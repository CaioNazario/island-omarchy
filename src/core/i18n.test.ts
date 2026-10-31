import { describe, expect, it } from 'vitest';
import { monthName, sanitizeLanguage, tr, trCount, weekdayShort } from './i18n.js';
import { PT_BR } from './i18nPtBr.js';

describe('sanitizeLanguage', () => {
  it('aceita os idiomas conhecidos', () => {
    expect(sanitizeLanguage('pt-BR')).toBe('pt-BR');
    expect(sanitizeLanguage('en')).toBe('en');
  });

  it('volta ao inglês com valor desconhecido ou de outro tipo', () => {
    expect(sanitizeLanguage('pt')).toBe('en');
    expect(sanitizeLanguage(undefined)).toBe('en');
  });
});

describe('tr', () => {
  it('em inglês devolve o texto-fonte com os valores', () => {
    expect(tr('en', '{n} min ago', { n: 5 })).toBe('5 min ago');
  });

  it('em português usa o catálogo', () => {
    expect(tr('pt-BR', '{n} min ago', { n: 5 })).toBe('há 5 min');
    expect(tr('pt-BR', 'Shut down')).toBe('Desligar');
  });

  it('texto fora do catálogo fica em inglês', () => {
    expect(tr('pt-BR', 'Not in the catalog')).toBe('Not in the catalog');
  });

  it('marcador sem valor fica visível', () => {
    expect(tr('en', '{n} min ago')).toBe('{n} min ago');
  });
});

describe('trCount', () => {
  it('escolhe singular ou plural pelo número', () => {
    expect(trCount('en', 1, '1 day', '{n} days')).toBe('1 day');
    expect(trCount('pt-BR', 3, '1 day', '{n} days')).toBe('3 dias');
  });
});

describe('weekdayShort e monthName', () => {
  it('seguem a numeração do Date', () => {
    expect(weekdayShort('en', 0)).toBe('Sun');
    expect(weekdayShort('pt-BR', 6)).toBe('Sáb');
    expect(monthName('en', 0)).toBe('January');
    expect(monthName('pt-BR', 2)).toBe('Março');
  });
});

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]!).sort();
}

// Que todo texto marcado no código está no catálogo, e vice-versa, quem
// confere é o `scripts/check-i18n.mjs` (no `make lint`): ele lê os arquivos.
describe('catálogo pt-BR', () => {
  it('cada tradução tem os mesmos marcadores do inglês', () => {
    const mismatched = Object.entries(PT_BR).filter(
      ([en, pt]) => placeholders(en).join() !== placeholders(pt).join(),
    );
    expect(mismatched).toEqual([]);
  });
});
