// Tokens por dia e por modelo do modo `ai` (specs/12-uso-ia.md "Tokens"),
// lidos dos registros que `omarchy-agent-usage-update` grava em
// ~/.local/state/omarchy/agents/usage/<agente>.json, como o widget de agentes do
// Omarchy (/usr/share/omarchy/shell/plugins/agents). Formatação e nomes dos
// modelos seguem o `Main.qml` de lá. Os limites de sessão e semanal também
// vêm do registro (o coletor do Claude consulta o endpoint OAuth de uso).

import type { UsageWindow } from './aiUsage.js';
import { msg, tr, weekdayShort, type Language } from './i18n.js';

export interface AgentDay {
  date: string;
  tokens: number;
}

export interface AgentModel {
  id: string;
  tokens: number;
}

export interface AgentRecord {
  plan: string;
  /** ms epoch; 0 sem `updatedAt`. */
  updatedAt: number;
  days: AgentDay[];
  /** Do mais usado para o menos. */
  models: AgentModel[];
  session: UsageWindow | null;
  weekly: UsageWindow | null;
  /** Aviso do coletor em vez dos limites (sem login, limite de requisições). */
  status: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function parseDays(value: unknown): AgentDay[] {
  if (!Array.isArray(value)) return [];
  // `messageCount` guarda os tokens do dia (o painel do Omarchy lê assim).
  return value
    .filter(isObject)
    .map((day) => ({ date: String(day.date ?? ''), tokens: count(day.messageCount) }));
}

function parseModels(value: unknown): AgentModel[] {
  if (!isObject(value)) return [];
  return Object.entries(value)
    .filter((entry): entry is [string, Record<string, unknown>] => isObject(entry[1]))
    .map(([id, bucket]) => ({
      id,
      tokens:
        count(bucket.inputTokens) +
        count(bucket.outputTokens) +
        count(bucket.cacheReadInputTokens) +
        count(bucket.cacheCreationInputTokens),
    }))
    .sort((a, b) => b.tokens - a.tokens);
}

function parseWindow(entry: Record<string, unknown>): UsageWindow | null {
  if (typeof entry.percent !== 'number' || !Number.isFinite(entry.percent)) return null;
  const resetsAt = typeof entry.resetsAt === 'string' ? Date.parse(entry.resetsAt) : NaN;
  return { percent: entry.percent * 100, resetsAt: Number.isNaN(resetsAt) ? null : resetsAt };
}

/** Pelo rótulo ("Session (5-hour)", "Weekly (7-day)"), nunca pela posição. */
function findWindow(limits: unknown, pattern: RegExp): UsageWindow | null {
  if (!Array.isArray(limits)) return null;
  const entry = limits.filter(isObject).find((limit) => pattern.test(String(limit.label ?? '')));
  return entry ? parseWindow(entry) : null;
}

function statusText(data: Record<string, unknown>, hasLimits: boolean): string {
  if (typeof data.usageStatusText === 'string' && data.usageStatusText !== '')
    return data.usageStatusText;
  if (!hasLimits && typeof data.authHelpText === 'string' && data.authHelpText !== '') {
    // Texto do core: a UI traduz `status` na hora de mostrar.
    return msg('Log in to the CLI to see the limits');
  }
  return '';
}

export function parseAgentRecord(text: string): AgentRecord | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isObject(data)) return null;
  const updatedAt = typeof data.updatedAt === 'string' ? Date.parse(data.updatedAt) : NaN;
  const session = findWindow(data.limits, /session|5-hour/i);
  const weekly = findWindow(data.limits, /weekly|7-day/i);
  return {
    plan: typeof data.tierLabel === 'string' ? data.tierLabel : '',
    updatedAt: Number.isNaN(updatedAt) ? 0 : updatedAt,
    days: parseDays(data.recentDays),
    models: parseModels(data.modelUsage),
    session,
    weekly,
    status: statusText(data, session !== null || weekly !== null),
  };
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1e9) return (tokens / 1e9).toFixed(1) + 'B';
  if (tokens >= 1e6) return (tokens / 1e6).toFixed(1) + 'M';
  if (tokens >= 1e3) return (tokens / 1e3).toFixed(1) + 'K';
  return String(tokens);
}

function wordCase(word: string): string {
  if (word === 'gpt') return 'GPT';
  if (word === 'deepseek') return 'DeepSeek';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** `claude-opus-4-8` → `Opus 4.8`, `gpt-5.6-sol` → `GPT 5.6 Sol`. */
export function friendlyModelName(id: string): string {
  const parts = id
    .replace(/^claude-/, '')
    .replace(/-\d{8}$/, '')
    .split('-');
  const words: string[] = [];
  let version: string[] = [];
  for (const part of parts) {
    if (part === '') continue;
    if (/^\d/.test(part)) {
      version.push(part);
      continue;
    }
    if (version.length > 0) words.push(version.join('.'));
    version = [];
    words.push(wordCase(part));
  }
  if (version.length > 0) words.push(version.join('.'));
  return words.length > 0 ? words.join(' ') : msg('Unknown');
}

export interface UsageRow {
  label: string;
  value: string;
  /** 0–1, relativo ao maior da lista. */
  fraction: number;
  today: boolean;
}

/** Últimos 7 dias; o de hoje (data local `YYYY-MM-DD`) vira "Today" em destaque. */
export function dayRows(days: AgentDay[], today: string, lang: Language): UsageRow[] {
  const last = days.slice(-7);
  const peak = Math.max(0, ...last.map((day) => day.tokens));
  return last.map((day) => {
    const isToday = day.date === today;
    const weekday = weekdayShort(lang, new Date(day.date + 'T12:00:00').getDay()) || day.date;
    return {
      label: isToday ? tr(lang, 'Today') : weekday,
      value: formatTokens(day.tokens),
      fraction: peak > 0 ? day.tokens / peak : 0,
      today: isToday,
    };
  });
}

export interface ModelRow {
  name: string;
  value: string;
  fraction: number;
}

export function modelRows(models: AgentModel[]): ModelRow[] {
  const peak = Math.max(0, ...models.map((model) => model.tokens));
  return models.map((model) => ({
    name: friendlyModelName(model.id),
    value: formatTokens(model.tokens),
    fraction: peak > 0 ? model.tokens / peak : 0,
  }));
}

export interface AiPanelParts {
  providers: number;
  days: boolean;
  models: number;
}

// Cartão: padding 10 + 12, topo 28 + 10, limites 46. Tokens por dia: divisor
// 12 + 1 + 10, rótulo 18, 7 × 22. Por modelo: divisor 23, rótulo 18 + 4,
// linhas de 30 com gap 4.
export function aiPanelHeight(parts: AiPanelParts): number {
  const header = 24 + 26 + 6;
  if (parts.providers === 0) return header;
  const tabs = parts.providers > 1 ? 36 : 0;
  let card = 106;
  if (parts.days) card += 23 + 18 + 7 * 22;
  if (parts.models > 0) card += 23 + 22 + parts.models * 34 - 4;
  return header + tabs + card;
}
