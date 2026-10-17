import { describe, expect, it } from 'vitest';
import { formatTemperature, isFresh, READING_TTL_MS, type WeatherReading } from './weather.js';

describe('formatTemperature', () => {
  it.each([
    [22, '22°'],
    [21.5, '22°'],
    [21.49, '21°'],
    [0, '0°'],
    [-0.4, '0°'],
    [-3.6, '-4°'],
  ])('shows %f °C as %s', (celsius, label) => {
    expect(formatTemperature(celsius)).toBe(label);
  });
});

describe('isFresh', () => {
  const reading: WeatherReading = { glyph: 'sun-fill', celsius: 22, receivedAt: 1_000 };

  it('keeps a reading for up to 3h', () => {
    expect(isFresh(reading, 1_000)).toBe(true);
    expect(isFresh(reading, 1_000 + READING_TTL_MS)).toBe(true);
  });

  it('drops a reading older than 3h', () => {
    expect(isFresh(reading, 1_000 + READING_TTL_MS + 1)).toBe(false);
  });
});
