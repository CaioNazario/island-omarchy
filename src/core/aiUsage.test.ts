import { describe, expect, it } from 'vitest';
import { formatPercent, formatSessionReset, formatWeeklyReset, usageLevel } from './aiUsage.js';

describe('usageLevel', () => {
  it.each([
    [0, 'normal'],
    [69.9, 'normal'],
    [70, 'high'],
    [89.9, 'high'],
    [90, 'critical'],
    [100, 'critical'],
  ])('%f%% is %s', (value, level) => {
    expect(usageLevel(value)).toBe(level);
  });
});

describe('formatPercent', () => {
  it('rounds to an integer', () => {
    expect(formatPercent(61.5)).toBe('62%');
    expect(formatPercent(0)).toBe('0%');
  });
});

describe('formatSessionReset', () => {
  const now = 1_000_000;
  const min = 60_000;

  it.each([
    [(2 * 60 + 14) * min, 'em 2h 14min'],
    [45 * min, 'em 45min'],
    [44 * min + 1, 'em 45min'],
    [2 * 60 * min, 'em 2h'],
    [0, 'em 1min'],
    [-5 * min, 'em 1min'],
  ])('%i ms ahead is %s', (ahead, label) => {
    expect(formatSessionReset(now + ahead, now)).toBe(label);
  });
});

describe('formatWeeklyReset', () => {
  it('shows the lowercase weekday and local time', () => {
    // 28/09/2026 é uma segunda.
    expect(formatWeeklyReset(new Date(2026, 8, 28, 9, 0).getTime())).toBe('seg, 09:00');
    expect(formatWeeklyReset(new Date(2026, 9, 3, 23, 5).getTime())).toBe('sáb, 23:05');
  });
});
