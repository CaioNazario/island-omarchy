// Uso de IA (specs/12-uso-ia.md): leitura das credenciais, parse das
// respostas, faixas de cor, "Reinicia" e a agenda do polling. Os endpoints
// são não documentados (referência: github.com/akitaonrails/ai-usagebar):
// formato inesperado vira `null`, nunca exceção.

import { formatClock } from './clock.js';
import { decodeUtf8 } from './utf8.js';

export type ProviderId = 'claude' | 'codex';

export interface Credential {
  token: string;
  /** Só o Codex: vai no `ChatGPT-Account-Id`. */
  accountId: string | null;
  /** ms epoch; `null` quando o arquivo não diz. */
  expiresAt: number | null;
  plan: string | null;
}

export interface UsageWindow {
  /** 0–100. */
  percent: number;
  /** ms epoch; `null` quando a resposta não diz. */
  resetsAt: number | null;
}

export interface Usage {
  /** Janela de 5h; conta Codex só com a semanal vem sem ela. */
  session: UsageWindow | null;
  weekly: UsageWindow | null;
  plan: string | null;
}

const SESSION_WINDOW_SECONDS = 18000;
const WEEKLY_WINDOW_SECONDS = 604800;

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null;
}

/** Número ou string numérica finita (o Codex manda os dois). */
function numeric(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function percent(value: unknown): number | null {
  const n = numeric(value);
  return n === null ? null : Math.max(0, Math.min(100, n));
}

function isoToMs(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

/** "max" → "Max", "plus" → "Plus". */
function capitalize(value: string | null): string | null {
  if (!value) return null;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const BASE64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function base64UrlDecode(input: string): Uint8Array | null {
  const clean = input.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of clean) {
    const value = BASE64URL.indexOf(char);
    if (value < 0) return null;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}

/** Claims de um JWT, sem validar assinatura: só lemos `exp` e o plano. */
function jwtClaims(token: unknown): Json | null {
  if (typeof token !== 'string') return null;
  const payload = token.split('.')[1];
  if (!payload) return null;
  const bytes = base64UrlDecode(payload);
  if (!bytes) return null;
  const text = decodeUtf8(bytes);
  if (text === null) return null;
  const claims = parseJson(text);
  return isObject(claims) ? claims : null;
}

/** `~/.claude/.credentials.json`. */
export function parseClaudeCredentials(text: string): Credential | null {
  const root = parseJson(text);
  if (!isObject(root) || !isObject(root.claudeAiOauth)) return null;
  const oauth = root.claudeAiOauth;
  const token = nonEmptyString(oauth.accessToken);
  if (!token) return null;
  return {
    token,
    accountId: null,
    expiresAt: numeric(oauth.expiresAt),
    plan: capitalize(nonEmptyString(oauth.subscriptionType)),
  };
}

/** `~/.codex/auth.json`. */
export function parseCodexCredentials(text: string): Credential | null {
  const root = parseJson(text);
  if (!isObject(root) || !isObject(root.tokens)) return null;
  const tokens = root.tokens;
  const token = nonEmptyString(tokens.access_token);
  if (!token) return null;
  const claims = jwtClaims(tokens.id_token);
  // `expires_at` aparece como ISO ou como número (s); vence o `exp` do id_token.
  let expiresAt = isoToMs(tokens.expires_at);
  if (expiresAt === null) {
    const seconds = numeric(tokens.expires_at) ?? numeric(claims?.exp);
    expiresAt = seconds === null ? null : seconds * 1000;
  }
  const auth = claims?.['https://api.openai.com/auth'];
  return {
    token,
    accountId: nonEmptyString(tokens.account_id),
    expiresAt,
    plan: capitalize(isObject(auth) ? nonEmptyString(auth.chatgpt_plan_type) : null),
  };
}

/** Arquivo de credencial de cada provedor, relativo à home, e o parser dele. */
export const CREDENTIAL_FILES: Record<
  ProviderId,
  { path: readonly string[]; parse: (text: string) => Credential | null }
> = {
  claude: { path: ['.claude', '.credentials.json'], parse: parseClaudeCredentials },
  codex: { path: ['.codex', 'auth.json'], parse: parseCodexCredentials },
};

export function isExpired(credential: Credential, now: number): boolean {
  return credential.expiresAt !== null && credential.expiresAt <= now;
}

/** Estado mostrado nas preferências; lá não há 401, só a data do arquivo. */
export type CredentialState = 'found' | 'missing' | 'expired';

export function credentialState(credential: Credential | null, now: number): CredentialState {
  if (!credential) return 'missing';
  return isExpired(credential, now) ? 'expired' : 'found';
}

function claudeWindow(value: unknown): UsageWindow | null {
  if (!isObject(value)) return null;
  const used = percent(value.utilization);
  if (used === null) return null;
  return { percent: used, resetsAt: isoToMs(value.resets_at) };
}

/** `GET /api/oauth/usage`. O plano vem da credencial. */
export function parseClaudeUsage(body: string): Usage | null {
  const root = parseJson(body);
  if (!isObject(root)) return null;
  const session = claudeWindow(root.five_hour);
  const weekly = claudeWindow(root.seven_day);
  if (!session && !weekly) return null;
  return { session, weekly, plan: null };
}

function codexWindow(value: Json, now: number): UsageWindow | null {
  const used = percent(value.used_percent);
  if (used === null) return null;
  const resetAt = numeric(value.reset_at);
  const resetAfter = numeric(value.reset_after_seconds);
  let resetsAt: number | null = null;
  if (resetAt !== null) resetsAt = resetAt * 1000;
  else if (resetAfter !== null) resetsAt = now + resetAfter * 1000;
  return { percent: used, resetsAt };
}

/** `GET /backend-api/wham/usage`. Janelas pela duração, nunca pela posição. */
export function parseCodexUsage(body: string, now: number): Usage | null {
  const root = parseJson(body);
  if (!isObject(root) || !isObject(root.rate_limit)) return null;
  let session: UsageWindow | null = null;
  let weekly: UsageWindow | null = null;
  for (const key of ['primary_window', 'secondary_window']) {
    const window = root.rate_limit[key];
    if (!isObject(window)) continue;
    const seconds = numeric(window.limit_window_seconds);
    if (seconds === SESSION_WINDOW_SECONDS) session ??= codexWindow(window, now);
    else if (seconds === WEEKLY_WINDOW_SECONDS) weekly ??= codexWindow(window, now);
  }
  if (!session && !weekly) return null;
  return { session, weekly, plan: capitalize(nonEmptyString(root.plan_type)) };
}

/** `high`: ≥70% (`accent-300`); `critical`: ≥90% (vermelho). */
export type UsageLevel = 'normal' | 'high' | 'critical';

export function usageLevel(percent: number): UsageLevel {
  if (percent >= 90) return 'critical';
  if (percent >= 70) return 'high';
  return 'normal';
}

export function formatPercent(percent: number): string {
  return `${Math.round(percent)}%`;
}

/** "em 2h 14min", "em 45min". Nunca "em 0min": o que falta arredonda para cima. */
export function formatSessionReset(resetsAt: number, now: number): string {
  const minutes = Math.max(1, Math.ceil((resetsAt - now) / 60000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `em ${rest}min`;
  return rest === 0 ? `em ${hours}h` : `em ${hours}h ${rest}min`;
}

const WEEKDAYS_ABBR = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/** "seg, 09:00", na hora local. */
export function formatWeeklyReset(resetsAt: number): string {
  const date = new Date(resetsAt);
  return `${WEEKDAYS_ABBR[date.getDay()]}, ${formatClock(date)}`;
}

export const POLL_INTERVAL_S = 300;
export const MAX_POLL_INTERVAL_S = 1200;
/** Abrir o modo `ai` força atualização se o cache for mais velho que isso. */
export const OPEN_REFRESH_MS = 60_000;
export const OFFLINE_AFTER_FAILURES = 3;

/**
 * Resultado de uma busca. `failure`: rede ou 5xx; `unauthorized`: 401;
 * `malformed`: 2xx com formato inesperado.
 */
export type FetchOutcome = 'ok' | 'rate-limited' | 'unauthorized' | 'failure' | 'malformed';

export interface PollSchedule {
  intervalS: number;
  /** Falhas de rede seguidas. */
  failures: number;
}

export const INITIAL_SCHEDULE: PollSchedule = { intervalS: POLL_INTERVAL_S, failures: 0 };

/** 429 dobra o intervalo até 1200s; sucesso volta a 300s. */
export function nextSchedule(schedule: PollSchedule, outcome: FetchOutcome): PollSchedule {
  switch (outcome) {
    case 'ok':
      return INITIAL_SCHEDULE;
    case 'rate-limited':
      return {
        intervalS: Math.min(MAX_POLL_INTERVAL_S, schedule.intervalS * 2),
        failures: schedule.failures,
      };
    case 'failure':
      return { intervalS: schedule.intervalS, failures: schedule.failures + 1 };
    case 'unauthorized':
    case 'malformed':
      return schedule;
  }
}

export function isOffline(schedule: PollSchedule): boolean {
  return schedule.failures >= OFFLINE_AFTER_FAILURES;
}

/** Status HTTP + resposta lida → resultado que move a agenda (`nextSchedule`). */
export function fetchOutcome(status: number, usage: Usage | null): FetchOutcome {
  if (status === 200) return usage ? 'ok' : 'malformed';
  if (status === 429) return 'rate-limited';
  if (status === 401 || status === 403) return 'unauthorized';
  return 'failure';
}

// O endpoint do Claude lê o formato `claude-cli/<versão> (external, cli)` do
// User-Agent (ai-usagebar, src/anthropic/fetch.rs); a versão é uma publicada.
const CLAUDE_USER_AGENT = 'claude-cli/2.1.281 (external, cli)';

export interface UsageRequest {
  url: string;
  headers: Record<string, string>;
}

/** GET do uso de cada provedor (specs/12-uso-ia.md "Provedores"). */
export function usageRequest(provider: ProviderId, credential: Credential): UsageRequest {
  if (provider === 'claude') {
    return {
      url: 'https://api.anthropic.com/api/oauth/usage',
      headers: {
        Authorization: `Bearer ${credential.token}`,
        'anthropic-beta': 'oauth-2025-04-20',
        'User-Agent': CLAUDE_USER_AGENT,
      },
    };
  }
  const headers: Record<string, string> = { Authorization: `Bearer ${credential.token}` };
  if (credential.accountId) headers['ChatGPT-Account-Id'] = credential.accountId;
  headers['User-Agent'] = 'codex-cli';
  return { url: 'https://chatgpt.com/backend-api/wham/usage', headers };
}
