import { describe, expect, it } from 'vitest';
import { parseBoolOption, parseIntOption } from './hyprOptions.js';

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

describe('parseIntOption', () => {
  it('o "int" da resposta', () => {
    expect(parseIntOption('{"option": "decoration:rounding", "int": 12, "set": true }')).toBe(12);
    expect(parseIntOption('{"option": "decoration:rounding", "int": 0, "set": true }')).toBe(0);
  });

  it('resposta inválida, sem "int" ou negativa dá -1 (sem o valor)', () => {
    expect(parseIntOption('no such option')).toBe(-1);
    expect(parseIntOption('{"option": "decoration:rounding"}')).toBe(-1);
    expect(parseIntOption('{"option": "decoration:rounding", "int": -3}')).toBe(-1);
  });
});
