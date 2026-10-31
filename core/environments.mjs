// Ambientes (specs/15-ambientes.md; design/logic.js `DEFAULT_ENVS`,
// `ENV_ICONS`, `loadEnvs`, `switchEnv`, `wheel`): modelo, saneamento do valor
// persistido, troca circular e a regra da rolagem que troca de ambiente.
import { msg, tr } from './i18n.mjs';
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
const PLUGIN_PREFIX = 'plugin:';
const PLUGIN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
/**
 * Cartão do catálogo (specs/16-widgets.md "Catálogo"); ícone como em `ui/icons.ts`.
 * Nome e descrição em inglês: a UI traduz na hora de mostrar.
 */
export const WIDGET_CATALOG = {
    ai: { name: msg('AI usage'), icon: 'sparkle', description: msg('Session and weekly limit') },
    hw: {
        name: msg('Hardware'),
        icon: 'cpu',
        description: msg('CPU, RAM, GPU, temperature and network'),
    },
    event: {
        name: msg('Next event'),
        icon: 'calendar-blank',
        description: msg("The day's next appointment"),
    },
    pomodoro: { name: msg('Pomodoro'), icon: 'timer', description: msg('Focus and break cycles') },
    music: { name: msg('Music'), icon: 'music-note', description: msg('What is playing now') },
    github: { name: msg('GitHub'), icon: 'github-logo', description: msg('PRs awaiting review') },
    progress: {
        name: msg('Day progress'),
        icon: 'hourglass-medium',
        description: msg('How much of the day has passed'),
    },
    countdown: {
        name: msg('Date countdown'),
        icon: 'airplane-tilt',
        description: msg('Days until the date that matters'),
    },
    note: { name: msg('Note'), icon: 'note', description: msg('A note pinned to the bar') },
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
// Os nomes saem no idioma da interface; editado, o ambiente guarda o nome
// como está.
const DEFAULT_ENVIRONMENTS = [
    { name: msg('Default'), icon: 'house', left: ['ai'], right: ['hw'] },
    {
        name: msg('Work'),
        icon: 'briefcase',
        left: ['event', 'pomodoro', 'ai'],
        right: ['hw', 'github'],
    },
    { name: msg('Studies'), icon: 'book-open', left: ['progress', 'pomodoro'], right: ['note'] },
    { name: msg('Weekend'), icon: 'sun-horizon', left: ['music'], right: ['countdown'] },
];
export function defaultEnvironments(lang) {
    return DEFAULT_ENVIRONMENTS.map((env) => (Object.assign(Object.assign({}, env), { name: tr(lang, env.name), left: [...env.left], right: [...env.right] })));
}
function isWidgetId(id) {
    return WIDGET_IDS.includes(id);
}
export function isPluginWidgetId(id) {
    return id.startsWith(PLUGIN_PREFIX) && PLUGIN_ID_PATTERN.test(id.slice(PLUGIN_PREFIX.length));
}
/** `omaplug` → `plugin:omaplug`; id fora do formato do Omarchy dá `null`. */
export function pluginWidgetId(pluginId) {
    const id = `${PLUGIN_PREFIX}${pluginId}`;
    return isPluginWidgetId(id) ? id : null;
}
/** `plugin:omaplug` → `omaplug`; widget da Island dá `''`. */
export function pluginIdOf(id) {
    return isPluginWidgetId(id) ? id.slice(PLUGIN_PREFIX.length) : '';
}
function isPlacedWidgetId(id) {
    return isWidgetId(id) || isPluginWidgetId(id);
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
export function sanitizeEnvironments(stored, lang) {
    const envs = stored.slice(0, MAX_ENVIRONMENTS).map(([name, icon, left, right]) => {
        const seen = new Set();
        // Widget de plugin fica mesmo sem o plugin instalado agora: ele pode
        // estar carregando, e a barra só não o desenha (specs/16-widgets.md).
        const keep = (ids) => ids.filter((id) => {
            if (!isPlacedWidgetId(id) || seen.has(id))
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
    return envs.length > 0 ? envs : defaultEnvironments(lang);
}
/** Teto de um "array" que não é `Array`: um `{"length": 1e9}` no arquivo não pode alocar. */
const MAX_LIST_LENGTH = 1000;
/**
 * Lista como o `JsonAdapter` do Quickshell a entrega: o V4 devolve os `var`
 * lidos do arquivo como objetos com `length` e índices em que `Array.isArray`
 * dá `false` (medido no qs 0.3.2). Com `Array.isArray` a leitura descartava
 * tudo e a Island subia com os ambientes iniciais, apagando as edições do
 * usuário na gravação seguinte.
 */
export function asList(value) {
    if (Array.isArray(value))
        return value;
    if (typeof value !== 'object' || value === null)
        return null;
    const length = value.length;
    if (typeof length !== 'number' || !Number.isInteger(length))
        return null;
    if (length < 0 || length > MAX_LIST_LENGTH)
        return null;
    return Array.from(value);
}
function asStringList(value) {
    const list = asList(value);
    return list !== null && list.every((item) => typeof item === 'string')
        ? list
        : null;
}
function asStoredEnvironment(value) {
    const item = asList(value);
    if (item === null || item.length !== 4)
        return null;
    const [name, icon] = item;
    const left = asStringList(item[2]);
    const right = asStringList(item[3]);
    if (typeof name !== 'string' || typeof icon !== 'string' || !left || !right)
        return null;
    return [name, icon, left, right];
}
/**
 * Valor lido do `settings.json` (specs/13-preferencias.md), em qualquer forma
 * (inclusive a lista tipo array do JsonAdapter, `asList`): entradas fora de
 * `[nome, ícone, [esquerda], [direita]]` saem antes do saneamento.
 */
export function environmentsFromJson(value, lang) {
    var _a;
    const stored = ((_a = asList(value)) !== null && _a !== void 0 ? _a : [])
        .map(asStoredEnvironment)
        .filter((env) => env !== null);
    return sanitizeEnvironments(stored, lang);
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
export function addEnvironment(envs, lang) {
    const n = envs.length;
    if (n >= MAX_ENVIRONMENTS)
        return [...envs];
    return [
        ...envs,
        {
            name: tr(lang, 'Environment {n}', { n: n + 1 }),
            icon: ENV_ICONS[n % ENV_ICONS.length],
            left: [],
            right: [],
        },
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
