// Configuração do Pomodoro (specs/20-pomodoro.md "Configuração"): ciclo,
// durações, início automático e wallpaper da pausa. Vive no `settings.json`
// (`pomodoro`); tudo passa por `sanitizePomodoroConfig` na leitura, campo a
// campo, para um valor ruim não derrubar o resto (PRD RN-10 do protótipo).
import { asList } from './environments.mjs';
export const DURATION_MODES = ['global', 'individual'];
export const WALLPAPER_IDS = ['noite', 'aurora', 'brasa', 'grafite', 'custom'];
export const BREAK_SOUND_IDS = ['off', 'chime', 'bell', 'alarm'];
/** Limites e passos da spec 06 do protótipo: sessões 1–24, foco 5–180 (de 5 em 5), pausa 1–60. */
export const CYCLE_LIMITS = { min: 1, max: 24 };
export const MINUTE_LIMITS = {
    focus: { min: 5, max: 180, step: 5 },
    break: { min: 1, max: 60, step: 1 },
};
const DEFAULT_FOCUS = 25;
const DEFAULT_BREAK = 5;
/** Pausas do plano padrão do protótipo: a última é a longa. */
const DEFAULT_BREAKS = [5, 5, 10, 20];
export function defaultPomodoroConfig() {
    return {
        cycleLen: DEFAULT_BREAKS.length,
        durationMode: 'global',
        focusMin: DEFAULT_FOCUS,
        breakMin: DEFAULT_BREAK,
        plan: DEFAULT_BREAKS.map((breakMin) => ({ focusMin: DEFAULT_FOCUS, breakMin })),
        autoStart: true,
        barControls: false,
        breakSound: 'chime',
        wallpaper: 'noite',
        wallpaperPath: '',
    };
}
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
/** Duração, em minutos, da etapa da sessão (1…cycleLen) no modo de duração atual. */
export function minutesFor(config, phase, session) {
    const global = phase === 'focus' ? config.focusMin : config.breakMin;
    if (config.durationMode === 'global')
        return global;
    const row = config.plan[session - 1];
    if (!row)
        return global;
    return phase === 'focus' ? row.focusMin : row.breakMin;
}
/** Quantidade de sessões; o plano é truncado no fim ou estendido com as durações globais. */
export function withCycleLength(config, count) {
    const cycleLen = clamp(Math.trunc(count), CYCLE_LIMITS.min, CYCLE_LIMITS.max);
    const plan = config.plan.slice(0, cycleLen);
    while (plan.length < cycleLen)
        plan.push({ focusMin: config.focusMin, breakMin: config.breakMin });
    return Object.assign(Object.assign({}, config), { cycleLen, plan });
}
/** Campo de texto das sessões: só dígitos; vazio ou inválido volta ao valor anterior, o resto é limitado a 1–24. */
export function parseCycleLength(text, previous) {
    const digits = text.trim();
    if (!/^\d{1,2}$/.test(digits))
        return previous;
    return clamp(Number(digits), CYCLE_LIMITS.min, CYCLE_LIMITS.max);
}
export function withDurationMode(config, durationMode) {
    return Object.assign(Object.assign({}, config), { durationMode });
}
function stepped(value, phase, direction) {
    const limits = MINUTE_LIMITS[phase];
    return clamp(value + direction * limits.step, limits.min, limits.max);
}
export function stepGlobalMinutes(config, phase, direction) {
    if (phase === 'focus')
        return Object.assign(Object.assign({}, config), { focusMin: stepped(config.focusMin, phase, direction) });
    return Object.assign(Object.assign({}, config), { breakMin: stepped(config.breakMin, phase, direction) });
}
/** Passo numa linha do plano (`session` de 1 a `cycleLen`); sessão fora do plano não muda nada. */
export function stepPlanMinutes(config, session, phase, direction) {
    const row = config.plan[session - 1];
    if (!row)
        return config;
    const next = phase === 'focus'
        ? Object.assign(Object.assign({}, row), { focusMin: stepped(row.focusMin, phase, direction) }) : Object.assign(Object.assign({}, row), { breakMin: stepped(row.breakMin, phase, direction) });
    return Object.assign(Object.assign({}, config), { plan: config.plan.map((item, i) => (i === session - 1 ? next : item)) });
}
export function withAutoStart(config, autoStart) {
    return Object.assign(Object.assign({}, config), { autoStart });
}
export function withBreakSound(config, breakSound) {
    return Object.assign(Object.assign({}, config), { breakSound });
}
export function withBarControls(config, barControls) {
    return Object.assign(Object.assign({}, config), { barControls });
}
/**
 * Wallpaper da pausa. `custom` só vale com o caminho da imagem; um id
 * desconhecido deixa tudo como estava. Trocar para um preset guarda o
 * caminho, para voltar à imagem própria sem escolher o arquivo de novo.
 */
export function withWallpaper(config, id, path) {
    const known = WALLPAPER_IDS.find((item) => item === id);
    if (known === undefined)
        return config;
    if (known !== 'custom')
        return Object.assign(Object.assign({}, config), { wallpaper: known });
    if (path === '')
        return config;
    return Object.assign(Object.assign({}, config), { wallpaper: 'custom', wallpaperPath: path });
}
/**
 * Esquece a imagem própria (só o caminho: o arquivo do usuário não é tocado).
 * Se ela era o wallpaper escolhido, volta ao padrão.
 */
export function withoutCustomWallpaper(config) {
    const wallpaper = config.wallpaper === 'custom' ? defaultPomodoroConfig().wallpaper : config.wallpaper;
    return Object.assign(Object.assign({}, config), { wallpaper, wallpaperPath: '' });
}
/** Soma de foco e pausa de todas as linhas do plano. */
export function cycleTotalMinutes(config) {
    return config.plan.reduce((sum, row) => sum + row.focusMin + row.breakMin, 0);
}
/** `2h 20m`, `2h`, `45m`. */
export function formatCycleTotal(minutes) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (hours === 0)
        return `${rest}m`;
    return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function validMinutes(value, phase, fallback) {
    const limits = MINUTE_LIMITS[phase];
    const ok = typeof value === 'number' && Number.isInteger(value);
    return ok && value >= limits.min && value <= limits.max ? value : fallback;
}
function saneRow(value, fallback) {
    if (!isRecord(value))
        return fallback;
    return {
        focusMin: validMinutes(value.focusMin, 'focus', fallback.focusMin),
        breakMin: validMinutes(value.breakMin, 'break', fallback.breakMin),
    };
}
function sanePlan(value, cycleLen, focusMin, breakMin) {
    var _a;
    const stored = (_a = asList(value)) !== null && _a !== void 0 ? _a : [];
    const global = { focusMin, breakMin };
    const plan = [];
    for (let i = 0; i < cycleLen; i++)
        plan.push(saneRow(stored[i], global));
    return plan;
}
function saneCycleLen(value, fallback) {
    const ok = typeof value === 'number' && Number.isInteger(value);
    return ok && value >= CYCLE_LIMITS.min && value <= CYCLE_LIMITS.max ? value : fallback;
}
/** Valor lido do `settings.json`, em qualquer forma (inclusive a lista tipo array do `JsonAdapter`, `asList`). */
export function sanitizePomodoroConfig(value) {
    var _a, _b;
    const base = defaultPomodoroConfig();
    if (!isRecord(value))
        return base;
    const cycleLen = saneCycleLen(value.cycleLen, base.cycleLen);
    const focusMin = validMinutes(value.focusMin, 'focus', base.focusMin);
    const breakMin = validMinutes(value.breakMin, 'break', base.breakMin);
    const path = typeof value.wallpaperPath === 'string' ? value.wallpaperPath : '';
    return Object.assign({ cycleLen, durationMode: (_a = DURATION_MODES.find((mode) => mode === value.durationMode)) !== null && _a !== void 0 ? _a : base.durationMode, focusMin,
        breakMin, 
        // Linha ausente ou inválida usa as durações globais; o plano 5/5/10/20 do
        // protótipo só vem do padrão, quando não há nada guardado.
        plan: sanePlan(value.plan, cycleLen, focusMin, breakMin), autoStart: typeof value.autoStart === 'boolean' ? value.autoStart : base.autoStart, barControls: typeof value.barControls === 'boolean' ? value.barControls : base.barControls, breakSound: (_b = BREAK_SOUND_IDS.find((id) => id === value.breakSound)) !== null && _b !== void 0 ? _b : base.breakSound }, savedWallpaper(value.wallpaper, path, base));
}
function savedWallpaper(id, path, base) {
    const known = WALLPAPER_IDS.find((item) => item === id);
    if (known === undefined || (known === 'custom' && path === '')) {
        return { wallpaper: base.wallpaper, wallpaperPath: path };
    }
    return { wallpaper: known, wallpaperPath: path };
}
