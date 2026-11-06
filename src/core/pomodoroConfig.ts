// Configuração do Pomodoro (specs/20-pomodoro.md "Configuração"): ciclo,
// durações, início automático e wallpaper da pausa. Vive no `settings.json`
// (`pomodoro`); tudo passa por `sanitizePomodoroConfig` na leitura, campo a
// campo, para um valor ruim não derrubar o resto (PRD RN-10 do protótipo).

import { asList } from './environments.js';

export type PomodoroPhase = 'focus' | 'break';
export type DurationMode = 'global' | 'individual';

export const DURATION_MODES: readonly DurationMode[] = ['global', 'individual'];
export const WALLPAPER_IDS = ['noite', 'aurora', 'brasa', 'grafite', 'custom'] as const;
export type WallpaperId = (typeof WALLPAPER_IDS)[number];

/** Limites e passos da spec 06 do protótipo: sessões 1–24, foco 5–180 (de 5 em 5), pausa 1–60. */
export const CYCLE_LIMITS = { min: 1, max: 24 } as const;
export const MINUTE_LIMITS: Readonly<
  Record<PomodoroPhase, { min: number; max: number; step: number }>
> = {
  focus: { min: 5, max: 180, step: 5 },
  break: { min: 1, max: 60, step: 1 },
};

export interface SessionPlan {
  focusMin: number;
  breakMin: number;
}

export interface PomodoroConfig {
  cycleLen: number;
  durationMode: DurationMode;
  /** Duração do foco no modo Global. */
  focusMin: number;
  /** Duração da pausa no modo Global. */
  breakMin: number;
  /** Uma linha por sessão do ciclo (modo Individual); sempre com `cycleLen` linhas. */
  plan: SessionPlan[];
  /** Inicia o foco sozinho depois da pausa; a pausa sempre começa correndo. */
  autoStart: boolean;
  wallpaper: WallpaperId;
  /** Arquivo da imagem própria; vale só com `wallpaper: 'custom'`, mas fica guardado ao trocar de preset. */
  wallpaperPath: string;
}

const DEFAULT_FOCUS = 25;
const DEFAULT_BREAK = 5;
/** Pausas do plano padrão do protótipo: a última é a longa. */
const DEFAULT_BREAKS = [5, 5, 10, 20];

export function defaultPomodoroConfig(): PomodoroConfig {
  return {
    cycleLen: DEFAULT_BREAKS.length,
    durationMode: 'global',
    focusMin: DEFAULT_FOCUS,
    breakMin: DEFAULT_BREAK,
    plan: DEFAULT_BREAKS.map((breakMin) => ({ focusMin: DEFAULT_FOCUS, breakMin })),
    autoStart: true,
    wallpaper: 'noite',
    wallpaperPath: '',
  };
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** Duração, em minutos, da etapa da sessão (1…cycleLen) no modo de duração atual. */
export function minutesFor(config: PomodoroConfig, phase: PomodoroPhase, session: number): number {
  const global = phase === 'focus' ? config.focusMin : config.breakMin;
  if (config.durationMode === 'global') return global;
  const row = config.plan[session - 1];
  if (!row) return global;
  return phase === 'focus' ? row.focusMin : row.breakMin;
}

/** Quantidade de sessões; o plano é truncado no fim ou estendido com as durações globais. */
export function withCycleLength(config: PomodoroConfig, count: number): PomodoroConfig {
  const cycleLen = clamp(Math.trunc(count), CYCLE_LIMITS.min, CYCLE_LIMITS.max);
  const plan = config.plan.slice(0, cycleLen);
  while (plan.length < cycleLen)
    plan.push({ focusMin: config.focusMin, breakMin: config.breakMin });
  return { ...config, cycleLen, plan };
}

/** Campo de texto das sessões: só dígitos; vazio ou inválido volta ao valor anterior, o resto é limitado a 1–24. */
export function parseCycleLength(text: string, previous: number): number {
  const digits = text.trim();
  if (!/^\d{1,2}$/.test(digits)) return previous;
  return clamp(Number(digits), CYCLE_LIMITS.min, CYCLE_LIMITS.max);
}

export function withDurationMode(
  config: PomodoroConfig,
  durationMode: DurationMode,
): PomodoroConfig {
  return { ...config, durationMode };
}

function stepped(value: number, phase: PomodoroPhase, direction: 1 | -1): number {
  const limits = MINUTE_LIMITS[phase];
  return clamp(value + direction * limits.step, limits.min, limits.max);
}

export function stepGlobalMinutes(
  config: PomodoroConfig,
  phase: PomodoroPhase,
  direction: 1 | -1,
): PomodoroConfig {
  if (phase === 'focus') return { ...config, focusMin: stepped(config.focusMin, phase, direction) };
  return { ...config, breakMin: stepped(config.breakMin, phase, direction) };
}

/** Passo numa linha do plano (`session` de 1 a `cycleLen`); sessão fora do plano não muda nada. */
export function stepPlanMinutes(
  config: PomodoroConfig,
  session: number,
  phase: PomodoroPhase,
  direction: 1 | -1,
): PomodoroConfig {
  const row = config.plan[session - 1];
  if (!row) return config;
  const next =
    phase === 'focus'
      ? { ...row, focusMin: stepped(row.focusMin, phase, direction) }
      : { ...row, breakMin: stepped(row.breakMin, phase, direction) };
  return { ...config, plan: config.plan.map((item, i) => (i === session - 1 ? next : item)) };
}

export function withAutoStart(config: PomodoroConfig, autoStart: boolean): PomodoroConfig {
  return { ...config, autoStart };
}

/**
 * Wallpaper da pausa. `custom` só vale com o caminho da imagem; um id
 * desconhecido deixa tudo como estava. Trocar para um preset guarda o
 * caminho, para voltar à imagem própria sem escolher o arquivo de novo.
 */
export function withWallpaper(config: PomodoroConfig, id: string, path: string): PomodoroConfig {
  const known = WALLPAPER_IDS.find((item) => item === id);
  if (known === undefined) return config;
  if (known !== 'custom') return { ...config, wallpaper: known };
  if (path === '') return config;
  return { ...config, wallpaper: 'custom', wallpaperPath: path };
}

/** Soma de foco e pausa de todas as linhas do plano. */
export function cycleTotalMinutes(config: PomodoroConfig): number {
  return config.plan.reduce((sum, row) => sum + row.focusMin + row.breakMin, 0);
}

/** `2h 20m`, `2h`, `45m`. */
export function formatCycleTotal(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validMinutes(value: unknown, phase: PomodoroPhase, fallback: number): number {
  const limits = MINUTE_LIMITS[phase];
  const ok = typeof value === 'number' && Number.isInteger(value);
  return ok && value >= limits.min && value <= limits.max ? value : fallback;
}

function saneRow(value: unknown, fallback: SessionPlan): SessionPlan {
  if (!isRecord(value)) return fallback;
  return {
    focusMin: validMinutes(value.focusMin, 'focus', fallback.focusMin),
    breakMin: validMinutes(value.breakMin, 'break', fallback.breakMin),
  };
}

function sanePlan(
  value: unknown,
  cycleLen: number,
  focusMin: number,
  breakMin: number,
): SessionPlan[] {
  const stored = asList(value) ?? [];
  const global = { focusMin, breakMin };
  const plan: SessionPlan[] = [];
  for (let i = 0; i < cycleLen; i++) plan.push(saneRow(stored[i], global));
  return plan;
}

function saneCycleLen(value: unknown, fallback: number): number {
  const ok = typeof value === 'number' && Number.isInteger(value);
  return ok && value >= CYCLE_LIMITS.min && value <= CYCLE_LIMITS.max ? value : fallback;
}

/** Valor lido do `settings.json`, em qualquer forma (inclusive a lista tipo array do `JsonAdapter`, `asList`). */
export function sanitizePomodoroConfig(value: unknown): PomodoroConfig {
  const base = defaultPomodoroConfig();
  if (!isRecord(value)) return base;
  const cycleLen = saneCycleLen(value.cycleLen, base.cycleLen);
  const focusMin = validMinutes(value.focusMin, 'focus', base.focusMin);
  const breakMin = validMinutes(value.breakMin, 'break', base.breakMin);
  const path = typeof value.wallpaperPath === 'string' ? value.wallpaperPath : '';
  return {
    cycleLen,
    durationMode: DURATION_MODES.find((mode) => mode === value.durationMode) ?? base.durationMode,
    focusMin,
    breakMin,
    // Linha ausente ou inválida usa as durações globais; o plano 5/5/10/20 do
    // protótipo só vem do padrão, quando não há nada guardado.
    plan: sanePlan(value.plan, cycleLen, focusMin, breakMin),
    autoStart: typeof value.autoStart === 'boolean' ? value.autoStart : base.autoStart,
    ...savedWallpaper(value.wallpaper, path, base),
  };
}

function savedWallpaper(
  id: unknown,
  path: string,
  base: PomodoroConfig,
): Pick<PomodoroConfig, 'wallpaper' | 'wallpaperPath'> {
  const known = WALLPAPER_IDS.find((item) => item === id);
  if (known === undefined || (known === 'custom' && path === '')) {
    return { wallpaper: base.wallpaper, wallpaperPath: path };
  }
  return { wallpaper: known, wallpaperPath: path };
}
