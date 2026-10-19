// Fusos do feed (`VTIMEZONE`). O V4 do QML não tem `Intl`, então o nome do
// fuso (`TZID=America/Sao_Paulo`) não resolve sozinho: o deslocamento sai das
// regras que o próprio feed carrega (o Google inclui o VTIMEZONE de cada
// TZID usado).
import { parseRule, ruleWallsInYear } from './icsRecurrence.mjs';
import { findProp } from './icsParse.mjs';
import { msToParts, parseWallValue } from './icsWall.mjs';
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
    return { onsetMs: onset.ms, offsetMin, fromMin, rule: rrule ? parseRule(rrule) : null };
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
        const observances = timezone.children
            .map(toObservance)
            .filter((o) => o !== null);
        zones.set(tzid, observances);
    }
    return zones;
}
/** Último início de `observance` até `wallMs`, ou `null` se ainda não começou. */
function latestOnset(observance, wallMs) {
    if (observance.onsetMs > wallMs)
        return null;
    if (!observance.rule)
        return observance.onsetMs;
    const start = msToParts(observance.onsetMs);
    const year = msToParts(wallMs).y;
    for (const candidateYear of [year, year - 1]) {
        const onsets = ruleWallsInYear(observance.rule, start, candidateYear).filter((wall) => wall >= observance.onsetMs && wall <= wallMs);
        if (onsets.length)
            return Math.max(...onsets);
    }
    return observance.onsetMs;
}
/** Deslocamento em minutos para UTC vigente em `wallMs` (relógio de parede do fuso). */
export function zoneOffsetMinutes(observances, wallMs) {
    var _a, _b;
    let best = null;
    for (const observance of observances) {
        const onset = latestOnset(observance, wallMs);
        if (onset !== null && (best === null || onset > best.onset))
            best = { onset, offsetMin: observance.offsetMin };
    }
    return best ? best.offsetMin : ((_b = (_a = observances[0]) === null || _a === void 0 ? void 0 : _a.fromMin) !== null && _b !== void 0 ? _b : 0);
}
