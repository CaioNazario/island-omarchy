import { describe, expect, it } from 'vitest';
import {
  activeScale,
  DISPLAY_SCALES,
  isSafeMonitorName,
  monitorSubtitle,
  parseTextSize,
  TEXT_SIZES,
  textSegments,
} from './display.js';

describe('parseTextSize', () => {
  it('lê o tamanho da primeira linha de omarchy-display-text-size', () => {
    expect(
      parseTextSize('text size: 12 px\ngtk text-scaling-factor: 1.0\nterminal font: 9 pt\n'),
    ).toBe(12);
    expect(parseTextSize('text size: 16px')).toBe(16);
  });

  it('saída sem o tamanho dá null', () => {
    expect(parseTextSize('')).toBeNull();
    expect(parseTextSize('Usage: omarchy-display-text-size [size|reset]')).toBeNull();
  });
});

describe('textSegments', () => {
  it('sete segmentos de 10 a 16px; preenche até o atual e põe o puxador nele', () => {
    expect(TEXT_SIZES).toEqual([10, 11, 12, 13, 14, 15, 16]);
    const segments = textSegments(12);
    expect(segments.map((segment) => segment.filled)).toEqual([
      true,
      true,
      true,
      false,
      false,
      false,
      false,
    ]);
    expect(segments.map((segment) => segment.knob)).toEqual([
      false,
      false,
      true,
      false,
      false,
      false,
      false,
    ]);
  });

  it('tamanho fora da faixa do design (o Omarchy aceita 9–20) não mostra puxador', () => {
    expect(textSegments(18).every((segment) => segment.filled && !segment.knob)).toBe(true);
    expect(textSegments(9).every((segment) => !segment.filled && !segment.knob)).toBe(true);
  });
});

describe('escala', () => {
  it('as escalas do omarchy-hyprland-monitor-scaling', () => {
    expect(DISPLAY_SCALES).toEqual([1, 1.25, 1.6, 2, 3, 4]);
  });

  it('ativa a escala mais próxima: o Omarchy ajusta a escala a um divisor da resolução', () => {
    expect(activeScale(1)).toBe(1);
    // 1.6 em 1920×1080 vira 1.666667 no Hyprland.
    expect(activeScale(1.666667)).toBe(1.6);
    expect(activeScale(1.25)).toBe(1.25);
  });

  it('escala longe de todas (ex.: 1.8 escrita à mão) não ativa nenhuma', () => {
    expect(activeScale(1.8)).toBeNull();
  });

  it('só aceita nome de saída simples, como o script do Omarchy', () => {
    expect(isSafeMonitorName('eDP-1')).toBe(true);
    expect(isSafeMonitorName('HDMI-A-1')).toBe(true);
    expect(isSafeMonitorName('x"); os.exit() --')).toBe(false);
  });
});

describe('monitorSubtitle', () => {
  it('descrição · resolução · taxa arredondada', () => {
    expect(
      monitorSubtitle({
        description: 'Dell U2723QE',
        width: 3840,
        height: 2160,
        refreshRate: 59.997,
      }),
    ).toBe('Dell U2723QE · 3840×2160 · 60 Hz');
  });

  it('sem taxa nem descrição, mostra só o que tem', () => {
    expect(monitorSubtitle({ description: '', width: 1920, height: 1080 })).toBe('1920×1080');
  });
});
