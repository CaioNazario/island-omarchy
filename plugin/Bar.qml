pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Hyprland
import "system"
import "ui"
import "core/island.mjs" as IslandCore
import "core/osd.mjs" as OsdCore
import "core/mixer.mjs" as MixerCore
import "core/environments.mjs" as EnvironmentsCore

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
  readonly property alias notifEntry: router.notifEntry
  readonly property alias bannerEntry: router.bannerEntry
  readonly property alias flashKey: router.flashKey
  // Relógio do tempo relativo ("há N min"), um tique por minuto.
  property real nowMs: Date.now()

  // Calendário (specs/06): Semana/Mês e o mês exibido; abre sempre em
  // Semana no mês atual.
  property string calendarView: "week"
  property int calendarOffset: 0

  // Ambientes (spec 15): um ativo para todos os monitores, guardado no serviço.
  readonly property var environments: service ? service.environments : EnvironmentsCore.defaultEnvironments()
  readonly property int environmentIndex: service ? service.environmentIndex : 0
  readonly property var environment: environments[environmentIndex]
  readonly property var activeWidgets: environment.left.concat(environment.right)
  // Sentido da última troca (+1/−1) para a animação; 0 = sem animar.
  property int envDirection: 0
  // Deslocamento do conteúdo das pílulas acompanhando a rolagem.
  property real envDrag: 0
  property var envScroll: new EnvironmentsCore.EnvironmentScroll()
  property bool editorOpen: false

  // Conteúdo do modo `osd` (specs/08 "OSD do Omarchy").
  property var osd: ({ glyph: "info", text: "", percent: 0 })

  readonly property var sizeContext: ({
      quickEnergyOpen: powerOpen,
      wifiEnergyOpen: powerOpen,
      btEnergyOpen: powerOpen,
      stackItemCount: service && service.notifications ? service.notifications.entries.length : 0,
      wifiPasswordField: wifiPasswordFor === "" ? "none" : wifiPasswordError === "" ? "normal" : "error",
      btOn: sources.bluetooth.radioOn,
      calendarView: calendarView,
      providerCount: sources.ai.providers.length,
      mixerHeight: MixerCore.mixerHeight({
        outputs: sources.audio.outputs.length,
        apps: sources.audio.streams.length,
        hasMic: sources.audio.micAvailable
      })
    })

  SystemSources {
    id: sources

    shell: root.shell
    audio.listing: root.mode === "mixer"
    // Tiles de gravação e ditado só consultam com a linha de controles à vista.
    screenRecord.watching: ["quick", "wifi", "bt"].includes(root.mode)
    dictation.watching: ["quick", "wifi", "bt"].includes(root.mode)
    // Fontes só de widget rodam só com o widget no ambiente ativo (spec 16).
    hardware.sampling: root.activeWidgets.includes("hw")
    ai.polling: root.activeWidgets.includes("ai")
    ai.claudeEnabled: root.service ? root.service.settings.values.aiClaudeEnabled : true
    ai.codexEnabled: root.service ? root.service.settings.values.aiCodexEnabled : true
    github.polling: root.activeWidgets.includes("github")
    weather.preferredLocation: root.service ? root.service.settings.values.weatherLocation : null
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

  /** `Super+I` (specs/03 "Atalho"): de qualquer modo vai a `quick`; de `quick`, fecha. */
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
    function onEnvironmentStepRequested(direction) {
      root.stepEnvironment(direction);
    }
    function onStackRequested() {
      root.targetFocusedScreen();
      if (root.mode !== "stack") root.islandState.openFromTrigger("stack");
    }
  }

  /** Próximo/anterior, circular (`stepIndex`). */
  function stepEnvironment(direction) {
    if (!service) return;
    switchEnvironment(EnvironmentsCore.stepIndex(environmentIndex, environments.length, direction), direction);
  }

  /** Clique num ponto ou aba do editor: vai direto, animando no sentido do destino. */
  function goEnvironment(index) {
    if (!service || index === environmentIndex) return;
    switchEnvironment(index, index > environmentIndex ? 1 : -1);
  }

  // Só trocas pedidas mostram `env`: o índice também muda quando a barra
  // acha o serviço (hot-reload) ou o arquivo muda por fora, e aí a ilha fica.
  function switchEnvironment(index, direction) {
    envDirection = direction;
    service.setEnvironmentIndex(index);
    targetForAutomatic();
    islandState.environmentSwitched();
  }

  /** Rolagem sobre a barra (spec 15 "Rolagem suave"); a regra é do core. */
  function scrollBar(input) {
    const result = envScroll.handle(input);
    if (result.drag !== undefined) envDrag = result.drag;
    if (result.step) {
      envDrag = 0;
      stepEnvironment(result.step);
    }
    return result.handled;
  }

  // O editor de ambientes é a spec 17; até lá o botão não abre nada.
  function toggleEditor() {
  }

  // As preferências (spec 13) entram depois; até lá não abrem nada.
  function openPreferences(page) {
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

  NotificationRouter {
    id: router

    bar: root
  }

  Timer {
    interval: 60000
    repeat: true
    running: true
    onTriggered: root.nowMs = Date.now()
  }

  function hideBanner() {
    router.hideBanner();
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
