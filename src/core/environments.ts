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
] as const;

export type WidgetId = (typeof WIDGET_IDS)[number];

/** Cartão do catálogo (specs/16-widgets.md "Catálogo"); ícone como em `ui/icons.ts`. */
export const WIDGET_CATALOG: Record<WidgetId, { name: string; icon: string; description: string }> =
  {
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
] as const;

export type EnvIcon = (typeof ENV_ICONS)[number];

export interface Environment {
  name: string;
  icon: EnvIcon;
  left: WidgetId[];
  right: WidgetId[];
}

/** Forma persistida em GSettings `environments`, `a(ssasas)` (specs/13-preferencias.md). */
export type StoredEnvironment = readonly [string, string, readonly string[], readonly string[]];

export const MAX_ENVIRONMENTS = 6;
export const MAX_NAME_LENGTH = 20;

const DEFAULT_ENVIRONMENTS: readonly Environment[] = [
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

export function defaultEnvironments(): Environment[] {
  return DEFAULT_ENVIRONMENTS.map((env) => ({
    ...env,
    left: [...env.left],
    right: [...env.right],
  }));
}

function isWidgetId(id: string): id is WidgetId {
  return (WIDGET_IDS as readonly string[]).includes(id);
}

function isEnvIcon(icon: string): icon is EnvIcon {
  return (ENV_ICONS as readonly string[]).includes(icon);
}

/**
 * Lê o valor persistido: descarta widget desconhecido ou repetido no mesmo
 * ambiente (vale a primeira ocorrência, esquerda antes da direita), troca
 * ícone desconhecido por `house`, corta nome e lista. Lista vazia volta aos
 * ambientes iniciais.
 */
export function sanitizeEnvironments(stored: readonly StoredEnvironment[]): Environment[] {
  const envs = stored.slice(0, MAX_ENVIRONMENTS).map(([name, icon, left, right]) => {
    const seen = new Set<WidgetId>();
    const keep = (ids: readonly string[]): WidgetId[] =>
      ids.filter((id): id is WidgetId => {
        if (!isWidgetId(id) || seen.has(id)) return false;
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

export function toStored(envs: readonly Environment[]): [string, string, string[], string[]][] {
  return envs.map((env) => [env.name, env.icon, [...env.left], [...env.right]]);
}

/** Índice fora da faixa vira 0. */
export function sanitizeIndex(index: number, count: number): number {
  return Number.isInteger(index) && index >= 0 && index < count ? index : 0;
}

/** Troca circular: depois do último vem o primeiro. */
export function stepIndex(index: number, count: number, direction: 1 | -1): number {
  return (index + direction + count) % count;
}

/** O Padrão (primeiro) não sai, e sempre sobra ao menos um ambiente. */
export function removeEnvironment(envs: readonly Environment[], index: number): Environment[] {
  if (index <= 0 || index >= envs.length) return [...envs];
  return envs.filter((_env, i) => i !== index);
}

export type Side = 'left' | 'right';

/**
 * Põe `id` na pílula `side` antes da posição `at` (`null`: no fim), tirando-o
 * de onde estiver (specs/17-editor-ambientes.md; design/logic.js `placeW`).
 * `at` conta na lista de antes da mudança.
 */
export function placeWidget(
  env: Environment,
  id: WidgetId,
  side: Side,
  at: number | null,
): Environment {
  const from = env[side].indexOf(id);
  const placed = removeWidget(env, id);
  let index = at ?? placed[side].length;
  if (from !== -1 && from < index) index--;
  placed[side].splice(Math.max(0, Math.min(placed[side].length, index)), 0, id);
  return placed;
}

export interface WidgetPlace {
  side: Side;
  index: number;
  /** Quantos widgets a pílula tem. */
  count: number;
}

export function findWidget(env: Environment, id: WidgetId): WidgetPlace | null {
  for (const side of ['left', 'right'] as const) {
    const index = env[side].indexOf(id);
    if (index !== -1) return { side, index, count: env[side].length };
  }
  return null;
}

export function removeWidget(env: Environment, id: WidgetId): Environment {
  return {
    ...env,
    left: env.left.filter((w) => w !== id),
    right: env.right.filter((w) => w !== id),
  };
}

/** Novo ambiente no fim (design/logic.js `addEnv`); com 6, nada muda. */
export function addEnvironment(envs: readonly Environment[]): Environment[] {
  const n = envs.length;
  if (n >= MAX_ENVIRONMENTS) return [...envs];
  return [
    ...envs,
    { name: `Ambiente ${n + 1}`, icon: ENV_ICONS[n % ENV_ICONS.length]!, left: [], right: [] },
  ];
}

// Rolagem suave (specs/15-ambientes.md "Rolagem suave"; spike S8): o delta
// chega em cliques de roda, ~10px de dedo cada.
export const SWITCH_THRESHOLD = 11;
const DRAG_PX_PER_UNIT = 5;
const MAX_DRAG = 56;

export type ScrollInput =
  | { kind: 'smooth'; dx: number; dy: number; finished: boolean }
  | { kind: 'discrete'; direction: 'up' | 'down' | 'left' | 'right'; fromWheel: boolean };

export interface ScrollResult {
  /** `false`: o evento não é nosso e passa adiante. */
  handled: boolean;
  /** Troca pedida: +1 próximo, −1 anterior. */
  step?: 1 | -1;
  /** Novo deslocamento do conteúdo das pílulas, em px. */
  drag?: number;
}

const PASS: ScrollResult = { handled: false };

export class EnvironmentScroll {
  private accumulated = 0;
  private locked = false;

  handle(input: ScrollInput): ScrollResult {
    if (input.kind === 'discrete') {
      // Os discretos emulados do touchpad chegam junto com os suaves.
      if (!input.fromWheel) return PASS;
      if (input.direction === 'left') return { handled: true, step: -1 };
      if (input.direction === 'right') return { handled: true, step: 1 };
      return PASS;
    }

    if (input.finished) {
      const active = this.locked || this.accumulated !== 0;
      this.accumulated = 0;
      this.locked = false;
      return active ? { handled: true, drag: 0 } : PASS;
    }

    if (Math.abs(input.dx) <= Math.abs(input.dy)) return PASS;
    if (this.locked) return { handled: true };

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
