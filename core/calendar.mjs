// Grade e eventos de hoje do calendário (specs/06-calendario.md; design/logic.js
// `calendar`, `calWeeks`, `todayLabel`, `events`).
import { formatClock, formatDay } from './clock.mjs';
import { monthName, tr, weekdayShort } from './i18n.mjs';
/** Semana começando na segunda, mês completo em semanas inteiras. */
export function weekdayHeaders(lang) {
    return [1, 2, 3, 4, 5, 6, 0].map((day) => weekdayShort(lang, day));
}
function sameDate(a, b) {
    return (a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate());
}
/** Mês a `offset` meses do de `today` (0 = atual). */
export function monthGrid(today, offset, lang) {
    const first = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const year = first.getFullYear();
    const month = first.getMonth();
    const lead = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cellCount = Math.ceil((lead + daysInMonth) / 7) * 7;
    const cells = [];
    for (let i = 0; i < cellCount; i++) {
        const date = new Date(year, month, i - lead + 1);
        const kind = sameDate(date, today)
            ? 'today'
            : date.getMonth() === month
                ? 'in-month'
                : 'outside';
        cells.push({ day: date.getDate(), kind });
    }
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7)
        weeks.push(cells.slice(i, i + 7));
    const todayWeek = weeks.findIndex((week) => week.some((d) => d.kind === 'today'));
    return {
        title: `${monthName(lang, month)} ${year}`,
        weeks,
        weekIndex: offset === 0 ? Math.max(0, todayWeek) : 0,
    };
}
export function visibleWeeks(grid, view) {
    return view === 'month' ? grid.weeks : grid.weeks.slice(grid.weekIndex, grid.weekIndex + 1);
}
const EVENT_DOTS = ['accent500', 'accent300', 'neutral400'];
const MAX_TODAY_EVENTS = 10;
function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
// Inclui eventos de duração zero.
function overlaps(event, begin, end) {
    if (event.start >= begin && event.end < end)
        return true;
    return event.end > begin && event.start < end;
}
function isAllDay(event, dayBegin, dayEnd) {
    return event.start <= dayBegin && event.end >= dayEnd;
}
function eventTime(event, dayBegin, dayEnd, lang) {
    if (isAllDay(event, dayBegin, dayEnd))
        return tr(lang, 'All day');
    const start = formatClock(event.start);
    if (event.start.getTime() === event.end.getTime())
        return start;
    return `${start} – ${formatClock(event.end)}`;
}
function sourceOf(event) {
    return event.id.slice(0, event.id.indexOf('\n'));
}
/**
 * Eventos que tocam hoje, por início, no máximo 10; a cor gira pela ordem em
 * que cada calendário aparece.
 */
export function todayEvents(events, today, lang) {
    const dayBegin = startOfDay(today);
    const dayEnd = new Date(dayBegin.getFullYear(), dayBegin.getMonth(), dayBegin.getDate() + 1);
    const sources = new Map();
    return events
        .filter((event) => overlaps(event, dayBegin, dayEnd))
        .sort((a, b) => a.start.getTime() - b.start.getTime() || a.end.getTime() - b.end.getTime())
        .slice(0, MAX_TODAY_EVENTS)
        .map((event) => {
        const source = sourceOf(event);
        let dot = sources.get(source);
        if (!dot) {
            dot = EVENT_DOTS[sources.size % EVENT_DOTS.length];
            sources.set(source, dot);
        }
        return { name: event.summary, time: eventTime(event, dayBegin, dayEnd, lang), dot };
    });
}
const SOON_MINUTES = 90;
/**
 * Widget Próximo evento (specs/16-widgets.md `event`): o primeiro evento de
 * hoje com hora (não "dia inteiro") que começa depois de `now`. O dia
 * inteiro começa às 00:00, então nunca começa depois de agora; sem próximo,
 * ele é a reserva.
 */
export function nextEvent(events, now, lang) {
    const dayBegin = startOfDay(now);
    const dayEnd = new Date(dayBegin.getFullYear(), dayBegin.getMonth(), dayBegin.getDate() + 1);
    const byStart = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
    const next = byStart.find((event) => event.start > now && event.start < dayEnd);
    if (!next) {
        const allDay = byStart.find((event) => isAllDay(event, dayBegin, dayEnd));
        if (allDay)
            return { label: allDay.summary, sub: tr(lang, 'all day') };
        return { label: tr(lang, 'No events'), sub: tr(lang, 'today') };
    }
    const minutes = Math.ceil((next.start.getTime() - now.getTime()) / 60000);
    const sub = minutes <= SOON_MINUTES ? tr(lang, 'in {n} min', { n: minutes }) : formatClock(next.start);
    return { label: next.summary, sub };
}
/** `Today, Fri 25`; em português `Hoje, sex, 25`, minúsculo como no design. */
export function todayTitle(today, lang) {
    const day = formatDay(today, lang);
    const shown = lang === 'pt-BR' ? `${day.charAt(0).toLowerCase()}${day.slice(1)}` : day;
    return tr(lang, 'Today, {day}', { day: shown });
}
