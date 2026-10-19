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
import { expandWalls, parseRule, type Rule } from './icsRecurrence.js';
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
}

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

function occurrenceWalls(vevent: IcsComponent, start: Moment, window: Window): number[] {
  const rrule = findProp(vevent, 'RRULE');
  const rule = rrule ? parseRule(rrule.value) : null;
  if (!rule) return [start.wallMs];
  const until = untilInstant(rule, start);
  const limit = until === null ? window.toMs : Math.min(window.toMs, until + 1);
  // O relógio de parede difere do instante em menos de um dia: longe do limite nem converte.
  const pastEnd = (wall: number) => wall >= limit - 2 * DAY_MS && start.toInstant(wall) >= limit;
  // Sem COUNT a varredura começa perto da janela, não no início da série (anos atrás).
  return expandWalls(rule, start.wallMs, pastEnd, window.fromMs - 2 * DAY_MS);
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
    summary: unescapeText(findProp(vevent, 'SUMMARY')?.value ?? ''),
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
  for (const wall of occurrenceWalls(master, start, context)) {
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
  };
  const vevents = calendar.children.filter((child) => child.name === 'VEVENT');
  const overrides = vevents.filter((e) => findProp(e, 'RECURRENCE-ID'));
  const replaced = new Set(overrides.map((e) => replacedKey(e, zones)));
  const series = vevents
    .filter((e) => !findProp(e, 'RECURRENCE-ID'))
    .reduce<CalendarEvent[]>(
      (all, master) => all.concat(seriesEvents(master, replaced, context)),
      [],
    );
  const edited = overrides
    .map((e) => overrideEvent(e, context))
    .filter((e): e is CalendarEvent => e !== null);
  return series.concat(edited);
}
