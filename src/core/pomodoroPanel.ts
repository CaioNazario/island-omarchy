// Medidas do modo `pomodoro` da ilha (specs/20-pomodoro.md "Modo da ilha").
// Fechadas as configurações, é só o card do protótipo; abertas, a ilha cresce
// com uma lista rolável cuja altura acompanha a tela, como o
// `min(470px, 100vh - 230px)` do protótipo.

export const POMODORO_COMPACT_WIDTH = 300;
export const POMODORO_SETTINGS_WIDTH = 340;
export const POMODORO_COMPACT_HEIGHT = 128;

/** Separador e respiros entre o card e a lista de configurações. */
const SETTINGS_GAP = 24;
const SETTINGS_MAX_LIST = 470;
const SETTINGS_MIN_LIST = 120;
/** Altura de tela reservada ao que não é lista (barra, margens e o card). */
const SCREEN_RESERVE = 230;

export function pomodoroPanelWidth(settingsOpen: boolean): number {
  return settingsOpen ? POMODORO_SETTINGS_WIDTH : POMODORO_COMPACT_WIDTH;
}

/**
 * `availableHeight`: altura da tela do monitor-alvo, já dividida pelo zoom da
 * barra. `contentHeight`: altura que a lista pede (0 enquanto não medida); a
 * ilha acompanha o conteúdo até o teto, como o `grid-template-rows` do protótipo.
 */
export function pomodoroPanelHeight(
  settingsOpen: boolean,
  availableHeight: number,
  contentHeight = 0,
): number {
  if (!settingsOpen) return POMODORO_COMPACT_HEIGHT;
  const cap = Math.min(
    SETTINGS_MAX_LIST,
    Math.max(SETTINGS_MIN_LIST, availableHeight - SCREEN_RESERVE),
  );
  const list = contentHeight > 0 ? Math.min(cap, contentHeight) : cap;
  return POMODORO_COMPACT_HEIGHT + SETTINGS_GAP + list;
}
