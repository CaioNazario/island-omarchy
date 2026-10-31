// Grade e eventos de hoje do calendário (specs/06-calendario.md; design/logic.js
// `calendar`, `calWeeks`, `todayLabel`, `events`).

import { formatClock, formatDay } from './clock.js';
import { monthName, tr, weekdayShort, type Language } from './i18n.js';

/** Semana começando na segunda, mês completo em semanas inteiras. */
export function weekdayHeaders(lang: Language): string[] {
  return [1, 2, 3, 4, 5, 6, 0].map((day) => weekdayShort(lang, day));
}

export type CalendarView = 'week' | 'month';
/** `today` vale mesmo fora do mês, como no design (`isToday` antes de `inMonth`). */
export type DayKind = 'today' | 'in-month' | 'outside';

export interface CalendarDay {
  day: number;
  kind: DayKind;
}

export interface MonthGrid {
  /** `September 2026` (`Setembro 2026`): capitalizado, sem "de". */
  title: string;
  weeks: CalendarDay[][];
  /** Linha mostrada em Semana: a de hoje no mês atual, a primeira nos outros. */
  weekIndex: number;
}

function sameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Mês a `offset` meses do de `today` (0 = atual). */
export function monthGrid(today: Date, offset: number, lang: Language): MonthGrid {
  const first = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const year = first.getFullYear();
  const month = first.getMonth();
  const lead = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cellCount = Math.ceil((lead + daysInMonth) / 7) * 7;

  const cells: CalendarDay[] = [];
  for (let i = 0; i < cellCount; i++) {
    const date = new Date(year, month, i - lead + 1);
    const kind: DayKind = sameDate(date, today)
      ? 'today'
      : date.getMonth() === month
        ? 'in-month'
        : 'outside';
    cells.push({ day: date.getDate(), kind });
  }
  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const todayWeek = weeks.findIndex((week) => week.some((d) => d.kind === 'today'));
  return {
    title: `${monthName(lang, month)} ${year}`,
    weeks,
    weekIndex: offset === 0 ? Math.max(0, todayWeek) : 0,
  };
}

export function visibleWeeks(grid: MonthGrid, view: CalendarView): CalendarDay[][] {
  return view === 'month' ? grid.weeks : grid.weeks.slice(grid.weekIndex, grid.weekIndex + 1);
}

// Eventos de hoje (specs/06-calendario.md, "Eventos").

/** Evento lido do feed ICS (`icsEvents.ts`). */
export interface CalendarEvent {
  /** `<id do calendário>\n<uid do evento>\n<início em ms>`. */
  id: string;
  summary: string;
  start: Date;
  end: Date;
}

/** Tokens da ilha para o ponto do evento, um por calendário de origem. */
export type EventDot = 'accent500' | 'accent300' | 'neutral400';
const EVENT_DOTS: readonly EventDot[] = ['accent500', 'accent300', 'neutral400'];
const MAX_TODAY_EVENTS = 10;

export interface TodayEvent {
  name: string;
  time: string;
  dot: EventDot;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Inclui eventos de duração zero.
function overlaps(event: CalendarEvent, begin: Date, end: Date): boolean {
  if (event.start >= begin && event.end < end) return true;
  return event.end > begin && event.start < end;
}

function isAllDay(event: CalendarEvent, dayBegin: Date, dayEnd: Date): boolean {
  return event.start <= dayBegin && event.end >= dayEnd;
}

function eventTime(event: CalendarEvent, dayBegin: Date, dayEnd: Date, lang: Language): string {
  if (isAllDay(event, dayBegin, dayEnd)) return tr(lang, 'All day');
  const start = formatClock(event.start);
  if (event.start.getTime() === event.end.getTime()) return start;
  return `${start} – ${formatClock(event.end)}`;
}

function sourceOf(event: CalendarEvent): string {
  return event.id.slice(0, event.id.indexOf('\n'));
}

/**
 * Eventos que tocam hoje, por início, no máximo 10; a cor gira pela ordem em
 * que cada calendário aparece.
 */
export function todayEvents(
  events: readonly CalendarEvent[],
  today: Date,
  lang: Language,
): TodayEvent[] {
  const dayBegin = startOfDay(today);
  const dayEnd = new Date(dayBegin.getFullYear(), dayBegin.getMonth(), dayBegin.getDate() + 1);
  const sources = new Map<string, EventDot>();

  return events
    .filter((event) => overlaps(event, dayBegin, dayEnd))
    .sort((a, b) => a.start.getTime() - b.start.getTime() || a.end.getTime() - b.end.getTime())
    .slice(0, MAX_TODAY_EVENTS)
    .map((event) => {
      const source = sourceOf(event);
      let dot = sources.get(source);
      if (!dot) {
        dot = EVENT_DOTS[sources.size % EVENT_DOTS.length]!;
        sources.set(source, dot);
      }
      return { name: event.summary, time: eventTime(event, dayBegin, dayEnd, lang), dot };
    });
}

export interface NextEventView {
  label: string;
  sub: string;
}

const SOON_MINUTES = 90;

/**
 * Widget Próximo evento (specs/16-widgets.md `event`): o primeiro evento de
 * hoje com hora (não "dia inteiro") que começa depois de `now`. O dia
 * inteiro começa às 00:00, então nunca começa depois de agora; sem próximo,
 * ele é a reserva.
 */
export function nextEvent(
  events: readonly CalendarEvent[],
  now: Date,
  lang: Language,
): NextEventView {
  const dayBegin = startOfDay(now);
  const dayEnd = new Date(dayBegin.getFullYear(), dayBegin.getMonth(), dayBegin.getDate() + 1);
  const byStart = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
  const next = byStart.find((event) => event.start > now && event.start < dayEnd);
  if (!next) {
    const allDay = byStart.find((event) => isAllDay(event, dayBegin, dayEnd));
    if (allDay) return { label: allDay.summary, sub: tr(lang, 'all day') };
    return { label: tr(lang, 'No events'), sub: tr(lang, 'today') };
  }

  const minutes = Math.ceil((next.start.getTime() - now.getTime()) / 60_000);
  const sub =
    minutes <= SOON_MINUTES ? tr(lang, 'in {n} min', { n: minutes }) : formatClock(next.start);
  return { label: next.summary, sub };
}

/** `Today, Fri 25`; em português `Hoje, sex, 25`, minúsculo como no design. */
export function todayTitle(today: Date, lang: Language): string {
  const day = formatDay(today, lang);
  const shown = lang === 'pt-BR' ? `${day.charAt(0).toLowerCase()}${day.slice(1)}` : day;
  return tr(lang, 'Today, {day}', { day: shown });
}
