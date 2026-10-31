import QtQuick
import Quickshell
import Quickshell.Io

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
    // `page <environments|appearance>`, `language <en|pt-BR>`, `barSize <id>`.
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
        active: bar.pluginWidgets.activePopout === widget // qmllint disable missing-property
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
