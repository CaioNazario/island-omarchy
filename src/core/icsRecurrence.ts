// Expansão de `RRULE` (RFC 5545 §3.3.10) no relógio de parede (`icsWall.ts`).
// Suporta DAILY/WEEKLY/MONTHLY/YEARLY com INTERVAL, COUNT, UNTIL, BYDAY (com
// ordinal), BYMONTHDAY e BYMONTH. Não suporta BYSETPOS, BYWEEKNO, BYYEARDAY,
// WKST (a semana sempre começa na segunda) nem frequências abaixo de dia: uma
// regra assim vira `null` ou é ignorada, e o evento aparece só na primeira vez.
//
// O feed é de terceiros e a expansão roda na thread da UI do shell: listas
// com valor impossível (`99MO`, `BYMONTHDAY=32`) invalidam a regra, valores
// repetidos entram uma vez só, a varredura para no fim da janela mesmo
// quando um período não gera data, e o orçamento do feed conta o trabalho
// de cada período, não só os períodos (revisão do marketplace, #13501).

import { DAY_MS, daysInMonth, msToParts, type WallParts } from './icsWall.js';

export type RuleFreq = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface DayRule {
  /** 0 = todos os dias da semana naquele mês; 1, 2… = o enésimo; -1 = o último. */
  ord: number;
  /** 0 = domingo, como `Date#getUTCDay`. */
  day: number;
}

export interface Rule {
  freq: RuleFreq;
  interval: number;
  count: number | null;
  /** Valor cru de UNTIL (`AAAAMMDD[THHMMSS[Z]]`): quem sabe o fuso o converte. */
  until: string | null;
  byDay: DayRule[];
  byMonthDay: number[];
  byMonth: number[];
}

const FREQS: readonly string[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
/** Teto de períodos varridos: uma regra que nunca casa (30 de fevereiro) termina. */
const MAX_PERIODS = 20_000;

/**
 * Trabalho que ainda pode ser feito, compartilhado entre as séries de um feed:
 * com COUNT não há salto até a janela, e muitas séries antigas somariam
 * segundos na thread da UI. Cada período gasta o custo dele (`periodCost`)
 * mais as datas que gerou: contar só períodos deixava um YEARLY com os 12
 * meses e os 77 BYDAY custar milhares de checagens por período.
 */
export interface ExpansionBudget {
  steps: number;
}

/** O ordinal conta dentro do mês (`weekdayDays`): um mês tem no máximo 5 de cada dia. */
const MAX_WEEKDAY_ORD = 5;

/** Valores de uma lista `BY*`, sem repetição; um valor inválido invalida a lista (`null`). */
function parseList<T>(
  value: string | undefined,
  read: (part: string) => T | null,
  key: (item: T) => string,
): T[] | null {
  if (value === undefined) return [];
  const items = new Map<string, T>();
  for (const part of value.split(',')) {
    const item = read(part.trim());
    if (item === null) return null;
    items.set(key(item), item);
  }
  return Array.from(items.values());
}

function readDayRule(part: string): DayRule | null {
  const match = /^([+-]?\d{1,2})?(SU|MO|TU|WE|TH|FR|SA)$/.exec(part);
  if (!match) return null;
  const ord = match[1] ? parseInt(match[1], 10) : 0;
  if ((match[1] && ord === 0) || Math.abs(ord) > MAX_WEEKDAY_ORD) return null;
  return { ord, day: WEEKDAYS.indexOf(match[2] ?? '') };
}

/** Inteiro de `-max` a `max`, sem o zero (BYMONTHDAY), ou de 1 a `max` (BYMONTH). */
function intReader(max: number, negative: boolean): (part: string) => number | null {
  return (part) => {
    if (!/^[+-]?\d{1,2}$/.test(part)) return null;
    const n = parseInt(part, 10);
    if (n === 0 || n > max || n < (negative ? -max : 1)) return null;
    return n;
  };
}

export function parseRule(value: string): Rule | null {
  const fields = new Map<string, string>();
  for (const part of value.split(';')) {
    const eq = part.indexOf('=');
    if (eq > 0) fields.set(part.slice(0, eq).toUpperCase(), part.slice(eq + 1));
  }
  const freq = fields.get('FREQ') ?? '';
  if (!FREQS.includes(freq)) return null;
  const count = parseInt(fields.get('COUNT') ?? '', 10);
  const byDay = parseList(fields.get('BYDAY'), readDayRule, (r) => `${r.ord}${r.day}`);
  const byMonthDay = parseList(fields.get('BYMONTHDAY'), intReader(31, true), String);
  const byMonth = parseList(fields.get('BYMONTH'), intReader(12, false), String);
  if (!byDay || !byMonthDay || !byMonth) return null;
  return {
    freq: freq as RuleFreq,
    interval: Math.max(1, parseInt(fields.get('INTERVAL') ?? '1', 10) || 1),
    count: isNaN(count) ? null : count,
    until: fields.get('UNTIL') ?? null,
    byDay,
    byMonthDay,
    byMonth: byMonth.map((month) => month - 1),
  };
}

function timeOfDayMs(start: WallParts): number {
  return (start.h * 3600 + start.mi * 60 + start.s) * 1000;
}

/**
 * Marca em `picked` os dias do mês que o item do BYDAY escolhe (ordinal 0 =
 * todos os dias daquela semana). O primeiro sai da aritmética e os seguintes
 * vêm de 7 em 7: varrer o mês dia a dia custava 31 `Date` por item do BYDAY,
 * e um feed hostil tem 77 itens. O ordinal vira um índice, sem lista.
 */
function markWeekday(picked: boolean[], firstWeekday: number, total: number, rule: DayRule): void {
  const first = 1 + ((rule.day - firstWeekday + 7) % 7);
  const count = Math.floor((total - first) / 7) + 1;
  if (rule.ord === 0) {
    for (let i = 0; i < count; i++) picked[first + 7 * i] = true;
    return;
  }
  const index = rule.ord > 0 ? rule.ord - 1 : count + rule.ord;
  if (index >= 0 && index < count) picked[first + 7 * index] = true;
}

/**
 * Dias do mês em ordem, sem repetição. Marcar e ler de 1 a `total` evita
 * `Set`, `sort` e uma lista por item do BYDAY, que no V4 do QML custavam ~30×
 * o Node. Um BYMONTHDAY negativo além do início do mês (`-31` em fevereiro)
 * fica fora: o V4 em módulo (estrito) lança `TypeError` ao escrever fora de
 * um `Uint8Array`, onde o Node ignora.
 */
function monthDays(rule: Rule, year: number, month: number, fallbackDay: number): number[] {
  const total = daysInMonth(year, month);
  const picked = new Array<boolean>(32).fill(false);
  if (rule.byMonthDay.length) {
    for (const d of rule.byMonthDay) picked[Math.max(0, d > 0 ? d : total + d + 1)] = true;
  } else if (rule.byDay.length) {
    const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
    for (const dayRule of rule.byDay) markWeekday(picked, firstWeekday, total, dayRule);
  } else picked[fallbackDay] = true;
  const days: number[] = [];
  for (let d = 1; d <= total; d++) if (picked[d]) days.push(d);
  return days;
}

/** Ocorrências do mês; cada dia é uma soma ao dia 1 (UTC não tem horário de verão), sem `Date.UTC` por dia. */
function monthWalls(rule: Rule, start: WallParts, year: number, month: number): number[] {
  const first = msToParts(Date.UTC(year, month, 1));
  const base = Date.UTC(first.y, first.m, 1) + timeOfDayMs(start) - DAY_MS;
  return monthDays(rule, first.y, first.m, start.d).map((d) => base + d * DAY_MS);
}

/** Ocorrências do ano `year` (também usado pelas regras de horário de verão do VTIMEZONE). */
export function ruleWallsInYear(rule: Rule, start: WallParts, year: number): number[] {
  const months = rule.byMonth.length ? rule.byMonth : [start.m];
  const walls: number[] = [];
  for (const month of months) walls.push(...monthWalls(rule, start, year, month));
  return walls;
}

function limitedBy(rule: Rule, wall: number): boolean {
  // Sem listas, nada a conferir: montar as partes da data a cada dia pesava no V4.
  if (!rule.byMonth.length && !rule.byMonthDay.length && !rule.byDay.length) return true;
  const parts = msToParts(wall);
  const weekday = new Date(wall).getUTCDay();
  if (rule.byMonth.length && !rule.byMonth.includes(parts.m)) return false;
  if (rule.byMonthDay.length && !rule.byMonthDay.includes(parts.d)) return false;
  return !rule.byDay.length || rule.byDay.some((r) => r.day === weekday);
}

function dailyWalls(rule: Rule, start: WallParts, step: number): number[] {
  const wall = Date.UTC(start.y, start.m, start.d + step) + timeOfDayMs(start);
  return limitedBy(rule, wall) ? [wall] : [];
}

function weeklyWalls(rule: Rule, start: WallParts, step: number): number[] {
  const startDay = new Date(Date.UTC(start.y, start.m, start.d)).getUTCDay();
  const sinceMonday = (startDay + 6) % 7;
  const monday = Date.UTC(start.y, start.m, start.d + 7 * step - sinceMonday);
  const offsets = rule.byDay.length ? rule.byDay.map((r) => (r.day + 6) % 7) : [sinceMonday];
  return offsets
    .sort((a, b) => a - b)
    .map((offset) => monday + offset * DAY_MS + timeOfDayMs(start))
    .filter((wall) => !rule.byMonth.length || rule.byMonth.includes(msToParts(wall).m));
}

/** Meia-noite do primeiro dia do período `k`: nenhuma ocorrência dele vem antes. */
function periodStart(rule: Rule, start: WallParts, k: number): number {
  const step = k * rule.interval;
  if (rule.freq === 'DAILY') return Date.UTC(start.y, start.m, start.d + step);
  if (rule.freq === 'MONTHLY') return Date.UTC(start.y, start.m + step, 1);
  if (rule.freq === 'YEARLY') return Date.UTC(start.y + step, 0, 1);
  const sinceMonday = (new Date(Date.UTC(start.y, start.m, start.d)).getUTCDay() + 6) % 7;
  return Date.UTC(start.y, start.m, start.d + 7 * step - sinceMonday);
}

function periodWalls(rule: Rule, start: WallParts, k: number): number[] {
  const step = k * rule.interval;
  if (rule.freq === 'DAILY') return dailyWalls(rule, start, step);
  if (rule.freq === 'WEEKLY') return weeklyWalls(rule, start, step);
  if (rule.freq === 'YEARLY') return ruleWallsInYear(rule, start, start.y + step);
  const month = msToParts(Date.UTC(start.y, start.m + step, 1)).m;
  return rule.byMonth.length && !rule.byMonth.includes(month)
    ? []
    : monthWalls(rule, start, start.y, start.m + step);
}

/**
 * Passos para montar um período: cada mês varrido custa 1 mais um por item
 * das listas `BY*`, que é o que `monthDays` e `limitedBy` percorrem.
 */
export function periodCost(rule: Rule): number {
  const months = rule.freq === 'YEARLY' ? Math.max(1, rule.byMonth.length) : 1;
  const lists = rule.byMonth.length + rule.byDay.length + rule.byMonthDay.length;
  return months * (1 + lists);
}

/** Maior duração de um período da frequência, em ms (mês = 31 dias, ano = 366). */
function longestPeriodMs(rule: Rule): number {
  const days = { DAILY: 1, WEEKLY: 7, MONTHLY: 31, YEARLY: 366 }[rule.freq];
  return days * rule.interval * DAY_MS;
}

/**
 * Primeiro período que pode ter ocorrência em `fromMs` ou depois. Conservador:
 * a folga de 8 dias cobre o BYDAY da semana e o dia da semana do início, e o
 * período mais longo nunca pula um período que ainda alcançaria a janela. Com
 * COUNT não há salto, porque as anteriores contam.
 */
function firstPeriod(rule: Rule, startMs: number, fromMs: number): number {
  if (rule.count !== null) return 0;
  const skippable = (fromMs - startMs - 8 * DAY_MS) / longestPeriodMs(rule);
  return Math.max(0, Math.floor(skippable) - 1);
}

/**
 * Ocorrências (relógio de parede) a partir de `startMs`, em ordem, até
 * `pastEnd` dizer que passou do fim (UNTIL ou fim da janela) ou o COUNT
 * acabar. COUNT conta desde o início, então as anteriores à janela vêm
 * junto: o chamador filtra. Sem COUNT, o laço começa perto de `fromMs`
 * (relógio de parede) e devolve só ocorrências a partir daí, aproximadamente.
 */
export function expandWalls(
  rule: Rule,
  startMs: number,
  pastEnd: (wallMs: number) => boolean,
  fromMs: number = startMs,
  budget: ExpansionBudget = { steps: Infinity },
): number[] {
  const start = msToParts(startMs);
  const cost = periodCost(rule);
  const out: number[] = [];
  for (let k = firstPeriod(rule, startMs, fromMs); k < MAX_PERIODS && budget.steps > 0; k++) {
    // Um período que começa depois do fim acaba a série, gere data ou não.
    if (pastEnd(periodStart(rule, start, k))) return out;
    const walls = periodWalls(rule, start, k);
    budget.steps -= cost + walls.length;
    for (const wall of walls) {
      if (wall < startMs) continue;
      if (pastEnd(wall)) return out;
      out.push(wall);
      if (rule.count !== null && out.length >= rule.count) return out;
    }
  }
  return out;
}
