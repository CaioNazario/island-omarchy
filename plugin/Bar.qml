pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Hyprland
import "system"
import "ui"
import "core/island.mjs" as IslandCore
import "core/osd.mjs" as OsdCore
import "core/notifications.mjs" as NotificationsCore

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
  readonly property alias system: sources

  // Um estado de ilha para todos os monitores (specs/02-barra.md
  // "Monitores"); `targetScreen` diz qual deles mostra o modo aberto.
  property var islandState: null
  property string mode: "compact"
  property bool cardOpen: false
  property bool fixed: false
  property bool powerOpen: false
  property string targetScreen: ""

  // Painel de senha do `wifi` (specs/08): um só, e muda a altura da ilha.
  property string wifiPasswordFor: ""
  property string wifiPasswordError: ""

  // Notificações (specs/04): conteúdo do `notif`, banner e destaque no `stack`.
  property var notifEntry: null
  property var bannerEntry: null
  property int flashKey: 0
  // Relógio do tempo relativo ("há N min"), um tique por minuto.
  property real nowMs: Date.now()

  // Calendário (specs/06): Semana/Mês e o mês exibido; abre sempre em
  // Semana no mês atual.
  property string calendarView: "week"
  property int calendarOffset: 0

  // Conteúdo do modo `osd` (specs/08 "OSD do Omarchy").
  property var osd: ({ glyph: "info", text: "", percent: 0 })

  readonly property var sizeContext: ({
      quickEnergyOpen: powerOpen,
      wifiEnergyOpen: powerOpen,
      btEnergyOpen: powerOpen,
      stackItemCount: service && service.notifications ? service.notifications.entries.length : 0,
      wifiPasswordField: wifiPasswordFor === "" ? "none" : wifiPasswordError === "" ? "normal" : "error",
      btOn: sources.bluetooth.radioOn,
      calendarView: calendarView
    })

  SystemSources {
    id: sources

    shell: root.shell
  }

  QmlScheduler {
    id: scheduler
  }

  Component.onCompleted: {
    islandState = new IslandCore.IslandState(scheduler, { onChange: syncIsland });
    targetFocusedScreen();
    findService();
  }

  function syncIsland() {
    const opening = islandState.mode !== mode || islandState.cardOpen !== cardOpen;
    if (opening && (islandState.mode === "calendar" || islandState.cardOpen)) resetCalendar();
    mode = islandState.mode;
    cardOpen = islandState.cardOpen;
    fixed = islandState.fixed || islandState.cardOpen;
    powerOpen = islandState.powerOpen;
    // Regra 1 da spec 03: sair de `wifi` fecha o painel de senha.
    if (mode !== "wifi") closePassword();
    // Abrir a lista marca tudo como lido (specs/04 "Modo `stack`").
    if (mode === "stack" && service) service.notifications.markAllRead();
    // Com a lista aberta, o banner repetiria o primeiro item dela.
    if (mode === "stack") hideBanner();
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

  /** Evento automático: só troca de monitor se a ilha puder abrir (regra 3). */
  function targetForAutomatic() {
    if (!fixed) targetFocusedScreen();
  }

  function closeAll() {
    islandState.closeAll();
  }

  /** Regra 9 da spec 03: com o painel de senha aberto, Esc fecha só ele. */
  function pressEscape() {
    if (islandState.escape(wifiPasswordFor !== "") === "closed-password") closePassword();
  }

  function islandHovered(hovered) {
    if (hovered) islandState.hoverStart();
    else islandState.hoverEnd();
  }

  function togglePassword(ssid) {
    wifiPasswordError = "";
    wifiPasswordFor = wifiPasswordFor === ssid ? "" : ssid;
  }

  function closePassword() {
    wifiPasswordFor = "";
    wifiPasswordError = "";
  }

  /** `Super+S` (specs/03 "Atalho"): de qualquer modo vai a `quick`; de `quick`, fecha. */
  function toggleQuick() {
    if (mode !== "quick") targetFocusedScreen();
    islandState.openFromTrigger("quick");
  }

  // Pedido de OSD (specs/08 "OSD do Omarchy"), já traduzido pelo core.
  function showOsd(payload) {
    const request = OsdCore.parseOsdPayload(payload);
    if (!request) return;
    targetForAutomatic();
    if (request.kind === "volume") return islandState.volumeKey();
    if (request.kind === "brightness") {
      sources.brightness.reportPercent(request.percent);
      return islandState.brightnessKey();
    }
    osd = {
      glyph: request.glyph,
      text: request.kind === "message" ? request.text : "",
      percent: request.kind === "progress" ? request.percent : 0
    };
    islandState.osdRequest(request.durationMs === null ? undefined : request.durationMs);
  }

  Connections {
    target: root.service
    function onOsdRequested(payload) {
      root.showOsd(payload);
    }
    function onOsdCloseRequested() {
      if (root.mode === "osd" || root.mode === "volume" || root.mode === "brightness") root.closeAll();
    }
    function onQuickToggleRequested() {
      root.toggleQuick();
    }
    function onStackRequested() {
      root.targetFocusedScreen();
      if (root.mode !== "stack") root.islandState.openFromTrigger("stack");
    }
  }

  function resetCalendar() {
    calendarView = "week";
    calendarOffset = 0;
  }

  function toggleCalendarView() {
    calendarView = calendarView === "week" ? "month" : "week";
  }

  function stepMonth(direction) {
    calendarOffset += direction;
  }

  // Troca de faixa (specs/05 "Modo `music`"): automática, regra 3 da spec 03.
  // Com `music` fixado aberto, o conteúdo só atualiza.
  Connections {
    target: sources.music
    function onTrackChanged() {
      if (root.islandState.musicPinned) return;
      root.targetForAutomatic();
      root.islandState.openAutomatic("music");
    }
    function onActiveChanged() {
      // O player sumir fecha o `music` fixado.
      if (!sources.music.active && root.islandState.musicPinned) root.closeAll();
    }
  }

  // Notificação nova (specs/04 "Roteamento"): a regra é do core.
  function routeNotification(entry) {
    const incoming = {
      critical: entry.critical,
      low: entry.low,
      acknowledged: false,
      bannersAllowed: !service.doNotDisturb,
      fromBrowser: entry.fromBrowser
    };
    const route = NotificationsCore.routeNotification(incoming, { mode: mode, cardOpen: cardOpen });
    if (route === "notif") return showNotif(entry);
    if (route === "stack") return flash(entry);
    if (route === "banner") return showBanner(entry);
  }

  function showNotif(entry) {
    targetForAutomatic();
    notifEntry = entry;
    islandState.openNotification(entry.critical, entry.fromBrowser);
  }

  function flash(entry) {
    flashKey = entry.key;
    flashTimer.restart();
  }

  function showBanner(entry) {
    bannerEntry = entry;
    bannerTimer.restart();
  }

  function hideBanner() {
    bannerEntry = null;
  }

  Timer {
    id: flashTimer

    interval: 2500
    onTriggered: root.flashKey = 0
  }

  Timer {
    id: bannerTimer

    interval: 2600
    onTriggered: root.hideBanner()
  }

  Timer {
    interval: 60000
    repeat: true
    running: true
    onTriggered: root.nowMs = Date.now()
  }

  Connections {
    target: root.service ? root.service.notifications : null
    function onArrived(entry) {
      root.nowMs = Date.now();
      root.routeNotification(entry);
    }
  }

  // Falha ao conectar com senha: o painel reabre com a mensagem (specs/08).
  Connections {
    target: sources.wifi
    function onConnectFailed(ssid, message) {
      root.wifiPasswordFor = ssid;
      root.wifiPasswordError = message;
    }
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
