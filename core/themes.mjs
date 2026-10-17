// Temas do design (specs/01-design-tokens.md "Temas"; design/logic.js
// `THEMES`): cada um troca as cores base, os neutros, a escala do acento e as
// superfícies das pílulas (`--isl-lane`), da ilha (`--isl-surface`) e dos
// painéis (`--isl-panel`). Cores com alfa saem como `#AARRGGBB` (formato do Qt).
export const THEME_IDS = ['Nocturne', 'Vidro fosco', 'Sólido', 'Claro', 'Alto contraste'];
const NOCTURNE_NEUTRALS = [
    '#f3f5fe',
    '#e4e7f5',
    '#cfd3e5',
    '#b2b6ca',
    '#9397ab',
    '#75798c',
    '#595d6c',
    '#3f424d',
    '#292b31',
];
// `acRamp(289, 1)`.
const ACCENTS = [
    '#f4f3ff',
    '#e6e4ff',
    '#d2cdff',
    '#b5acfa',
    '#9387dd',
    '#766ab9',
    '#5a508f',
    '#3f3865',
    '#28253e',
];
/** `color-mix(in srgb, cor P%, transparent)` → `#AARRGGBB`. */
export function withAlpha(hex, percent) {
    const alpha = Math.round((percent / 100) * 255)
        .toString(16)
        .padStart(2, '0');
    return `#${alpha}${hex.replace(/^#/, '').slice(-6)}`;
}
function nocturne() {
    return {
        bg: '#161826',
        surface: '#232532',
        text: '#e9e9ed',
        neutrals: [...NOCTURNE_NEUTRALS],
        accents: [...ACCENTS],
        accent: ACCENTS[4],
        // O design pinta as pílulas com `bg` 82%, mas sem o blur dele o fundo da
        // tela vazaria: a Island usa o `bg` opaco no Nocturne (spec 01).
        lane: '#161826',
        island: '#161826',
        panel: withAlpha('#161826', 94),
        light: false,
    };
}
function glass() {
    const base = nocturne();
    const neutrals = [...base.neutrals];
    neutrals[7] = withAlpha(base.neutrals[0], 18);
    neutrals[8] = withAlpha(base.neutrals[0], 10);
    return Object.assign(Object.assign({}, base), { neutrals, lane: withAlpha(base.bg, 38), island: withAlpha(base.bg, 52), panel: withAlpha(base.bg, 60) });
}
function solid() {
    const base = nocturne();
    const neutrals = [...base.neutrals];
    neutrals[7] = '#41455c';
    neutrals[8] = '#30334a';
    return Object.assign(Object.assign({}, base), { neutrals, lane: base.surface, island: base.surface, panel: base.surface });
}
function light() {
    // A escala do acento inverte; o acento é o passo 5 da invertida (r[4]).
    const accents = [...ACCENTS].reverse();
    return {
        bg: '#f5f6fb',
        surface: '#ffffff',
        text: '#1b1d28',
        neutrals: [
            '#1f2129',
            '#2f323c',
            '#434756',
            '#585c6c',
            '#6b6f81',
            '#8e92a6',
            '#b4b8ca',
            '#d9dce8',
            '#e9ebf3',
        ],
        accents,
        accent: accents[4],
        lane: withAlpha('#f8f9fc', 80),
        island: withAlpha('#f8f9fc', 94),
        panel: withAlpha('#f8f9fc', 96),
        light: true,
    };
}
function contrast() {
    // Passos claros do acento puxados para cima (design `th.contrast`); o
    // design também aumenta a saturação 25%, que fica de fora.
    const accents = ACCENTS.map((color, i) => i >= 4 && i < 7 ? ACCENTS[Math.max(2, i - 2)] : color);
    return {
        bg: '#0b0c12',
        surface: '#14161f',
        text: '#f7f8fc',
        neutrals: [
            '#f7f8fc',
            '#eef0f7',
            '#e3e6f0',
            '#d3d7e5',
            '#bcc1d4',
            '#9aa0b8',
            '#7c829c',
            '#6a7089',
            '#262938',
        ],
        accents,
        accent: accents[3],
        lane: '#0b0c12',
        island: '#0b0c12',
        panel: '#0b0c12',
        light: false,
    };
}
const BUILDERS = {
    Nocturne: nocturne,
    'Vidro fosco': glass,
    Sólido: solid,
    Claro: light,
    'Alto contraste': contrast,
};
/** Tema desconhecido (arquivo editado à mão) cai no Nocturne. */
export function themeColors(id) {
    const builder = BUILDERS[id];
    return builder ? builder() : nocturne();
}
