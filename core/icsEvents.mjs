// Eventos de um feed ICS dentro de uma janela de tempo, no formato do
// `CalendarEvent` (calendar.ts). Cuida do que o Google põe no feed: fusos
// (`TZID` com `VTIMEZONE`), dia inteiro, recorrência (`RRULE`), `EXDATE`,
// ocorrências editadas ou canceladas (`RECURRENCE-ID`). Não suporta `RDATE`
// nem as partes não suportadas do RRULE (icsRecurrence.ts).
import { findProp, parseIcs, unescapeText, } from './icsParse.mjs';
import { dropFarEvents } from './icsPrefilter.mjs';
import { expandWalls, parseRule } from './icsRecurrence.mjs';
import { DAY_MS, msToParts, parseDuration, parseWallValue } from './icsWall.mjs';
import { parseZones, zoneOffsetMinutes } from './icsZones.mjs';
/**
 * Períodos de recorrência que um feed inteiro pode varrer (~0,1 s no Node). Um
 * feed real gasta poucos: sem COUNT a varredura salta até a janela. Esgotado,
 * as séries seguintes param e os eventos simples continuam.
 */
const FEED_PERIOD_BUDGET = 100000;
// Sem fuso (flutuante) e dia inteiro valem no relógio local da máquina.
function localInstant(wallMs) {
    const p = msToParts(wallMs);
    return new Date(p.y, p.m, p.d, p.h, p.mi, p.s).getTime();
}
function instantResolver(prop, utc, zones) {
    var _a;
    if (utc)
        return (wallMs) => wallMs;
    const zone = zones.get((_a = prop.params.TZID) !== null && _a !== void 0 ? _a : '');
    if (!zone)
        return localInstant;
    return (wallMs) => wallMs - zoneOffsetMinutes(zone, wallMs) * 60000;
}
function momentOf(prop, zones) {
    const wall = prop ? parseWallValue(prop.value) : null;
    if (!prop || !wall)
        return null;
    const allDay = !wall.hasTime;
    return {
        wallMs: wall.ms,
        allDay,
        toInstant: allDay ? localInstant : instantResolver(prop, wall.utc, zones),
    };
}
/** Dia inteiro mede em relógio de parede (um dia continua dia na mudança de horário); com hora, em ms reais. */
function durationOf(vevent, start, zones) {
    var _a, _b;
    const end = momentOf(findProp(vevent, 'DTEND'), zones);
    if (end && start.allDay)
        return Math.max(0, end.wallMs - start.wallMs);
    if (end)
        return Math.max(0, end.toInstant(end.wallMs) - start.toInstant(start.wallMs));
    const explicit = parseDuration((_b = (_a = findProp(vevent, 'DURATION')) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : '');
    if (explicit !== null)
        return Math.max(0, explicit);
    return start.allDay ? DAY_MS : 0;
}
function untilInstant(rule, start) {
    const until = rule.until ? parseWallValue(rule.until) : null;
    if (!until)
        return null;
    if (until.utc)
        return until.ms;
    return start.toInstant(until.hasTime ? until.ms : until.ms + DAY_MS - 1);
}
function occurrenceWalls(vevent, start, context) {
    const rrule = findProp(vevent, 'RRULE');
    const rule = rrule ? parseRule(rrule.value) : null;
    if (!rule)
        return [start.wallMs];
    const until = untilInstant(rule, start);
    const limit = until === null ? context.toMs : Math.min(context.toMs, until + 1);
    // O relógio de parede difere do instante em menos de um dia: longe do limite nem converte.
    const pastEnd = (wall) => wall >= limit - 2 * DAY_MS && start.toInstant(wall) >= limit;
    // Sem COUNT a varredura começa perto da janela, não no início da série (anos atrás).
    return expandWalls(rule, start.wallMs, pastEnd, context.fromMs - 2 * DAY_MS, context.budget);
}
function exdateInstants(vevent, zones) {
    const instants = new Set();
    for (const prop of vevent.props.filter((p) => p.name === 'EXDATE')) {
        for (const value of prop.value.split(',')) {
            const moment = momentOf({ name: prop.name, params: prop.params, value }, zones);
            if (moment)
                instants.add(moment.toInstant(moment.wallMs));
        }
    }
    return instants;
}
function overlapsWindow(startMs, endMs, context) {
    if (startMs >= context.toMs)
        return false;
    return endMs > context.fromMs || (startMs === endMs && startMs >= context.fromMs);
}
function eventAt(vevent, start, durationMs, wall, context) {
    var _a, _b, _c, _d;
    const startMs = start.toInstant(wall);
    const endMs = start.allDay ? start.toInstant(wall + durationMs) : startMs + durationMs;
    if (!overlapsWindow(startMs, endMs, context))
        return null;
    const uid = (_b = (_a = findProp(vevent, 'UID')) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : '';
    return {
        id: `${context.calendarId}\n${uid}\n${startMs}`,
        summary: unescapeText((_d = (_c = findProp(vevent, 'SUMMARY')) === null || _c === void 0 ? void 0 : _c.value) !== null && _d !== void 0 ? _d : ''),
        start: new Date(startMs),
        end: new Date(endMs),
    };
}
function isCancelled(vevent) {
    var _a, _b;
    return ((_b = (_a = findProp(vevent, 'STATUS')) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : '').toUpperCase() === 'CANCELLED';
}
function replacedKey(override, zones) {
    var _a, _b;
    const moment = momentOf(findProp(override, 'RECURRENCE-ID'), zones);
    return `${(_b = (_a = findProp(override, 'UID')) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : ''}|${moment ? moment.toInstant(moment.wallMs) : ''}`;
}
function seriesEvents(master, replaced, context) {
    var _a, _b;
    const start = momentOf(findProp(master, 'DTSTART'), context.zones);
    if (!start || isCancelled(master))
        return [];
    const duration = durationOf(master, start, context.zones);
    const skipped = exdateInstants(master, context.zones);
    const uid = (_b = (_a = findProp(master, 'UID')) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : '';
    const found = [];
    for (const wall of occurrenceWalls(master, start, context)) {
        const instant = start.toInstant(wall);
        if (skipped.has(instant) || replaced.has(`${uid}|${instant}`))
            continue;
        const event = eventAt(master, start, duration, wall, context);
        if (event)
            found.push(event);
    }
    return found;
}
function overrideEvent(override, context) {
    const start = momentOf(findProp(override, 'DTSTART'), context.zones);
    if (!start || isCancelled(override))
        return null;
    return eventAt(override, start, durationOf(override, start, context.zones), start.wallMs, context);
}
/** Eventos de `text` que tocam [`from`, `to`); texto que não é ICS → `[]`. */
export function parseIcsEvents(text, from, to) {
    var _a;
    const root = parseIcs(dropFarEvents(text, from, to));
    const calendar = root.children.find((child) => child.name === 'VCALENDAR');
    if (!calendar)
        return [];
    const zones = parseZones(root);
    const context = {
        zones,
        calendarId: ((_a = findProp(calendar, 'X-WR-CALNAME')) === null || _a === void 0 ? void 0 : _a.value) || 'ics',
        fromMs: from.getTime(),
        toMs: to.getTime(),
        budget: { periods: FEED_PERIOD_BUDGET },
    };
    const vevents = calendar.children.filter((child) => child.name === 'VEVENT');
    const overrides = vevents.filter((e) => findProp(e, 'RECURRENCE-ID'));
    const replaced = new Set(overrides.map((e) => replacedKey(e, zones)));
    const series = vevents
        .filter((e) => !findProp(e, 'RECURRENCE-ID'))
        .reduce((all, master) => all.concat(seriesEvents(master, replaced, context)), []);
    const edited = overrides
        .map((e) => overrideEvent(e, context))
        .filter((e) => e !== null);
    return series.concat(edited);
}
