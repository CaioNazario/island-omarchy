import { tr, type Language } from './i18n.js';

// Quem cuida das notificações e do OSD (specs/04-notificacoes.md "Quem cuida
// das notificações"). A Island só assume com consentimento: ela lê o estado
// dos plugins do Omarchy e decide o que ligar.

/**
 * Os plugins do Omarchy que a Island substitui: respondem pelos mesmos alvos
 * IPC (`notifications`, `osd`) e, o primeiro, pelo nome D-Bus
 * `org.freedesktop.Notifications` (specs/14-spikes.md, S7).
 */
export const REPLACED_PLUGIN_IDS = ['omarchy.notifications', 'omarchy.osd'] as const;

/**
 * `builtin`: o Omarchy cuida e a Island é só barra. `island`: ela cuida.
 * `unknown`: a lista ainda não chegou; ela não assume nada até saber.
 */
export type TakeoverStatus = 'unknown' | 'builtin' | 'island';

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isReplaced(id: unknown): id is string {
  return typeof id === 'string' && (REPLACED_PLUGIN_IDS as readonly string[]).indexOf(id) !== -1;
}

/**
 * Os built-ins substituídos que estão ligados, segundo `omarchy plugin list
 * --json`. Um que não aparece na lista não conta como ligado; só `enabled:
 * true` conta. Formato inesperado → `null`, para não assumir nem devolver
 * nada às cegas.
 */
export function enabledBuiltins(listJson: string): string[] | null {
  const root = parseJson(listJson);
  if (!Array.isArray(root)) return null;
  const enabled: string[] = [];
  for (const item of root) {
    if (typeof item !== 'object' || item === null) continue;
    const entry = item as Record<string, unknown>;
    if (isReplaced(entry.id) && entry.enabled === true) enabled.push(entry.id);
  }
  return enabled;
}

/**
 * A lista lida confere com o que os comandos deviam deixar? O código de saída
 * do `omarchy plugin enable|disable` não basta: com o shell ocupado (cada
 * troca reconstrói os painéis de todos os plugins) o IPC pode estourar o
 * tempo com a troca já aplicada, ou voltar 0 sem ela ter valido. Quem manda é
 * a lista; sem lista (`null`) não há como dar a troca como feita.
 */
export function matchesExpected(
  enabled: readonly string[] | null,
  expected: readonly string[],
): boolean {
  if (enabled === null || enabled.length !== expected.length) return false;
  return expected.every((id) => enabled.indexOf(id) !== -1);
}

export function takeoverStatus(enabled: readonly string[] | null): TakeoverStatus {
  if (enabled === null) return 'unknown';
  return enabled.length === 0 ? 'island' : 'builtin';
}

/**
 * A pergunta aparece uma vez (`takeoverPromptShown` no `state.json`), e só
 * enquanto o Omarchy cuida. Quem já desligou os built-ins (install.sh, à mão)
 * não é perguntado.
 */
export function shouldPromptTakeover(promptShown: boolean, status: TakeoverStatus): boolean {
  return !promptShown && status === 'builtin';
}

/** Texto da notificação de pergunta, no idioma da interface. */
export function takeoverPrompt(lang: Language): { title: string; body: string } {
  return {
    title: tr(lang, 'Notifications'),
    body: tr(lang, 'Island can show your notifications and volume. Click to review.'),
  };
}

/**
 * Argumentos do `omarchy` (depois do binário), um comando por plugin: o
 * `omarchy plugin disable` lê só o primeiro id e sai com 0 ignorando o resto.
 * Só passam os ids que a Island substitui: nenhum outro plugin é tocado.
 */
export function pluginToggleArgs(verb: 'enable' | 'disable', ids: readonly string[]): string[][] {
  return ids.filter(isReplaced).map((id) => ['plugin', verb, id]);
}
