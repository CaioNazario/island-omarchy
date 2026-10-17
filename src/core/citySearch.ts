// Busca de cidade da página Clima (specs/13-preferencias.md). O GWeather 4
// tirou o `GWeatherLocationEntry`; a janela achata o banco de cidades em
// `CityCandidate` e a comparação fica aqui.

export const CITY_SEARCH_LIMIT = 20;
export const CITY_QUERY_MIN_LENGTH = 2;

export interface CityCandidate<L> {
  name: string;
  /** Estado/província; vazio quando o GWeather não tem. */
  region: string;
  country: string;
  location: L;
}

export interface IndexedCity<L> {
  city: CityCandidate<L>;
  name: string;
  region: string;
  words: string[];
}

const normalize = (text: string): string =>
  text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

const splitWords = (text: string): string[] => text.split(/[^\p{L}\p{N}]+/u).filter(Boolean);

function indexCity<L>(city: CityCandidate<L>): IndexedCity<L> {
  const name = normalize(city.name);
  const region = normalize(city.region);
  const words = splitWords(`${name} ${region} ${normalize(city.country)}`);
  return { city, name, region, words };
}

/** Normaliza uma vez só: a busca roda a cada tecla sobre milhares de cidades. */
export const buildCityIndex = <L>(cities: CityCandidate<L>[]): IndexedCity<L>[] =>
  cities.map(indexCity);

const byNameThenRegion = <L>(a: IndexedCity<L>, b: IndexedCity<L>): number =>
  a.name.localeCompare(b.name) || a.region.localeCompare(b.region);

/**
 * Cada palavra da busca tem que ser começo de alguma palavra do nome, região
 * ou país. Nome que começa com a busca inteira vem antes; depois, por nome.
 */
export function searchCities<L>(index: IndexedCity<L>[], query: string): CityCandidate<L>[] {
  const needle = normalize(query);
  if (needle.length < CITY_QUERY_MIN_LENGTH) return [];
  const queryWords = splitWords(needle);
  const matches = index.filter((c) =>
    queryWords.every((q) => c.words.some((w) => w.startsWith(q))),
  );
  const direct = matches.filter((c) => c.name.startsWith(needle)).sort(byNameThenRegion);
  const others = matches.filter((c) => !c.name.startsWith(needle)).sort(byNameThenRegion);
  return [...direct, ...others].slice(0, CITY_SEARCH_LIMIT).map((c) => c.city);
}
