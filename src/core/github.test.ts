import { describe, expect, it } from 'vitest';
import {
  githubView,
  outcomeForStatus,
  parseTotalCount,
  SEARCH_QUERIES,
  searchUrl,
  tokenFromOutput,
} from './github.js';

describe('searchUrl', () => {
  it('codifica a busca e pede um resultado só', () => {
    expect(searchUrl(SEARCH_QUERIES.mine)).toBe(
      'https://api.github.com/search/issues?q=is%3Apr%20is%3Aopen%20author%3A%40me&per_page=1',
    );
  });
});

describe('tokenFromOutput', () => {
  it('aceita saída 0 com token, sem o \\n do fim', () => {
    expect(tokenFromOutput(0, 'gho_abc\n')).toBe('gho_abc');
  });

  it('sem login (saída 1) ou stdout vazio não é credencial', () => {
    expect(tokenFromOutput(1, '')).toBeNull();
    expect(tokenFromOutput(0, '  \n')).toBeNull();
  });
});

describe('outcomeForStatus', () => {
  it('200 ok, 401 pede token novo, o resto mantém o último valor', () => {
    expect(outcomeForStatus(200)).toBe('ok');
    expect(outcomeForStatus(401)).toBe('unauthorized');
    expect(outcomeForStatus(403)).toBe('failed');
    expect(outcomeForStatus(502)).toBe('failed');
  });
});

describe('parseTotalCount', () => {
  it('lê total_count', () => {
    expect(parseTotalCount('{"total_count":3,"incomplete_results":false,"items":[{}]}')).toBe(3);
    expect(parseTotalCount('{"total_count":0,"items":[]}')).toBe(0);
  });

  it('resposta estranha vira null', () => {
    expect(parseTotalCount('')).toBeNull();
    expect(parseTotalCount('{"message":"Bad credentials"}')).toBeNull();
    expect(parseTotalCount('{"total_count":"3"}')).toBeNull();
    expect(parseTotalCount('{"total_count":-1}')).toBeNull();
  });
});

describe('githubView', () => {
  it('PRs no singular e no plural', () => {
    expect(githubView({ mine: 1, review: 0 })).toEqual({ label: '1 PR', unavailable: false });
    expect(githubView({ mine: 0, review: 0 }).label).toBe('0 PRs');
    expect(githubView({ mine: 4, review: 0 }).label).toBe('4 PRs');
  });

  it('sub com revisões pedidas, e some com zero', () => {
    expect(githubView({ mine: 2, review: 1 }).sub).toBe('1 para revisar');
    expect(githubView({ mine: 2, review: 3 }).sub).toBe('3 para revisar');
    expect(githubView({ mine: 2, review: 0 }).sub).toBeUndefined();
  });

  it('sem credencial: "GitHub" sem sub', () => {
    expect(githubView(null)).toEqual({ label: 'GitHub', unavailable: true });
  });
});
