import { tr } from './i18n.mjs';
// Clima da ilha compacta (specs/07-clima.md): exibição, resposta do
// Open-Meteo e a localização.
/** Falha de rede: o último valor vale por até 3h; depois o clima some. */
export const READING_TTL_MS = 3 * 60 * 60 * 1000;
/** Teto das respostas do Open-Meteo e do wttr.in (~50 KB): o `curl` recusa o resto. */
export const MAX_RESPONSE_BYTES = 1024 * 1024;
/** °C arredondado, sem casa decimal: `22°`. */
export function formatTemperature(celsius) {
    // `Math.round(-0.4)` é `-0`, que viraria `-0°`.
    return `${Math.round(celsius) || 0}°`;
}
export function isFresh(reading, now) {
    return now - reading.receivedAt <= READING_TTL_MS;
}
function parseJson(text) {
    try {
        return JSON.parse(text);
    }
    catch (_a) {
        return null;
    }
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
/** Bloco `current` da resposta do Open-Meteo; formato inesperado → `null`. */
export function parseOpenMeteoCurrent(body) {
    const root = parseJson(body);
    if (!isRecord(root) || !isRecord(root.current))
        return null;
    const { temperature_2m: celsius, weather_code: code, is_day: isDay } = root.current;
    if (typeof celsius !== 'number' || typeof code !== 'number')
        return null;
    return { celsius, code, isDay: isDay !== 0 };
}
/** O nome vem de fora (wttr.in, ipwho.is): fica curto, nunca é exibido inteiro. */
const MAX_AREA_NAME = 100;
function coordinate(value, limit) {
    const number = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof number !== 'number' || !Number.isFinite(number))
        return null;
    return Math.abs(number) <= limit ? number : null;
}
/**
 * `{name, latitude, longitude}`: o formato do `weather.json` do Omarchy
 * (`omarchy-weather-location`) e da cidade das preferências da Island. Sem
 * coordenadas válidas → `null`: aí vale o nome (`parseWeatherName`) ou a
 * detecção pela IP do wttr.in, como no Omarchy.
 */
export function parseWeatherLocation(text) {
    const root = parseJson(text);
    if (!isRecord(root))
        return null;
    const latitude = coordinate(root.latitude, 90);
    const longitude = coordinate(root.longitude, 180);
    if (latitude === null || longitude === null)
        return null;
    return { name: typeof root.name === 'string' ? root.name : '', latitude, longitude };
}
export function openMeteoUrl(location) {
    return ('https://api.open-meteo.com/v1/forecast' +
        `?latitude=${location.latitude}&longitude=${location.longitude}` +
        '&current=temperature_2m,weather_code,is_day&temperature_unit=celsius');
}
/** O nome do `weather.json`, que sozinho também serve ao Omarchy; '' sem nome. */
export function parseWeatherName(text) {
    const root = parseJson(text);
    return isRecord(root) && typeof root.name === 'string' ? root.name.trim() : '';
}
/**
 * Consulta do wttr.in como a do painel de clima do Omarchy: pelo nome, ou
 * vazia para detectar o lugar pela IP (o que o Omarchy faz sem `weather.json`).
 */
export function wttrUrl(name) {
    return `https://wttr.in/${encodeURIComponent(name)}?format=j1`;
}
/** `nearest_area[0]` do `format=j1`: as coordenadas que o Omarchy passa ao Open-Meteo. */
export function parseWttrArea(body) {
    const root = parseJson(body);
    if (!isRecord(root) || !Array.isArray(root.nearest_area))
        return null;
    const area = root.nearest_area[0];
    if (!isRecord(area))
        return null;
    const latitude = coordinate(area.latitude, 90);
    const longitude = coordinate(area.longitude, 180);
    if (latitude === null || longitude === null)
        return null;
    const names = Array.isArray(area.areaName) ? area.areaName : [];
    const first = names[0];
    const name = isRecord(first) && typeof first.value === 'string' ? first.value : '';
    return { name: name.slice(0, MAX_AREA_NAME), latitude, longitude };
}
/**
 * O wttr.in devolve a área a cada atualização: com as mesmas coordenadas, o
 * lugar não mudou e a leitura atual continua valendo.
 */
export function sameLocation(a, b) {
    if (a === null || b === null)
        return a === b;
    return a.latitude === b.latitude && a.longitude === b.longitude;
}
export const IP_GEO_URL = 'https://ipwho.is/';
/** Resposta do ipwho.is (`success`, `latitude`, `longitude`, `city`); falha → `null`. */
export function parseIpGeo(body) {
    const root = parseJson(body);
    if (!isRecord(root) || root.success === false)
        return null;
    const latitude = coordinate(root.latitude, 90);
    const longitude = coordinate(root.longitude, 180);
    if (latitude === null || longitude === null)
        return null;
    return {
        name: typeof root.city === 'string' ? root.city.slice(0, MAX_AREA_NAME) : '',
        latitude,
        longitude,
    };
}
export function areaSources(name) {
    const sources = [{ url: wttrUrl(name), parse: parseWttrArea }];
    if (name === '')
        sources.push({ url: IP_GEO_URL, parse: parseIpGeo });
    return sources;
}
export function weatherOrigin(preferred, omarchy, detected) {
    if (preferred)
        return 'island';
    if (omarchy)
        return 'omarchy';
    return detected ? 'auto' : 'none';
}
/** Cidades que a busca por nome devolve, no máximo (spec 13 "Clima"). */
export const MAX_SEARCH_RESULTS = 20;
/** Geocodificação do Open-Meteo, sem chave, como o resto do clima. */
export function geocodingUrl(query) {
    return ('https://geocoding-api.open-meteo.com/v1/search' +
        `?name=${encodeURIComponent(query.trim())}&count=${MAX_SEARCH_RESULTS}&language=en&format=json`);
}
function textPart(value) {
    return typeof value === 'string' ? value.trim().slice(0, MAX_AREA_NAME) : '';
}
/** `results` do geocoding; item sem nome ou coordenadas válidas é descartado. */
export function parseGeocoding(body) {
    const root = parseJson(body);
    if (!isRecord(root) || !Array.isArray(root.results))
        return [];
    const cities = [];
    for (const item of root.results.slice(0, MAX_SEARCH_RESULTS)) {
        if (!isRecord(item))
            continue;
        const name = textPart(item.name);
        const latitude = coordinate(item.latitude, 90);
        const longitude = coordinate(item.longitude, 180);
        if (name === '' || latitude === null || longitude === null)
            continue;
        const parts = [name, textPart(item.admin1), textPart(item.country)].filter((part, i, all) => part !== '' && all.indexOf(part) === i);
        cities.push({ label: parts.join(', '), location: { name, latitude, longitude } });
    }
    return cities;
}
/**
 * A dica "Configure sua cidade" (spec 07): só uma vez, e só se a cadeia
 * inteira falhou sem cidade nenhuma.
 */
export function shouldShowHint(hintShown, origin, detectionFailed) {
    return !hintShown && origin === 'none' && detectionFailed;
}
/** Texto da notificação de dica, no idioma da interface. */
export function hintMessage(lang) {
    return {
        title: tr(lang, 'Weather'),
        body: tr(lang, "Couldn't find your city. Click to choose one."),
    };
}
/** Rodadas seguidas de detecção que alcançaram um servidor e mesmo assim não deram cidade. */
export const HINT_AFTER_ROUNDS = 2;
/**
 * O `curl` falou com um servidor? Saída 0 (resposta) ou 22 (`-f`: erro HTTP)
 * sim; DNS (6), conexão (7), tempo esgotado (28) e TLS não: sem rede não é
 * "cidade desconhecida" e não gasta a dica (spec 07).
 */
export function reachedServer(exitCode) {
    return exitCode === 0 || exitCode === 22;
}
