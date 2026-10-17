import { describe, expect, it } from 'vitest';
import { dayProgress, msUntilNextMinute } from './dayProgress.js';

describe('dayProgress', () => {
  it('conta os minutos desde 00:00 em %', () => {
    expect(dayProgress(new Date(2026, 8, 30, 0, 0))).toBe(0);
    expect(dayProgress(new Date(2026, 8, 30, 6, 0))).toBe(25);
    expect(dayProgress(new Date(2026, 8, 30, 12, 0))).toBe(50);
    expect(dayProgress(new Date(2026, 8, 30, 14, 30))).toBe(60);
  });

  it('arredonda para o % mais perto', () => {
    // 7 min / 14.4 = 0.49; 8 min = 0.56.
    expect(dayProgress(new Date(2026, 8, 30, 0, 7))).toBe(0);
    expect(dayProgress(new Date(2026, 8, 30, 0, 8))).toBe(1);
    expect(dayProgress(new Date(2026, 8, 30, 23, 59))).toBe(100);
  });

  it('ignora os segundos', () => {
    expect(dayProgress(new Date(2026, 8, 30, 12, 0, 59))).toBe(50);
  });
});

describe('msUntilNextMinute', () => {
  it('conta até o segundo zero do próximo minuto', () => {
    expect(msUntilNextMinute(new Date(2026, 8, 30, 12, 0, 0, 0))).toBe(60_000);
    expect(msUntilNextMinute(new Date(2026, 8, 30, 12, 0, 45, 500))).toBe(14_500);
  });
});
