// Confirmação de reiniciar, desligar e sair (specs/09-sessao-energia.md "Confirmação"):
// como o diálogo do GNOME, pergunta e age sozinho quando o tempo acaba.
import { msg, tr } from './i18n.mjs';
/** Tempo para responder antes de a ação rodar sozinha (o do GNOME). */
export const CONFIRM_SECONDS = 60;
/** Suspender e bloquear não perguntam: acordar ou desbloquear desfaz. */
const CONFIRMED_ACTIONS = ['reboot', 'shutdown', 'logout'];
const TEXTS = {
    reboot: msg('Restarting in {n}s'),
    shutdown: msg('Shutting down in {n}s'),
    logout: msg('Logging out in {n}s'),
};
export function needsConfirmation(action) {
    return CONFIRMED_ACTIONS.includes(action);
}
export function startPending(action, nowMs) {
    if (!needsConfirmation(action)) {
        throw new Error(`no confirmation for power action '${action}', expected one of ${CONFIRMED_ACTIONS.join(', ')}`);
    }
    return { action, endsAt: nowMs + CONFIRM_SECONDS * 1000 };
}
/** Pelo relógio, não por tiques contados: um tique atrasado não alonga a espera. */
export function secondsLeft(pending, nowMs) {
    return Math.max(0, Math.ceil((pending.endsAt - nowMs) / 1000));
}
export function isDue(pending, nowMs) {
    return nowMs >= pending.endsAt;
}
export function confirmationText(lang, action, seconds) {
    const text = TEXTS[action];
    if (!text) {
        throw new Error(`no confirmation text for power action '${action}', expected one of ${Object.keys(TEXTS).join(', ')}`);
    }
    return tr(lang, text, { n: seconds });
}
