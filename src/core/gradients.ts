// Paletas do fundo em gradiente (specs/19-aparencia.md "Gradiente"). As 9
// fixas e a regra da paleta Tema vêm do omadock (MIT, thepathless, `Dock.qml`
// `gradientPresets` e `DockStyleLogic.themeGradientColors` @ 16492e5). A
// paleta Tema sai do `colors.toml` do tema do Omarchy; sem ele, dos tons do
// realce da Island.

import { hslOf, parseHex } from './color.js';
import { msg } from './i18n.js';

export interface GradientPreset {
  id: string;
  /** Em inglês: a UI traduz na hora de mostrar. */
  name: string;
  colors: [string, string, string];
}

export const GRADIENT_PRESETS: readonly GradientPreset[] = [
  { id: 'aurora', name: msg('Aurora'), colors: ['#5dffb0', '#7fc4ff', '#c99cff'] },
  { id: 'sunset', name: msg('Sunset'), colors: ['#ff7a59', '#ff4f8b', '#ffc15e'] },
  { id: 'ocean', name: msg('Ocean'), colors: ['#1e90ff', '#00c2c7', '#6a5cff'] },
  { id: 'forest', name: msg('Forest'), colors: ['#2e8b57', '#a3c95a', '#1f6f5c'] },
  { id: 'rose', name: msg('Rose'), colors: ['#ff9ac1', '#c86bfa', '#ffd1dc'] },
  { id: 'lavender', name: msg('Lavender'), colors: ['#b8a1ff', '#7aa2ff', '#f0b3ff'] },
  { id: 'ember', name: msg('Ember'), colors: ['#ff5e3a', '#ff9f1c', '#8b1e3f'] },
  { id: 'citrus', name: msg('Citrus'), colors: ['#ffd43b', '#94d82d', '#ff922b'] },
  { id: 'mono', name: msg('Mono'), colors: ['#9aa0a6', '#5f6368', '#d0d4d8'] },
];

/** `theme` primeiro: a paleta tirada do tema do Omarchy. */
export const GRADIENT_IDS: readonly string[] = [
  'theme',
  ...GRADIENT_PRESETS.map((preset) => preset.id),
];

/** O `colors.toml` tem uns 600 bytes; o omadock lê até 256 KiB. */
export const MAX_THEME_COLORS_CHARS = 262144;

// A ordem em que o omadock procura cores para juntar ao acento.
const NAMED_ORDER = ['magenta', 'blue', 'cyan', 'red', 'green', 'orange', 'yellow'];
// Matizes a menos de ~25° de distância viram uma cor só no gradiente.
const MIN_HUE_GAP = 0.07;

/** `nome = "#rrggbb"` por linha; arquivo grande demais é ignorado. */
export function parseThemeColors(text: string): Record<string, string> {
  const named: Record<string, string> = {};
  if (text.length > MAX_THEME_COLORS_CHARS) return named;
  const line = /^\s*([a-z_]+)\s*=\s*"(#[0-9a-fA-F]{6})"/gm;
  let match: RegExpExecArray | null;
  while ((match = line.exec(text)) !== null) named[match[1]!] = match[2]!.toLowerCase();
  return named;
}

function hueGap(a: string, b: string): number {
  const ha = hslOf(parseHex(a)).h;
  const hb = hslOf(parseHex(b)).h;
  if (ha < 0 || hb < 0) return 1;
  const distance = Math.abs(ha - hb);
  return Math.min(distance, 1 - distance);
}

function farFromAll(color: string, picked: string[]): boolean {
  return picked.every((other) => hueGap(color, other) >= MIN_HUE_GAP);
}

/**
 * Acento do tema + até duas cores nomeadas com matiz longe dele e entre si,
 * completando com o acento. Sem acento no tema, `fallback` (tons do realce).
 */
export function themeGradientColors(
  named: Record<string, string>,
  fallback: [string, string, string],
): [string, string, string] {
  const accent = named.accent;
  if (!accent) return fallback;
  const picked = [accent];
  for (const name of NAMED_ORDER) {
    const color = named[name];
    if (picked.length < 3 && color && farFromAll(color, picked)) picked.push(color);
  }
  while (picked.length < 3) picked.push(accent);
  return [picked[0]!, picked[1]!, picked[2]!];
}

/** Id desconhecido (arquivo editado à mão) usa a paleta Tema. */
export function gradientColors(
  id: string,
  named: Record<string, string>,
  fallback: [string, string, string],
): [string, string, string] {
  const preset = GRADIENT_PRESETS.find((candidate) => candidate.id === id);
  return preset ? preset.colors : themeGradientColors(named, fallback);
}
