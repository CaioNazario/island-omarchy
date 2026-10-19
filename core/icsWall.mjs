// Relógio de parede do ICS: "20261018T093000" vira `Date.UTC(...)` só como
// codificação (sem fuso). Quem sabe o fuso (`icsEvents.ts`) converte para o
// instante real; assim a recorrência soma dias no relógio de parede e uma
// reunião às 09:00 continua às 09:00 depois da mudança de horário.
export const DAY_MS = 86400000;
export function wallToMs(parts) {
    return Date.UTC(parts.y, parts.m, parts.d, parts.h, parts.mi, parts.s);
}
export function msToParts(ms) {
    const date = new Date(ms);
    return {
        y: date.getUTCFullYear(),
        m: date.getUTCMonth(),
        d: date.getUTCDate(),
        h: date.getUTCHours(),
        mi: date.getUTCMinutes(),
        s: date.getUTCSeconds(),
    };
}
export function daysInMonth(year, month) {
    return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}
const WALL_VALUE = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/;
/** `AAAAMMDD` ou `AAAAMMDDTHHMMSS[Z]`; outro formato → `null`. */
export function parseWallValue(value) {
    const match = WALL_VALUE.exec(value.trim());
    if (!match)
        return null;
    const [y, m, d, h, mi, s] = match
        .slice(1, 7)
        .map((part) => (part === undefined ? 0 : parseInt(part, 10)));
    const ms = Date.UTC(y !== null && y !== void 0 ? y : 0, (m !== null && m !== void 0 ? m : 1) - 1, d !== null && d !== void 0 ? d : 1, h, mi, s);
    return { ms, hasTime: match[4] !== undefined, utc: match[7] === 'Z' };
}
const DURATION = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/;
/** `P1D`, `PT1H30M`, `P1W`, `-PT15M` em ms; formato inesperado → `null`. */
export function parseDuration(value) {
    const match = DURATION.exec(value.trim());
    if (!match)
        return null;
    const [w = 0, d = 0, h = 0, m = 0, s = 0] = match
        .slice(2, 7)
        .map((part) => (part ? parseInt(part, 10) : 0));
    const ms = (((w * 7 + d) * 24 + h) * 60 + m) * 60000 + s * 1000;
    return match[1] === '-' ? -ms : ms;
}
