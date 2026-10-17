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

    function status(): string {
      return JSON.stringify({
        bar: barLoader.status === Loader.Ready,
        service: serviceLoader.status === Loader.Ready,
        reloads: host.reloads
      });
    }
  }
}
