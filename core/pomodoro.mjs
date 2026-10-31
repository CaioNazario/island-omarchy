// Widget Pomodoro (specs/16-widgets.md `pomodoro`): Foco 25:00 → Pausa 05:00
// → Foco…, trocando de fase sozinho ao zerar. O bloqueio de tela pausa: o
// estado salvo em `pomodoroState` do `state.json` é sempre pausado.
import { tr } from './i18n.mjs';
export const PHASE_MS = {
    focus: 25 * 60000,
    break: 5 * 60000,
};
export function initialPomodoro() {
    return { phase: 'focus', endsAt: null, remainingMs: PHASE_MS.focus };
}
const other = (phase) => (phase === 'focus' ? 'break' : 'focus');
export function remainingAt(state, now) {
    return state.endsAt === null ? state.remainingMs : Math.max(0, state.endsAt - now);
}
/** Rodando ↔ pausado, guardando o que falta. */
export function toggle(state, now) {
    if (state.endsAt === null)
        return Object.assign(Object.assign({}, state), { endsAt: now + state.remainingMs });
    return Object.assign(Object.assign({}, state), { endsAt: null, remainingMs: remainingAt(state, now) });
}
/** Troca de fase ao zerar; várias vencidas de uma vez contam como uma troca. */
export function advance(state, now) {
    if (state.endsAt === null || state.endsAt > now)
        return { state, started: null };
    let { phase, endsAt } = state;
    while (endsAt <= now) {
        phase = other(phase);
        endsAt += PHASE_MS[phase];
    }
    return { state: { phase, endsAt, remainingMs: PHASE_MS[phase] }, started: phase };
}
/** Fração já decorrida da fase, para o anel. */
export function elapsedFraction(state, now) {
    return 1 - remainingAt(state, now) / PHASE_MS[state.phase];
}
/** `mm:ss`, arredondando o segundo para cima: 25:00 no início, 00:01 no fim. */
export function formatRemaining(ms) {
    const seconds = Math.ceil(ms / 1000);
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
}
export function phaseLabel(state, lang) {
    if (state.endsAt === null)
        return tr(lang, 'Paused');
    return state.phase === 'focus' ? tr(lang, 'Focus') : tr(lang, 'Break');
}
export function phaseNotification(started, lang) {
    return started === 'break'
        ? { title: tr(lang, 'Time for a break'), body: tr(lang, '5 min break') }
        : { title: tr(lang, 'Time to focus'), body: tr(lang, '25 min of focus') };
}
/** Sempre salvo pausado. */
export function serialize(state, now) {
    return JSON.stringify({ phase: state.phase, remainingMs: remainingAt(state, now) });
}
/** Valor salvo inválido ou vazio volta ao Foco 25:00 pausado. */
export function parse(text) {
    try {
        const value = JSON.parse(text);
        const phase = value.phase;
        const remainingMs = value.remainingMs;
        if (phase !== 'focus' && phase !== 'break')
            return initialPomodoro();
        if (typeof remainingMs !== 'number' || !(remainingMs > 0 && remainingMs <= PHASE_MS[phase]))
            return initialPomodoro();
        return { phase, endsAt: null, remainingMs };
    }
    catch (_a) {
        return initialPomodoro();
    }
}
