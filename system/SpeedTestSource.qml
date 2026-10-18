pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io
import "../core/wifiPanel.mjs" as PanelCore

// Teste de velocidade do modo `wifi` (specs/08 "Modo `wifi`"), como o painel
// de velocidade do Omarchy: `omarchy-network-speedtest down`, depois `up`,
// cada fase parada em 5s; cada linha da saída é a medida em Mbps até ali.
Scope {
  id: speed

  property string phase: "idle"
  property real down: 0
  property real up: 0
  property real phaseStartedAt: 0
  property real now: 0
  readonly property real progress: PanelCore.speedProgress(phase, now - phaseStartedAt)
  readonly property bool running: phase === "down" || phase === "up"
  // Parada pelo timer ou por `stop()`: a saída com erro não conta como falha.
  property bool stopping: false

  function run() {
    if (proc.running) return;
    down = 0;
    up = 0;
    start("down");
  }

  function stop() {
    if (!running) return;
    phase = "idle";
    stopping = true;
    proc.running = false;
  }

  function start(next) {
    phase = next;
    phaseStartedAt = Date.now();
    now = phaseStartedAt;
    stopping = false;
    proc.command = ["omarchy-network-speedtest", next];
    proc.running = true;
  }

  function finishPhase() {
    if (phase === "down") start("up");
    else if (phase === "up") phase = "done";
  }

  Process {
    id: proc

    stdout: SplitParser {
      onRead: line => {
        const value = PanelCore.parseSpeedLine(line);
        if (value === null) return;
        if (speed.phase === "down") speed.down = value;
        else if (speed.phase === "up") speed.up = value;
      }
    }
    onExited: exitCode => {
      if (speed.stopping || exitCode === 0) {
        speed.stopping = false;
        speed.finishPhase();
        return;
      }
      speed.phase = "failed";
    }
  }

  // Encerra a fase em 5s e anda a barra de progresso.
  Timer {
    interval: 100
    repeat: true
    running: speed.running
    onTriggered: {
      speed.now = Date.now();
      if (speed.now - speed.phaseStartedAt < PanelCore.SPEED_PHASE_MS || !proc.running) return;
      speed.stopping = true;
      proc.running = false;
    }
  }
}
