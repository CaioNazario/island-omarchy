import { describe, expect, it } from 'vitest';
import { formatClock, formatDay } from './clock.js';

describe('formatClock', () => {
  it('formata HH:MM com zero à esquerda', () => {
    expect(formatClock(new Date(2026, 8, 25, 9, 5))).toBe('09:05');
    expect(formatClock(new Date(2026, 8, 25, 23, 41))).toBe('23:41');
    expect(formatClock(new Date(2026, 8, 25, 0, 0))).toBe('00:00');
  });
});

describe('formatDay', () => {
  it('abrevia o dia da semana sem ponto e junta o dia do mês', () => {
    // 2026-09-25 é uma sexta-feira.
    expect(formatDay(new Date(2026, 8, 25))).toBe('Sex, 25');
    // 2026-09-27 é um domingo.
    expect(formatDay(new Date(2026, 8, 27))).toBe('Dom, 27');
  });
});
