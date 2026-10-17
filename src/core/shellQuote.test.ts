import { describe, expect, it } from 'vitest';

import { shellQuote } from './shellQuote.js';

describe('shellQuote', () => {
  it('envolve em aspas simples', () => {
    expect(shellQuote('Casa')).toBe("'Casa'");
  });

  it('mantém espaços e metacaracteres literais', () => {
    expect(shellQuote('Rede $HOME; rm -rf ~ `x`')).toBe("'Rede $HOME; rm -rf ~ `x`'");
  });

  it('escapa aspas simples fechando e reabrindo', () => {
    expect(shellQuote("Caio's")).toBe("'Caio'\\''s'");
  });

  it('string vazia vira um argumento vazio', () => {
    expect(shellQuote('')).toBe("''");
  });
});
