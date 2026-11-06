import { describe, expect, it } from 'vitest';
import {
  cycleLabel,
  elapsedFraction,
  formatRemaining,
  initialPomodoro,
  localDay,
  parse,
  phaseLabel,
  phaseMs,
  phaseNotification,
  previewBreak,
  reconcile,
  release,
  remainingAt,
  reset,
  serialize,
  skip,
  skipLabel,
  tick,
  toggle,
  type PomodoroState,
} from './pomodoro.js';
import {
  defaultPomodoroConfig,
  stepGlobalMinutes,
  withAutoStart,
  withCycleLength,
  withDurationMode,
  type PomodoroConfig,
} from './pomodoroConfig.js';

const MIN = 60_000;
// Meio-dia local: longe da virada do dia em qualquer fuso.
const T0 = new Date(2026, 10, 6, 12, 0, 0).getTime();
const config = defaultPomodoroConfig();

function running(state: PomodoroState, now: number): PomodoroState {
  return toggle(state, now);
}

describe('estado inicial e contagem', () => {
  it('começa em Foco 1/4, 25:00, parado e sem bloqueio', () => {
    const state = initialPomodoro(config, T0);
    expect(state.phase).toBe('focus');
    expect(state.session).toBe(1);
    expect(state.locked).toBe(false);
    expect(state.endsAt).toBeNull();
    expect(formatRemaining(remainingAt(state, T0))).toBe('25:00');
    expect(phaseLabel(state, 'pt-BR')).toBe('Pausado');
    expect(elapsedFraction(state, config, T0)).toBe(0);
  });

  it('rodando conta pelo horário de término', () => {
    const state = running(initialPomodoro(config, T0), T0);
    expect(phaseLabel(state, 'pt-BR')).toBe('Foco');
    expect(formatRemaining(remainingAt(state, T0 + 10 * MIN + 500))).toBe('15:00');
    expect(elapsedFraction(state, config, T0 + 5 * MIN)).toBeCloseTo(0.2);
  });

  it('pausar e retomar guarda o restante', () => {
    let state = running(initialPomodoro(config, T0), T0);
    state = toggle(state, T0 + 10 * MIN);
    expect(state.endsAt).toBeNull();
    expect(remainingAt(state, T0 + 99 * MIN)).toBe(15 * MIN);
    state = toggle(state, T0 + 100 * MIN);
    expect(remainingAt(state, T0 + 105 * MIN)).toBe(10 * MIN);
  });

  it('formata mm:ss arredondando para cima', () => {
    expect(formatRemaining(5 * MIN)).toBe('05:00');
    expect(formatRemaining(1)).toBe('00:01');
    expect(formatRemaining(0)).toBe('00:00');
    expect(formatRemaining(61_500)).toBe('01:02');
  });
});

describe('fim da etapa (tick)', () => {
  it('foco termina: pausa corre, bloqueia, conta o foco e mantém a sessão', () => {
    const state = running(initialPomodoro(config, T0), T0);
    expect(tick(state, config, T0 + 25 * MIN - 1).started).toBeNull();
    const { state: next, started } = tick(state, config, T0 + 25 * MIN);
    expect(started).toBe('break');
    expect(next.phase).toBe('break');
    expect(next.session).toBe(1);
    expect(next.locked).toBe(true);
    expect(next.completed).toBe(1);
    expect(remainingAt(next, T0 + 25 * MIN)).toBe(5 * MIN);
  });

  it('pausa termina com início automático: o foco da sessão seguinte corre, sem bloqueio', () => {
    const inBreak = tick(running(initialPomodoro(config, T0), T0), config, T0 + 25 * MIN).state;
    const { state, started } = tick(inBreak, config, T0 + 30 * MIN);
    expect(started).toBe('focus');
    expect(state.session).toBe(2);
    expect(state.locked).toBe(false);
    expect(state.endsAt).not.toBeNull();
  });

  it('sem início automático, o foco depois da pausa fica parado', () => {
    const manual = withAutoStart(config, false);
    const inBreak = tick(running(initialPomodoro(manual, T0), T0), manual, T0 + 25 * MIN).state;
    expect(inBreak.endsAt).not.toBeNull();
    const { state } = tick(inBreak, manual, T0 + 30 * MIN);
    expect(state.phase).toBe('focus');
    expect(state.endsAt).toBeNull();
    expect(formatRemaining(remainingAt(state, T0 + 30 * MIN))).toBe('25:00');
  });

  it('pausado não troca de etapa', () => {
    expect(tick(initialPomodoro(config, T0), config, T0 + 99 * MIN).started).toBeNull();
  });

  it('depois da última pausa volta à sessão 1', () => {
    let state: PomodoroState = { ...initialPomodoro(config, T0), phase: 'break', session: 4 };
    state = { ...state, endsAt: T0 + 20 * MIN, remainingMs: 20 * MIN };
    const { state: next } = tick(state, config, T0 + 20 * MIN);
    expect(next.session).toBe(1);
    expect(next.phase).toBe('focus');
  });

  it('modo individual usa a pausa da sessão: sessão 3 tem 10 min', () => {
    const individual = withDurationMode(config, 'individual');
    let state: PomodoroState = { ...initialPomodoro(individual, T0), session: 3 };
    state = running(state, T0);
    const { state: next } = tick(state, individual, T0 + 25 * MIN);
    expect(remainingAt(next, T0 + 25 * MIN)).toBe(10 * MIN);
  });

  it('atraso pequeno do timer não desloca o ciclo', () => {
    const state = running(initialPomodoro(config, T0), T0);
    const late = tick(state, config, T0 + 26 * MIN);
    expect(remainingAt(late.state, T0 + 26 * MIN)).toBe(4 * MIN);
  });

  it('suspensão que cobre a etapa seguinte inteira: ela recomeça cheia, de agora', () => {
    const state = running(initialPomodoro(config, T0), T0);
    const stalled = tick(state, config, T0 + 40 * MIN);
    expect(stalled.started).toBe('break');
    expect(remainingAt(stalled.state, T0 + 40 * MIN)).toBe(5 * MIN);
  });
});

describe('pular', () => {
  it('pular o foco abre a pausa com bloqueio e conta como concluído', () => {
    const next = skip(initialPomodoro(config, T0), config, T0);
    expect(next.phase).toBe('break');
    expect(next.locked).toBe(true);
    expect(next.completed).toBe(1);
    expect(next.endsAt).toBe(T0 + 5 * MIN);
  });

  it('pular a pausa vai para o foco seguinte e desfaz o bloqueio', () => {
    const inBreak = skip(initialPomodoro(config, T0), config, T0);
    const next = skip(inBreak, config, T0 + MIN);
    expect(next.phase).toBe('focus');
    expect(next.session).toBe(2);
    expect(next.locked).toBe(false);
    expect(next.endsAt).toBe(T0 + MIN + 25 * MIN);
  });

  it('em 4 sessões, pular 8 vezes volta a Foco 1/4', () => {
    let state = initialPomodoro(config, T0);
    for (let i = 0; i < 8; i++) state = skip(state, config, T0);
    expect(state.phase).toBe('focus');
    expect(state.session).toBe(1);
    expect(state.completed).toBe(4);
  });

  it('o rótulo do botão acompanha a etapa', () => {
    const focus = initialPomodoro(config, T0);
    expect(skipLabel(focus, 'en')).toBe('Skip focus');
    expect(skipLabel(skip(focus, config, T0), 'pt-BR')).toBe('Pular pausa');
  });
});

describe('reiniciar e liberar', () => {
  it('reiniciar o foco devolve o tempo integral, parado, na mesma sessão', () => {
    let state = running(initialPomodoro(config, T0), T0);
    state = reset(state, config);
    expect(state.endsAt).toBeNull();
    expect(formatRemaining(remainingAt(state, T0 + 99 * MIN))).toBe('25:00');
    expect(state.session).toBe(1);
  });

  it('reiniciar durante a pausa remove o bloqueio e deixa a pausa parada e cheia', () => {
    const inBreak = skip(initialPomodoro(config, T0), config, T0);
    const state = reset(inBreak, config);
    expect(state.phase).toBe('break');
    expect(state.locked).toBe(false);
    expect(state.endsAt).toBeNull();
    expect(remainingAt(state, T0 + MIN)).toBe(5 * MIN);
  });

  it('urgência libera a tela sem mexer no tempo', () => {
    const inBreak = skip(initialPomodoro(config, T0), config, T0);
    const free = release(inBreak);
    expect(free.locked).toBe(false);
    expect(free.endsAt).toBe(inBreak.endsAt);
    expect(free.phase).toBe('break');
  });
});

describe('pré-visualização da pausa', () => {
  it('mostra a pausa da sessão atual, cheia e parada, sem alterar o estado real', () => {
    const real = running(initialPomodoro(config, T0), T0);
    const before = JSON.stringify(real);
    const preview = previewBreak(real, withDurationMode(config, 'individual'));
    expect(preview.phase).toBe('break');
    expect(preview.locked).toBe(true);
    expect(preview.endsAt).toBeNull();
    expect(remainingAt(preview, T0 + 9 * MIN)).toBe(5 * MIN);
    expect(preview.session).toBe(real.session);
    expect(preview.completed).toBe(real.completed);
    expect(JSON.stringify(real)).toBe(before);
  });
});

describe('contador do dia', () => {
  it('zera na virada do dia', () => {
    const state: PomodoroState = {
      ...initialPomodoro(config, T0),
      completed: 3,
      completedDay: localDay(T0 - 24 * 60 * MIN),
    };
    const next = skip(state, config, T0);
    expect(next.completed).toBe(1);
    expect(next.completedDay).toBe(localDay(T0));
  });

  it('localDay usa a data local, AAAA-MM-DD', () => {
    expect(localDay(new Date(2026, 0, 5, 23, 59).getTime())).toBe('2026-01-05');
  });
});

describe('reconcile com mudanças de configuração', () => {
  const stopped = initialPomodoro(config, T0);

  it('mudar a duração da etapa em curso redefine para o valor integral', () => {
    const next = stepGlobalMinutes(config, 'focus', 1);
    const state = reconcile(stopped, config, next, T0);
    expect(remainingAt(state, T0)).toBe(30 * MIN);
  });

  it('com o timer correndo, a etapa em curso recomeça cheia e continua correndo', () => {
    const next = stepGlobalMinutes(config, 'focus', 1);
    const state = reconcile(running(stopped, T0), config, next, T0 + 10 * MIN);
    expect(state.endsAt).toBe(T0 + 40 * MIN);
  });

  it('mudar a duração da outra etapa não mexe no tempo restante', () => {
    const paused = toggle(running(stopped, T0), T0 + 10 * MIN);
    const next = stepGlobalMinutes(config, 'break', 1);
    expect(reconcile(paused, config, next, T0 + 10 * MIN)).toEqual(paused);
  });

  it('reduzir de 4 para 2 sessões estando na 3 deixa a sessão em 2', () => {
    const onThree: PomodoroState = { ...stopped, session: 3 };
    const state = reconcile(onThree, config, withCycleLength(config, 2), T0);
    expect(state.session).toBe(2);
  });

  it('mudar a quantidade com o timer parado dá a duração integral da etapa', () => {
    const half: PomodoroState = { ...stopped, remainingMs: 7 * MIN };
    const state = reconcile(half, config, withCycleLength(config, 6), T0);
    expect(remainingAt(state, T0)).toBe(25 * MIN);
  });

  it('mudar a quantidade com o timer correndo mantém o restante', () => {
    const live = running(stopped, T0);
    const state = reconcile(live, config, withCycleLength(config, 6), T0 + 5 * MIN);
    expect(state.endsAt).toBe(live.endsAt);
  });

  it('trocar de modo de duração parado reflete o novo modo', () => {
    const onFour: PomodoroState = { ...stopped, phase: 'break', session: 4, remainingMs: 2 * MIN };
    const state = reconcile(onFour, config, withDurationMode(config, 'individual'), T0);
    expect(remainingAt(state, T0)).toBe(20 * MIN);
  });

  it('só a linha da sessão e etapa atuais redefine o tempo no modo individual', () => {
    const individual = withDurationMode(config, 'individual');
    const base = initialPomodoro(individual, T0);
    const other: PomodoroConfig = {
      ...individual,
      plan: individual.plan.map((row, i) => (i === 1 ? { ...row, focusMin: 45 } : row)),
    };
    expect(reconcile(base, individual, other, T0)).toEqual(base);
    const current: PomodoroConfig = {
      ...individual,
      plan: individual.plan.map((row, i) => (i === 0 ? { ...row, focusMin: 45 } : row)),
    };
    expect(remainingAt(reconcile(base, individual, current, T0), T0)).toBe(45 * MIN);
  });
});

describe('persistência do estado', () => {
  it('salva parado, com o restante de agora', () => {
    const live = running(initialPomodoro(config, T0), T0);
    const saved = parse(serialize(live, T0 + 10 * MIN), config, T0 + 11 * MIN);
    expect(saved.phase).toBe('focus');
    expect(saved.endsAt).toBeNull();
    expect(remainingAt(saved, T0)).toBe(15 * MIN);
  });

  it('guarda a sessão e o contador do dia', () => {
    const state: PomodoroState = { ...initialPomodoro(config, T0), session: 3, completed: 2 };
    const saved = parse(serialize(state, T0), config, T0);
    expect(saved.session).toBe(3);
    expect(saved.completed).toBe(2);
  });

  it('reabrir durante a pausa volta ao foco da mesma sessão, parado e cheio, sem bloqueio', () => {
    const inBreak = skip(initialPomodoro(config, T0), config, T0);
    const saved = parse(serialize(inBreak, T0 + MIN), config, T0 + 2 * MIN);
    expect(saved.phase).toBe('focus');
    expect(saved.session).toBe(1);
    expect(saved.locked).toBe(false);
    expect(remainingAt(saved, T0)).toBe(25 * MIN);
  });

  it('o contador de outro dia não vale', () => {
    const state: PomodoroState = {
      ...initialPomodoro(config, T0),
      completed: 4,
      completedDay: localDay(T0 - 24 * 60 * MIN),
    };
    expect(parse(serialize(state, T0), config, T0).completed).toBe(0);
  });

  it('a sessão salva é limitada ao ciclo atual', () => {
    const state: PomodoroState = { ...initialPomodoro(config, T0), session: 4 };
    expect(parse(serialize(state, T0), withCycleLength(config, 2), T0).session).toBe(2);
  });

  it('o formato antigo (só fase e restante) ainda é lido', () => {
    const saved = parse('{"phase":"focus","remainingMs":600000}', config, T0);
    expect(remainingAt(saved, T0)).toBe(10 * MIN);
    expect(saved.session).toBe(1);
  });

  it('valor vazio ou inválido volta ao inicial', () => {
    const initial = initialPomodoro(config, T0);
    expect(parse('', config, T0)).toEqual(initial);
    expect(parse('{"phase":"nap","remainingMs":1000}', config, T0)).toEqual(initial);
    expect(parse('{"phase":"focus","remainingMs":99999999}', config, T0)).toEqual(initial);
    expect(parse('{"phase":"focus","remainingMs":0}', config, T0)).toEqual(initial);
    expect(parse('[]', config, T0)).toEqual(initial);
  });
});

describe('textos', () => {
  it('cabeçalho do card: etapa e posição no ciclo', () => {
    const state = initialPomodoro(config, T0);
    expect(cycleLabel(state, config, 'en')).toBe('Focus · 1/4');
    expect(cycleLabel(skip(state, config, T0), config, 'pt-BR')).toBe('Pausa · 1/4');
  });

  it('notificação de cada etapa, com os minutos dela', () => {
    expect(phaseNotification('break', 5, 'pt-BR')).toEqual({
      title: 'Hora da pausa',
      body: '5 min de pausa',
    });
    expect(phaseNotification('focus', 25, 'pt-BR')).toEqual({
      title: 'Hora de focar',
      body: '25 min de foco',
    });
    expect(phaseNotification('break', 20, 'en')).toEqual({
      title: 'Time for a break',
      body: '20 min break',
    });
  });

  it('phaseMs vem da configuração', () => {
    expect(phaseMs(config, 'break', 4)).toBe(5 * MIN);
    expect(phaseMs(withDurationMode(config, 'individual'), 'break', 4)).toBe(20 * MIN);
  });
});
