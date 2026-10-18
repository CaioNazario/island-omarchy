pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Hyprland
import Quickshell.Io
import "../core/display.mjs" as DisplayCore

// Modo `display` (specs/08 "Modo `display`"): monitor pelo IPC do Hyprland,
// tamanho do texto por `omarchy-display-text-size` e escala por
// `omarchy-hyprland-monitor-scaling`. Só lê com o modo aberto.
Scope {
  id: display

  property bool watching: false
  property string screenName: ""

  readonly property var monitor: Hyprland.monitors.values.find(m => m.name === screenName) ?? null
  readonly property var ipc: monitor ? monitor.lastIpcObject : ({})
  readonly property string subtitle: monitor ? DisplayCore.monitorSubtitle({
    description: monitor.description,
    width: monitor.width,
    height: monitor.height,
    refreshRate: ipc.refreshRate ?? 0
  }) : ""
  readonly property real scale: monitor ? monitor.scale : 1
  property int textSize: 12

  onWatchingChanged: {
    if (!watching) return;
    // `lastIpcObject` (taxa de atualização) só vem com um refresh.
    Hyprland.refreshMonitors();
    readTextSize();
  }

  function readTextSize() {
    if (!textSizeProc.running) textSizeProc.running = true;
  }

  /** Otimista: o segmento muda já e a leitura confirma depois. */
  function setTextSize(size) {
    textSize = size;
    Quickshell.execDetached(["omarchy-display-text-size", String(size)]);
    confirmTimer.restart();
  }

  // O script só mexe no monitor focado: foca o desta ilha antes, como o
  // `omarchy-launch-screensaver` (Lua do Hyprland 0.56, com o dispatch antigo
  // de reserva).
  function setScale(value) {
    if (!monitor || !DisplayCore.isSafeMonitorName(monitor.name)) return;
    Quickshell.execDetached(["sh", "-c", "hyprctl dispatch \"hl.dsp.focus({ monitor = \\\"$1\\\" })\" >/dev/null 2>&1 || hyprctl dispatch focusmonitor \"$1\" >/dev/null; omarchy-hyprland-monitor-scaling \"$2\"", "sh", monitor.name, String(value)]);
  }

  Process {
    id: textSizeProc

    command: ["omarchy-display-text-size"]
    stdout: StdioCollector {
      onStreamFinished: {
        const size = DisplayCore.parseTextSize(text);
        if (size !== null) display.textSize = size;
      }
    }
  }

  Timer {
    id: confirmTimer

    interval: 1200
    onTriggered: display.readTextSize()
  }
}
