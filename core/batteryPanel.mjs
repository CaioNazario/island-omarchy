// Modo `battery` (specs/11-bateria.md "Modo `battery`"; design v5 `battery`).
// Os dados vêm dos mesmos comandos do painel de energia do Omarchy:
// `omarchy-battery-status --shell` e `omarchy-powerprofiles-list --active-state`.
import { msg, tr } from './i18n.mjs';
import { parseKeyValues } from './keyValue.mjs';
/** Linhas `chave<TAB>valor` de `omarchy-battery-status --shell`. */
export function parseBatteryStatus(raw) {
    return parseKeyValues(raw);
}
const DASH = '—';
/** `29Wh` → `29 Wh`, `16.9W` → `16.9 W`. */
function spacedUnit(value) {
    return value ? value.replace(/^([\d.]+)\s*(W|Wh)$/, '$1 $2') : DASH;
}
/** `1h 23m` → `1h 23min`, `3h 5m` → `3h 05min`, `45m` → `45 min` (design `hm`). */
function duration(value) {
    var _a;
    if (!value)
        return DASH;
    const match = /^(?:(\d+)h)?\s*(?:(\d+)m)?$/.exec(value.trim());
    if (!match || (!match[1] && !match[2]))
        return value;
    const minutes = Number((_a = match[2]) !== null && _a !== void 0 ? _a : 0);
    if (!match[1])
        return `${minutes} min`;
    return `${match[1]}h ${String(minutes).padStart(2, '0')}min`;
}
function statusText(status, lang) {
    var _a;
    switch (status.state) {
        case 'charging':
            return tr(lang, 'Charging');
        case 'fully-charged':
            return tr(lang, 'Fully charged');
        case 'pending-charge': {
            const limit = /(\d+)%$/.exec((_a = status.threshold) !== null && _a !== void 0 ? _a : '');
            return limit ? tr(lang, 'Charge limit · {n}%', { n: limit[1] }) : tr(lang, 'Plugged in');
        }
        default:
            return tr(lang, 'On battery');
    }
}
export function batteryPanel(status, lang) {
    var _a;
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
            { label: tr(lang, 'Charge cycles'), value: (_a = status.cycles) !== null && _a !== void 0 ? _a : DASH },
            {
                label: plugged ? tr(lang, 'Charging power') : tr(lang, 'Power draw'),
                value: flowing ? spacedUnit(status.rate) : DASH,
            },
        ],
    };
}
/** Ícone do cabeçalho (design `batShown`/`batIcon`). */
export function batteryGlyph(percent, charging) {
    if (charging)
        return 'battery-charging-fill';
    if (percent >= 95)
        return 'battery-full-fill';
    if (percent >= 60)
        return 'battery-high-fill';
    if (percent > 20)
        return 'battery-medium-fill';
    if (percent > 8)
        return 'battery-low-fill';
    return 'battery-warning-fill';
}
const PROFILE_LOOKS = {
    'power-saver': { label: msg('Power saver'), glyph: 'leaf' },
    balanced: { label: msg('Balanced'), glyph: 'scales' },
    performance: { label: msg('Performance'), glyph: 'lightning' },
};
/**
 * Linhas `perfil<TAB>0|1`; perfil desconhecido aparece com o próprio nome. O
 * rótulo sai em inglês: a UI traduz na hora de mostrar.
 */
export function parsePowerProfiles(raw) {
    var _a;
    const profiles = [];
    for (const line of raw.split('\n')) {
        const [id = '', active = ''] = line.trim().split('\t');
        if (id === '')
            continue;
        const look = (_a = PROFILE_LOOKS[id]) !== null && _a !== void 0 ? _a : { label: id, glyph: 'gauge' };
        profiles.push({ id, label: look.label, glyph: look.glyph, active: active === '1' });
    }
    return profiles;
}
