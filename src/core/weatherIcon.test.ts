import { describe, expect, it } from 'vitest';

import { weatherGlyph } from './weatherIcon.js';

describe('weatherGlyph (código WMO do Open-Meteo)', () => {
  it.each([
    [0, true, 'sun-fill'],
    [0, false, 'moon-fill'],
    [1, true, 'cloud-sun-fill'],
    [2, false, 'cloud-moon-fill'],
    [3, true, 'cloud-fill'],
    [3, false, 'cloud-fill'],
    [45, true, 'cloud-fog-fill'],
    [48, false, 'cloud-fog-fill'],
    [51, true, 'cloud-rain-fill'],
    [57, true, 'cloud-rain-fill'],
    [61, true, 'cloud-rain-fill'],
    [67, false, 'cloud-rain-fill'],
    [80, true, 'cloud-rain-fill'],
    [82, true, 'cloud-rain-fill'],
    [71, true, 'snowflake-fill'],
    [77, true, 'snowflake-fill'],
    [85, true, 'snowflake-fill'],
    [86, false, 'snowflake-fill'],
    [95, true, 'cloud-lightning-fill'],
    [99, false, 'cloud-lightning-fill'],
  ])('%i (dia=%s) → %s', (code, isDay, glyph) => {
    expect(weatherGlyph(code, isDay)).toBe(glyph);
  });

  it('código desconhecido → null', () => {
    expect(weatherGlyph(4, true)).toBeNull();
    expect(weatherGlyph(100, true)).toBeNull();
    expect(weatherGlyph(-1, true)).toBeNull();
  });
});
