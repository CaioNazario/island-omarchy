import { describe, expect, it } from 'vitest';
import { DEFAULT_APPEARANCE, type Appearance } from './appearance.js';
import { contrastRatio, mix, parseHex } from './color.js';
import { cappedStrength, surfaceStyle, type SurfaceInput } from './surfaceStyle.js';

const AURORA: [string, string, string] = ['#5dffb0', '#7fc4ff', '#c99cff'];
const TEXT_INK = { color: '#e9e9ed', min: 4.5 };
const LABEL_INK = { color: '#75798c', min: 3 };

function input(look: Partial<Appearance>, extra: Partial<SurfaceInput> = {}): SurfaceInput {
  return {
    look: { ...DEFAULT_APPEARANCE, ...look },
    base: '#161826',
    gradientColors: AURORA,
    inks: [TEXT_INK],
    blurAvailable: true,
    ...extra,
  };
}

describe('surfaceStyle', () => {
  it('o padrão é o visual do design', () => {
    expect(surfaceStyle(input({}))).toEqual({
      visible: true,
      fill: '#161826',
      finish: true,
      gradient: null,
      borderWidth: 1,
      borderColor: '#0dffffff',
      shadow: 0.5,
      shadowExpanded: 0.6,
      blur: false,
    });
  });

  it('cor sólida escolhida, com a opacidade da opção', () => {
    const style = surfaceStyle(input({ color: '#1e1e2e', opacityFromTheme: false, opacity: 0.5 }));
    expect(style.fill).toBe('#801e1e2e');
  });

  it('opacidade do tema: opaca sem blur, 82% (a do design) com blur', () => {
    expect(surfaceStyle(input({})).fill).toBe('#161826');
    expect(surfaceStyle(input({ blur: true })).fill).toBe('#d1161826');
  });

  it('blur só com a opção ligada, o blur do sistema ligado e fundo', () => {
    expect(surfaceStyle(input({ blur: true })).blur).toBe(true);
    expect(surfaceStyle(input({ blur: true }, { blurAvailable: false })).blur).toBe(false);
    expect(surfaceStyle(input({ blur: true }, { blurAvailable: false })).fill).toBe('#161826');
    expect(surfaceStyle(input({ blur: true, background: false })).blur).toBe(false);
  });

  it('cor Nenhuma: preto 25% fixo, sem acabamento, anel mais forte', () => {
    const style = surfaceStyle(input({ color: 'none', opacityFromTheme: false, opacity: 1 }));
    expect(style.fill).toBe('#40000000');
    expect(style.finish).toBe(false);
    expect(style.borderColor).toBe('#7affffff');
  });

  it('fundo desligado: sem fundo, acabamento nem sombra; o anel fica se ligado', () => {
    const style = surfaceStyle(input({ background: false }));
    expect(style.visible).toBe(false);
    expect(style.fill).toBe('#00161826');
    expect(style.finish).toBe(false);
    expect(style.shadow).toBe(0);
    expect(style.borderWidth).toBe(1);
  });

  it('anel automático fica forte quando o fundo quase some', () => {
    const style = surfaceStyle(input({ opacityFromTheme: false, opacity: 0.1 }));
    expect(style.borderColor).toBe('#7affffff');
  });

  it('borda manual e desligada', () => {
    expect(
      surfaceStyle(input({ borderWidth: 2.5, borderOpacityAuto: false, borderOpacity: 0.4 })),
    ).toMatchObject({ borderWidth: 2.5, borderColor: '#66ffffff' });
    expect(surfaceStyle(input({ border: false })).borderWidth).toBe(0);
  });

  it('sombra: força da opção, 1.2× na ilha aberta, desligada = 0', () => {
    expect(surfaceStyle(input({ shadowStrength: 0.8 }))).toMatchObject({
      shadow: 0.8,
      shadowExpanded: 0.96,
    });
    expect(surfaceStyle(input({ shadowStrength: 1 })).shadowExpanded).toBe(1);
    expect(surfaceStyle(input({ shadow: false }))).toMatchObject({ shadow: 0, shadowExpanded: 0 });
  });

  it('gradiente: o fundo vai para o shader como base, com as cores e a força', () => {
    const style = surfaceStyle(input({ fill: 'gradient', gradientStrength: 0.3 }));
    expect(style.fill).toBe('#00161826');
    expect(style.gradient).toEqual({ base: '#161826', colors: AURORA, strength: 0.3 });
  });

  it('gradiente forte demais para os textos é limitado', () => {
    const style = surfaceStyle(
      input({ fill: 'gradient', gradientStrength: 1 }, { inks: [TEXT_INK, LABEL_INK] }),
    );
    expect(style.gradient!.strength).toBeLessThan(1);
    expect(style.gradient!.strength).toBeGreaterThan(0);
  });
});

describe('cappedStrength', () => {
  const base = parseHex('#161826');

  it('mantém a força quando os textos ainda leem', () => {
    expect(cappedStrength(0.2, AURORA, '#161826', [TEXT_INK])).toBe(0.2);
  });

  it('desce até cada tinta atingir o contraste mínimo sobre a cor média', () => {
    const capped = cappedStrength(1, AURORA, '#161826', [TEXT_INK, LABEL_INK]);
    const average = mix(
      mix(parseHex(AURORA[0]), parseHex(AURORA[1]), 0.5),
      parseHex(AURORA[2]),
      1 / 3,
    );
    const backdrop = mix(base, average, capped * 0.75);
    expect(contrastRatio(parseHex(LABEL_INK.color), backdrop)).toBeGreaterThanOrEqual(3);
  });

  it('sem tintas, a força pedida', () => {
    expect(cappedStrength(0.9, AURORA, '#161826', [])).toBe(0.9);
  });
});
