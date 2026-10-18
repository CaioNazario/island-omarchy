pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io

// "Ditado" (specs/08 "Linha de controles"): o Voxtype do Omarchy. O estado vem
// de `omarchy-voxtype-status` (JSON por linha, `alt`/`class` = idle,
// recording, transcribing), como o indicador de ditado do Omarchy
// (/usr/share/omarchy/shell/plugins/bar/indicators/Dictation.qml); o clique é o
// `voxtype record toggle` do atalho Super+Ctrl+X. Sem voxtype, o tile some.
Scope {
  id: dictation

  property bool watching: false
  property bool available: false
  property string phase: "idle"
  readonly property bool recording: phase === "recording"

  function toggle() {
    if (available) Quickshell.execDetached(["voxtype", "record", "toggle"]);
  }

  /** Uma linha do status; JSON inválido mantém a fase anterior. */
  function readStatus(line) {
    try {
      const status = JSON.parse(line);
      phase = String(status.alt || status["class"] || "idle");
    } catch (error) {
      console.warn("island: voxtype status is not JSON, got", line);
    }
  }

  Process {
    running: true
    command: ["sh", "-c", "command -v voxtype"]
    onExited: exitCode => dictation.available = exitCode === 0
  }

  // O status segue enquanto a linha de controles está à vista; o
  // `omarchy-voxtype-status` usa `setpriv --pdeathsig` e morre com o processo.
  Process {
    running: dictation.watching && dictation.available
    command: ["omarchy-voxtype-status"]
    stdout: SplitParser {
      onRead: line => dictation.readStatus(line)
    }
    onRunningChanged: if (!running) dictation.phase = "idle"
  }
}
