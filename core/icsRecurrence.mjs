// Expansão de `RRULE` (RFC 5545 §3.3.10) no relógio de parede (`icsWall.ts`).
// Suporta DAILY/WEEKLY/MONTHLY/YEARLY com INTERVAL, COUNT, UNTIL, BYDAY (com
// ordinal), BYMONTHDAY e BYMONTH. Não suporta BYSETPOS, BYWEEKNO, BYYEARDAY,
// WKST (a semana sempre começa na segunda) nem frequências abaixo de dia: uma
// regra assim vira `null` ou é ignorada, e o evento aparece só na primeira vez.
import { DAY_MS, daysInMonth, msToParts } from './icsWall.mjs';
const FREQS = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
/** Teto de períodos varridos: uma regra que nunca casa (30 de fevereiro) termina. */
const MAX_PERIODS = 20000;
function parseDayRules(value) {
    var _a;
    const rules = [];
    for (const part of (value !== null && value !== void 0 ? value : '').split(',')) {
        const match = /^([+-]?\d{1,2})?(SU|MO|TU|WE|TH|FR|SA)$/.exec(part.trim());
        if (match)
            rules.push({
                ord: match[1] ? parseInt(match[1], 10) : 0,
                day: WEEKDAYS.indexOf((_a = match[2]) !== null && _a !== void 0 ? _a : ''),
            });
    }
    return rules;
}
function parseInts(value) {
    return (value !== null && value !== void 0 ? value : '')
        .split(',')
        .map((part) => parseInt(part, 10))
        .filter((n) => !isNaN(n));
}
export function parseRule(value) {
    var _a, _b, _c, _d;
    const fields = new Map();
    for (const part of value.split(';')) {
        const eq = part.indexOf('=');
        if (eq > 0)
            fields.set(part.slice(0, eq).toUpperCase(), part.slice(eq + 1));
    }
    const freq = (_a = fields.get('FREQ')) !== null && _a !== void 0 ? _a : '';
    if (!FREQS.includes(freq))
        return null;
    const count = parseInt((_b = fields.get('COUNT')) !== null && _b !== void 0 ? _b : '', 10);
    return {
        freq: freq,
        interval: Math.max(1, parseInt((_c = fields.get('INTERVAL')) !== null && _c !== void 0 ? _c : '1', 10) || 1),
        count: isNaN(count) ? null : count,
        until: (_d = fields.get('UNTIL')) !== null && _d !== void 0 ? _d : null,
        byDay: parseDayRules(fields.get('BYDAY')),
        byMonthDay: parseInts(fields.get('BYMONTHDAY')),
        byMonth: parseInts(fields.get('BYMONTH')).map((month) => month - 1),
    };
}
function timeOfDayMs(start) {
    return (start.h * 3600 + start.mi * 60 + start.s) * 1000;
}
/** Dias do mês que o BYDAY escolhe (ordinal 0 = todos os dias daquela semana). */
function weekdayDays(year, month, rule) {
    const total = daysInMonth(year, month);
    const matching = [];
    for (let d = 1; d <= total; d++) {
        if (new Date(Date.UTC(year, month, d)).getUTCDay() === rule.day)
            matching.push(d);
    }
    if (rule.ord === 0)
        return matching;
    const picked = rule.ord > 0 ? matching[rule.ord - 1] : matching[matching.length + rule.ord];
    return picked === undefined ? [] : [picked];
}
function monthDays(rule, year, month, fallbackDay) {
    const total = daysInMonth(year, month);
    let days = [fallbackDay];
    if (rule.byMonthDay.length)
        days = rule.byMonthDay.map((d) => (d > 0 ? d : total + d + 1));
    else if (rule.byDay.length)
        days = rule.byDay.reduce((all, r) => all.concat(weekdayDays(year, month, r)), []);
    return Array.from(new Set(days))
        .filter((d) => d >= 1 && d <= total)
        .sort((a, b) => a - b);
}
function monthWalls(rule, start, year, month) {
    const first = msToParts(Date.UTC(year, month, 1));
    const time = timeOfDayMs(start);
    return monthDays(rule, first.y, first.m, start.d).map((d) => Date.UTC(first.y, first.m, d) + time);
}
/** Ocorrências do ano `year` (também usado pelas regras de horário de verão do VTIMEZONE). */
export function ruleWallsInYear(rule, start, year) {
    const months = rule.byMonth.length ? rule.byMonth : [start.m];
    return months.reduce((all, month) => all.concat(monthWalls(rule, start, year, month)), []);
}
function limitedBy(rule, wall) {
    const parts = msToParts(wall);
    const weekday = new Date(wall).getUTCDay();
    if (rule.byMonth.length && !rule.byMonth.includes(parts.m))
        return false;
    if (rule.byMonthDay.length && !rule.byMonthDay.includes(parts.d))
        return false;
    return !rule.byDay.length || rule.byDay.some((r) => r.day === weekday);
}
function dailyWalls(rule, start, step) {
    const wall = Date.UTC(start.y, start.m, start.d + step) + timeOfDayMs(start);
    return limitedBy(rule, wall) ? [wall] : [];
}
function weeklyWalls(rule, start, step) {
    const startDay = new Date(Date.UTC(start.y, start.m, start.d)).getUTCDay();
    const sinceMonday = (startDay + 6) % 7;
    const monday = Date.UTC(start.y, start.m, start.d + 7 * step - sinceMonday);
    const offsets = rule.byDay.length ? rule.byDay.map((r) => (r.day + 6) % 7) : [sinceMonday];
    return offsets
        .sort((a, b) => a - b)
        .map((offset) => monday + offset * DAY_MS + timeOfDayMs(start))
        .filter((wall) => !rule.byMonth.length || rule.byMonth.includes(msToParts(wall).m));
}
function periodWalls(rule, start, k) {
    const step = k * rule.interval;
    if (rule.freq === 'DAILY')
        return dailyWalls(rule, start, step);
    if (rule.freq === 'WEEKLY')
        return weeklyWalls(rule, start, step);
    if (rule.freq === 'YEARLY')
        return ruleWallsInYear(rule, start, start.y + step);
    const month = msToParts(Date.UTC(start.y, start.m + step, 1)).m;
    return rule.byMonth.length && !rule.byMonth.includes(month)
        ? []
        : monthWalls(rule, start, start.y, start.m + step);
}
/** Maior duração de um período da frequência, em ms (mês = 31 dias, ano = 366). */
function longestPeriodMs(rule) {
    const days = { DAILY: 1, WEEKLY: 7, MONTHLY: 31, YEARLY: 366 }[rule.freq];
    return days * rule.interval * DAY_MS;
}
/**
 * Primeiro período que pode ter ocorrência em `fromMs` ou depois. Conservador:
 * a folga de 8 dias cobre o BYDAY da semana e o dia da semana do início, e o
 * período mais longo nunca pula um período que ainda alcançaria a janela. Com
 * COUNT não há salto, porque as anteriores contam.
 */
function firstPeriod(rule, startMs, fromMs) {
    if (rule.count !== null)
        return 0;
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
export function expandWalls(rule, startMs, pastEnd, fromMs = startMs) {
    const start = msToParts(startMs);
    const out = [];
    for (let k = firstPeriod(rule, startMs, fromMs); k < MAX_PERIODS; k++) {
        for (const wall of periodWalls(rule, start, k)) {
            if (wall < startMs)
                continue;
            if (pastEnd(wall))
                return out;
            out.push(wall);
            if (rule.count !== null && out.length >= rule.count)
                return out;
        }
    }
    return out;
}
