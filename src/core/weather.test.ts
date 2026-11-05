import { describe, expect, it } from 'vitest';
import {
  areaSources,
  geocodingUrl,
  hintMessage,
  parseGeocoding,
  shouldShowHint,
  weatherOrigin,
  formatTemperature,
  isFresh,
  openMeteoUrl,
  parseIpGeo,
  parseOpenMeteoCurrent,
  parseWeatherLocation,
  parseWeatherName,
  parseWttrArea,
  reachedServer,
  sameLocation,
  wttrUrl,
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

describe('localização como o Omarchy', () => {
  it('weather.json só com o nome vira consulta do wttr.in pelo nome', () => {
    expect(wttrUrl(parseWeatherName('{"name": "São Paulo"}'))).toBe(
      'https://wttr.in/S%C3%A3o%20Paulo?format=j1',
    );
  });

  it('sem arquivo (ou sem nome), o wttr.in detecta pela IP', () => {
    expect(wttrUrl(parseWeatherName(''))).toBe('https://wttr.in/?format=j1');
    expect(wttrUrl(parseWeatherName('{"latitude": 1}'))).toBe('https://wttr.in/?format=j1');
  });

  it('a área do wttr.in dá as coordenadas para o Open-Meteo', () => {
    const body = JSON.stringify({
      nearest_area: [
        { areaName: [{ value: 'Camaragibe' }], latitude: '-8.021', longitude: '-34.981' },
      ],
    });
    expect(parseWttrArea(body)).toEqual({
      name: 'Camaragibe',
      latitude: -8.021,
      longitude: -34.981,
    });
  });

  it('resposta sem área ou inválida dá null', () => {
    expect(parseWttrArea('{}')).toBeNull();
    expect(parseWttrArea('<html>')).toBeNull();
  });
});

describe('sameLocation', () => {
  it('mesmas coordenadas são o mesmo lugar, mesmo em objetos diferentes', () => {
    const a = { name: 'Camaragibe', latitude: -8.021, longitude: -34.981 };
    expect(sameLocation(a, { ...a })).toBe(true);
    expect(sameLocation(a, { ...a, latitude: -8.03 })).toBe(false);
    expect(sameLocation(null, a)).toBe(false);
    expect(sameLocation(null, null)).toBe(true);
  });
});

describe('parseIpGeo', () => {
  it('lê coordenadas e cidade do ipwho.is', () => {
    const body = JSON.stringify({
      success: true,
      city: 'Camaragibe',
      latitude: -8.02,
      longitude: -34.98,
    });
    expect(parseIpGeo(body)).toEqual({ name: 'Camaragibe', latitude: -8.02, longitude: -34.98 });
  });

  it('corta um nome gigante vindo de fora', () => {
    const body = JSON.stringify({
      success: true,
      city: 'x'.repeat(5000),
      latitude: 1,
      longitude: 2,
    });
    expect(parseIpGeo(body)?.name).toHaveLength(100);
  });

  it('recusa falha, coordenada fora da faixa e lixo', () => {
    expect(parseIpGeo(JSON.stringify({ success: false, message: 'limit' }))).toBeNull();
    expect(parseIpGeo(JSON.stringify({ success: true, latitude: 99, longitude: 0 }))).toBeNull();
    expect(parseIpGeo('<html>')).toBeNull();
  });
});

describe('areaSources', () => {
  it('sem nome: wttr.in e depois a geolocalização por IP', () => {
    expect(areaSources('').map((source) => source.url)).toEqual([
      'https://wttr.in/?format=j1',
      'https://ipwho.is/',
    ]);
  });

  it('com nome do weather.json: só o wttr.in, que o resolve', () => {
    expect(areaSources('Recife')).toHaveLength(1);
  });
});

describe('weatherOrigin', () => {
  const city = { name: 'X', latitude: 1, longitude: 2 };

  it('follows the fallback chain', () => {
    expect(weatherOrigin(city, city, city)).toBe('island');
    expect(weatherOrigin(null, city, city)).toBe('omarchy');
    expect(weatherOrigin(null, null, city)).toBe('auto');
    expect(weatherOrigin(null, null, null)).toBe('none');
  });
});

describe('parseGeocoding', () => {
  it('builds labels without repeated parts and keeps the coordinates', () => {
    const body = JSON.stringify({
      results: [
        {
          name: 'Paris',
          admin1: 'Île-de-France',
          country: 'France',
          latitude: 48.85,
          longitude: 2.35,
        },
        {
          name: 'Singapore',
          admin1: 'Singapore',
          country: 'Singapore',
          latitude: 1.28,
          longitude: 103.85,
        },
      ],
    });
    expect(parseGeocoding(body)).toEqual([
      {
        label: 'Paris, Île-de-France, France',
        location: { name: 'Paris', latitude: 48.85, longitude: 2.35 },
      },
      { label: 'Singapore', location: { name: 'Singapore', latitude: 1.28, longitude: 103.85 } },
    ]);
  });

  it('drops items without a name or valid coordinates and tolerates bad bodies', () => {
    const body = JSON.stringify({
      results: [
        { name: '', latitude: 1, longitude: 1 },
        { name: 'A', latitude: 99, longitude: 1 },
        7,
      ],
    });
    expect(parseGeocoding(body)).toEqual([]);
    expect(parseGeocoding('{"generationtime_ms":1}')).toEqual([]);
    expect(parseGeocoding('nope')).toEqual([]);
  });

  it('keeps at most 20 results', () => {
    const results = Array.from({ length: 30 }, (_, i) => ({
      name: `C${i}`,
      latitude: 1,
      longitude: 1,
    }));
    expect(parseGeocoding(JSON.stringify({ results }))).toHaveLength(20);
  });
});

describe('geocodingUrl', () => {
  it('encodes the query and asks for 20 results', () => {
    expect(geocodingUrl(' São Paulo ')).toBe(
      'https://geocoding-api.open-meteo.com/v1/search?name=S%C3%A3o%20Paulo&count=20&language=en&format=json',
    );
  });
});

describe('shouldShowHint', () => {
  it('fires once, only when nothing resolved a city', () => {
    expect(shouldShowHint(false, 'none', true)).toBe(true);
    expect(shouldShowHint(true, 'none', true)).toBe(false);
    expect(shouldShowHint(false, 'auto', true)).toBe(false);
    expect(shouldShowHint(false, 'none', false)).toBe(false);
  });
});

describe('hintMessage', () => {
  it('follows the interface language', () => {
    expect(hintMessage('en').title).toBe('Weather');
    expect(hintMessage('pt-BR').title).toBe('Clima');
  });
});

describe('reachedServer', () => {
  it('tells a server answer from a network failure', () => {
    expect([0, 22].map(reachedServer)).toEqual([true, true]);
    expect([6, 7, 28, 35, 56].map(reachedServer)).toEqual([false, false, false, false, false]);
  });
});
