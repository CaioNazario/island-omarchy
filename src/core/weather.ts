// Clima da ilha compacta (specs/07-clima.md): exibição, resposta do
// Open-Meteo e a localização.

/** Falha de rede: o último valor vale por até 3h; depois o clima some. */
export const READING_TTL_MS = 3 * 60 * 60 * 1000;

export interface WeatherReading {
  /** Glifo Phosphor, de `weatherGlyph`. */
  glyph: string;
  celsius: number;
  /** Quando a leitura chegou (ms, relógio do sistema). */
  receivedAt: number;
}

/** °C arredondado, sem casa decimal: `22°`. */
export function formatTemperature(celsius: number): string {
  // `Math.round(-0.4)` é `-0`, que viraria `-0°`.
  return `${Math.round(celsius) || 0}°`;
}

export function isFresh(reading: WeatherReading, now: number): boolean {
  return now - reading.receivedAt <= READING_TTL_MS;
}

export interface OpenMeteoCurrent {
  celsius: number;
  /** Código WMO, para `weatherGlyph`. */
  code: number;
  isDay: boolean;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Bloco `current` da resposta do Open-Meteo; formato inesperado → `null`. */
export function parseOpenMeteoCurrent(body: string): OpenMeteoCurrent | null {
  const root = parseJson(body);
  if (!isRecord(root) || !isRecord(root.current)) return null;
  const { temperature_2m: celsius, weather_code: code, is_day: isDay } = root.current;
  if (typeof celsius !== 'number' || typeof code !== 'number') return null;
  return { celsius, code, isDay: isDay !== 0 };
}

export interface WeatherLocation {
  name: string;
  latitude: number;
  longitude: number;
}

function coordinate(value: unknown, limit: number): number | null {
  const number = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof number !== 'number' || !Number.isFinite(number)) return null;
  return Math.abs(number) <= limit ? number : null;
}

/**
 * `{name, latitude, longitude}`: o formato do `weather.json` do Omarchy
 * (`omarchy-weather-location`) e da cidade das preferências da Island. Sem
 * coordenadas válidas → `null` (a Island não geolocaliza por IP).
 */
export function parseWeatherLocation(text: string): WeatherLocation | null {
  const root = parseJson(text);
  if (!isRecord(root)) return null;
  const latitude = coordinate(root.latitude, 90);
  const longitude = coordinate(root.longitude, 180);
  if (latitude === null || longitude === null) return null;
  return { name: typeof root.name === 'string' ? root.name : '', latitude, longitude };
}

export function openMeteoUrl(location: WeatherLocation): string {
  return (
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${location.latitude}&longitude=${location.longitude}` +
    '&current=temperature_2m,weather_code,is_day&temperature_unit=celsius'
  );
}
