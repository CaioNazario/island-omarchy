import { describe, expect, it } from 'vitest';
import { fitWidgets, type WidgetSize } from './widgetFit.js';

const fixed = (width: number): WidgetSize => ({ natural: width, min: width });
const hw: WidgetSize = { natural: 200, min: 90 };

describe('fitWidgets', () => {
  it('com espaço, todos na largura natural', () => {
    expect(fitWidgets([fixed(80), hw], 400, 2, 'end')).toEqual([80, 200]);
  });

  it('o hw encolhe antes de qualquer widget sumir', () => {
    // 80 + 2 + 200 = 282; sobra 250: o hw perde 32px.
    expect(fitWidgets([hw, fixed(80)], 250, 2, 'end')).toEqual([168, 80]);
    expect(fitWidgets([hw, fixed(80)], 172, 2, 'end')).toEqual([90, 80]);
  });

  it('sem espaço nem com o hw no mínimo, some o widget mais longe da ilha', () => {
    // Direita: a ilha fica no começo, some o último.
    expect(fitWidgets([hw, fixed(80), fixed(60)], 180, 2, 'end')).toEqual([98, 80, null]);
    // Esquerda: a ilha fica no fim, some o primeiro.
    expect(fitWidgets([fixed(60), fixed(80), hw], 180, 2, 'start')).toEqual([null, 80, 98]);
  });

  it('depois de um widget sumir, o hw volta a crescer no espaço que sobrou', () => {
    expect(fitWidgets([hw, fixed(150)], 220, 2, 'end')).toEqual([200, null]);
  });

  it('nunca corta um widget: sem espaço para nenhum, somem todos', () => {
    expect(fitWidgets([fixed(80), fixed(60)], 50, 2, 'end')).toEqual([null, null]);
    expect(fitWidgets([hw], 50, 2, 'end')).toEqual([null]);
  });

  it('lista vazia', () => {
    expect(fitWidgets([], 100, 2, 'end')).toEqual([]);
  });
});

describe('fitWidgets com ícone', () => {
  const note = (width: number): WidgetSize => ({ natural: width, min: width, icon: 30 });

  it('colapsa para o ícone, do mais longe, antes de sumir', () => {
    // 100 + 2 + 100 + 2 + 100 = 304; sobra 250: colapsa só o último (direita).
    expect(fitWidgets([note(100), note(100), note(100)], 250, 2, 'end')).toEqual([100, 100, 30]);
    // Esquerda: o mais longe da ilha é o primeiro.
    expect(fitWidgets([note(100), note(100), note(100)], 250, 2, 'start')).toEqual([30, 100, 100]);
  });

  it('o hw encolhe primeiro; só depois os ícones colapsam', () => {
    expect(fitWidgets([hw, note(100)], 250, 2, 'end')).toEqual([148, 100]);
    expect(fitWidgets([hw, note(100)], 150, 2, 'end')).toEqual([118, 30]);
  });

  it('só some um widget se nem todos colapsados cabem', () => {
    expect(fitWidgets([note(100), note(100), note(100)], 70, 2, 'end')).toEqual([30, 30, null]);
  });

  it('widget sem ícone nunca colapsa', () => {
    expect(fitWidgets([fixed(100), note(100)], 140, 2, 'end')).toEqual([100, 30]);
  });
});

describe('fitWidgets com listas grandes', () => {
  it('mil widgets com ícone saem rápido e cabem colapsados', () => {
    const sizes: WidgetSize[] = Array.from({ length: 1000 }, () => ({
      natural: 100,
      min: 100,
      icon: 30,
    }));
    const started = performance.now();
    const widths = fitWidgets(sizes, 32000, 2, 'end');
    expect(performance.now() - started).toBeLessThan(200);
    expect(widths.filter((width) => width === null)).toHaveLength(0);
  });
});
