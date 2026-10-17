pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io

// Entrada `service` do plugin (keepLoaded: specs/14-spikes.md, S6). Vive até
// o shell reiniciar: guarda o estado visível que não pode se perder quando a
// barra é recriada pelo hot-reload, e responde pelos alvos IPC que os
// scripts do Omarchy chamam (S7). A barra escuta os sinais.
Item {
  id: root

  // Injetados pelo host quando existem aqui.
  property string omarchyPath: Quickshell.env("OMARCHY_PATH")
  property var shell: null
  property var manifest: null

  readonly property string pluginId: "caionazario.island"

  property bool doNotDisturb: false

  signal osdRequested(string payload)
  signal osdCloseRequested
  signal quickToggleRequested

  function setDoNotDisturb(on) {
    doNotDisturb = on;
  }

  // Mesmo contrato do `plugins/osd/Osd.qml` do Omarchy 4.0.4.
  IpcHandler {
    target: "osd"

    function show(payloadJson: string): string {
      root.osdRequested(payloadJson);
      return "ok";
    }
    function close(): string {
      root.osdCloseRequested();
      return "ok";
    }
    function state(): string {
      return "closed";
    }
    function ping(): string {
      return "ok";
    }
  }

  // Atalhos da Island, para amarrar no Hyprland (`omarchy-shell island toggleQuick`).
  IpcHandler {
    target: "island"

    function toggleQuick(): string {
      root.quickToggleRequested();
      return "ok";
    }
    function ping(): string {
      return "ok";
    }
  }
}
