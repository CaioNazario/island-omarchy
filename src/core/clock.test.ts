import { describe, expect, it } from 'vitest';
import { formatClock, formatClockRange, formatDay } from './clock.js';

describe('formatClock', () => {
  it('em português, HH:MM 24h com zero à esquerda', () => {
    expect(formatClock(new Date(2026, 8, 25, 9, 5), 'pt-BR')).toBe('09:05');
    expect(formatClock(new Date(2026, 8, 25, 23, 41), 'pt-BR')).toBe('23:41');
    expect(formatClock(new Date(2026, 8, 25, 0, 0), 'pt-BR')).toBe('00:00');
  });

  it('em inglês, 12h com AM/PM e sem zero à esquerda', () => {
    expect(formatClock(new Date(2026, 8, 25, 9, 5), 'en')).toBe('9:05 AM');
    expect(formatClock(new Date(2026, 8, 25, 23, 41), 'en')).toBe('11:41 PM');
  });

  it('em inglês, meia-noite é 12 AM e meio-dia é 12 PM', () => {
    expect(formatClock(new Date(2026, 8, 25, 0, 0), 'en')).toBe('12:00 AM');
    expect(formatClock(new Date(2026, 8, 25, 12, 30), 'en')).toBe('12:30 PM');
  });
});

describe('formatClockRange', () => {
  const at = (h: number, m = 0, day = 25) => new Date(2026, 8, day, h, m);

  it('em português, HH:MM – HH:MM', () => {
    expect(formatClockRange(at(9), at(10, 30), 'pt-BR')).toBe('09:00 – 10:30');
  });

  it('em inglês, AM/PM uma vez quando é o mesmo, sem :00 na hora cheia', () => {
    expect(formatClockRange(at(9), at(10), 'en')).toBe('9 – 10 AM');
    expect(formatClockRange(at(22), at(23, 30), 'en')).toBe('10 – 11:30 PM');
  });

  it('em inglês, AM/PM nos dois lados quando muda', () => {
    expect(formatClockRange(at(11), at(12, 30), 'en')).toBe('11 AM – 12:30 PM');
    expect(formatClockRange(at(22), at(2, 0, 26), 'en')).toBe('10 PM – 2 AM');
  });
});

describe('formatDay', () => {
  it('abrevia o dia da semana sem ponto e junta o dia do mês', () => {
    // 2026-09-25 é uma sexta-feira.
    expect(formatDay(new Date(2026, 8, 25), 'pt-BR')).toBe('Sex, 25');
    // 2026-09-27 é um domingo.
    expect(formatDay(new Date(2026, 8, 27), 'pt-BR')).toBe('Dom, 27');
  });

  it('em inglês, sem vírgula', () => {
    expect(formatDay(new Date(2026, 8, 25), 'en')).toBe('Fri 25');
  });
});
