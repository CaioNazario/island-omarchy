// Monitores sob uma janela em tela cheia de verdade (specs/02-barra.md "Tela
// cheia e lock"). Mesma regra de /usr/share/omarchy/shell/plugins/bar/BarModel.js
// `fullscreenOn` (Omarchy 4): o Hyprland informa a janela maximizada como
// `fullscreen` 1 e a tela cheia de verdade com o bit 2 ligado; só esta esconde
// a barra.

import { asList } from './environments.js';

interface WorkspaceRef {
  id: number;
}

/** O que a Island lê de um `HyprlandMonitor` do Quickshell. */
export interface FullscreenMonitor {
  name: string;
  activeWorkspace: WorkspaceRef | null;
}

/** O que a Island lê de um `HyprlandToplevel` do Quickshell. */
export interface FullscreenToplevel {
  workspace: WorkspaceRef | null;
  lastIpcObject: { fullscreen?: unknown } | null;
}

const REAL_FULLSCREEN_BIT = 2;

function fullscreenWorkspaces(toplevels: unknown): number[] {
  const ids: number[] = [];
  for (const item of asList(toplevels) ?? []) {
    const toplevel = item as FullscreenToplevel | null;
    if (!toplevel || !toplevel.workspace || !toplevel.lastIpcObject) continue;
    if ((Number(toplevel.lastIpcObject.fullscreen) & REAL_FULLSCREEN_BIT) !== 0)
      ids.push(toplevel.workspace.id);
  }
  return ids;
}

/**
 * Nomes dos monitores cujo workspace ativo tem uma janela em tela cheia de
 * verdade. Aceita as listas do Quickshell (`Hyprland.monitors.values`,
 * `Hyprland.toplevels.values`), que podem não ser `Array`.
 */
export function fullscreenMonitors(monitors: unknown, toplevels: unknown): string[] {
  const workspaces = fullscreenWorkspaces(toplevels);
  if (workspaces.length === 0) return [];
  return (asList(monitors) ?? [])
    .map((item) => item as FullscreenMonitor | null)
    .filter((monitor): monitor is FullscreenMonitor => !!monitor && !!monitor.activeWorkspace)
    .filter((monitor) => workspaces.indexOf((monitor.activeWorkspace as WorkspaceRef).id) !== -1)
    .map((monitor) => monitor.name);
}
