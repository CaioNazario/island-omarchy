import { describe, expect, it } from 'vitest';
import {
  APPEARANCE_PRESETS,
  DEFAULT_APPEARANCE,
  SOLID_SWATCHES,
  appearancePreset,
  matchingPreset,
  sanitizeAppearance,
  type Appearance,
} from './appearance.js';

describe('DEFAULT_APPEARANCE', () => {
  it('é o visual do design: fundo do tema opaco, anel, sombra, cantos do design, sem blur', () => {
    expect(DEFAULT_APPEARANCE).toEqual<Appearance>({
      background: true,
      fill: 'solid',
      color: 'theme',
      gradient: 'theme',
      gradientStrength: 0.6,
      opacityFromTheme: true,
      opacity: 1,
      border: true,
      borderWidth: 1,
      borderOpacityAuto: true,
      borderOpacity: 0.05,
      shadow: true,
      shadowStrength: 0.5,
      shape: 'default',
      cornerRadius: 12,
      grain: 0,
      blur: false,
    });
  });

  it('as 10 cores sólidas do omadock', () => {
    expect(SOLID_SWATCHES).toHaveLength(10);
    expect(SOLID_SWATCHES[0]).toBe('#000000');
  });
});

describe('sanitizeAppearance', () => {
  it('sem a chave (ou com lixo), o padrão', () => {
    for (const raw of [undefined, null, 'vidro', 42, []]) {
      expect(sanitizeAppearance(raw)).toEqual(DEFAULT_APPEARANCE);
    }
  });

  it('mantém o que é válido e completa o resto com o padrão', () => {
    const look = sanitizeAppearance({ fill: 'gradient', gradient: 'aurora', blur: true });
    expect(look).toEqual({
      ...DEFAULT_APPEARANCE,
      fill: 'gradient',
      gradient: 'aurora',
      blur: true,
    });
  });

  it('limita os números à faixa de cada opção', () => {
    const look = sanitizeAppearance({
      gradientStrength: 3,
      opacity: -1,
      borderWidth: 9,
      shadowStrength: 2,
      cornerRadius: 0,
      grain: -0.5,
    });
    expect(look.gradientStrength).toBe(1);
    expect(look.opacity).toBe(0);
    expect(look.borderWidth).toBe(6);
    expect(look.shadowStrength).toBe(1);
    expect(look.cornerRadius).toBe(2);
    expect(look.grain).toBe(0);
  });

  it('arredonda para o passo do controle: borda de meio em meio pixel, raio inteiro', () => {
    const look = sanitizeAppearance({ borderWidth: 1.3, cornerRadius: 7.6 });
    expect(look.borderWidth).toBe(1.5);
    expect(look.cornerRadius).toBe(8);
  });

  it('opção fora da lista, tipo errado ou número inválido voltam ao padrão', () => {
    const look = sanitizeAppearance({
      fill: 'xadrez',
      shape: 'estrela',
      gradient: 'arco-íris',
      background: 'sim',
      opacity: Number.NaN,
      grain: '0.5',
    });
    expect(look).toEqual(DEFAULT_APPEARANCE);
  });

  it('cor: tema, nenhuma ou hex de 3/6 dígitos, normalizado', () => {
    expect(sanitizeAppearance({ color: 'none' }).color).toBe('none');
    expect(sanitizeAppearance({ color: '#1E1E2E' }).color).toBe('#1e1e2e');
    expect(sanitizeAppearance({ color: '#abc' }).color).toBe('#aabbcc');
    expect(sanitizeAppearance({ color: '#801e1e2e' }).color).toBe('theme');
    expect(sanitizeAppearance({ color: 'azul' }).color).toBe('theme');
  });
});

describe('presets', () => {
  it('Padrão e Vidro', () => {
    expect(APPEARANCE_PRESETS.map((preset) => preset.name)).toEqual(['Padrão', 'Vidro']);
  });

  it('Padrão é o padrão; Vidro é o Glass do omadock', () => {
    expect(appearancePreset('default')).toEqual(DEFAULT_APPEARANCE);
    expect(appearancePreset('glass')).toEqual({
      ...DEFAULT_APPEARANCE,
      fill: 'gradient',
      gradient: 'aurora',
      gradientStrength: 0.55,
      grain: 0.18,
    });
  });

  it('preset desconhecido é o Padrão', () => {
    expect(appearancePreset('neon')).toEqual(DEFAULT_APPEARANCE);
  });

  it('matchingPreset diz qual preset a aparência atual é, ou vazio', () => {
    expect(matchingPreset(DEFAULT_APPEARANCE)).toBe('default');
    expect(matchingPreset(appearancePreset('glass'))).toBe('glass');
    expect(matchingPreset({ ...DEFAULT_APPEARANCE, blur: true })).toBe('');
  });
});
