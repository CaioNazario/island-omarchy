pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io
import Quickshell.Services.Notifications

// Hospeda o plugin como o omarchy-shell (shell.qml `configureBar`,
// `pluginBarLoader`, Omarchy 4.0.4), para rodar fora da sessão do usuário,
// dentro do Hyprland aninhado do `make dev`/`make smoke`.
ShellRoot {
  id: host

  readonly property string pluginDir: Quickshell.env("ISLAND_PLUGIN_DIR")
  readonly property string pluginId: "caionazario.island"
  property bool reloading: false
  property int reloads: 0

  // Fachada com o mesmo formato da `PluginShellApi` que a barra recebe.
  QtObject {
    id: scopedShell

    function serviceFor(id) {
      return id === host.pluginId ? serviceLoader.item : null;
    }

    function firstPartyServiceFor(id) {
      return null;
    }
  }

  // Catálogo como o `PluginBarWidgetRegistryApi` que uma barra de terceiros
  // recebe, com um widget de plugin de mentira (specs/16 "Widgets de plugins").
  // O componente sai de `Qt.createComponent`, como em shell.qml
  // `loadPluginWidget`: um `Component {}` declarado aqui teria outro dono.
  QtObject {
    id: widgetRegistry

    property int revision: 1
    property var widgets: ({
        "dev.fake": {
          component: Qt.createComponent(Qt.resolvedUrl("FakePluginWidget.qml")),
          metadata: {
            displayName: "Widget de teste",
            description: "Plugin de mentira do harness",
            firstParty: false
          }
        }
      })
  }

  // Um `NotificationServer` no papel do `omarchy.notifications`: nasce depois
  // de a Island devolver e conta o que recebe. O Quickshell entrega a ele, como
  // se fossem novas, as notificações que o servidor anterior ainda rastreia.
  property int simReceived: 0

  LazyLoader {
    id: omarchySim

    NotificationServer {
      onNotification: notification => {
        notification.tracked = true;
        host.simReceived++;
      }
    }
  }

  Loader {
    id: serviceLoader

    source: "file://" + host.pluginDir + "/Service.qml"
    onLoaded: host.inject(item)
  }

  Loader {
    id: barLoader

    active: !host.reloading
    asynchronous: true
    source: "file://" + host.pluginDir + "/Bar.qml"
    onLoaded: host.inject(item)
    onStatusChanged: if (status === Loader.Error) console.error("ISLAND-DEV bar failed to load")
  }

  function inject(target) {
    if ("omarchyPath" in target) target.omarchyPath = Quickshell.env("OMARCHY_PATH");
    if ("shell" in target) target.shell = scopedShell;
    if ("barConfig" in target) target.barConfig = { position: "top", layout: {} };
    if ("barWidgetRegistry" in target) target.barWidgetRegistry = widgetRegistry;
  }

  // O host descarrega, limpa o cache de componentes e recarrega
  // (shell.qml `reloadPlugins`/`finishPluginReload`). O serviço fica.
  function reloadBar() {
    reloading = true;
    Qt.callLater(finishReload);
  }

  function finishReload() {
    // Mesma guarda do host: a função não existe em todo Qt (6.11.2 não tem).
    if (typeof Qt.clearComponentCache === "function") Qt.clearComponentCache(); // qmllint disable missing-property
    reloading = false;
    reloads++;
  }

  // A saída virtual do `nested.sh`, que é a capturada; senão a primeira.
  function captureScreen() {
    const screens = Quickshell.screens;
    for (let i = 0; i < screens.length; i++)
      if (screens[i].name === "HEADLESS-ISLAND") return screens[i].name;
    return screens[0].name;
  }

  IpcHandler {
    target: "dev"

    function reload(): string {
      host.reloadBar();
      return "ok";
    }

    // Abre um modo no primeiro monitor, como um clique na barra dele.
    function open(mode: string): string {
      // O Bar.qml é carregado por URL: o qmllint não conhece os membros dele.
      const bar = barLoader.item; // qmllint disable missing-property
      if (!bar) return "no bar";
      bar.openFromBar(host.captureScreen(), mode); // qmllint disable missing-property
      return bar.mode; // qmllint disable missing-property
    }

    // Botão de ambiente do monitor capturado: abre/fecha o editor (spec 17).
    function editor(): string {
      const bar = barLoader.item; // qmllint disable missing-property
      if (!bar) return "no bar";
      bar.toggleEditor(host.captureScreen()); // qmllint disable missing-property
      return bar.editorOpen ? "open" : "closed"; // qmllint disable missing-property
    }

    // Ação do editor sem ponteiro (o aninhado não simula mouse): `place
    // <id> <left|right> [índice]`, `select <id>`, `step <-1|1>`, `move`,
    // `remove`, `add`, `delete`, `rename <nome>`, `icon <glifo>`, `switch <i>`, `theme <nome>`,
    // `accent <nome>`, `appearance <chave> <valor JSON>`, `preset <id>`,
    // `page <environments|appearance|weather|settings>`, `language <en|pt-BR>`, `barSize <id>`.
    function editorDo(action: string, arg: string): string {
      const bar = barLoader.item; // qmllint disable missing-property
      if (!bar) return "no bar";
      const parts = arg.split(" ");
      const actions = {
        place: () => bar.editorPlace(parts[0], parts[1], parts[2] === undefined ? null : Number(parts[2])),
        select: () => bar.editorSelected = arg,
        step: () => bar.editorStepSelected(Number(arg)),
        move: () => bar.editorMoveSelected(),
        remove: () => bar.editorRemoveSelected(),
        add: () => bar.editorAddEnvironment(),
        "delete": () => bar.editorRemoveEnvironment(),
        rename: () => bar.editorRename(arg),
        icon: () => bar.editorSetIcon(arg),
        "switch": () => bar.editorSwitch(Number(arg)),
        theme: () => bar.setTheme(arg),
        accent: () => bar.setAccent(arg),
        appearance: () => bar.service.setAppearanceOption(parts[0], JSON.parse(parts.slice(1).join(" "))),
        preset: () => bar.service.applyAppearancePreset(arg),
        page: () => bar.editorPage = arg,
        language: () => bar.setLanguage(arg),
        barSize: () => bar.setBarSize(arg)
      }; // qmllint disable missing-property
      if (!actions[action]) return "unknown action " + action;
      actions[action]();
      return JSON.stringify(bar.environment); // qmllint disable missing-property
    }

    // Ambientes como a barra os enxerga (já lidos do settings.json): o `smoke`
    // confere que os guardados no arquivo sobrevivem ao reinício.
    function environments(): string {
      const bar = barLoader.item; // qmllint disable missing-property
      if (!bar) return "no bar";
      return JSON.stringify(bar.environments); // qmllint disable missing-property
    }

    // Idioma e tamanho da barra como o serviço os guarda (specs/13 e 02).
    function prefs(): string {
      const bar = barLoader.item; // qmllint disable missing-property
      if (!bar || !bar.service) return "no service"; // qmllint disable missing-property
      return JSON.stringify({ language: bar.service.language, barSize: bar.service.settings.values.barSize }); // qmllint disable missing-property
    }

    // Aparência como o serviço a entrega à barra (já saneada do settings.json).
    function appearance(): string {
      const bar = barLoader.item; // qmllint disable missing-property
      if (!bar || !bar.service) return "no bar"; // qmllint disable missing-property
      return JSON.stringify(bar.service.appearance); // qmllint disable missing-property
    }

    // Cores do tema do Omarchy como a barra as lê (spec 19 "Gradiente").
    function themeColors(): string {
      const bar = barLoader.item; // qmllint disable missing-property
      if (!bar) return "no bar";
      return JSON.stringify(bar.system.omarchyTheme.named); // qmllint disable missing-property
    }

    // Servidor de mentira no papel do Omarchy (`on`, `off`): devolve quantas
    // notificações recebeu. Só nasce com a Island sem o servidor dela.
    function omarchySimulator(action: string): string {
      if (action === "on") omarchySim.active = true;
      else if (action === "off") omarchySim.active = false;
      return String(host.simReceived);
    }

    // Quem cuida das notificações e do OSD (spec 04), com o `omarchy` falso do
    // harness: `status` devolve o estado, `enable` liga a Island, `handback`
    // devolve ao Omarchy e `refresh` relê a lista.
    function takeover(action: string): string {
      const service = serviceLoader.item; // qmllint disable missing-property
      if (!service) return "no service";
      const control = service.takeover; // qmllint disable missing-property
      const actions = {
        enable: () => control.takeOver(),
        handback: () => control.handBack(),
        refresh: () => control.refresh()
      };
      if (actions[action]) actions[action]();
      else if (action !== "status") return "unknown action " + action;
      return JSON.stringify({
        status: control.status,
        builtins: control.builtins,
        claimsNotifications: control.claimsNotifications,
        claimsOsd: control.claimsOsd,
        busy: control.busy,
        failed: control.failed,
        shown: service.stateStore.values.takeoverPromptShown, // qmllint disable missing-property
        entries: service.notifications.entries.length // qmllint disable missing-property
      });
    }

    // Botão Energia: abre/fecha a linha de energia (spec 09); só vale em `quick`/`wifi`/`bt`.
    function power(): string {
      const bar = barLoader.item; // qmllint disable missing-property
      if (!bar) return "no bar";
      bar.islandState.togglePower(); // qmllint disable missing-property
      return bar.powerOpen ? "open" : "closed"; // qmllint disable missing-property
    }

    // Clique na ilha do monitor capturado (regra 5 da spec 03).
    function click(): string {
      const bar = barLoader.item; // qmllint disable missing-property
      if (!bar) return "no bar";
      bar.islandClick(host.captureScreen()); // qmllint disable missing-property
      return bar.cardOpen ? "card" : bar.mode; // qmllint disable missing-property
    }

    // Cidade das preferências (spec 07) sem tocar no weather.json do Omarchy.
    function weather(locationJson: string): string {
      const bar = barLoader.item; // qmllint disable missing-property
      if (!bar) return "no bar";
      bar.system.weather.preferredLocation = JSON.parse(locationJson); // qmllint disable missing-property
      return "ok";
    }

    // Busca de cidade como a aba Clima a faz: devolve os rótulos achados
    // (espere a rede) e, com `pick`, escolhe o primeiro como a cidade.
    function weatherSearch(query: string): string {
      const bar = barLoader.item; // qmllint disable missing-property
      if (!bar) return "no bar";
      const weather = bar.system.weather; // qmllint disable missing-property
      if (query === "clear") bar.service.setWeatherLocation(null); // qmllint disable missing-property
      else if (query === "pick") bar.service.setWeatherLocation(weather.searchResults[0].location); // qmllint disable missing-property
      else weather.search(query);
      return weather.origin + " " + weather.searchResults.length + " " + (weather.searchResults[0] ? weather.searchResults[0].label : "-");
    }

    // Simula a detecção de área falha (spec 07 "Dica"): sem cidade em lugar
    // nenhum, a dica sai uma vez e abre a aba Clima ao clicar.
    function weatherFail(): string {
      const bar = barLoader.item; // qmllint disable missing-property
      if (!bar) return "no bar";
      const weather = bar.system.weather; // qmllint disable missing-property
      weather.preferredLocation = null;
      weather.omarchyLocation = null;
      weather.detectedLocation = null;
      weather.detectionFailed();
      return bar.service ? String(bar.service.notifications.entries.length) : "no service"; // qmllint disable missing-property
    }

    // Clica na notificação mais recente da lista (a dica do clima): devolve
    // se o editor abriu e em que aba.
    function activateFirst(): string {
      const bar = barLoader.item; // qmllint disable missing-property
      if (!bar || !bar.service) return "no service"; // qmllint disable missing-property
      const first = bar.service.notifications.entries[0]; // qmllint disable missing-property
      if (!first) return "none";
      bar.service.notifications.activate(first.key); // qmllint disable missing-property
      return bar.editorOpen + " " + bar.editorPage; // qmllint disable missing-property
    }

    // Texto de um feed ICS (spec 06) sem URL no chaveiro nem rede: confere a
    // lista de eventos na tela.
    function calendar(icsText: string): string {
      const bar = barLoader.item; // qmllint disable missing-property
      if (!bar) return "no bar";
      bar.system.calendar.feedText = icsText; // qmllint disable missing-property
      return "ok";
    }

    // Modo da ilha no monitor alvo: confere os gestos (`openStack`, `closeStack`).
    function mode(): string {
      const bar = barLoader.item; // qmllint disable missing-property
      if (!bar) return "no bar";
      return bar.mode; // qmllint disable missing-property
    }

    // Widget de plugin de mentira no monitor capturado: `toggle` clica nele;
    // devolve se o painel está aberto e onde ele abre (spec 16).
    function pluginWidget(action: string): string {
      const bar = barLoader.item; // qmllint disable missing-property
      if (!bar) return "no bar";
      const items = bar.pluginWidgets.instancesOf("dev.fake"); // qmllint disable missing-property
      const widget = items.find(item => item.anchorWindow && item.anchorWindow.screen.name === host.captureScreen());
      if (!widget) return JSON.stringify({ count: items.length });
      if (action === "toggle") widget.toggle();
      return JSON.stringify({
        count: items.length,
        opened: widget.opened,
        popupY: widget.popupY,
        active: bar.pluginWidgets.activePopout === widget, // qmllint disable missing-property
        // A margem que o QML pediu à janela da faixa (`stripX`): o smoke a compara
        // com onde o compositor pôs a janela.
        marginLeft: widget.anchorWindow.margins.left // qmllint disable missing-property unqualified unresolved-type
      });
    }

    // Pomodoro (spec 20): `toggle`, `skip`, `restart`, `release` (Urgência),
    // `preview`/`endPreview` (Testar pausa) e `settings` (engrenagem) agem como
    // os botões; `config <json>` grava a configuração. Devolve o estado.
    function pomodoro(action: string, arg: string): string {
      const bar = barLoader.item; // qmllint disable missing-property
      const service = serviceLoader.item; // qmllint disable missing-property
      if (!bar || !service) return "no bar";
      const source = service.pomodoro; // qmllint disable missing-property
      if (action === "toggle") source.toggle();
      else if (action === "skip") source.skip();
      else if (action === "restart") source.restart();
      else if (action === "release") source.release();
      // Direto na fonte: a barra recém-recriada ainda pode não ter achado o serviço.
      else if (action === "preview") source.startPreview();
      else if (action === "endPreview") source.endPreview();
      else if (action === "settings") bar.togglePomodoroSettings(); // qmllint disable missing-property
      // A engrenagem do widget da barra: abre o card já nas configurações.
      else if (action === "barSettings") bar.openPomodoroSettings(host.captureScreen()); // qmllint disable missing-property
      else if (action === "config") source.setConfig(JSON.parse(arg));
      return JSON.stringify({
        phase: source.current.phase,
        session: source.current.session,
        running: source.running,
        locked: source.current.locked,
        previewing: source.previewing,
        completed: source.current.completed,
        remainingMs: source.current.endsAt === null ? source.current.remainingMs : source.current.endsAt - Date.now(),
        config: source.config,
        mode: bar.mode, // qmllint disable missing-property
        settingsOpen: bar.pomodoroSettingsOpen // qmllint disable missing-property
      });
    }

    function status(): string {
      return JSON.stringify({
        bar: barLoader.status === Loader.Ready,
        service: serviceLoader.status === Loader.Ready,
        reloads: host.reloads
      });
    }
  }
}
