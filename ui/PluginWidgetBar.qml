import QtQuick
import Quickshell

// O `bar` que um widget de outro plugin recebe (specs/16-widgets.md "Widgets
// de plugins"), no contrato de `qs.Ui/PluginBarApi.qml` do Omarchy 4: o
// estado da barra em escalares e as operações delegadas ao anfitrião. Uma
// por plugin, compartilhada pelos monitores, como em plugins/bar/Bar.qml
// `pluginBarApiFor`.
QtObject {
  required property string pluginId
  required property string moduleName
  required property PluginWidgetHost host
  // Fachada sem serviço do omarchy-shell (`pluginShellForBarEntry`): `null`
  // se o plugin não tem entrada em `bar.layout`.
  property var shell: null

  readonly property color foreground: Tokens.text
  readonly property color barForeground: Tokens.text
  readonly property color background: Tokens.laneBg
  readonly property color urgent: Tokens.alertRed
  // Os widgets do Omarchy desenham glifos Nerd Font; a barra dele usa a
  // fonte que o fontconfig dá a `monospace` (plugins/bar/Bar.qml `barConfig`).
  readonly property string fontFamily: "monospace"
  readonly property string position: "top"
  readonly property bool vertical: false
  // Altura da faixa onde o widget é desenhado: o painel dele abre logo abaixo.
  readonly property int barSize: Tokens.barReserved
  readonly property bool transparent: false
  readonly property bool foregroundAnimationEnabled: true
  readonly property bool centerSectionRevealHeld: false
  readonly property bool centerHoverRevealSuppressed: false
  readonly property var activePopout: host.activePopout
  readonly property var clickTargets: host.clickTargets
  readonly property var layoutConfig: ({})
  readonly property var foreignPopoutMarker: ({
      foreign: true
    })

  function setCenterHoverRevealSuppressed(value) {
  }

  // A Island não tem dica flutuante própria; o widget só não mostra a dele.
  function showTooltip(target, text) {
  }

  function hideTooltip(target) {
  }

  function registerClickTarget(target) {
    host.registerClickTarget(target);
  }

  function unregisterClickTarget(target) {
    host.unregisterClickTarget(target);
  }

  function requestPopout(owner) {
    host.requestPopout(owner);
  }

  function releasePopout(owner) {
    host.releasePopout(owner);
  }

  // Sem setas entre painéis vizinhos: a Island não tem a fila de ícones.
  function switchPanelFrom(owner, direction) {
    return false;
  }

  function targetBelongsToWindow(target, window) {
    return host.targetBelongsToWindow(target, window);
  }

  function moduleWidgets(id) {
    return String(id || "") === moduleName ? host.instancesOf(moduleName) : [];
  }

  // Como `Util.execDetached` do Omarchy: shell de login, sem esperar.
  function run(command) {
    if (command) Quickshell.execDetached(["bash", "-lc", String(command)]);
  }
}
