// Widgets de barra de outros plugins do Omarchy (specs/16-widgets.md "Widgets
// de plugins"): o catálogo vem do `barWidgetRegistry` que o omarchy-shell
// injeta numa barra de terceiros (shell.qml `publicBarWidgetSnapshot`,
// Omarchy 4), e as configurações de cada um da entrada dele em `bar.layout`.

import {
  asList,
  isPluginWidgetId,
  pluginIdOf,
  pluginWidgetId,
  WIDGET_CATALOG,
  type PluginWidgetId,
  type WidgetId,
} from './environments.js';

export interface WidgetInfo {
  name: string;
  icon: string;
  description: string;
}

export interface PluginWidgetInfo extends WidgetInfo {
  id: PluginWidgetId;
}

const PLUGIN_ICON = 'puzzle-piece';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function catalogEntry(pluginId: string, entry: unknown): PluginWidgetInfo | null {
  const id = pluginWidgetId(pluginId);
  if (!id || !isRecord(entry) || !entry.component) return null;
  const metadata = isRecord(entry.metadata) ? entry.metadata : {};
  // Os widgets do próprio Omarchy esperam a barra dele inteira, não a
  // fachada que um plugin recebe (plugins/bar/Bar.qml `injectProps`).
  if (metadata.firstParty === true) return null;
  return {
    id,
    name: text(metadata.displayName) || pluginId,
    icon: PLUGIN_ICON,
    description: text(metadata.description),
  };
}

/**
 * Widgets de terceiros carregados (`{ id: { component, metadata } }`), por
 * nome. Sem `Intl` no V4, a ordem é a das letras minúsculas.
 */
export function pluginCatalog(widgets: unknown): PluginWidgetInfo[] {
  if (!isRecord(widgets)) return [];
  return Object.keys(widgets)
    .map((pluginId) => catalogEntry(pluginId, widgets[pluginId]))
    .filter((info): info is PluginWidgetInfo => info !== null)
    .sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1));
}

/** Nome, ícone e descrição para o editor; widget de plugin ausente usa o id. */
export function widgetInfo(id: string, catalog: readonly PluginWidgetInfo[]): WidgetInfo | null {
  if (id in WIDGET_CATALOG) return WIDGET_CATALOG[id as WidgetId];
  if (!isPluginWidgetId(id)) return null;
  const found = catalog.find((info) => info.id === id);
  if (found) return { name: found.name, icon: found.icon, description: found.description };
  return { name: pluginIdOf(id), icon: PLUGIN_ICON, description: 'Plugin não carregado' };
}

/**
 * Configurações inline da entrada do plugin em `bar.layout` (README do
 * omarchy-shell: "Settings are inline on the entry"), sem o `id`.
 */
export function entrySettings(layout: unknown, pluginId: string): Record<string, unknown> {
  if (!isRecord(layout)) return {};
  for (const section of ['left', 'center', 'right']) {
    const entry = (asList(layout[section]) ?? []).find(
      (item) => isRecord(item) && item.id === pluginId,
    );
    if (isRecord(entry)) {
      const settings: Record<string, unknown> = {};
      for (const key of Object.keys(entry)) if (key !== 'id') settings[key] = entry[key];
      return settings;
    }
  }
  return {};
}
