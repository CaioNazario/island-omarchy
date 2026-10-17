import { describe, expect, it } from 'vitest';
import {
  advance,
  elapsedFraction,
  formatRemaining,
  initialPomodoro,
  parse,
  PHASE_MS,
  phaseLabel,
  phaseNotification,
  remainingAt,
  serialize,
  toggle,
} from './pomodoro.js';

const MIN = 60_000;

describe('pomodoro', () => {
  it('começa em Foco 25:00, pausado', () => {
    const state = initialPomodoro();
    expect(formatRemaining(remainingAt(state, 0))).toBe('25:00');
    expect(phaseLabel(state)).toBe('Pausado');
    expect(elapsedFraction(state, 0)).toBe(0);
  });

  it('rodando conta pelo horário de término', () => {
    const state = toggle(initialPomodoro(), 1000);
    expect(phaseLabel(state)).toBe('Foco');
    expect(formatRemaining(remainingAt(state, 1000 + 10 * MIN + 500))).toBe('15:00');
    expect(elapsedFraction(state, 1000 + 5 * MIN)).toBeCloseTo(0.2);
  });

  it('pausar e retomar guarda o restante', () => {
    let state = toggle(initialPomodoro(), 0);
    state = toggle(state, 10 * MIN);
    expect(state.endsAt).toBeNull();
    expect(remainingAt(state, 99 * MIN)).toBe(15 * MIN);
    state = toggle(state, 100 * MIN);
    expect(remainingAt(state, 105 * MIN)).toBe(10 * MIN);
  });

  it('troca de Foco para Pausa ao zerar e segue rodando', () => {
    const running = toggle(initialPomodoro(), 0);
    expect(advance(running, 25 * MIN - 1).started).toBeNull();
    const { state, started } = advance(running, 25 * MIN);
    expect(started).toBe('break');
    expect(phaseLabel(state)).toBe('Pausa');
    expect(remainingAt(state, 25 * MIN)).toBe(PHASE_MS.break);
  });

  it('troca de Pausa para Foco', () => {
    const inBreak = advance(toggle(initialPomodoro(), 0), 25 * MIN).state;
    const { state, started } = advance(inBreak, 30 * MIN);
    expect(started).toBe('focus');
    expect(remainingAt(state, 30 * MIN)).toBe(PHASE_MS.focus);
  });

  it('atraso do timer não desloca o ciclo, e várias fases vencidas são uma troca', () => {
    const running = toggle(initialPomodoro(), 0);
    const late = advance(running, 26 * MIN);
    expect(remainingAt(late.state, 26 * MIN)).toBe(4 * MIN);
    const stalled = advance(running, 31 * MIN);
    expect(stalled.started).toBe('focus');
    expect(remainingAt(stalled.state, 31 * MIN)).toBe(24 * MIN);
  });

  it('pausado não troca de fase', () => {
    expect(advance(initialPomodoro(), 99 * MIN).started).toBeNull();
  });

  it('formata mm:ss arredondando para cima', () => {
    expect(formatRemaining(PHASE_MS.break)).toBe('05:00');
    expect(formatRemaining(1)).toBe('00:01');
    expect(formatRemaining(0)).toBe('00:00');
    expect(formatRemaining(61_500)).toBe('01:02');
  });

  it('textos da notificação de cada fase', () => {
    expect(phaseNotification('break')).toEqual({ title: 'Hora da pausa', body: '5 min de pausa' });
    expect(phaseNotification('focus')).toEqual({ title: 'Hora de focar', body: '25 min de foco' });
  });
});

describe('pomodoro-state', () => {
  it('salva pausado, com o restante de agora', () => {
    const running = toggle(initialPomodoro(), 0);
    const saved = parse(serialize(running, 10 * MIN));
    expect(saved).toEqual({ phase: 'focus', endsAt: null, remainingMs: 15 * MIN });
  });

  it('valor vazio ou inválido volta ao inicial', () => {
    expect(parse('')).toEqual(initialPomodoro());
    expect(parse('{"phase":"nap","remainingMs":1000}')).toEqual(initialPomodoro());
    expect(parse('{"phase":"break","remainingMs":3600000}')).toEqual(initialPomodoro());
    expect(parse('{"phase":"focus","remainingMs":0}')).toEqual(initialPomodoro());
  });
});
