import { describe, expect, it } from 'vitest';

import { decodeUtf8 } from './utf8.js';

const bytes = (...values: number[]) => new Uint8Array(values);

describe('decodeUtf8', () => {
  it('decodes ascii', () => {
    expect(decodeUtf8(new TextEncoder().encode('{"exp":1}'))).toBe('{"exp":1}');
  });

  it('decodes two, three and four byte sequences', () => {
    const text = 'ção € 🎵';
    expect(decodeUtf8(new TextEncoder().encode(text))).toBe(text);
  });

  it('rejects a lone continuation byte', () => {
    expect(decodeUtf8(bytes(0x80))).toBeNull();
  });

  it('rejects a truncated sequence', () => {
    expect(decodeUtf8(bytes(0xe2, 0x82))).toBeNull();
  });

  it('rejects overlong encodings', () => {
    expect(decodeUtf8(bytes(0xc0, 0xaf))).toBeNull();
    expect(decodeUtf8(bytes(0xe0, 0x80, 0xaf))).toBeNull();
  });

  it('rejects surrogates and code points above U+10FFFF', () => {
    expect(decodeUtf8(bytes(0xed, 0xa0, 0x80))).toBeNull();
    expect(decodeUtf8(bytes(0xf4, 0x90, 0x80, 0x80))).toBeNull();
  });
});
