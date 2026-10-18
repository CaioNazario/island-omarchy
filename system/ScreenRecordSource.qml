pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io

// "Gravar tela" (specs/08 "Linha de controles"), como o indicador de gravação
// do Omarchy (/usr/share/omarchy/shell/plugins/bar/indicators/ScreenRecording.qml):
// gravando = `gpu-screen-recorder` vivo; parar chama
// `omarchy-capture-screenrecording --stop-recording`, começar abre o menu de
// captura do Omarchy (região, áudio, webcam). Só consulta com a linha de
// controles à vista.
Scope {
  id: recorder

  property bool watching: false
  property bool recording: false

  function refresh() {
    if (!probe.running) probe.running = true;
  }

  function toggle() {
    Quickshell.execDetached(recording ? ["omarchy-capture-screenrecording", "--stop-recording"] : ["omarchy-menu", "toggle", "trigger.capture.screenrecord"]);
    // O comando leva um instante para subir ou descer o gravador.
    settleTimer.restart();
  }

  onWatchingChanged: if (watching) refresh()

  Process {
    id: probe

    command: ["pgrep", "--quiet", "-f", "^gpu-screen-recorder"]
    onExited: exitCode => recorder.recording = exitCode === 0
  }

  Timer {
    interval: 2000
    repeat: true
    running: recorder.watching
    onTriggered: recorder.refresh()
  }

  Timer {
    id: settleTimer

    interval: 600
    onTriggered: recorder.refresh()
  }
}
