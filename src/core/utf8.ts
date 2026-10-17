// UTF-8 estrito para o core. O motor JS do QML (V4) não tem `TextDecoder`
// (specs/14-spikes.md, S5), e o payload de um JWT chega como bytes.

/** Menor code point válido para cada tamanho de sequência; abaixo disso é overlong. */
const MIN_CODE_POINT = [0, 0, 0x80, 0x800, 0x10000];

function sequenceLength(lead: number): number {
  if (lead < 0x80) return 1;
  if (lead >= 0xc2 && lead < 0xe0) return 2;
  if (lead >= 0xe0 && lead < 0xf0) return 3;
  if (lead >= 0xf0 && lead < 0xf5) return 4;
  return 0;
}

/** Code point da sequência em `start`, ou null se for inválida. */
function readCodePoint(bytes: Uint8Array, start: number, length: number): number | null {
  if (start + length > bytes.length) return null;
  let codePoint = length === 1 ? bytes[start]! : bytes[start]! & (0xff >> (length + 1));
  for (let i = 1; i < length; i++) {
    const next = bytes[start + i]!;
    if ((next & 0xc0) !== 0x80) return null;
    codePoint = (codePoint << 6) | (next & 0x3f);
  }
  return isScalarValue(codePoint, length) ? codePoint : null;
}

function isScalarValue(codePoint: number, length: number): boolean {
  if (codePoint < MIN_CODE_POINT[length]!) return false;
  if (codePoint >= 0xd800 && codePoint <= 0xdfff) return false;
  return codePoint <= 0x10ffff;
}

/** Texto dos bytes, ou null se não forem UTF-8 válido (como `TextDecoder` com `fatal: true`). */
export function decodeUtf8(bytes: Uint8Array): string | null {
  let text = '';
  for (let i = 0; i < bytes.length;) {
    const length = sequenceLength(bytes[i]!);
    const codePoint = length === 0 ? null : readCodePoint(bytes, i, length);
    if (codePoint === null) return null;
    text += String.fromCodePoint(codePoint);
    i += length;
  }
  return text;
}
