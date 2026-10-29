import { describe, expect, it } from 'vitest';
import {
  blackOrWhiteOn,
  contrastRatio,
  hslOf,
  isLight,
  luminance,
  mix,
  parseHex,
  toHex,
} from './color.js';

describe('parseHex', () => {
  it('lê #RRGGBB em canais de 0 a 1, opaco', () => {
    expect(parseHex('#ff8000')).toEqual({ r: 1, g: 128 / 255, b: 0, a: 1 });
  });

  it('expande #RGB', () => {
    expect(toHex(parseHex('#abc'))).toBe('#aabbcc');
  });

  it('lê #AARRGGBB, o formato com alfa do Qt', () => {
    const color = parseHex('#80ff0000');
    expect(color.r).toBe(1);
    expect(color.a).toBeCloseTo(128 / 255);
  });

  it('aceita maiúsculas e espaços em volta', () => {
    expect(toHex(parseHex('  #1E1E2E '))).toBe('#1e1e2e');
  });

  it('recusa o que não é hex, citando o valor e o formato esperado', () => {
    expect(() => parseHex('red')).toThrow(/"red".*#RRGGBB/);
    expect(() => parseHex('#12345')).toThrow(/"#12345"/);
  });
});

describe('toHex', () => {
  it('opaco sai #RRGGBB; com alfa, #AARRGGBB', () => {
    expect(toHex({ r: 1, g: 0, b: 0, a: 1 })).toBe('#ff0000');
    expect(toHex({ r: 1, g: 0, b: 0, a: 0.5 })).toBe('#80ff0000');
  });

  it('limita os canais a 0..1', () => {
    expect(toHex({ r: 1.2, g: -0.1, b: 0.5, a: 1 })).toBe('#ff0080');
  });
});

describe('mix', () => {
  it('interpola canal a canal, alfa incluído', () => {
    expect(toHex(mix(parseHex('#000000'), parseHex('#ffffff'), 0.5))).toBe('#808080');
    // `#AARRGGBB`: de preto transparente a preto opaco.
    expect(mix(parseHex('#00000000'), parseHex('#ff000000'), 0.25).a).toBe(0.25);
  });

  it('t = 0 e t = 1 devolvem as pontas', () => {
    const from = parseHex('#161826');
    const to = parseHex('#5dffb0');
    expect(toHex(mix(from, to, 0))).toBe('#161826');
    expect(toHex(mix(from, to, 1))).toBe('#5dffb0');
  });
});

describe('hslOf', () => {
  it('matiz em voltas (0..1), como o hslHue do Qt', () => {
    expect(hslOf(parseHex('#ff0000'))).toEqual({ h: 0, s: 1, l: 0.5 });
    expect(hslOf(parseHex('#00ff00')).h).toBeCloseTo(1 / 3);
    expect(hslOf(parseHex('#0000ff')).h).toBeCloseTo(2 / 3);
  });

  it('cinza não tem matiz: h = -1', () => {
    expect(hslOf(parseHex('#808080')).h).toBe(-1);
  });
});

describe('contraste WCAG', () => {
  it('luminância relativa nas pontas', () => {
    expect(luminance(parseHex('#ffffff'))).toBe(1);
    expect(luminance(parseHex('#000000'))).toBe(0);
  });

  it('preto sobre branco é 21:1, nos dois sentidos', () => {
    expect(contrastRatio(parseHex('#000000'), parseHex('#ffffff'))).toBe(21);
    expect(contrastRatio(parseHex('#ffffff'), parseHex('#000000'))).toBe(21);
  });

  it('#777777 sobre branco fica logo abaixo de 4.5:1', () => {
    expect(contrastRatio(parseHex('#777777'), parseHex('#ffffff'))).toBeCloseTo(4.48, 2);
  });
});

describe('isLight', () => {
  it('luma linear acima de 0.5 (a regra do omadock)', () => {
    expect(isLight(parseHex('#ffffff'))).toBe(true);
    expect(isLight(parseHex('#161826'))).toBe(false);
    expect(isLight(parseHex('#ffd43b'))).toBe(true);
  });
});

describe('blackOrWhiteOn', () => {
  it('quase branco sobre fundo escuro, quase preto sobre fundo claro', () => {
    expect(toHex(blackOrWhiteOn(parseHex('#161826')))).toBe('#f2f2f2');
    expect(toHex(blackOrWhiteOn(parseHex('#ffffff')))).toBe('#141414');
  });
});
