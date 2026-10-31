import { describe, expect, it } from 'vitest';
import { autoBarSize, barZoom, sanitizeBarSize } from './barZoom.js';

// Tamanhos lógicos (já divididos pela escala do Hyprland).
const LAPTOP = { width: 1366, height: 768 };
const FULL_HD = { width: 1920, height: 1080 };
const QHD = { width: 2560, height: 1440 };
const UHD = { width: 3840, height: 2160 };

describe('sanitizeBarSize', () => {
  it('aceita os ids conhecidos', () => {
    expect(sanitizeBarSize('large')).toBe('large');
    expect(sanitizeBarSize('auto')).toBe('auto');
  });

  it('volta a auto com valor desconhecido ou de outro tipo', () => {
    expect(sanitizeBarSize('huge')).toBe('auto');
    expect(sanitizeBarSize(1.2)).toBe('auto');
    expect(sanitizeBarSize(null)).toBe('auto');
  });
});

describe('autoBarSize', () => {
  it('tela pequena fica com a barra pequena', () => {
    expect(autoBarSize(LAPTOP)).toBe('small');
    expect(autoBarSize({ width: 1536, height: 960 })).toBe('small');
  });

  it('Full HD fica no tamanho do design', () => {
    expect(autoBarSize(FULL_HD)).toBe('medium');
    expect(autoBarSize({ width: 2560, height: 1080 })).toBe('medium');
  });

  it('QHD e 4K em escala 1 ficam com a barra grande', () => {
    expect(autoBarSize(QHD)).toBe('large');
    expect(autoBarSize(UHD)).toBe('large');
  });
});

describe('barZoom', () => {
  it('cada tamanho tem o seu fator', () => {
    expect(barZoom('small', FULL_HD)).toBe(0.85);
    expect(barZoom('medium', FULL_HD)).toBe(1);
    expect(barZoom('large', FULL_HD)).toBe(1.2);
  });

  it('auto usa o tamanho do monitor', () => {
    expect(barZoom('auto', LAPTOP)).toBe(0.85);
    expect(barZoom('auto', FULL_HD)).toBe(1);
    expect(barZoom('auto', QHD)).toBe(1.2);
  });

  it('reduz o zoom para o layout ter sempre 1280×720 lógicos', () => {
    // 1280 / 1.2 = 1066: grande demais para 1280px de largura.
    expect(barZoom('large', { width: 1280, height: 800 })).toBe(1);
    // 1024 / 1280 = 0.8, abaixo até do pequeno.
    expect(barZoom('small', { width: 1024, height: 768 })).toBe(0.8);
    // 720 / 720 = 1 na altura.
    expect(barZoom('large', { width: 1920, height: 720 })).toBe(1);
  });

  it('arredonda o zoom reduzido para baixo, em passos de 0.05', () => {
    // 1366 / 1280 = 1.067.
    expect(barZoom('large', { width: 1366, height: 900 })).toBe(1.05);
  });

  it('sem medida do monitor fica no fator escolhido', () => {
    expect(barZoom('large', { width: 0, height: 0 })).toBe(1.2);
    expect(barZoom('auto', { width: 0, height: 0 })).toBe(1);
  });
});
