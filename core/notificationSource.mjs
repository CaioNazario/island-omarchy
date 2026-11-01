// Origem de uma notificação: o site, para notificação web, ou o app nativo
// (specs/04-notificacoes.md "Identificação da origem").
// Chave sem `www.`; o subdomínio mais específico casa primeiro.
const WEB_SERVICES = {
    'music.youtube.com': { name: 'YouTube Music', glyph: 'youtube-logo-fill' },
    'youtube.com': { name: 'YouTube', glyph: 'youtube-logo-fill' },
    'open.spotify.com': { name: 'Spotify', glyph: 'spotify-logo-fill' },
    'web.whatsapp.com': { name: 'WhatsApp', glyph: 'whatsapp-logo-fill' },
};
const UNKNOWN_SITE_GLYPH = 'globe';
// Chromium e derivados põem o domínio na primeira linha do corpo, seguido de
// uma linha em branco (spike S1, payloads do Brave e do Chrome). O Firefox
// não manda a origem em nenhum campo, então fica como app.
const CHROMIUM_BROWSERS = new Set(['Brave', 'Google Chrome', 'Chromium']);
/** App de navegador, identificando o site ou não (o `notif` dele fecha mais cedo, specs/04-notificacoes.md). */
export function isBrowserApp(appName) {
    return CHROMIUM_BROWSERS.has(appName) || appName === 'Firefox';
}
// Sem a Public Suffix List inteira: só os sufixos de segundo nível comuns, o
// bastante para `globo.com.br` virar "Globo" e não "Com".
const SECOND_LEVEL_SUFFIXES = new Set([
    'com.br',
    'net.br',
    'org.br',
    'gov.br',
    'edu.br',
    'co.uk',
    'org.uk',
    'ac.uk',
    'com.au',
    'co.jp',
    'com.ar',
    'com.mx',
]);
const HOST_WITH_PORT = /^([a-z0-9-]+(?:\.[a-z0-9-]+)+)(?::\d+)?$/i;
// Com `body-markup`, o domínio pode vir dentro de um `<a>`.
function hostFromLine(line) {
    var _a;
    const host = (_a = HOST_WITH_PORT.exec(line.replace(/<[^>]*>/g, '').trim())) === null || _a === void 0 ? void 0 : _a[1];
    return host ? host.toLowerCase().replace(/^www\./, '') : null;
}
function knownService(host) {
    const labels = host.split('.');
    for (let start = 0; start < labels.length - 1; start++) {
        const service = WEB_SERVICES[labels.slice(start).join('.')];
        if (service)
            return service;
    }
    return null;
}
function registrableLabel(host) {
    var _a;
    const labels = host.split('.');
    const suffixLength = SECOND_LEVEL_SUFFIXES.has(labels.slice(-2).join('.')) ? 2 : 1;
    return (_a = labels[Math.max(0, labels.length - suffixLength - 1)]) !== null && _a !== void 0 ? _a : host;
}
function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}
export function identifySource(appName, body) {
    const asApp = { name: appName, glyph: null, body };
    if (!CHROMIUM_BROWSERS.has(appName))
        return asApp;
    const [firstLine, ...rest] = body.split('\n');
    const host = hostFromLine(firstLine !== null && firstLine !== void 0 ? firstLine : '');
    if (!host)
        return asApp;
    const shownBody = rest.join('\n').replace(/^\n+/, '');
    const service = knownService(host);
    if (service)
        return Object.assign(Object.assign({}, service), { body: shownBody });
    return { name: capitalize(registrableLabel(host)), glyph: UNKNOWN_SITE_GLYPH, body: shownBody };
}
/**
 * Nome do ícone simbólico do tema para o `appIcon` da notificação, ou vazio. O
 * nome vem de quem manda a notificação: caminho (qualquer `/`, `../`) e
 * `file:` ficam de fora, e a UI usa o sino.
 */
export function themeIconName(appIcon) {
    if (appIcon === '' || appIcon.includes('/') || appIcon.startsWith('file:'))
        return '';
    return appIcon.endsWith('-symbolic') ? appIcon : `${appIcon}-symbolic`;
}
