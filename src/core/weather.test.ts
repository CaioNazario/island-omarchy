import { describe, expect, it } from 'vitest';
import {
  formatTemperature,
  isFresh,
  openMeteoUrl,
  parseOpenMeteoCurrent,
  parseWeatherLocation,
  READING_TTL_MS,
  type WeatherReading,
} from './weather.js';

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

describe('parseOpenMeteoCurrent', () => {
  it('lê temperatura, código e dia/noite do bloco current', () => {
    const body = JSON.stringify({
      current: { temperature_2m: 22.4, weather_code: 2, is_day: 0 },
    });
    expect(parseOpenMeteoCurrent(body)).toEqual({ celsius: 22.4, code: 2, isDay: false });
  });

  it('formato inesperado ou JSON inválido → null', () => {
    expect(parseOpenMeteoCurrent('<html>')).toBeNull();
    expect(parseOpenMeteoCurrent('{}')).toBeNull();
    expect(parseOpenMeteoCurrent(JSON.stringify({ current: { temperature_2m: 'x' } }))).toBeNull();
    expect(
      parseOpenMeteoCurrent(
        JSON.stringify({ current: { temperature_2m: 20, weather_code: null } }),
      ),
    ).toBeNull();
  });
});

describe('parseWeatherLocation', () => {
  it('lê nome e coordenadas (formato do omarchy-weather-location)', () => {
    const text = JSON.stringify({ name: 'Recife', latitude: -8.05, longitude: '-34.9' });
    expect(parseWeatherLocation(text)).toEqual({
      name: 'Recife',
      latitude: -8.05,
      longitude: -34.9,
    });
  });

  it('sem coordenadas, vazio ou inválido → null', () => {
    expect(parseWeatherLocation(JSON.stringify({ name: 'Recife' }))).toBeNull();
    expect(parseWeatherLocation('')).toBeNull();
    expect(parseWeatherLocation('nope')).toBeNull();
    expect(parseWeatherLocation(JSON.stringify({ latitude: 'a', longitude: 1 }))).toBeNull();
  });

  it('coordenadas fora da faixa → null', () => {
    expect(parseWeatherLocation(JSON.stringify({ latitude: 91, longitude: 0 }))).toBeNull();
    expect(parseWeatherLocation(JSON.stringify({ latitude: 0, longitude: 181 }))).toBeNull();
  });
});

describe('openMeteoUrl', () => {
  it('pede só o bloco current, em °C', () => {
    expect(openMeteoUrl({ name: 'Recife', latitude: -8.05, longitude: -34.9 })).toBe(
      'https://api.open-meteo.com/v1/forecast?latitude=-8.05&longitude=-34.9&current=temperature_2m,weather_code,is_day&temperature_unit=celsius',
    );
  });
});
