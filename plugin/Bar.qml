pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Hyprland
import "system"
import "ui"
import "core/island.mjs" as IslandCore

// Entrada `bar` do plugin (specs/14-spikes.md, S6). O omarchy-shell recria
// este item a cada hot-reload; o que precisa sobreviver mora no Service.qml.
Item {
  id: root

  // Injetados pelo host (shell.qml `configureBar`) quando existem aqui.
  property string omarchyPath: Quickshell.env("OMARCHY_PATH")
  property var shell: null
  property var manifest: null
  property var barConfig: ({})
  property var pluginRegistry: null

  readonly property string pluginId: "caionazario.island"
  property var service: null

  // Um estado de ilha para todos os monitores (specs/02-barra.md
  // "Monitores"); `targetScreen` diz qual deles mostra o modo aberto.
  property var islandState: null
  property string mode: "compact"
  property bool cardOpen: false
  property bool fixed: false
  property string targetScreen: ""

  QmlScheduler {
    id: scheduler
  }

  Component.onCompleted: {
    islandState = new IslandCore.IslandState(scheduler, { onChange: syncIsland });
    targetFocusedScreen();
    findService();
  }

  function syncIsland() {
    mode = islandState.mode;
    cardOpen = islandState.cardOpen;
    fixed = islandState.fixed || islandState.cardOpen;
  }

  // O host carrega serviços e barra em paralelo: o serviço pode chegar depois.
  function findService() {
    if (service || !shell || typeof shell.serviceFor !== "function") return;
    service = shell.serviceFor(pluginId);
  }

  Timer {
    interval: 250
    repeat: true
    running: root.service === null && root.shell !== null
    onTriggered: root.findService()
  }

  /** Gatilho do usuário numa barra: o monitor dela vira o alvo (specs/02-barra.md). */
  function openFromBar(screenName, mode) {
    targetScreen = screenName;
    islandState.openFromTrigger(mode);
  }

  function islandClick(screenName) {
    targetScreen = screenName;
    islandState.islandClick();
  }

  /**
   * Modos transitórios e atalhos vão para o monitor focado (specs/02-barra.md
   * "Monitores"); sem monitor focado, o primeiro da lista.
   */
  function targetFocusedScreen() {
    const focused = Hyprland.focusedMonitor;
    if (focused) targetScreen = focused.name;
    else if (Quickshell.screens.length > 0) targetScreen = Quickshell.screens[0].name;
  }

  function closeAll() {
    islandState.closeAll();
  }

  /** Regra 9 da spec 03; o painel de senha do `wifi` entra com a spec 08. */
  function pressEscape() {
    islandState.escape(false);
  }

  Variants {
    model: Quickshell.screens

    delegate: Component {
      ScreenBar {
        required property var modelData

        screen: modelData
        bar: root
      }
    }
  }
}
