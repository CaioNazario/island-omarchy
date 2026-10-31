// Tokens por dia e por modelo do modo `ai` (specs/12-uso-ia.md "Tokens"),
// lidos dos registros que `omarchy-agent-usage-update` grava em
// ~/.local/state/omarchy/agents/usage/<agente>.json, como o widget de agentes do
// Omarchy (/usr/share/omarchy/shell/plugins/agents). Formatação e nomes dos
// modelos seguem o `Main.qml` de lá. Os limites de sessão e semanal também
// vêm do registro (o coletor do Claude consulta o endpoint OAuth de uso).
import { msg, tr, weekdayShort } from './i18n.mjs';
function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function count(value) {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
function parseDays(value) {
    if (!Array.isArray(value))
        return [];
    // `messageCount` guarda os tokens do dia (o painel do Omarchy lê assim).
    return value
        .filter(isObject)
        .map((day) => { var _a; return ({ date: String((_a = day.date) !== null && _a !== void 0 ? _a : ''), tokens: count(day.messageCount) }); });
}
function parseModels(value) {
    if (!isObject(value))
        return [];
    return Object.entries(value)
        .filter((entry) => isObject(entry[1]))
        .map(([id, bucket]) => ({
        id,
        tokens: count(bucket.inputTokens) +
            count(bucket.outputTokens) +
            count(bucket.cacheReadInputTokens) +
            count(bucket.cacheCreationInputTokens),
    }))
        .sort((a, b) => b.tokens - a.tokens);
}
function parseWindow(entry) {
    if (typeof entry.percent !== 'number' || !Number.isFinite(entry.percent))
        return null;
    const resetsAt = typeof entry.resetsAt === 'string' ? Date.parse(entry.resetsAt) : NaN;
    return { percent: entry.percent * 100, resetsAt: Number.isNaN(resetsAt) ? null : resetsAt };
}
/** Pelo rótulo ("Session (5-hour)", "Weekly (7-day)"), nunca pela posição. */
function findWindow(limits, pattern) {
    if (!Array.isArray(limits))
        return null;
    const entry = limits.filter(isObject).find((limit) => { var _a; return pattern.test(String((_a = limit.label) !== null && _a !== void 0 ? _a : '')); });
    return entry ? parseWindow(entry) : null;
}
function statusText(data, hasLimits) {
    if (typeof data.usageStatusText === 'string' && data.usageStatusText !== '')
        return data.usageStatusText;
    if (!hasLimits && typeof data.authHelpText === 'string' && data.authHelpText !== '') {
        // Texto do core: a UI traduz `status` na hora de mostrar.
        return msg('Log in to the CLI to see the limits');
    }
    return '';
}
export function parseAgentRecord(text) {
    let data;
    try {
        data = JSON.parse(text);
    }
    catch (_a) {
        return null;
    }
    if (!isObject(data))
        return null;
    const updatedAt = typeof data.updatedAt === 'string' ? Date.parse(data.updatedAt) : NaN;
    const session = findWindow(data.limits, /session|5-hour/i);
    const weekly = findWindow(data.limits, /weekly|7-day/i);
    return {
        plan: typeof data.tierLabel === 'string' ? data.tierLabel : '',
        updatedAt: Number.isNaN(updatedAt) ? 0 : updatedAt,
        days: parseDays(data.recentDays),
        models: parseModels(data.modelUsage),
        session,
        weekly,
        status: statusText(data, session !== null || weekly !== null),
    };
}
export function formatTokens(tokens) {
    if (tokens >= 1e9)
        return (tokens / 1e9).toFixed(1) + 'B';
    if (tokens >= 1e6)
        return (tokens / 1e6).toFixed(1) + 'M';
    if (tokens >= 1e3)
        return (tokens / 1e3).toFixed(1) + 'K';
    return String(tokens);
}
function wordCase(word) {
    if (word === 'gpt')
        return 'GPT';
    if (word === 'deepseek')
        return 'DeepSeek';
    return word.charAt(0).toUpperCase() + word.slice(1);
}
/** `claude-opus-4-8` → `Opus 4.8`, `gpt-5.6-sol` → `GPT 5.6 Sol`. */
export function friendlyModelName(id) {
    const parts = id
        .replace(/^claude-/, '')
        .replace(/-\d{8}$/, '')
        .split('-');
    const words = [];
    let version = [];
    for (const part of parts) {
        if (part === '')
            continue;
        if (/^\d/.test(part)) {
            version.push(part);
            continue;
        }
        if (version.length > 0)
            words.push(version.join('.'));
        version = [];
        words.push(wordCase(part));
    }
    if (version.length > 0)
        words.push(version.join('.'));
    return words.length > 0 ? words.join(' ') : msg('Unknown');
}
/** Últimos 7 dias; o de hoje (data local `YYYY-MM-DD`) vira "Today" em destaque. */
export function dayRows(days, today, lang) {
    const last = days.slice(-7);
    const peak = Math.max(0, ...last.map((day) => day.tokens));
    return last.map((day) => {
        const isToday = day.date === today;
        const weekday = weekdayShort(lang, new Date(day.date + 'T12:00:00').getDay()) || day.date;
        return {
            label: isToday ? tr(lang, 'Today') : weekday,
            value: formatTokens(day.tokens),
            fraction: peak > 0 ? day.tokens / peak : 0,
            today: isToday,
        };
    });
}
export function modelRows(models) {
    const peak = Math.max(0, ...models.map((model) => model.tokens));
    return models.map((model) => ({
        name: friendlyModelName(model.id),
        value: formatTokens(model.tokens),
        fraction: peak > 0 ? model.tokens / peak : 0,
    }));
}
// Cartão: padding 10 + 12, topo 28 + 10, limites 46. Tokens por dia: divisor
// 12 + 1 + 10, rótulo 18, 7 × 22. Por modelo: divisor 23, rótulo 18 + 4,
// linhas de 30 com gap 4.
export function aiPanelHeight(parts) {
    const header = 24 + 26 + 6;
    if (parts.providers === 0)
        return header;
    const tabs = parts.providers > 1 ? 36 : 0;
    let card = 106;
    if (parts.days)
        card += 23 + 18 + 7 * 22;
    if (parts.models > 0)
        card += 23 + 22 + parts.models * 34 - 4;
    return header + tabs + card;
}
