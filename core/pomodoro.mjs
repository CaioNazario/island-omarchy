// Motor do Pomodoro (specs/20-pomodoro.md "Motor"): Foco → Pausa → Foco…, uma
// posição no ciclo (`session`), troca de etapa ao zerar e bloqueio de tela nas
// pausas. Estado puro e relógio por horário de término (`endsAt`), imune a
// atraso de timer e a suspensão. A configuração vive em `pomodoroConfig.ts`;
// aqui ela só entra como argumento.
import { tr } from './i18n.mjs';
import { minutesFor } from './pomodoroConfig.mjs';
const other = (phase) => (phase === 'focus' ? 'break' : 'focus');
/** Data local `AAAA-MM-DD`: o contador do dia zera na virada (PRD RN-05 do protótipo). */
export function localDay(now) {
    const date = new Date(now);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}
export function phaseMs(config, phase, session) {
    return minutesFor(config, phase, session) * 60000;
}
export function initialPomodoro(config, now) {
    return {
        phase: 'focus',
        session: 1,
        endsAt: null,
        remainingMs: phaseMs(config, 'focus', 1),
        locked: false,
        completed: 0,
        completedDay: localDay(now),
    };
}
export function remainingAt(state, now) {
    return state.endsAt === null ? state.remainingMs : Math.max(0, state.endsAt - now);
}
/** Rodando ↔ parado, guardando o que falta. */
export function toggle(state, now) {
    if (state.endsAt === null)
        return Object.assign(Object.assign({}, state), { endsAt: now + state.remainingMs });
    return Object.assign(Object.assign({}, state), { endsAt: null, remainingMs: remainingAt(state, now) });
}
/** Fração já decorrida da etapa, para o anel e as barras. */
export function elapsedFraction(state, config, now) {
    const total = phaseMs(config, state.phase, state.session);
    return Math.min(1, Math.max(0, 1 - remainingAt(state, now) / total));
}
/** Reiniciar: tempo integral, parado, sem bloqueio; etapa e sessão ficam. */
export function reset(state, config) {
    return Object.assign(Object.assign({}, state), { endsAt: null, remainingMs: phaseMs(config, state.phase, state.session), locked: false });
}
/** Urgência: sai da tela de pausa e a pausa segue correndo. */
export function release(state) {
    return Object.assign(Object.assign({}, state), { locked: false });
}
function advance(state, config, now, auto) {
    const phase = other(state.phase);
    const session = phase === 'focus' ? (state.session % config.cycleLen) + 1 : state.session;
    const remainingMs = phaseMs(config, phase, session);
    // A pausa sempre começa correndo; o foco só com o início automático.
    const run = phase === 'break' ? true : config.autoStart;
    // Atraso pequeno do timer não desloca o ciclo; uma suspensão que cobre a
    // etapa seguinte inteira a faz recomeçar cheia, de agora.
    const aligned = auto && state.endsAt !== null && state.endsAt + remainingMs > now;
    const base = aligned && state.endsAt !== null ? state.endsAt : now;
    const day = localDay(now);
    const completed = (state.completedDay === day ? state.completed : 0) + (state.phase === 'focus' ? 1 : 0);
    return {
        phase,
        session,
        endsAt: run ? base + remainingMs : null,
        remainingMs,
        locked: phase === 'break',
        completed,
        completedDay: day,
    };
}
/** Pular: avança uma etapa; pular um foco conta como concluído e abre a pausa com bloqueio (v7). */
export function skip(state, config, now) {
    return advance(state, config, now, false);
}
/** Troca de etapa ao zerar (a cada disparo do timer de vencimento). */
export function tick(state, config, now) {
    if (state.endsAt === null || state.endsAt > now)
        return { state, started: null };
    const next = advance(state, config, now, true);
    return { state: next, started: next.phase };
}
/** "Testar pausa": a pausa da sessão atual, cheia e parada, sem tocar no estado real (specs/20). */
export function previewBreak(state, config) {
    return Object.assign(Object.assign({}, state), { phase: 'break', endsAt: null, remainingMs: phaseMs(config, 'break', state.session), locked: true });
}
/**
 * Aplica uma mudança de configuração ao estado (specs/20 "Mudar a
 * configuração"): a sessão cabe no novo ciclo; mudar a duração da etapa em
 * curso a recomeça cheia; mudar a quantidade ou o modo de duração só mexe no
 * tempo com o timer parado.
 */
export function reconcile(state, prev, next, now) {
    const session = Math.min(state.session, next.cycleLen);
    const running = state.endsAt !== null;
    const structural = prev.durationMode !== next.durationMode || prev.cycleLen !== next.cycleLen;
    const stageChanged = minutesFor(prev, state.phase, state.session) !== minutesFor(next, state.phase, session);
    const refill = structural ? !running : stageChanged;
    if (!refill)
        return session === state.session ? state : Object.assign(Object.assign({}, state), { session });
    const full = phaseMs(next, state.phase, session);
    if (running)
        return Object.assign(Object.assign({}, state), { session, endsAt: now + full });
    return Object.assign(Object.assign({}, state), { session, remainingMs: full });
}
/** `mm:ss`, arredondando o segundo para cima: 25:00 no início, 00:01 no fim. */
export function formatRemaining(ms) {
    const seconds = Math.ceil(ms / 1000);
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
}
const stageName = (phase, lang) => phase === 'focus' ? tr(lang, 'Focus') : tr(lang, 'Break');
/** Subtítulo do widget da barra: a etapa rodando, ou "Pausado" parado. */
export function phaseLabel(state, lang) {
    if (state.endsAt === null)
        return tr(lang, 'Paused');
    return stageName(state.phase, lang);
}
/** Cabeçalho do card: `Foco · 1/4`. */
export function cycleLabel(state, config, lang) {
    return `${stageName(state.phase, lang)} · ${state.session}/${config.cycleLen}`;
}
/** Rótulo acessível do botão Pular. */
export function skipLabel(state, lang) {
    return state.phase === 'focus' ? tr(lang, 'Skip focus') : tr(lang, 'Skip break');
}
export function phaseNotification(started, minutes, lang) {
    return started === 'break'
        ? { title: tr(lang, 'Time for a break'), body: tr(lang, '{n} min break', { n: minutes }) }
        : { title: tr(lang, 'Time to focus'), body: tr(lang, '{n} min of focus', { n: minutes }) };
}
/** Sempre salvo parado, com o restante de agora. */
export function serialize(state, now) {
    return JSON.stringify({
        phase: state.phase,
        session: state.session,
        remainingMs: remainingAt(state, now),
        completed: state.completed,
        completedDay: state.completedDay,
    });
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function savedSession(value, config) {
    const ok = typeof value === 'number' && Number.isInteger(value) && value >= 1;
    return ok ? Math.min(value, config.cycleLen) : 1;
}
function savedCount(value, day, now) {
    const ok = typeof value === 'number' && Number.isInteger(value) && value > 0;
    return ok && day === localDay(now) ? value : 0;
}
/**
 * Valor salvo inválido ou vazio volta ao Foco 1 parado. Uma pausa guardada
 * volta como o foco da mesma sessão, cheio (specs/20 "Persistência"): a tela
 * de pausa não deve reaparecer depois de reiniciar o shell.
 */
export function parse(text, config, now) {
    const initial = initialPomodoro(config, now);
    try {
        const value = JSON.parse(text);
        if (!isRecord(value) || (value.phase !== 'focus' && value.phase !== 'break'))
            return initial;
        const session = savedSession(value.session, config);
        const base = Object.assign(Object.assign({}, initial), { session, completed: savedCount(value.completed, value.completedDay, now), remainingMs: phaseMs(config, 'focus', session) });
        if (value.phase === 'break')
            return base;
        const full = phaseMs(config, 'focus', session);
        const left = value.remainingMs;
        const keep = typeof left === 'number' && left > 0 && left <= full;
        return Object.assign(Object.assign({}, base), { remainingMs: keep ? left : full });
    }
    catch (_a) {
        return initial;
    }
}
