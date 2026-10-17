// Modo `battery` (specs/11-bateria.md "Modo `battery`"; design v5 `battery`).
// Os dados vêm dos mesmos comandos do painel de energia do Omarchy:
// `omarchy-battery-status --shell` e `omarchy-powerprofiles-list --active-state`.

export type BatteryStatus = Partial<
  Record<'percentage' | 'state' | 'rate' | 'size' | 'time' | 'cycles' | 'threshold', string>
>;

/** Linhas `chave<TAB>valor`; linha sem TAB é ignorada. */
export function parseBatteryStatus(raw: string): BatteryStatus {
  const status: Record<string, string> = {};
  for (const line of raw.split('\n')) {
    const tab = line.indexOf('\t');
    if (tab > 0) status[line.slice(0, tab).trim()] = line.slice(tab + 1).trim();
  }
  return status;
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

function statusText(status: BatteryStatus): string {
  switch (status.state) {
    case 'charging':
      return 'Carregando';
    case 'fully-charged':
      return 'Carga completa';
    case 'pending-charge': {
      const limit = /(\d+)%$/.exec(status.threshold ?? '');
      return limit ? `Limite de carga · ${limit[1]}%` : 'Na tomada';
    }
    default:
      return 'Na bateria';
  }
}

export function batteryPanel(status: BatteryStatus): BatteryPanel {
  const plugged = status.state !== 'discharging' && status.state !== undefined;
  // Cheia ou parada no limite: não há tempo nem potência de carga.
  const flowing = status.state === 'charging' || status.state === 'discharging';
  return {
    status: statusText(status),
    stats: [
      { label: 'Capacidade', value: spacedUnit(status.size) },
      {
        label: plugged ? 'Até carga total' : 'Tempo restante',
        value: flowing ? duration(status.time) : DASH,
      },
      { label: 'Ciclos de carga', value: status.cycles ?? DASH },
      {
        label: plugged ? 'Potência de carga' : 'Consumo',
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
  'power-saver': { label: 'Economia', glyph: 'leaf' },
  balanced: { label: 'Equilibrado', glyph: 'scales' },
  performance: { label: 'Desempenho', glyph: 'lightning' },
};

/** Linhas `perfil<TAB>0|1`; perfil desconhecido aparece com o próprio nome. */
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
