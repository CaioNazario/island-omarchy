// Modo `battery` (specs/11-bateria.md "Modo `battery`"; design v5 `battery`).
// Os dados vêm dos mesmos comandos do painel de energia do Omarchy:
// `omarchy-battery-status --shell` e `omarchy-powerprofiles-list --active-state`.

import { msg, tr, type Language } from './i18n.js';
import { parseKeyValues } from './keyValue.js';

export type BatteryStatus = Partial<
  Record<'percentage' | 'state' | 'rate' | 'size' | 'time' | 'cycles' | 'threshold', string>
>;

/** Linhas `chave<TAB>valor` de `omarchy-battery-status --shell`. */
export function parseBatteryStatus(raw: string): BatteryStatus {
  return parseKeyValues(raw);
}

export interface BatteryStat {
  label: string;
  value: string;
}

export interface BatteryPanel {
  status: string;
  stats: BatteryStat[];
}

const DASH = '—';

/** `29Wh` → `29 Wh`, `16.9W` → `16.9 W`. */
function spacedUnit(value: string | undefined): string {
  return value ? value.replace(/^([\d.]+)\s*(W|Wh)$/, '$1 $2') : DASH;
}

/** `1h 23m` → `1h 23min`, `3h 5m` → `3h 05min`, `45m` → `45 min` (design `hm`). */
function duration(value: string | undefined): string {
  if (!value) return DASH;
  const match = /^(?:(\d+)h)?\s*(?:(\d+)m)?$/.exec(value.trim());
  if (!match || (!match[1] && !match[2])) return value;
  const minutes = Number(match[2] ?? 0);
  if (!match[1]) return `${minutes} min`;
  return `${match[1]}h ${String(minutes).padStart(2, '0')}min`;
}

function statusText(status: BatteryStatus, lang: Language): string {
  switch (status.state) {
    case 'charging':
      return tr(lang, 'Charging');
    case 'fully-charged':
      return tr(lang, 'Fully charged');
    case 'pending-charge': {
      const limit = /(\d+)%$/.exec(status.threshold ?? '');
      return limit ? tr(lang, 'Charge limit · {n}%', { n: limit[1]! }) : tr(lang, 'Plugged in');
    }
    default:
      return tr(lang, 'On battery');
  }
}

export function batteryPanel(status: BatteryStatus, lang: Language): BatteryPanel {
  const plugged = status.state !== 'discharging' && status.state !== undefined;
  // Cheia ou parada no limite: não há tempo nem potência de carga.
  const flowing = status.state === 'charging' || status.state === 'discharging';
  return {
    status: statusText(status, lang),
    stats: [
      { label: tr(lang, 'Capacity'), value: spacedUnit(status.size) },
      {
        label: plugged ? tr(lang, 'Until full') : tr(lang, 'Time left'),
        value: flowing ? duration(status.time) : DASH,
      },
      { label: tr(lang, 'Charge cycles'), value: status.cycles ?? DASH },
      {
        label: plugged ? tr(lang, 'Charging power') : tr(lang, 'Power draw'),
        value: flowing ? spacedUnit(status.rate) : DASH,
      },
    ],
  };
}

/** Ícone do cabeçalho (design `batShown`/`batIcon`). */
export function batteryGlyph(percent: number, charging: boolean): string {
  if (charging) return 'battery-charging-fill';
  if (percent >= 95) return 'battery-full-fill';
  if (percent >= 60) return 'battery-high-fill';
  if (percent > 20) return 'battery-medium-fill';
  if (percent > 8) return 'battery-low-fill';
  return 'battery-warning-fill';
}

export interface PowerProfile {
  id: string;
  label: string;
  glyph: string;
  active: boolean;
}

const PROFILE_LOOKS: Record<string, { label: string; glyph: string }> = {
  'power-saver': { label: msg('Power saver'), glyph: 'leaf' },
  balanced: { label: msg('Balanced'), glyph: 'scales' },
  performance: { label: msg('Performance'), glyph: 'lightning' },
};

/**
 * Linhas `perfil<TAB>0|1`; perfil desconhecido aparece com o próprio nome. O
 * rótulo sai em inglês: a UI traduz na hora de mostrar.
 */
export function parsePowerProfiles(raw: string): PowerProfile[] {
  const profiles: PowerProfile[] = [];
  for (const line of raw.split('\n')) {
    const [id = '', active = ''] = line.trim().split('\t');
    if (id === '') continue;
    const look = PROFILE_LOOKS[id] ?? { label: id, glyph: 'gauge' };
    profiles.push({ id, label: look.label, glyph: look.glyph, active: active === '1' });
  }
  return profiles;
}
