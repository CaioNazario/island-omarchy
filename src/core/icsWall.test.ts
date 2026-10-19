import { describe, expect, it } from 'vitest';
import { daysInMonth, msToParts, parseDuration, parseWallValue, wallToMs } from './icsWall.js';

describe('parseWallValue', () => {
  it('data e hora flutuantes', () => {
    expect(parseWallValue('20261018T093000')).toEqual({
      ms: Date.UTC(2026, 9, 18, 9, 30, 0),
      hasTime: true,
      utc: false,
    });
  });

  it('sufixo Z marca UTC; só data não tem hora', () => {
    expect(parseWallValue('20261018T093000Z')?.utc).toBe(true);
    expect(parseWallValue('20261018')).toEqual({
      ms: Date.UTC(2026, 9, 18),
      hasTime: false,
      utc: false,
    });
  });

  it('formato inesperado → null', () => {
    expect(parseWallValue('2026-10-18')).toBeNull();
  });
});

describe('wallToMs / msToParts', () => {
  it('são inversas, inclusive com mês fora da faixa', () => {
    const parts = { y: 2026, m: 9, d: 18, h: 9, mi: 30, s: 15 };
    expect(msToParts(wallToMs(parts))).toEqual(parts);
    expect(msToParts(wallToMs({ ...parts, m: 12 })).y).toBe(2027);
  });
});

describe('daysInMonth', () => {
  it('fevereiro bissexto', () => {
    expect(daysInMonth(2028, 1)).toBe(29);
    expect(daysInMonth(2026, 1)).toBe(28);
  });
});

describe('parseDuration', () => {
  it('dias, semanas, horas, minutos', () => {
    expect(parseDuration('P1D')).toBe(86_400_000);
    expect(parseDuration('PT1H30M')).toBe(5_400_000);
    expect(parseDuration('P1W')).toBe(7 * 86_400_000);
    expect(parseDuration('-PT15M')).toBe(-900_000);
  });

  it('formato inesperado → null', () => {
    expect(parseDuration('1 hora')).toBeNull();
  });
});
