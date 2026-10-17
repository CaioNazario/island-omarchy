import { describe, expect, it } from 'vitest';
import {
  buildCityIndex,
  CITY_SEARCH_LIMIT,
  searchCities,
  type CityCandidate,
} from './citySearch.js';

const city = (name: string, region: string, country: string): CityCandidate<string> => ({
  name,
  region,
  country,
  location: name,
});

const cities = buildCityIndex([
  city('São Paulo', 'São Paulo', 'Brasil'),
  city('São José dos Campos', 'São Paulo', 'Brasil'),
  city('Paris', 'Île-de-France', 'França'),
  city('Paris', 'Texas', 'Estados Unidos'),
  city('Parintins', 'Amazonas', 'Brasil'),
  city('Campinas', 'São Paulo', 'Brasil'),
]);

const names = (query: string) => searchCities(cities, query).map((c) => `${c.name} (${c.region})`);

describe('searchCities', () => {
  it('ignores accents and case', () => {
    expect(names('SÃO JOSÉ')).toEqual(['São José dos Campos (São Paulo)']);
  });

  it('matches each word as the start of a word in name, region or country', () => {
    expect(names('paris texas')).toEqual(['Paris (Texas)']);
    expect(names('campos')).toEqual(['São José dos Campos (São Paulo)']);
    expect(names('ari')).toEqual([]);
  });

  it('ranks names that start with the query before other matches', () => {
    expect(names('sao paulo')).toEqual([
      'São Paulo (São Paulo)',
      'Campinas (São Paulo)',
      'São José dos Campos (São Paulo)',
    ]);
  });

  it('ranks by name, then region, among equal matches', () => {
    expect(names('par')).toEqual([
      'Parintins (Amazonas)',
      'Paris (Île-de-France)',
      'Paris (Texas)',
    ]);
    expect(names('sao')).toEqual([
      'São José dos Campos (São Paulo)',
      'São Paulo (São Paulo)',
      'Campinas (São Paulo)',
    ]);
  });

  it('needs at least two letters', () => {
    expect(names('p')).toEqual([]);
    expect(names('   ')).toEqual([]);
  });

  it('returns at most CITY_SEARCH_LIMIT results', () => {
    const many = Array.from({ length: CITY_SEARCH_LIMIT + 5 }, (_, i) =>
      city(`Santa ${i}`, 'Região', 'Brasil'),
    );
    expect(searchCities(buildCityIndex(many), 'santa')).toHaveLength(CITY_SEARCH_LIMIT);
  });
});
