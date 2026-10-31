// Roteamento de notificação nova e tempo relativo (specs/04-notificacoes.md;
// design/logic.js `pushNotif`, ~136).
import { tr } from './i18n.mjs';
// Urgência baixa nunca mostra banner.
function onlyInList(notification) {
    if (notification.low)
        return true;
    return !notification.bannersAllowed && !notification.critical;
}
export function routeNotification(notification, island) {
    if (onlyInList(notification))
        return 'list';
    if (island.cardOpen)
        return 'banner';
    if (island.mode === 'compact' || island.mode === 'notif')
        return 'notif';
    if (island.mode === 'stack')
        return 'stack';
    return 'banner';
}
const MINUTE_MS = 60000;
export function formatRelativeTime(elapsedMs, lang) {
    const minutes = Math.floor(elapsedMs / MINUTE_MS);
    if (minutes < 1)
        return tr(lang, 'now');
    if (minutes < 60)
        return tr(lang, '{n} min ago', { n: minutes });
    return tr(lang, '{n} h ago', { n: Math.floor(minutes / 60) });
}
const NAMED_ENTITIES = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
};
const MAX_CODE_POINT = 0x10ffff;
// `body-markup` do protocolo: subconjunto de tags simples + entidades XML.
function stripMarkup(text) {
    return text
        .replace(/<[^>]*>/g, '')
        .replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (entity, code) => {
        var _a;
        if (code[0] !== '#')
            return (_a = NAMED_ENTITIES[code.toLowerCase()]) !== null && _a !== void 0 ? _a : entity;
        const isHex = code[1] === 'x' || code[1] === 'X';
        const point = parseInt(code.slice(isHex ? 2 : 1), isHex ? 16 : 10);
        // `fromCodePoint` lança fora do Unicode; uma exceção aqui chegaria ao shell.
        return point <= MAX_CODE_POINT ? String.fromCodePoint(point) : entity;
    });
}
function singleLine(text) {
    return text.replace(/\s+/g, ' ').trim();
}
/** Linha de texto do `notif`/`stack`/banner: "título: corpo", como `latest.text` no design. */
export function notificationText(appName, title, body, useBodyMarkup) {
    const cleanTitle = singleLine(title);
    const cleanBody = singleLine(useBodyMarkup ? stripMarkup(body) : body);
    const shownTitle = cleanTitle === appName ? '' : cleanTitle;
    if (shownTitle && cleanBody)
        return `${shownTitle}: ${cleanBody}`;
    return shownTitle || cleanBody;
}
