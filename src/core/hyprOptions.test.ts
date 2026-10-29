import { describe, expect, it } from 'vitest';
import { parseBoolOption } from './hyprOptions.js';

describe('parseBoolOption', () => {
  it('Hyprland novo responde "bool"', () => {
    expect(
      parseBoolOption('{"option": "decoration:blur:enabled", "bool": true, "set": true }'),
    ).toBe(true);
    expect(
      parseBoolOption('{"option": "decoration:blur:enabled", "bool": false, "set": true }'),
    ).toBe(false);
  });

  it('Hyprland antigo responde "int"', () => {
    expect(parseBoolOption('{"option": "decoration:blur:enabled", "int": 1, "set": true }')).toBe(
      true,
    );
    expect(parseBoolOption('{"option": "decoration:blur:enabled", "int": 0, "set": true }')).toBe(
      false,
    );
  });

  it('resposta que não é JSON ou sem valor conta como desligado', () => {
    expect(parseBoolOption('no such option')).toBe(false);
    expect(parseBoolOption('')).toBe(false);
    expect(parseBoolOption('{"option": "x"}')).toBe(false);
  });
});
