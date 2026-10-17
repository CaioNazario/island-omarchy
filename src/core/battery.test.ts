import { describe, expect, it } from 'vitest';
import { batteryDisplay } from './battery.js';

describe('batteryDisplay', () => {
  it.each([
    [100, 1],
    [78, 0.78],
    [5, 0.05],
    [0, 0],
  ] as const)('fills %i%% of the body width', (percent, fill) => {
    expect(batteryDisplay(percent, false).fill).toBe(fill);
  });

  it.each([
    [100, 'good'],
    [90, 'good'],
    [89, 'normal'],
    [21, 'normal'],
    [20, 'low'],
    [0, 'low'],
  ] as const)('colors the %i%% level as %s', (percent, tone) => {
    expect(batteryDisplay(percent, false).tone).toBe(tone);
  });

  it('writes the level without the percent sign', () => {
    expect(batteryDisplay(78, false).number).toBe('78');
    expect(batteryDisplay(100, true).number).toBe('100');
  });

  it('shows the bolt only while charging', () => {
    for (const percent of [100, 50, 20, 0]) {
      expect(batteryDisplay(percent, true).bolt).toBe(true);
      expect(batteryDisplay(percent, false).bolt).toBe(false);
    }
  });

  it('keeps the level colors while charging', () => {
    expect(batteryDisplay(95, true).tone).toBe('good');
    expect(batteryDisplay(50, true).tone).toBe('normal');
    expect(batteryDisplay(15, true).tone).toBe('low');
  });

  it('rounds the UPower percentage before applying the thresholds', () => {
    expect(batteryDisplay(89.6, false)).toEqual({
      tone: 'good',
      fill: 0.9,
      number: '90',
      bolt: false,
    });
    expect(batteryDisplay(20.4, false)).toEqual({
      tone: 'low',
      fill: 0.2,
      number: '20',
      bolt: false,
    });
  });

  it('clamps out-of-range percentages', () => {
    expect(batteryDisplay(104, false)).toMatchObject({ fill: 1, number: '100' });
    expect(batteryDisplay(-3, false)).toMatchObject({ fill: 0, number: '0' });
  });
});
