// Condição do GWeather → glifo Phosphor `ph-fill` (specs/07-clima.md
// "Condição → ícone"). A entrada é o nome de ícone que o `GWeather.Info` já
// resolve a partir de céu, fenômeno e dia/noite: a libgweather 4 só gera os
// nove nomes abaixo (garoa cai em `showers`, granizo em `snow`).

const GLYPHS: Readonly<Record<string, string>> = {
  'weather-clear': 'sun-fill',
  'weather-clear-night': 'moon-fill',
  'weather-few-clouds': 'cloud-sun-fill',
  'weather-few-clouds-night': 'cloud-moon-fill',
  'weather-overcast': 'cloud-fill',
  'weather-fog': 'cloud-fog-fill',
  'weather-showers': 'cloud-rain-fill',
  'weather-storm': 'cloud-lightning-fill',
  'weather-snow': 'snowflake-fill',
};

/** Aceita o nome com ou sem `-symbolic`; condição desconhecida → `null`. */
export function weatherGlyph(gweatherIconName: string): string | null {
  return GLYPHS[gweatherIconName.replace(/-symbolic$/, '')] ?? null;
}
