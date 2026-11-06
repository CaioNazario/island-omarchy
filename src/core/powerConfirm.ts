// Confirmação de reiniciar, desligar e sair (specs/09-sessao-energia.md "Confirmação"):
// como o diálogo do GNOME, pergunta e age sozinho quando o tempo acaba.

import { msg, tr, type Language } from './i18n.js';

/** Tempo para responder antes de a ação rodar sozinha (o do GNOME). */
export const CONFIRM_SECONDS = 60;

/** Suspender e bloquear não perguntam: acordar ou desbloquear desfaz. */
const CONFIRMED_ACTIONS: readonly string[] = ['reboot', 'shutdown', 'logout'];

const TEXTS: Readonly<Record<string, string>> = {
  reboot: msg('Restarting in {n}s'),
  shutdown: msg('Shutting down in {n}s'),
  logout: msg('Logging out in {n}s'),
};

export interface PendingPower {
  action: string;
  /** Instante (ms, `Date.now()`) em que a ação roda sozinha. */
  endsAt: number;
}

export function needsConfirmation(action: string): boolean {
  return CONFIRMED_ACTIONS.includes(action);
}

export function startPending(action: string, nowMs: number): PendingPower {
  if (!needsConfirmation(action)) {
    throw new Error(
      `no confirmation for power action '${action}', expected one of ${CONFIRMED_ACTIONS.join(', ')}`,
    );
  }
  return { action, endsAt: nowMs + CONFIRM_SECONDS * 1000 };
}

/** Pelo relógio, não por tiques contados: um tique atrasado não alonga a espera. */
export function secondsLeft(pending: PendingPower, nowMs: number): number {
  return Math.max(0, Math.ceil((pending.endsAt - nowMs) / 1000));
}

export function isDue(pending: PendingPower, nowMs: number): boolean {
  return nowMs >= pending.endsAt;
}

export function confirmationText(lang: Language, action: string, seconds: number): string {
  const text = TEXTS[action];
  if (!text) {
    throw new Error(
      `no confirmation text for power action '${action}', expected one of ${Object.keys(TEXTS).join(', ')}`,
    );
  }
  return tr(lang, text, { n: seconds });
}
