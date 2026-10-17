import { describe, expect, it } from 'vitest';
import { MAX_NOTE_LENGTH, noteCounter, sanitizeNote } from './note.js';

describe('sanitizeNote', () => {
  it('troca quebra de linha por espaço', () => {
    expect(sanitizeNote('comprar\npão')).toBe('comprar pão');
    expect(sanitizeNote('a\r\nb\rc')).toBe('a b c');
  });

  it('corta em 80 caracteres, contando emoji como um', () => {
    expect(sanitizeNote('x'.repeat(100))).toHaveLength(MAX_NOTE_LENGTH);
    expect([...sanitizeNote('🎉'.repeat(90))]).toHaveLength(MAX_NOTE_LENGTH);
  });

  it('mantém texto válido', () => {
    expect(sanitizeNote('reunião às 15h')).toBe('reunião às 15h');
  });
});

describe('noteCounter', () => {
  it('conta caracteres', () => {
    expect(noteCounter('')).toBe('0/80 · Enter para salvar');
    expect(noteCounter('olá')).toBe('3/80 · Enter para salvar');
  });
});
