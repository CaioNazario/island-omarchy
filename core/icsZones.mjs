// Fusos do feed (`VTIMEZONE`). O V4 do QML não tem `Intl`, então o nome do
// fuso (`TZID=America/Sao_Paulo`) não resolve sozinho: o deslocamento sai das
// regras que o próprio feed carrega (o Google inclui o VTIMEZONE de cada
// TZID usado).
//
// O VTIMEZONE também é de terceiros, e cada conversão de horário de cada
// evento percorre as observâncias do fuso: regras mais pesadas que uma de
// horário de verão descartam a observância, um fuso guarda no máximo as
// `MAX_OBSERVANCES` mais recentes, e os inícios são calculados uma vez por
// forma de ano (`YearShape`), não por ano (revisão do marketplace, #13501).
import { parseRule, periodCost, ruleWallsInYear } from './icsRecurrence.mjs';
import { findProp } from './icsParse.mjs';
import { daysInMonth, msToParts, parseWallValue } from './icsWall.mjs';
/**
 * Uma regra de horário de verão escolhe um dia por ano: `BYMONTH=3;BYDAY=2SU`
 * custa 3 passos (`periodCost`), a forma antiga `BYMONTHDAY=8,…,14;BYDAY=SU`
 * custa 10. Uma regra mais pesada não é fuso, é feed hostil.
 */
const MAX_ZONE_RULE_COST = 10;
/** O Google traz 2 observâncias por fuso; exportações com histórico, algumas dezenas. */
const MAX_OBSERVANCES = 32;
/** `-0300`, `+0530`, `-030000` em minutos; formato inesperado → `null`. */
export function parseOffsetMinutes(value) {
    var _a, _b;
    const match = /^([+-])(\d{2})(\d{2})(?:\d{2})?$/.exec(value.trim());
    if (!match)
        return null;
    const minutes = parseInt((_a = match[2]) !== null && _a !== void 0 ? _a : '0', 10) * 60 + parseInt((_b = match[3]) !== null && _b !== void 0 ? _b : '0', 10);
    return match[1] === '-' ? -minutes : minutes;
}
function toObservance(component) {
    var _a, _b, _c, _d, _e, _f, _g;
    const onset = parseWallValue((_b = (_a = findProp(component, 'DTSTART')) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : '');
    const offsetMin = parseOffsetMinutes((_d = (_c = findProp(component, 'TZOFFSETTO')) === null || _c === void 0 ? void 0 : _c.value) !== null && _d !== void 0 ? _d : '');
    const fromMin = parseOffsetMinutes((_f = (_e = findProp(component, 'TZOFFSETFROM')) === null || _e === void 0 ? void 0 : _e.value) !== null && _f !== void 0 ? _f : '');
    if (!onset || offsetMin === null || fromMin === null)
        return null;
    const rrule = (_g = findProp(component, 'RRULE')) === null || _g === void 0 ? void 0 : _g.value;
    const rule = rrule ? parseRule(rrule) : null;
    if (rule && periodCost(rule) > MAX_ZONE_RULE_COST)
        return null;
    return { onsetMs: onset.ms, offsetMin, fromMin, rule, onsetsByShape: new Map() };
}
/** Observâncias válidas em ordem de início, só as `MAX_OBSERVANCES` mais recentes. */
function zoneObservances(timezone) {
    return timezone.children
        .map(toObservance)
        .filter((o) => o !== null)
        .sort((a, b) => a.onsetMs - b.onsetMs)
        .slice(-MAX_OBSERVANCES);
}
/** `TZID` → observâncias de todos os `VTIMEZONE` do `VCALENDAR`. */
export function parseZones(root) {
    var _a;
    const zones = new Map();
    const calendars = root.children.filter((child) => child.name === 'VCALENDAR');
    for (const timezone of calendars.reduce((all, c) => all.concat(c.children), [])) {
        const tzid = (_a = findProp(timezone, 'TZID')) === null || _a === void 0 ? void 0 : _a.value;
        if (timezone.name !== 'VTIMEZONE' || !tzid)
            continue;
        zones.set(tzid, zoneObservances(timezone));
    }
    return zones;
}
function yearShape(year) {
    const startMs = Date.UTC(year, 0, 1);
    const leap = daysInMonth(year, 1) === 29 ? 7 : 0;
    return { year, key: leap + new Date(startMs).getUTCDay(), startMs };
}
/** Inícios de `rule` num ano da forma `shape`, em ms desde o 1º de janeiro. */
function onsetsInShape(observance, rule, shape) {
    const cached = observance.onsetsByShape.get(shape.key);
    if (cached)
        return cached;
    const walls = ruleWallsInYear(rule, msToParts(observance.onsetMs), shape.year);
    const onsets = walls.map((wall) => wall - shape.startMs);
    observance.onsetsByShape.set(shape.key, onsets);
    return onsets;
}
/** Maior início do ano `shape` em [`fromMs`, `toMs`], ou `null`. Laço sem `filter`: roda para cada observância em cada conversão. */
function latestIn(shape, onsets, fromMs, toMs) {
    let latest = null;
    for (const offset of onsets) {
        const wall = shape.startMs + offset;
        if (wall >= fromMs && wall <= toMs && (latest === null || wall > latest))
            latest = wall;
    }
    return latest;
}
/** Último início de `observance` até `wallMs` (`shapes`: o ano dele e o anterior), ou `null` se ainda não começou. */
function latestOnset(observance, wallMs, shapes) {
    if (observance.onsetMs > wallMs)
        return null;
    const rule = observance.rule;
    if (!rule)
        return observance.onsetMs;
    for (const shape of shapes) {
        const onset = latestIn(shape, onsetsInShape(observance, rule, shape), observance.onsetMs, wallMs);
        if (onset !== null)
            return onset;
    }
    return observance.onsetMs;
}
/** Deslocamento em minutos para UTC vigente em `wallMs` (relógio de parede do fuso). */
export function zoneOffsetMinutes(observances, wallMs) {
    var _a, _b;
    const year = msToParts(wallMs).y;
    const shapes = [yearShape(year), yearShape(year - 1)];
    let best = null;
    for (const observance of observances) {
        const onset = latestOnset(observance, wallMs, shapes);
        if (onset !== null && (best === null || onset > best.onset))
            best = { onset, offsetMin: observance.offsetMin };
    }
    return best ? best.offsetMin : ((_b = (_a = observances[0]) === null || _a === void 0 ? void 0 : _a.fromMin) !== null && _b !== void 0 ? _b : 0);
}
