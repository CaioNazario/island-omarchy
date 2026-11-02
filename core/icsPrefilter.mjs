// O V4 do QML é cerca de 7× mais lento que o Node e o parser roda na thread da
// UI: um feed do Google com anos de histórico (milhares de eventos) levava ~1s
// para virar árvore. Quase tudo isso está a anos da janela, então os blocos
// `VEVENT` que certamente não a tocam saem do texto antes de `parseIcs`. Na
// dúvida o bloco fica: recorrente, ocorrência editada, `DURATION` ou datas que
// o filtro não lê.
// Ancorados no começo da linha: uma descrição dobrada que cite "BEGIN:VEVENT"
// começa a continuação com espaço e não corta o texto.
const BEGIN = '\nBEGIN:VEVENT';
const END = '\nEND:VEVENT';
const MARGIN_MS = 2 * 24 * 60 * 60 * 1000;
function dayKey(ms) {
    const date = new Date(ms);
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}
/** `AAAAMMDD` da propriedade (qualquer parâmetro ou hora); sem ela → `null`. */
function dateOf(block, name) {
    var _a;
    const match = new RegExp(`(?:^|\\n)${name}[^:\\r\\n]*:(\\d{8})`).exec(block);
    return match ? ((_a = match[1]) !== null && _a !== void 0 ? _a : null) : null;
}
function isAlwaysKept(block) {
    return /\n(?:RRULE|RECURRENCE-ID|DURATION)[;:]/.test(block);
}
/** Só `true` com certeza: o evento termina antes de `fromKey` ou começa depois de `toKey`. */
function isFarOutside(block, fromKey, toKey) {
    var _a;
    if (isAlwaysKept(block))
        return false;
    const start = dateOf(block, 'DTSTART');
    if (start === null)
        return false;
    if (start > toKey)
        return true;
    const end = (_a = dateOf(block, 'DTEND')) !== null && _a !== void 0 ? _a : start;
    return end < fromKey && start < fromKey;
}
/**
 * Teto de `VEVENT` que passam para o parser. Evento simples não gasta o
 * orçamento da recorrência (icsEvents.ts), e 100 mil no mesmo dia cabem nos
 * 10 MB: levavam ~10 s no V4 do QML. Um feed real fica bem abaixo (sobram as
 * séries, as ocorrências editadas e os eventos perto da janela); acima do
 * teto, os seguintes são descartados (revisão do marketplace, #13501).
 */
export const MAX_FEED_EVENTS = 10000;
/** `text` sem os `VEVENT` que certamente não tocam [`from`, `to`), com no máximo `MAX_FEED_EVENTS`. */
export function dropFarEvents(text, from, to) {
    var _a;
    const parts = text.split(BEGIN);
    const fromKey = dayKey(from.getTime() - MARGIN_MS);
    const toKey = dayKey(to.getTime() + MARGIN_MS);
    const out = [(_a = parts[0]) !== null && _a !== void 0 ? _a : ''];
    let kept = 0;
    for (const part of parts.slice(1)) {
        const end = part.indexOf(END);
        const keep = end < 0 || !isFarOutside(part.slice(0, end), fromKey, toKey);
        if (keep && kept++ < MAX_FEED_EVENTS)
            out.push(BEGIN + part);
        else if (end >= 0)
            out.push(part.slice(end + END.length));
    }
    return out.join('');
}
