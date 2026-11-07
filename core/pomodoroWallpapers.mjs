// Wallpapers da pausa (specs/20-pomodoro.md "Wallpaper da pausa"): os quatro
// presets da spec 07 do protótipo como camadas de degradê, desenhadas pelo
// `PomodoroWallpaper.qml` num `Canvas`. Cores em `#AARRGGBB`, já convertidas
// do `oklch()` do protótipo.
import { oklch, toHex } from './color.mjs';
import { msg, tr } from './i18n.mjs';
import { WALLPAPER_IDS } from './pomodoroConfig.mjs';
const L = (lightness, chroma, hue, alpha = 1) => toHex(oklch(lightness, chroma, hue, alpha));
export const POMODORO_ACCENTS = {
    focus: L(0.79, 0.135, 62),
    break: L(0.8, 0.09, 178),
};
// Um brilho que some: a parada final tem o mesmo matiz com alfa 0. Com
// "transparent" puro (preto sem alfa) a interpolação do Canvas escurece a borda.
const glow = (lightness, chroma, hue, alpha, end) => ({
    stops: [
        { at: 0, color: L(lightness, chroma, hue, alpha) },
        { at: end, color: L(lightness, chroma, hue, 0) },
    ],
});
export const WALLPAPER_PRESETS = [
    {
        id: 'noite',
        layers: [
            {
                kind: 'radial',
                cx: 0.5,
                cy: 1.15,
                rx: 1.2,
                ry: 0.9,
                stops: [
                    { at: 0, color: L(0.34, 0.05, 178) },
                    { at: 0.55, color: L(0.16, 0.01, 200) },
                    { at: 1, color: '#09090a' },
                ],
            },
        ],
    },
    {
        id: 'aurora',
        layers: [
            { kind: 'solid', color: '#09090b' },
            Object.assign({ kind: 'radial', cx: 0.88, cy: 1, rx: 0.9, ry: 0.7 }, glow(0.32, 0.06, 178, 0.85, 0.6)),
            Object.assign({ kind: 'radial', cx: 0.18, cy: 0.08, rx: 0.8, ry: 0.6 }, glow(0.32, 0.06, 250, 0.9, 0.62)),
        ],
    },
    {
        id: 'brasa',
        layers: [
            {
                kind: 'radial',
                cx: 0.5,
                cy: 1.2,
                rx: 1.1,
                ry: 0.85,
                stops: [
                    { at: 0, color: L(0.38, 0.08, 55) },
                    { at: 0.55, color: L(0.17, 0.02, 45) },
                    { at: 1, color: '#0b0a09' },
                ],
            },
        ],
    },
    {
        id: 'grafite',
        layers: [
            {
                kind: 'linear',
                stops: [
                    { at: 0, color: '#19191c' },
                    { at: 1, color: '#0a0a0b' },
                ],
            },
        ],
    },
];
/** Vinheta sobre qualquer wallpaper (camada 4 da tela de pausa). */
export const VIGNETTE = {
    kind: 'radial',
    cx: 0.5,
    cy: 0.48,
    rx: 0.7,
    ry: 0.65,
    stops: [
        { at: 0, color: '#2e000000' },
        { at: 1, color: '#8c000000' },
    ],
};
/** Camadas de um preset; `custom` (imagem própria) e ids desconhecidos não têm. */
export function presetLayers(id) {
    var _a, _b;
    return (_b = (_a = WALLPAPER_PRESETS.find((preset) => preset.id === id)) === null || _a === void 0 ? void 0 : _a.layers) !== null && _b !== void 0 ? _b : [];
}
const NAMES = {
    noite: msg('Night'),
    aurora: msg('Aurora'),
    brasa: msg('Ember'),
    grafite: msg('Graphite'),
    custom: msg('Your image'),
};
export function wallpaperName(id, lang) {
    const known = WALLPAPER_IDS.find((item) => item === id);
    return known === undefined ? id : tr(lang, NAMES[known]);
}
