// Monitores sob uma janela em tela cheia de verdade (specs/02-barra.md "Tela
// cheia e lock"). Mesma regra de /usr/share/omarchy/shell/plugins/bar/BarModel.js
// `fullscreenOn` (Omarchy 4): o Hyprland informa a janela maximizada como
// `fullscreen` 1 e a tela cheia de verdade com o bit 2 ligado; só esta esconde
// a barra.
import { asList } from './environments.mjs';
const REAL_FULLSCREEN_BIT = 2;
function fullscreenWorkspaces(toplevels) {
    var _a;
    const ids = [];
    for (const item of (_a = asList(toplevels)) !== null && _a !== void 0 ? _a : []) {
        const toplevel = item;
        if (!toplevel || !toplevel.workspace || !toplevel.lastIpcObject)
            continue;
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
export function fullscreenMonitors(monitors, toplevels) {
    var _a;
    const workspaces = fullscreenWorkspaces(toplevels);
    if (workspaces.length === 0)
        return [];
    return ((_a = asList(monitors)) !== null && _a !== void 0 ? _a : [])
        .map((item) => item)
        .filter((monitor) => !!monitor && !!monitor.activeWorkspace)
        .filter((monitor) => workspaces.indexOf(monitor.activeWorkspace.id) !== -1)
        .map((monitor) => monitor.name);
}
