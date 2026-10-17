import { describe, expect, it } from 'vitest';

import { osdGlyph, parseOsdPayload, volumeGlyph } from './osd.js';

// Payload como `omarchy-osd` monta (bin/omarchy-osd, Omarchy 4.0.4): todos os
// campos chegam como string, vazios quando a opção não foi passada.
function payload(fields: Partial<Record<string, string>>): string {
  return JSON.stringify({
    icon: '',
    message: '',
    value: '',
    progressText: '',
    max: '100',
    duration: '',
    ...fields,
  });
}

describe('parseOsdPayload', () => {
  it('volume com progresso vira pedido de volume', () => {
    expect(parseOsdPayload(payload({ icon: 'volume-high', value: '70' }))).toEqual({
      kind: 'volume',
      percent: 70,
    });
    expect(parseOsdPayload(payload({ icon: 'volume-muted', value: '0' }))).toEqual({
      kind: 'volume',
      percent: 0,
    });
  });

  it('brilho com progresso vira pedido de brilho', () => {
    expect(parseOsdPayload(payload({ icon: 'brightness', value: '45' }))).toEqual({
      kind: 'brightness',
      percent: 45,
    });
  });

  it('volume com mensagem (troca de saída) é mensagem, não volume', () => {
    expect(parseOsdPayload(payload({ icon: 'volume-high', message: 'Fones USB' }))).toEqual({
      kind: 'message',
      glyph: 'speaker-high-fill',
      text: 'Fones USB',
      durationMs: null,
    });
  });

  it('mensagem com duração', () => {
    expect(
      parseOsdPayload(payload({ icon: 'shutdown', message: 'Shutting down', duration: '5000' })),
    ).toEqual({ kind: 'message', glyph: 'power-bold', text: 'Shutting down', durationMs: 5000 });
  });

  it('progresso de outro tipo (luz do teclado) usa a escala de max', () => {
    expect(parseOsdPayload(payload({ icon: 'keyboard', value: '2', max: '3' }))).toEqual({
      kind: 'progress',
      glyph: 'keyboard-fill',
      percent: 67,
      durationMs: null,
    });
  });

  it('limita o progresso a 0–100', () => {
    expect(parseOsdPayload(payload({ icon: 'volume', value: '150' }))).toEqual({
      kind: 'volume',
      percent: 100,
    });
    expect(parseOsdPayload(payload({ icon: 'brightness', value: '-3' }))).toEqual({
      kind: 'brightness',
      percent: 0,
    });
  });

  it('sem mensagem nem progresso não há o que mostrar', () => {
    expect(parseOsdPayload(payload({ icon: 'keyboard' }))).toBeNull();
  });

  it('json inválido ou fora do formato devolve null', () => {
    expect(parseOsdPayload('not json')).toBeNull();
    expect(parseOsdPayload('[1, 2]')).toBeNull();
    expect(parseOsdPayload('null')).toBeNull();
  });

  it('campos ausentes contam como vazios', () => {
    expect(parseOsdPayload(JSON.stringify({ message: 'Oi' }))).toEqual({
      kind: 'message',
      glyph: 'info',
      text: 'Oi',
      durationMs: null,
    });
  });

  it('duração inválida ou zero usa a padrão da ilha', () => {
    const text = (duration: string) =>
      parseOsdPayload(payload({ icon: 'microphone', message: 'Microphone on', duration }));
    expect(text('abc')).toMatchObject({ durationMs: null });
    expect(text('0')).toMatchObject({ durationMs: null });
  });
});

describe('osdGlyph', () => {
  it.each([
    ['volume-muted', 'speaker-x-fill'],
    ['mute', 'speaker-x-fill'],
    ['volume-low', 'speaker-low-fill'],
    ['volume-medium', 'speaker-high-fill'],
    ['microphone-muted', 'microphone-slash'],
    ['mic-off', 'microphone-slash'],
    ['microphone', 'microphone'],
    ['keyboard', 'keyboard-fill'],
    ['brightness', 'sun'],
    ['display', 'monitor'],
    ['reboot', 'arrow-clockwise'],
    ['poweroff', 'power-bold'],
    ['logout', 'sign-out'],
    ['media-play', 'play-fill'],
    ['media-pause', 'pause-fill'],
    ['media-next', 'skip-forward-fill'],
    ['media-previous', 'skip-back-fill'],
    ['player', 'music-note-fill'],
    ['󰇚', 'download-simple'],
    ['', 'info'],
    ['󰂯', 'info'],
  ])('%s → %s', (icon, glyph) => {
    expect(osdGlyph(icon)).toBe(glyph);
  });

  it('ignora maiúsculas', () => {
    expect(osdGlyph('Volume-Muted')).toBe('speaker-x-fill');
  });
});

describe('volumeGlyph', () => {
  it('mudo ou zero → speaker-x', () => {
    expect(volumeGlyph(50, true)).toBe('speaker-x-fill');
    expect(volumeGlyph(0, false)).toBe('speaker-x-fill');
  });

  it('abaixo de 40 → speaker-low, senão speaker-high', () => {
    expect(volumeGlyph(39, false)).toBe('speaker-low-fill');
    expect(volumeGlyph(40, false)).toBe('speaker-high-fill');
  });
});
