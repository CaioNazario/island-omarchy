// Widget Pomodoro (specs/16-widgets.md `pomodoro`): Foco 25:00 → Pausa 05:00
// → Foco…, trocando de fase sozinho ao zerar. O bloqueio de tela pausa: o
// estado salvo em GSettings `pomodoro-state` é sempre pausado.

export type PomodoroPhase = 'focus' | 'break';

export const PHASE_MS: Readonly<Record<PomodoroPhase, number>> = {
  focus: 25 * 60_000,
  break: 5 * 60_000,
};

export interface PomodoroState {
  phase: PomodoroPhase;
  /** Rodando: horário de término da fase (ms desde a época). */
  endsAt: number | null;
  /** Pausado: quanto falta da fase. */
  remainingMs: number;
}

export function initialPomodoro(): PomodoroState {
  return { phase: 'focus', endsAt: null, remainingMs: PHASE_MS.focus };
}

const other = (phase: PomodoroPhase): PomodoroPhase => (phase === 'focus' ? 'break' : 'focus');

export function remainingAt(state: PomodoroState, now: number): number {
  return state.endsAt === null ? state.remainingMs : Math.max(0, state.endsAt - now);
}

/** Rodando ↔ pausado, guardando o que falta. */
export function toggle(state: PomodoroState, now: number): PomodoroState {
  if (state.endsAt === null) return { ...state, endsAt: now + state.remainingMs };
  return { ...state, endsAt: null, remainingMs: remainingAt(state, now) };
}

export interface Advance {
  state: PomodoroState;
  /** Fase que acabou de começar, se houve troca. */
  started: PomodoroPhase | null;
}

/** Troca de fase ao zerar; várias vencidas de uma vez contam como uma troca. */
export function advance(state: PomodoroState, now: number): Advance {
  if (state.endsAt === null || state.endsAt > now) return { state, started: null };
  let { phase, endsAt } = state;
  while (endsAt <= now) {
    phase = other(phase);
    endsAt += PHASE_MS[phase];
  }
  return { state: { phase, endsAt, remainingMs: PHASE_MS[phase] }, started: phase };
}

/** Fração já decorrida da fase, para o anel. */
export function elapsedFraction(state: PomodoroState, now: number): number {
  return 1 - remainingAt(state, now) / PHASE_MS[state.phase];
}

/** `mm:ss`, arredondando o segundo para cima: 25:00 no início, 00:01 no fim. */
export function formatRemaining(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export function phaseLabel(state: PomodoroState): string {
  if (state.endsAt === null) return 'Pausado';
  return state.phase === 'focus' ? 'Foco' : 'Pausa';
}

export function phaseNotification(started: PomodoroPhase): { title: string; body: string } {
  return started === 'break'
    ? { title: 'Hora da pausa', body: '5 min de pausa' }
    : { title: 'Hora de focar', body: '25 min de foco' };
}

/** Sempre salvo pausado. */
export function serialize(state: PomodoroState, now: number): string {
  return JSON.stringify({ phase: state.phase, remainingMs: remainingAt(state, now) });
}

/** Valor salvo inválido ou vazio volta ao Foco 25:00 pausado. */
export function parse(text: string): PomodoroState {
  try {
    const value = JSON.parse(text) as { phase?: unknown; remainingMs?: unknown };
    const phase = value.phase;
    const remainingMs = value.remainingMs;
    if (phase !== 'focus' && phase !== 'break') return initialPomodoro();
    if (typeof remainingMs !== 'number' || !(remainingMs > 0 && remainingMs <= PHASE_MS[phase]))
      return initialPomodoro();
    return { phase, endsAt: null, remainingMs };
  } catch {
    return initialPomodoro();
  }
}
