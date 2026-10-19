// Árvore de componentes do iCalendar (RFC 5545): o texto de um feed ICS vira
// `VCALENDAR > VEVENT/VTIMEZONE > propriedades`. Sem `Intl` nem `TextDecoder`
// (spec 14, S5): só texto já decodificado.
/** Linha que começa com espaço ou tab continua a anterior (RFC 5545 §3.1). */
export function unfoldLines(text) {
    const lines = [];
    for (const raw of text.split(/\r?\n/)) {
        const last = lines.pop();
        if (last !== undefined && /^[ \t]/.test(raw))
            lines.push(last + raw.slice(1));
        else {
            if (last !== undefined)
                lines.push(last);
            if (raw !== '')
                lines.push(raw);
        }
    }
    return lines;
}
function valueColon(line) {
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"')
            quoted = !quoted;
        else if (line[i] === ':' && !quoted)
            return i;
    }
    return -1;
}
function parseParams(parts) {
    const params = {};
    for (const part of parts) {
        const eq = part.indexOf('=');
        if (eq > 0)
            params[part.slice(0, eq).toUpperCase()] = part.slice(eq + 1).replace(/^"|"$/g, '');
    }
    return params;
}
export function parseProperty(line) {
    const colon = valueColon(line);
    if (colon < 1)
        return null;
    const [name = '', ...rawParams] = line.slice(0, colon).split(';');
    return { name: name.toUpperCase(), params: parseParams(rawParams), value: line.slice(colon + 1) };
}
/** Raiz sintética `ROOT`: um feed válido tem um `VCALENDAR` como filho. */
export function parseIcs(text) {
    var _a;
    const root = { name: 'ROOT', props: [], children: [] };
    const stack = [root];
    for (const line of unfoldLines(text)) {
        const prop = parseProperty(line);
        const top = (_a = stack[stack.length - 1]) !== null && _a !== void 0 ? _a : root;
        if (!prop)
            continue;
        if (prop.name === 'BEGIN') {
            const child = { name: prop.value.toUpperCase(), props: [], children: [] };
            top.children.push(child);
            stack.push(child);
        }
        else if (prop.name === 'END') {
            if (stack.length > 1)
                stack.pop();
        }
        else
            top.props.push(prop);
    }
    return root;
}
/** Texto escapado do ICS (`\n`, `\,`, `\;`, `\\`); quebra de linha vira espaço (a ilha não quebra linha). */
export function unescapeText(value) {
    return value.replace(/\\([nN,;\\])/g, (_all, char) => char === 'n' || char === 'N' ? ' ' : char);
}
export function findProp(component, name) {
    return component.props.find((prop) => prop.name === name);
}
