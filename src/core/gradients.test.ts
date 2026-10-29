import { describe, expect, it } from 'vitest';
import {
  GRADIENT_IDS,
  GRADIENT_PRESETS,
  MAX_THEME_COLORS_CHARS,
  gradientColors,
  parseThemeColors,
  themeGradientColors,
} from './gradients.js';

// `colors.toml` do Tokyo Night, como o `omarchy-theme-set` grava.
const TOKYO_NIGHT = `mode = "dark"

accent = "#7aa2f7"
selection = "#292e42"

background = "#1a1b26"
foreground = "#a9b1d6"

red = "#f7768e"
yellow = "#e0af68"
orange = "#eb927b"
green = "#9ece6a"
cyan = "#449dab"
blue = "#7aa2f7"
magenta = "#ad8ee6"
`;

const ISLAND_RAMP: [string, string, string] = ['#d2cdff', '#9387dd', '#5a508f'];

describe('GRADIENT_PRESETS', () => {
  it('as 9 paletas do omadock, 3 cores cada, com nome em pt-BR', () => {
    expect(GRADIENT_PRESETS.map((preset) => preset.id)).toEqual([
      'aurora',
      'sunset',
      'ocean',
      'forest',
      'rose',
      'lavender',
      'ember',
      'citrus',
      'mono',
    ]);
    for (const preset of GRADIENT_PRESETS) expect(preset.colors).toHaveLength(3);
    expect(GRADIENT_PRESETS[0]).toEqual({
      id: 'aurora',
      name: 'Aurora',
      colors: ['#5dffb0', '#7fc4ff', '#c99cff'],
    });
  });

  it('a paleta Tema vem antes das fixas', () => {
    expect(GRADIENT_IDS[0]).toBe('theme');
    expect(GRADIENT_IDS).toHaveLength(10);
  });
});

describe('parseThemeColors', () => {
  it('lê as cores nomeadas e ignora o que não é cor', () => {
    const named = parseThemeColors(TOKYO_NIGHT);
    expect(named.accent).toBe('#7aa2f7');
    expect(named.magenta).toBe('#ad8ee6');
    expect(named.mode).toBeUndefined();
  });

  it('arquivo grande demais é ignorado inteiro', () => {
    const huge = TOKYO_NIGHT + '#'.repeat(MAX_THEME_COLORS_CHARS);
    expect(parseThemeColors(huge)).toEqual({});
  });

  it('texto vazio não tem cor nenhuma', () => {
    expect(parseThemeColors('')).toEqual({});
  });
});

describe('themeGradientColors', () => {
  it('acento + as cores com matiz longe dele e entre si, na ordem do omadock', () => {
    // O `blue` tem o matiz do acento e fica de fora.
    expect(themeGradientColors(parseThemeColors(TOKYO_NIGHT), ISLAND_RAMP)).toEqual([
      '#7aa2f7',
      '#ad8ee6',
      '#449dab',
    ]);
  });

  it('tema só com o acento repete o acento', () => {
    expect(themeGradientColors({ accent: '#ff0000' }, ISLAND_RAMP)).toEqual([
      '#ff0000',
      '#ff0000',
      '#ff0000',
    ]);
  });

  it('sem colors.toml (ou sem acento), os tons do realce da Island', () => {
    expect(themeGradientColors({}, ISLAND_RAMP)).toEqual(ISLAND_RAMP);
    expect(themeGradientColors({ red: '#ff0000' }, ISLAND_RAMP)).toEqual(ISLAND_RAMP);
  });
});

describe('gradientColors', () => {
  it('paleta fixa pelo id', () => {
    expect(gradientColors('mono', {}, ISLAND_RAMP)).toEqual(['#9aa0a6', '#5f6368', '#d0d4d8']);
  });

  it('Tema e id desconhecido usam a paleta do tema', () => {
    const named = parseThemeColors(TOKYO_NIGHT);
    const theme = themeGradientColors(named, ISLAND_RAMP);
    expect(gradientColors('theme', named, ISLAND_RAMP)).toEqual(theme);
    expect(gradientColors('arco-íris', named, ISLAND_RAMP)).toEqual(theme);
  });
});
