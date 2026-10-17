pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io

// Brilho do monitor focado pelo mesmo script que as teclas do Omarchy usam
// (`omarchy-brightness-display`: backlight interno, DDC ou monitor Apple).
// Sem argumento, o script imprime a porcentagem; sem backlight, falha.
Scope {
  id: brightness

  property bool available: false
  property int percent: 0
  property int pendingPercent: -1

  Component.onCompleted: refresh()

  function refresh() {
    if (!reader.running) reader.running = true;
  }

  /** Valor que chegou num pedido de OSD: já foi aplicado por quem pediu. */
  function reportPercent(value) {
    available = true;
    percent = value;
  }

  function setPercent(value) {
    percent = Math.max(1, Math.min(100, Math.round(value)));
    pendingPercent = percent;
    if (!writer.running) flush();
  }

  // Um processo por vez; arrastar o slider só guarda o último valor.
  function flush() {
    if (pendingPercent < 0) return;
    writer.command = ["omarchy-brightness-display", "--no-osd", pendingPercent + "%"];
    pendingPercent = -1;
    writer.running = true;
  }

  Process {
    id: reader

    command: ["omarchy-brightness-display"]
    stdout: StdioCollector {
      onStreamFinished: {
        const value = parseInt(text, 10);
        brightness.available = !isNaN(value);
        if (brightness.available) brightness.percent = value;
      }
    }
  }

  Process {
    id: writer

    onExited: brightness.flush()
  }
}
