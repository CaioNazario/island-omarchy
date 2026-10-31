// Opções de aparência das pílulas e da ilha (specs/19-aparencia.md), guardadas
// em `settings.json` `appearance` (spec 13). Vêm das opções do omadock (MIT,
// thepathless, `DockConfigLogic.applyLook` e `DockPresets.js` @ 16492e5), sem
// as que só servem a uma dock. O padrão é o visual do design: quem não mexe
// não vê diferença.
import { parseHex, toHex } from './color.mjs';
import { GRADIENT_IDS } from './gradients.mjs';
export const FILL_IDS = ['solid', 'gradient'];
/** `default` são os raios do design; `theme`, o `decoration:rounding` do Hyprland. */
export const SHAPE_IDS = ['default', 'rounded', 'square', 'theme'];
export const DEFAULT_APPEARANCE = {
    background: true,
    fill: 'solid',
    color: 'theme',
    gradient: 'theme',
    gradientStrength: 0.6,
    opacityFromTheme: true,
    opacity: 1,
    border: true,
    // O anel `inset 0 0 0 1px rgba(255,255,255,.05)` do design.
    borderWidth: 1,
    borderOpacityAuto: true,
    borderOpacity: 0.05,
    // `SOFT_OUT` das pílulas; a ilha aberta usa 1.2× (spec 01 "Superfícies").
    shadowStrength: 0.5,
    shadow: true,
    shape: 'default',
    cornerRadius: 12,
    grain: 0,
    blur: false,
};
/** As cores sólidas do omadock: todas escuras, como os temas da Island. */
export const SOLID_SWATCHES = [
    '#000000',
    '#181825',
    '#1e1e2e',
    '#0f172a',
    '#111827',
    '#062e24',
    '#1c1917',
    '#2c0b16',
    '#1e102d',
    '#334155',
];
const BOOL_KEYS = [
    'background',
    'opacityFromTheme',
    'border',
    'borderOpacityAuto',
    'shadow',
    'blur',
];
const FRACTION = { min: 0, max: 1, step: 0.01 };
const NUMBER_RANGES = {
    gradientStrength: FRACTION,
    opacity: FRACTION,
    borderWidth: { min: 1, max: 6, step: 0.5 },
    borderOpacity: FRACTION,
    shadowStrength: FRACTION,
    cornerRadius: { min: 2, max: 24, step: 1 },
    grain: FRACTION,
};
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function readBool(value, fallback) {
    return typeof value === 'boolean' ? value : fallback;
}
/** Limita à faixa e arredonda ao passo (1/n) do controle. */
function readNumber(value, range, fallback) {
    if (typeof value !== 'number' || !isFinite(value))
        return fallback;
    const clamped = Math.min(range.max, Math.max(range.min, value));
    const perUnit = Math.round(1 / range.step);
    return Math.round(clamped * perUnit) / perUnit;
}
function readChoice(value, options, fallback) {
    const known = typeof value === 'string' && options.indexOf(value) >= 0;
    return known ? value : fallback;
}
/** Hex com alfa fica de fora: a opacidade é uma opção à parte. */
function readColor(value, fallback) {
    if (value === 'theme' || value === 'none')
        return value;
    if (typeof value !== 'string' || !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value))
        return fallback;
    return toHex(parseHex(value));
}
/**
 * Chave ausente, de tipo errado ou fora da lista fica com o valor de `base`
 * (o padrão, ao ler o arquivo).
 */
export function sanitizeAppearance(raw, base = DEFAULT_APPEARANCE) {
    const look = Object.assign({}, base);
    if (!isRecord(raw))
        return look;
    for (const key of BOOL_KEYS)
        look[key] = readBool(raw[key], base[key]);
    for (const key of Object.keys(NUMBER_RANGES))
        look[key] = readNumber(raw[key], NUMBER_RANGES[key], base[key]);
    look.fill = readChoice(raw.fill, FILL_IDS, base.fill);
    look.shape = readChoice(raw.shape, SHAPE_IDS, base.shape);
    look.gradient = readChoice(raw.gradient, GRADIENT_IDS, base.gradient);
    look.color = readColor(raw.color, base.color);
    return look;
}
/** Uma opção trocada pela UI; valor inválido ou opção desconhecida não muda nada. */
export function withAppearanceOption(look, key, value) {
    if (!(key in look))
        return Object.assign({}, look);
    return sanitizeAppearance(Object.assign(Object.assign({}, look), { [key]: value }), look);
}
export const APPEARANCE_PRESETS = [
    { id: 'default', name: 'Padrão', look: {} },
    // O Glass do omadock (`DockPresets.js` `builtin_glass`), sem as chaves de dock.
    {
        id: 'glass',
        name: 'Vidro',
        look: { fill: 'gradient', gradient: 'aurora', gradientStrength: 0.55, grain: 0.18 },
    },
];
/** Preset desconhecido é o Padrão. */
export function appearancePreset(id) {
    const preset = APPEARANCE_PRESETS.find((candidate) => candidate.id === id);
    return Object.assign(Object.assign({}, DEFAULT_APPEARANCE), (preset ? preset.look : {}));
}
function sameAppearance(a, b) {
    return Object.keys(a).every((key) => a[key] === b[key]);
}
/** O id do preset igual à aparência, ou vazio se ela foi ajustada à mão. */
export function matchingPreset(look) {
    const preset = APPEARANCE_PRESETS.find((candidate) => sameAppearance(appearancePreset(candidate.id), look));
    return preset ? preset.id : '';
}
