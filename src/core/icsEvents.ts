// Eventos de um feed ICS dentro de uma janela de tempo, no formato do
// `CalendarEvent` (calendar.ts). Cuida do que o Google põe no feed: fusos
// (`TZID` com `VTIMEZONE`), dia inteiro, recorrência (`RRULE`), `EXDATE`,
// ocorrências editadas ou canceladas (`RECURRENCE-ID`). Não suporta `RDATE`
// nem as partes não suportadas do RRULE (icsRecurrence.ts).

import type { CalendarEvent } from './calendar.js';
import {
  findProp,
  parseIcs,
  unescapeText,
  type IcsComponent,
  type IcsProperty,
} from './icsParse.js';
import { dropFarEvents } from './icsPrefilter.js';
import { expandWalls, parseRule, type ExpansionBudget, type Rule } from './icsRecurrence.js';
import { DAY_MS, msToParts, parseDuration, parseWallValue } from './icsWall.js';
import { parseZones, zoneOffsetMinutes, type Observance } from './icsZones.js';

type Zones = Map<string, Observance[]>;

interface Moment {
  wallMs: number;
  allDay: boolean;
  /** Relógio de parede → instante real (ms). */
  toInstant: (wallMs: number) => number;
}

/** Janela pedida, em ms de instante. */
interface Window {
  fromMs: number;
  toMs: number;
}

interface Context extends Window {
  zones: Zones;
  calendarId: string;
  budget: ExpansionBudget;
}

/**
 * Passos de recorrência que um feed inteiro pode gastar (`ExpansionBudget`).
 * Medido no V4 do QML (o motor do shell, 15–30× mais lento que o Node), com
 * 1000 séries hostis de cada formato de regra: o pior gasta tudo em ~0,16 s,
 * mais ~55 ms para ler o feed. Contando períodos, 5 séries YEARLY com todos
 * os meses e BYDAY levavam ~16 s. Um feed real gasta poucos: sem COUNT a
 * varredura salta até a janela. Esgotado, as séries seguintes param e os
 * eventos simples continuam.
 */
const FEED_STEP_BUDGET = 150_000;

/**
 * Teto do nome de um evento. O nome vai para um `Text` e um `TextMetrics`
 * (TodayEvents.qml) toda vez que a lista se refaz, a cada minuto, e o custo
 * cresce com o texto: 1 milhão de caracteres levava ~0,8 s no QML. A ilha
 * mostra uma linha; 200 caracteres sobram.
 */
export const MAX_SUMMARY_CHARS = 200;

// Sem fuso (flutuante) e dia inteiro valem no relógio local da máquina.
function localInstant(wallMs: number): number {
  const p = msToParts(wallMs);
  return new Date(p.y, p.m, p.d, p.h, p.mi, p.s).getTime();
}

function instantResolver(
  prop: IcsProperty,
  utc: boolean,
  zones: Zones,
): (wallMs: number) => number {
  if (utc) return (wallMs) => wallMs;
  const zone = zones.get(prop.params.TZID ?? '');
  if (!zone) return localInstant;
  return (wallMs) => wallMs - zoneOffsetMinutes(zone, wallMs) * 60_000;
}

function momentOf(prop: IcsProperty | undefined, zones: Zones): Moment | null {
  const wall = prop ? parseWallValue(prop.value) : null;
  if (!prop || !wall) return null;
  const allDay = !wall.hasTime;
  return {
    wallMs: wall.ms,
    allDay,
    toInstant: allDay ? localInstant : instantResolver(prop, wall.utc, zones),
  };
}

/** Dia inteiro mede em relógio de parede (um dia continua dia na mudança de horário); com hora, em ms reais. */
function durationOf(vevent: IcsComponent, start: Moment, zones: Zones): number {
  const end = momentOf(findProp(vevent, 'DTEND'), zones);
  if (end && start.allDay) return Math.max(0, end.wallMs - start.wallMs);
  if (end) return Math.max(0, end.toInstant(end.wallMs) - start.toInstant(start.wallMs));
  const explicit = parseDuration(findProp(vevent, 'DURATION')?.value ?? '');
  if (explicit !== null) return Math.max(0, explicit);
  return start.allDay ? DAY_MS : 0;
}

function untilInstant(rule: Rule, start: Moment): number | null {
  const until = rule.until ? parseWallValue(rule.until) : null;
  if (!until) return null;
  if (until.utc) return until.ms;
  return start.toInstant(until.hasTime ? until.ms : until.ms + DAY_MS - 1);
}

function occurrenceWalls(vevent: IcsComponent, start: Moment, context: Context): number[] {
  const rrule = findProp(vevent, 'RRULE');
  // Orçamento esgotado: a série não gera nada, e ler uma regra longa custaria por série.
  if (rrule && context.budget.steps <= 0) return [];
  const rule = rrule ? parseRule(rrule.value) : null;
  if (!rule) return [start.wallMs];
  const until = untilInstant(rule, start);
  const limit = until === null ? context.toMs : Math.min(context.toMs, until + 1);
  // O relógio de parede difere do instante em menos de um dia: longe do limite nem converte.
  const pastEnd = (wall: number) => wall >= limit - 2 * DAY_MS && start.toInstant(wall) >= limit;
  // Sem COUNT a varredura começa perto da janela, não no início da série (anos atrás).
  return expandWalls(rule, start.wallMs, pastEnd, context.fromMs - 2 * DAY_MS, context.budget);
}

/**
 * Com COUNT a série vem desde o início: o que termina antes da janela (com a
 * folga do relógio de parede) nem passa pela conversão de fuso.
 */
function windowWalls(
  vevent: IcsComponent,
  start: Moment,
  durationMs: number,
  context: Context,
): number[] {
  const earliest = context.fromMs - durationMs - 2 * DAY_MS;
  return occurrenceWalls(vevent, start, context).filter((wall) => wall >= earliest);
}

function exdateInstants(vevent: IcsComponent, zones: Zones): Set<number> {
  const instants = new Set<number>();
  for (const prop of vevent.props.filter((p) => p.name === 'EXDATE')) {
    for (const value of prop.value.split(',')) {
      const moment = momentOf({ name: prop.name, params: prop.params, value }, zones);
      if (moment) instants.add(moment.toInstant(moment.wallMs));
    }
  }
  return instants;
}

function overlapsWindow(startMs: number, endMs: number, context: Context): boolean {
  if (startMs >= context.toMs) return false;
  return endMs > context.fromMs || (startMs === endMs && startMs >= context.fromMs);
}

function eventAt(
  vevent: IcsComponent,
  start: Moment,
  durationMs: number,
  wall: number,
  context: Context,
): CalendarEvent | null {
  const startMs = start.toInstant(wall);
  const endMs = start.allDay ? start.toInstant(wall + durationMs) : startMs + durationMs;
  if (!overlapsWindow(startMs, endMs, context)) return null;
  const uid = findProp(vevent, 'UID')?.value ?? '';
  return {
    id: `${context.calendarId}\n${uid}\n${startMs}`,
    summary: unescapeText(findProp(vevent, 'SUMMARY')?.value ?? '').slice(0, MAX_SUMMARY_CHARS),
    start: new Date(startMs),
    end: new Date(endMs),
  };
}

function isCancelled(vevent: IcsComponent): boolean {
  return (findProp(vevent, 'STATUS')?.value ?? '').toUpperCase() === 'CANCELLED';
}

function replacedKey(override: IcsComponent, zones: Zones): string {
  const moment = momentOf(findProp(override, 'RECURRENCE-ID'), zones);
  return `${findProp(override, 'UID')?.value ?? ''}|${moment ? moment.toInstant(moment.wallMs) : ''}`;
}

function seriesEvents(
  master: IcsComponent,
  replaced: Set<string>,
  context: Context,
): CalendarEvent[] {
  const start = momentOf(findProp(master, 'DTSTART'), context.zones);
  if (!start || isCancelled(master)) return [];
  const duration = durationOf(master, start, context.zones);
  const skipped = exdateInstants(master, context.zones);
  const uid = findProp(master, 'UID')?.value ?? '';
  const found: CalendarEvent[] = [];
  for (const wall of windowWalls(master, start, duration, context)) {
    const instant = start.toInstant(wall);
    if (skipped.has(instant) || replaced.has(`${uid}|${instant}`)) continue;
    const event = eventAt(master, start, duration, wall, context);
    if (event) found.push(event);
  }
  return found;
}

function overrideEvent(override: IcsComponent, context: Context): CalendarEvent | null {
  const start = momentOf(findProp(override, 'DTSTART'), context.zones);
  if (!start || isCancelled(override)) return null;
  return eventAt(
    override,
    start,
    durationOf(override, start, context.zones),
    start.wallMs,
    context,
  );
}

/** Eventos de `text` que tocam [`from`, `to`); texto que não é ICS → `[]`. */
export function parseIcsEvents(text: string, from: Date, to: Date): CalendarEvent[] {
  const root = parseIcs(dropFarEvents(text, from, to));
  const calendar = root.children.find((child) => child.name === 'VCALENDAR');
  if (!calendar) return [];
  const zones = parseZones(root);
  const context: Context = {
    zones,
    calendarId: findProp(calendar, 'X-WR-CALNAME')?.value || 'ics',
    fromMs: from.getTime(),
    toMs: to.getTime(),
    budget: { steps: FEED_STEP_BUDGET },
  };
  const vevents = calendar.children.filter((child) => child.name === 'VEVENT');
  const overrides = vevents.filter((e) => findProp(e, 'RECURRENCE-ID'));
  const replaced = new Set(overrides.map((e) => replacedKey(e, zones)));
  const found: CalendarEvent[] = [];
  for (const master of vevents.filter((e) => !findProp(e, 'RECURRENCE-ID')))
    for (const event of seriesEvents(master, replaced, context)) found.push(event);
  for (const override of overrides) {
    const event = overrideEvent(override, context);
    if (event) found.push(event);
  }
  return found;
}
