// Ambientes (specs/15-ambientes.md; design/logic.js `DEFAULT_ENVS`,
// `ENV_ICONS`, `loadEnvs`, `switchEnv`, `wheel`): modelo, saneamento do valor
// persistido, troca circular e a regra da rolagem que troca de ambiente.
/** Catálogo de widgets (specs/16-widgets.md), na ordem do catálogo. */
export const WIDGET_IDS = [
    'ai',
    'hw',
    'event',
    'pomodoro',
    'music',
    'github',
    'progress',
    'countdown',
    'note',
];
/** Cartão do catálogo (specs/16-widgets.md "Catálogo"); ícone como em `ui/icons.ts`. */
export const WIDGET_CATALOG = {
    ai: { name: 'Uso de IA', icon: 'sparkle', description: 'Sessão e limite semanal' },
    hw: { name: 'Hardware', icon: 'cpu', description: 'CPU, RAM, GPU, temperatura e rede' },
    event: {
        name: 'Próximo evento',
        icon: 'calendar-blank',
        description: 'O próximo compromisso do dia',
    },
    pomodoro: { name: 'Pomodoro', icon: 'timer', description: 'Ciclos de foco e pausa' },
    music: { name: 'Música', icon: 'music-note', description: 'O que está tocando agora' },
    github: { name: 'GitHub', icon: 'github-logo', description: 'PRs esperando revisão' },
    progress: {
        name: 'Progresso do dia',
        icon: 'hourglass-medium',
        description: 'Quanto do dia já passou',
    },
    countdown: {
        name: 'Contagem regressiva',
        icon: 'airplane-tilt',
        description: 'Dias até a data que importa',
    },
    note: { name: 'Nota', icon: 'note', description: 'Um recado fixo na barra' },
};
/** Glifos Phosphor de `ENV_ICONS` (`ph ph-house` → `house`, ver `ui/icons.ts`). */
export const ENV_ICONS = [
    'house',
    'briefcase',
    'book-open',
    'sun-horizon',
    'code',
    'game-controller',
    'moon-stars',
    'barbell',
    'coffee',
];
export const MAX_ENVIRONMENTS = 6;
export const MAX_NAME_LENGTH = 20;
const DEFAULT_ENVIRONMENTS = [
    { name: 'Padrão', icon: 'house', left: ['ai'], right: ['hw'] },
    {
        name: 'Trabalho',
        icon: 'briefcase',
        left: ['event', 'pomodoro', 'ai'],
        right: ['hw', 'github'],
    },
    { name: 'Estudos', icon: 'book-open', left: ['progress', 'pomodoro'], right: ['note'] },
    { name: 'Fim de semana', icon: 'sun-horizon', left: ['music'], right: ['countdown'] },
];
export function defaultEnvironments() {
    return DEFAULT_ENVIRONMENTS.map((env) => (Object.assign(Object.assign({}, env), { left: [...env.left], right: [...env.right] })));
}
function isWidgetId(id) {
    return WIDGET_IDS.includes(id);
}
function isEnvIcon(icon) {
    return ENV_ICONS.includes(icon);
}
/**
 * Lê o valor persistido: descarta widget desconhecido ou repetido no mesmo
 * ambiente (vale a primeira ocorrência, esquerda antes da direita), troca
 * ícone desconhecido por `house`, corta nome e lista. Lista vazia volta aos
 * ambientes iniciais.
 */
export function sanitizeEnvironments(stored) {
    const envs = stored.slice(0, MAX_ENVIRONMENTS).map(([name, icon, left, right]) => {
        const seen = new Set();
        const keep = (ids) => ids.filter((id) => {
            if (!isWidgetId(id) || seen.has(id))
                return false;
            seen.add(id);
            return true;
        });
        return {
            name: name.slice(0, MAX_NAME_LENGTH),
            icon: isEnvIcon(icon) ? icon : 'house',
            left: keep(left),
            right: keep(right),
        };
    });
    return envs.length > 0 ? envs : defaultEnvironments();
}
function isStringList(value) {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
function isStoredEnvironment(value) {
    if (!Array.isArray(value) || value.length !== 4)
        return false;
    const [name, icon, left, right] = value;
    return (typeof name === 'string' &&
        typeof icon === 'string' &&
        isStringList(left) &&
        isStringList(right));
}
/**
 * Valor lido do `settings.json` (specs/13-preferencias.md), em qualquer forma:
 * entradas fora de `[nome, ícone, [esquerda], [direita]]` saem antes do
 * saneamento.
 */
export function environmentsFromJson(value) {
    return sanitizeEnvironments(Array.isArray(value) ? value.filter(isStoredEnvironment) : []);
}
export function toStored(envs) {
    return envs.map((env) => [env.name, env.icon, [...env.left], [...env.right]]);
}
/** Índice fora da faixa vira 0. */
export function sanitizeIndex(index, count) {
    return Number.isInteger(index) && index >= 0 && index < count ? index : 0;
}
/** Troca circular: depois do último vem o primeiro. */
export function stepIndex(index, count, direction) {
    return (index + direction + count) % count;
}
/** O Padrão (primeiro) não sai, e sempre sobra ao menos um ambiente. */
export function removeEnvironment(envs, index) {
    if (index <= 0 || index >= envs.length)
        return [...envs];
    return envs.filter((_env, i) => i !== index);
}
/**
 * Põe `id` na pílula `side` antes da posição `at` (`null`: no fim), tirando-o
 * de onde estiver (specs/17-editor-ambientes.md; design/logic.js `placeW`).
 * `at` conta na lista de antes da mudança.
 */
export function placeWidget(env, id, side, at) {
    const from = env[side].indexOf(id);
    const placed = removeWidget(env, id);
    let index = at !== null && at !== void 0 ? at : placed[side].length;
    if (from !== -1 && from < index)
        index--;
    placed[side].splice(Math.max(0, Math.min(placed[side].length, index)), 0, id);
    return placed;
}
export function findWidget(env, id) {
    for (const side of ['left', 'right']) {
        const index = env[side].indexOf(id);
        if (index !== -1)
            return { side, index, count: env[side].length };
    }
    return null;
}
export function removeWidget(env, id) {
    return Object.assign(Object.assign({}, env), { left: env.left.filter((w) => w !== id), right: env.right.filter((w) => w !== id) });
}
/** Novo ambiente no fim (design/logic.js `addEnv`); com 6, nada muda. */
export function addEnvironment(envs) {
    const n = envs.length;
    if (n >= MAX_ENVIRONMENTS)
        return [...envs];
    return [
        ...envs,
        { name: `Ambiente ${n + 1}`, icon: ENV_ICONS[n % ENV_ICONS.length], left: [], right: [] },
    ];
}
// Rolagem suave (specs/15-ambientes.md "Rolagem suave"; spike S8): o delta
// chega em cliques de roda, ~10px de dedo cada.
export const SWITCH_THRESHOLD = 11;
const DRAG_PX_PER_UNIT = 5;
const MAX_DRAG = 56;
const PASS = { handled: false };
export class EnvironmentScroll {
    constructor() {
        this.accumulated = 0;
        this.locked = false;
    }
    handle(input) {
        if (input.kind === 'discrete') {
            // Os discretos emulados do touchpad chegam junto com os suaves.
            if (!input.fromWheel)
                return PASS;
            if (input.direction === 'left')
                return { handled: true, step: -1 };
            if (input.direction === 'right')
                return { handled: true, step: 1 };
            return PASS;
        }
        if (input.finished) {
            const active = this.locked || this.accumulated !== 0;
            this.accumulated = 0;
            this.locked = false;
            return active ? { handled: true, drag: 0 } : PASS;
        }
        if (Math.abs(input.dx) <= Math.abs(input.dy))
            return PASS;
        if (this.locked)
            return { handled: true };
        this.accumulated += input.dx;
        if (Math.abs(this.accumulated) > SWITCH_THRESHOLD) {
            const step = this.accumulated > 0 ? 1 : -1;
            this.accumulated = 0;
            this.locked = true;
            return { handled: true, step };
        }
        const drag = -this.accumulated * DRAG_PX_PER_UNIT;
        return { handled: true, drag: Math.max(-MAX_DRAG, Math.min(MAX_DRAG, drag)) };
    }
}
