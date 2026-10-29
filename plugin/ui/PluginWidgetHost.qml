pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import "../core/environments.mjs" as EnvironmentsCore
import "../core/pluginWidgets.mjs" as PluginWidgetsCore

// Anfitrião dos widgets de outros plugins (specs/16-widgets.md "Widgets de
// plugins"): o catálogo que o omarchy-shell injeta, uma fachada `bar` por
// plugin e um painel de plugin aberto por vez, como em plugins/bar/Bar.qml
// `requestPopout`. Vive na barra e morre com ela no hot-reload.
Item {
  id: host

  // `barWidgetRegistry` injetado (shell.qml `pluginBarWidgetRegistryFor`).
  property var registry: null
  // Fachada do omarchy-shell para a Island (`PluginShellApi`).
  property var shell: null
  // `bar.layout` do shell.json, de onde vêm as configurações de cada widget.
  property var layout: null

  property var activePopout: null
  property var clickTargets: []
  property var instances: []
  property var facades: ({})

  readonly property var catalog: PluginWidgetsCore.pluginCatalog(registry ? registry.widgets : null)

  /** Um painel de plugin abriu: a ilha fecha o modo fixo dela (Bar.qml). */
  signal popoutOpened

  visible: false

  Component {
    id: facadeComponent

    PluginWidgetBar {}
  }

  // Componente próprio de cada plugin, `{ url, revision, component }`. O do
  // catálogo vem de `Qt.createComponent` no omarchy-shell (shell.qml
  // `loadPluginWidget`), sem pai. Medido no Omarchy 4 com Quickshell 0.3:
  // destruídas as instâncias dele na Island (troca de ambiente), o componente
  // some (ler a entrada dá `TypeError`) e o widget não volta. Este tem o
  // anfitrião como pai e vive com a barra.
  property var components: ({})

  onCatalogChanged: loadComponents()
  Component.onCompleted: loadComponents()

  /** Componente do widget `plugin:<id>`; `null` se o plugin não está carregado. */
  function componentFor(widgetId) {
    const entry = components[EnvironmentsCore.pluginIdOf(widgetId)];
    return entry && entry.component.status === Component.Ready ? entry.component : null;
  }

  // Lido só quando o catálogo muda: aí os componentes dele estão vivos.
  function loadComponents() {
    const next = {};
    const revision = registry ? registry.revision : 0;
    catalog.forEach(info => {
      const pluginId = EnvironmentsCore.pluginIdOf(info.id);
      const url = String(registry.widgets[pluginId].component.url);
      const known = components[pluginId];
      next[pluginId] = known && known.url === url && known.revision === revision ? known : ownComponent(url, revision);
    });
    const dropped = Object.keys(components).filter(id => components[id] !== next[id]).map(id => components[id].component);
    components = next;
    // Depois de os `Loader` trocarem de componente.
    Qt.callLater(() => dropped.forEach(component => component.destroy()));
  }

  function ownComponent(url, revision) {
    const component = Qt.createComponent(url, Component.Asynchronous, host);
    component.statusChanged.connect(() => {
      if (component.status === Component.Error) console.warn("Island: widget de plugin " + url + " falhou: " + component.errorString());
    });
    return {
      url: url,
      revision: revision,
      component: component
    };
  }

  function settingsFor(pluginId) {
    return PluginWidgetsCore.entrySettings(layout, pluginId);
  }

  // Criada fora de binding: criar um QObject durante um binding o reavalia
  // (aviso de laço do omarchy-shell em shell.qml `pluginShellFor`).
  function facadeFor(pluginId) {
    if (facades[pluginId]) return facades[pluginId];
    const entryShell = shell && typeof shell.pluginShellForBarEntry === "function" ? shell.pluginShellForBarEntry(pluginId, pluginId) : null;
    const facade = facadeComponent.createObject(host, {
      pluginId: pluginId,
      moduleName: pluginId,
      host: host,
      shell: entryShell
    });
    const next = Object.assign({}, facades);
    next[pluginId] = facade;
    facades = next;
    return facade;
  }

  // Mesma ordem de plugins/bar/Bar.qml `requestPopout`: fecha o anterior
  // (preferindo `closeForPopoutSwitch`) e só depois troca o dono.
  function requestPopout(owner) {
    if (activePopout === owner) return;
    closeOwner(activePopout, true);
    activePopout = owner;
    popoutOpened();
  }

  function releasePopout(owner) {
    if (activePopout === owner) activePopout = null;
  }

  /** A ilha abriu um modo fixo: o painel do plugin fecha. */
  function closePopout() {
    closeOwner(activePopout, false);
  }

  function closeOwner(owner, switching) {
    if (!owner) return;
    if (switching && "closeForPopoutSwitch" in owner) owner.closeForPopoutSwitch();
    else if ("close" in owner) owner.close();
  }

  function registerClickTarget(target) {
    if (target && clickTargets.indexOf(target) === -1) clickTargets = clickTargets.concat([target]);
  }

  function unregisterClickTarget(target) {
    clickTargets = clickTargets.filter(item => item !== target);
  }

  function targetBelongsToWindow(target, window) {
    return !!target && !!window && (target as Item).QsWindow.window === window;
  }

  function registerInstance(pluginId, item) {
    instances = instances.concat([
      {
        pluginId: pluginId,
        item: item
      }
    ]);
  }

  function unregisterInstance(item) {
    instances = instances.filter(entry => entry.item !== item);
  }

  function instancesOf(pluginId) {
    return instances.filter(entry => entry.pluginId === pluginId).map(entry => entry.item);
  }
}
