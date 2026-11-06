// Tela de pausa (specs/20-pomodoro.md "Tela de pausa"): textos e a escada de
// estágios da animação de entrada. A UI (`PomodoroBreakScreen.qml`) só liga
// essas regras ao desenho.

import { msg, tr, type Language } from './i18n.js';

/** Acima disto a pausa é "longa" (spec 09 do protótipo). */
export const LONG_BREAK_MIN = 10;

/** Segurar Esc por este tempo mostra os botões da zona de Urgência no teclado. */
export const URGENCY_HOLD_MS = 2000;

const INSTRUCTIONS = [msg('Stand up.'), msg('Drink some water.'), msg('Look out the window.')];

export function breakKindLabel(minutes: number, lang: Language): string {
  const kind =
    minutes > LONG_BREAK_MIN ? msg('Long break · {n} min') : msg('Short break · {n} min');
  return tr(lang, kind, { n: minutes });
}

/** A frase troca a cada pausa: `(focos concluídos + sessão) % 3`. */
export function breakInstruction(completed: number, session: number, lang: Language): string {
  const text = INSTRUCTIONS[(completed + session) % INSTRUCTIONS.length] ?? INSTRUCTIONS[0]!;
  return tr(lang, text);
}

/**
 * Instantes, em ms desde a entrada, em que cada estágio dispara: 1 wallpaper,
 * 2 bloco da instrução, 3 bloco do tempo, 4 chip de áudio (sem atividade, o
 * 4 não tem efeito).
 */
export const ENTRANCE_MS: readonly number[] = [60, 900, 1700, 2400];

/** Estágio (0–4) depois de `elapsedMs` de entrada. */
export function entranceStage(elapsedMs: number): number {
  return ENTRANCE_MS.filter((at) => elapsedMs >= at).length;
}

/** Quanto falta para o próximo estágio; `null` depois do último. */
export function nextStageDelay(elapsedMs: number): number | null {
  const next = ENTRANCE_MS.find((at) => elapsedMs < at);
  return next === undefined ? null : Math.max(0, next - Math.max(0, elapsedMs));
}
