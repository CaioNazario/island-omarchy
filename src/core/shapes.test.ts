import { describe, expect, it } from 'vitest';
import { shapedRadius } from './shapes.js';

// Pílula: raio 13 do design em 26px de altura; ilha `wifi`: 34 em 280px.
const PILL = { design: 13, height: 26 };
const WIFI = { design: 34, height: 280 };

describe('shapedRadius', () => {
  it('Padrão mantém o raio do design', () => {
    expect(shapedRadius('default', PILL, 12, 12)).toBe(13);
    expect(shapedRadius('default', WIFI, 12, 12)).toBe(34);
  });

  it('Quadrado é 0', () => {
    expect(shapedRadius('square', PILL, 12, 12)).toBe(0);
    expect(shapedRadius('square', WIFI, 12, 12)).toBe(0);
  });

  it('Arredondado usa o raio escolhido, alguns pixels abaixo de uma pílula', () => {
    expect(shapedRadius('rounded', WIFI, 12, 12)).toBe(12);
    // 26px: no máximo 13 − 4 = 9.
    expect(shapedRadius('rounded', PILL, 12, 12)).toBe(9);
    expect(shapedRadius('rounded', PILL, 2, 12)).toBe(2);
  });

  it('Arredondado numa superfície baixa demais fica no mínimo de 2', () => {
    expect(shapedRadius('rounded', { design: 4, height: 8 }, 12, 12)).toBe(2);
  });

  it('Tema usa o arredondamento das janelas do Hyprland, até meia altura', () => {
    expect(shapedRadius('theme', WIFI, 12, 12)).toBe(12);
    expect(shapedRadius('theme', PILL, 12, 20)).toBe(13);
    expect(shapedRadius('theme', PILL, 12, 0)).toBe(0);
  });

  it('Tema sem o valor do Hyprland (-1) fica no raio do design', () => {
    expect(shapedRadius('theme', WIFI, 12, -1)).toBe(34);
  });
});
