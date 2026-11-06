import { describe, expect, it } from 'vitest';
import {
  POMODORO_COMPACT_HEIGHT,
  pomodoroPanelHeight,
  pomodoroPanelWidth,
} from './pomodoroPanel.js';

describe('medidas do modo pomodoro', () => {
  it('fechado, o painel é só o card: 300 de largura e o mesmo tamanho em qualquer tela', () => {
    expect(pomodoroPanelWidth(false)).toBe(300);
    expect(pomodoroPanelHeight(false, 480)).toBe(POMODORO_COMPACT_HEIGHT);
    expect(pomodoroPanelHeight(false, 2000)).toBe(POMODORO_COMPACT_HEIGHT);
  });

  it('com as configurações abertas ele cresce para 340 de largura', () => {
    expect(pomodoroPanelWidth(true)).toBe(340);
  });

  it('a lista de configurações tem até 470 de altura numa tela alta', () => {
    expect(pomodoroPanelHeight(true, 1080)).toBe(POMODORO_COMPACT_HEIGHT + 24 + 470);
  });

  it('numa janela de 480 de altura, a lista encolhe e o painel cabe inteiro', () => {
    const height = pomodoroPanelHeight(true, 480);
    expect(height).toBe(POMODORO_COMPACT_HEIGHT + 24 + 250);
    expect(height).toBeLessThan(480);
  });

  it('numa tela minúscula a lista não some', () => {
    expect(pomodoroPanelHeight(true, 100)).toBe(POMODORO_COMPACT_HEIGHT + 24 + 120);
  });

  it('com a altura do conteúdo conhecida, a lista só ocupa o que precisa, até o teto', () => {
    expect(pomodoroPanelHeight(true, 1080, 340)).toBe(POMODORO_COMPACT_HEIGHT + 24 + 340);
    expect(pomodoroPanelHeight(true, 1080, 900)).toBe(POMODORO_COMPACT_HEIGHT + 24 + 470);
    expect(pomodoroPanelHeight(true, 480, 900)).toBe(POMODORO_COMPACT_HEIGHT + 24 + 250);
  });

  it('conteúdo ainda não medido (0) usa o teto', () => {
    expect(pomodoroPanelHeight(true, 1080, 0)).toBe(POMODORO_COMPACT_HEIGHT + 24 + 470);
  });
});
