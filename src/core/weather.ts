// Clima da ilha compacta (specs/07-clima.md "Exibição").

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
