// Wallpapers da pausa (specs/20-pomodoro.md "Wallpaper da pausa"): os quatro
// presets da spec 07 do protótipo como camadas de degradê, desenhadas pelo
// `PomodoroWallpaper.qml` num `Canvas`. Cores em `#AARRGGBB`, já convertidas
// do `oklch()` do protótipo.

import { oklch, toHex } from './color.js';
import { msg, tr, type Language } from './i18n.js';
import { WALLPAPER_IDS, type WallpaperId } from './pomodoroConfig.js';

export interface GradientStop {
  /** Posição de 0 a 1. */
  at: number;
  color: string;
}

/**
 * Camada, de baixo para cima. `radial` é uma elipse de raios `rx`×`ry`
 * (frações da largura e da altura) centrada em (`cx`, `cy`), também em
 * frações: o `radial-gradient(120% 90% at 50% 115%, …)` do CSS. `linear`
 * vai do topo à base.
 */
export type WallpaperLayer =
  | { kind: 'solid'; color: string }
  | { kind: 'radial'; cx: number; cy: number; rx: number; ry: number; stops: GradientStop[] }
  | { kind: 'linear'; stops: GradientStop[] };

export interface WallpaperPreset {
  id: WallpaperId;
  layers: WallpaperLayer[];
}

const L = (lightness: number, chroma: number, hue: number, alpha = 1): string =>
  toHex(oklch(lightness, chroma, hue, alpha));

export const POMODORO_ACCENTS = {
  focus: L(0.79, 0.135, 62),
  break: L(0.8, 0.09, 178),
} as const;

// Um brilho que some: a parada final tem o mesmo matiz com alfa 0. Com
// "transparent" puro (preto sem alfa) a interpolação do Canvas escurece a borda.
const glow = (lightness: number, chroma: number, hue: number, alpha: number, end: number) => ({
  stops: [
    { at: 0, color: L(lightness, chroma, hue, alpha) },
    { at: end, color: L(lightness, chroma, hue, 0) },
  ],
});

export const WALLPAPER_PRESETS: readonly WallpaperPreset[] = [
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
      { kind: 'radial', cx: 0.88, cy: 1, rx: 0.9, ry: 0.7, ...glow(0.32, 0.06, 178, 0.85, 0.6) },
      { kind: 'radial', cx: 0.18, cy: 0.08, rx: 0.8, ry: 0.6, ...glow(0.32, 0.06, 250, 0.9, 0.62) },
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
export const VIGNETTE: WallpaperLayer = {
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
export function presetLayers(id: string): WallpaperLayer[] {
  return WALLPAPER_PRESETS.find((preset) => preset.id === id)?.layers ?? [];
}

const NAMES: Record<WallpaperId, string> = {
  noite: msg('Night'),
  aurora: msg('Aurora'),
  brasa: msg('Ember'),
  grafite: msg('Graphite'),
  custom: msg('Your image'),
};

export function wallpaperName(id: string, lang: Language): string {
  const known = WALLPAPER_IDS.find((item) => item === id);
  return known === undefined ? id : tr(lang, NAMES[known]);
}
