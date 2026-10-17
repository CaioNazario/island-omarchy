// Origem de uma notificação: o site, para notificação web, ou o app nativo
// (specs/04-notificacoes.md "Identificação da origem").

export interface NotificationSourceInfo {
  /** "YouTube", "Twitch" ou o nome do app nativo. */
  name: string;
  /** Glifo Phosphor do site; `null` usa o ícone do app. */
  glyph: string | null;
  /** Corpo sem a linha do domínio. */
  body: string;
}

interface WebService {
  name: string;
  glyph: string;
}

// Chave sem `www.`; o subdomínio mais específico casa primeiro.
const WEB_SERVICES: Readonly<Record<string, WebService>> = {
  'music.youtube.com': { name: 'YouTube Music', glyph: 'youtube-logo-fill' },
  'youtube.com': { name: 'YouTube', glyph: 'youtube-logo-fill' },
  'open.spotify.com': { name: 'Spotify', glyph: 'spotify-logo-fill' },
  'web.whatsapp.com': { name: 'WhatsApp', glyph: 'whatsapp-logo-fill' },
};

const UNKNOWN_SITE_GLYPH = 'globe';

// Chromium e derivados põem o domínio na primeira linha do corpo, seguido de
// uma linha em branco (spike S1, payloads do Brave e do Chrome). O Firefox
// não manda a origem em nenhum campo, então fica como app.
const CHROMIUM_BROWSERS: ReadonlySet<string> = new Set(['Brave', 'Google Chrome', 'Chromium']);

/** App de navegador, identificando o site ou não (o `notif` dele fecha mais cedo, specs/04-notificacoes.md). */
export function isBrowserApp(appName: string): boolean {
  return CHROMIUM_BROWSERS.has(appName) || appName === 'Firefox';
}

// Sem a Public Suffix List inteira: só os sufixos de segundo nível comuns, o
// bastante para `globo.com.br` virar "Globo" e não "Com".
const SECOND_LEVEL_SUFFIXES: ReadonlySet<string> = new Set([
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
function hostFromLine(line: string): string | null {
  const host = HOST_WITH_PORT.exec(line.replace(/<[^>]*>/g, '').trim())?.[1];
  return host ? host.toLowerCase().replace(/^www\./, '') : null;
}

function knownService(host: string): WebService | null {
  const labels = host.split('.');
  for (let start = 0; start < labels.length - 1; start++) {
    const service = WEB_SERVICES[labels.slice(start).join('.')];
    if (service) return service;
  }
  return null;
}

function registrableLabel(host: string): string {
  const labels = host.split('.');
  const suffixLength = SECOND_LEVEL_SUFFIXES.has(labels.slice(-2).join('.')) ? 2 : 1;
  return labels[Math.max(0, labels.length - suffixLength - 1)] ?? host;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function identifySource(appName: string, body: string): NotificationSourceInfo {
  const asApp: NotificationSourceInfo = { name: appName, glyph: null, body };
  if (!CHROMIUM_BROWSERS.has(appName)) return asApp;

  const [firstLine, ...rest] = body.split('\n');
  const host = hostFromLine(firstLine ?? '');
  if (!host) return asApp;

  const shownBody = rest.join('\n').replace(/^\n+/, '');
  const service = knownService(host);
  if (service) return { ...service, body: shownBody };
  return { name: capitalize(registrableLabel(host)), glyph: UNKNOWN_SITE_GLYPH, body: shownBody };
}
