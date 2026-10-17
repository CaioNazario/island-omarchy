import { describe, expect, it } from 'vitest';
import { weatherGlyph } from './weatherIcon.js';

describe('weatherGlyph', () => {
  it.each([
    ['weather-clear', 'sun-fill'],
    ['weather-clear-night', 'moon-fill'],
    ['weather-few-clouds', 'cloud-sun-fill'],
    ['weather-few-clouds-night', 'cloud-moon-fill'],
    ['weather-overcast', 'cloud-fill'],
    ['weather-fog', 'cloud-fog-fill'],
    ['weather-showers', 'cloud-rain-fill'],
    ['weather-storm', 'cloud-lightning-fill'],
    ['weather-snow', 'snowflake-fill'],
  ])('maps %s to %s', (name, glyph) => {
    expect(weatherGlyph(name)).toBe(glyph);
  });

  it('accepts the symbolic variant', () => {
    expect(weatherGlyph('weather-clear-night-symbolic')).toBe('moon-fill');
  });

  it('returns null for an unknown condition', () => {
    expect(weatherGlyph('weather-severe-alert')).toBeNull();
    expect(weatherGlyph('')).toBeNull();
  });
});
