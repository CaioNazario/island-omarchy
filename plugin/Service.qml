pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io
import "system"

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

  readonly property alias notifications: feed
  readonly property bool doNotDisturb: store.values.doNotDisturb
  readonly property bool hasUnread: feed.hasUnread

  signal osdRequested(string payload)
  signal osdCloseRequested
  signal quickToggleRequested
  signal stackRequested

  function setDoNotDisturb(on) {
    store.values.doNotDisturb = on;
  }

  StateStore {
    id: store
  }

  NotificationFeed {
    id: feed
  }

  // Mesmo contrato do `plugins/notifications/Service.qml` do Omarchy 4.0.4:
  // os scripts `omarchy-*` e os atalhos `SUPER + vírgula` chamam estes nomes.
  IpcHandler {
    target: "notifications"

    function dndState(): string {
      return root.doNotDisturb ? "on" : "off";
    }
    function toggleDnd(): string {
      root.setDoNotDisturb(!root.doNotDisturb);
      return dndState();
    }
    function setDnd(value: string): string {
      root.setDoNotDisturb(["true", "1", "on", "yes"].includes(String(value).toLowerCase()));
      return dndState();
    }
    function isDnd(): string {
      return dndState();
    }
    // O histórico da Island é a lista do `stack`.
    function showHistory(): string {
      root.stackRequested();
      return "ok";
    }
    function clear(): string {
      feed.clearAll();
      return "ok";
    }
    function dismissAll(): string {
      feed.clearAll();
      return "ok";
    }
    function dismissOne(): string {
      if (feed.entries.length === 0) return "none";
      feed.dismiss(feed.entries[0].key);
      return "ok";
    }
    function invokeLast(): string {
      if (feed.entries.length === 0) return "none";
      feed.activate(feed.entries[0].key);
      return "ok";
    }
    function dismiss(summary: string): string {
      const match = feed.entries.find(entry => entry.ref && String(entry.ref.summary).includes(summary));
      if (!match) return "none";
      feed.dismiss(match.key);
      return "ok";
    }
    function ping(): string {
      return "ok";
    }
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
