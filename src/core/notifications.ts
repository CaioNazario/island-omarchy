// Roteamento de notificação nova e tempo relativo (specs/04-notificacoes.md;
// design/logic.js `pushNotif`, ~136).

import type { Mode } from './island.js';

/** `list`: só entra na lista, sem abrir `notif` nem banner. */
export type NotificationRoute = 'notif' | 'stack' | 'banner' | 'list';

export interface IncomingNotification {
  critical: boolean;
  low: boolean;
  /** Já reconhecida pelo Shell ao chegar (ex.: app residente com foco). */
  acknowledged: boolean;
  /** `showBanners` da política da fonte: "Não perturbe" + a opção por app. */
  bannersAllowed: boolean;
  /** Veio de um navegador (`isBrowserApp`). */
  fromBrowser: boolean;
}

export interface IslandSnapshot {
  mode: Mode;
  cardOpen: boolean;
}

// O Shell nunca mostra banner de notificação já reconhecida nem de urgência
// baixa (`_onNotificationRequestBanner`, js/ui/messageTray.js, 50.4).
function onlyInList(notification: IncomingNotification): boolean {
  if (notification.acknowledged || notification.low) return true;
  return !notification.bannersAllowed && !notification.critical;
}

export function routeNotification(
  notification: IncomingNotification,
  island: IslandSnapshot,
): NotificationRoute {
  if (onlyInList(notification)) return 'list';
  if (island.cardOpen) return 'banner';
  if (island.mode === 'compact' || island.mode === 'notif') return 'notif';
  if (island.mode === 'stack') return 'stack';
  return 'banner';
}

const MINUTE_MS = 60_000;

export function formatRelativeTime(elapsedMs: number): string {
  const minutes = Math.floor(elapsedMs / MINUTE_MS);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  return `há ${Math.floor(minutes / 60)} h`;
}

const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

const MAX_CODE_POINT = 0x10ffff;

// `body-markup` do protocolo: subconjunto de tags simples + entidades XML.
function stripMarkup(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (entity: string, code: string) => {
      if (code[0] !== '#') return NAMED_ENTITIES[code.toLowerCase()] ?? entity;
      const isHex = code[1] === 'x' || code[1] === 'X';
      const point = parseInt(code.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      // `fromCodePoint` lança fora do Unicode; uma exceção aqui chegaria ao Shell.
      return point <= MAX_CODE_POINT ? String.fromCodePoint(point) : entity;
    });
}

function singleLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Linha de texto do `notif`/`stack`/banner: "título: corpo", como `latest.text` no design. */
export function notificationText(
  appName: string,
  title: string,
  body: string,
  useBodyMarkup: boolean,
): string {
  const cleanTitle = singleLine(title);
  const cleanBody = singleLine(useBodyMarkup ? stripMarkup(body) : body);
  const shownTitle = cleanTitle === appName ? '' : cleanTitle;
  if (shownTitle && cleanBody) return `${shownTitle}: ${cleanBody}`;
  return shownTitle || cleanBody;
}
