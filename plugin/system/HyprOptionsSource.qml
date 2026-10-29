pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Hyprland
import Quickshell.Io
import "../core/hyprOptions.mjs" as HyprOptionsCore

// Opções do Hyprland que a aparência usa (specs/19-aparencia.md "Blur" e
// "Cantos"): `decoration:blur:enabled`, sem o qual o compositor não borra nada
// e o fundo translúcido deixa a tela legível por trás (specs/14-spikes.md,
// S9), e `decoration:rounding`, o raio das janelas, para os cantos Tema.
// Lidas ao subir e a cada `configreloaded`.
Scope {
  id: options

  property bool blurEnabled: false
  // -1 sem o valor: os cantos Tema ficam no raio do design.
  property int rounding: -1

  function probe() {
    blurProbe.running = true;
    roundingProbe.running = true;
  }

  Component.onCompleted: probe()

  Connections {
    target: Hyprland

    function onRawEvent(event) {
      if (event.name === "configreloaded") options.probe();
    }
  }

  Process {
    id: blurProbe

    command: ["hyprctl", "getoption", "decoration:blur:enabled", "-j"]
    stdout: StdioCollector {
      onStreamFinished: options.blurEnabled = HyprOptionsCore.parseBoolOption(text)
    }
  }

  Process {
    id: roundingProbe

    command: ["hyprctl", "getoption", "decoration:rounding", "-j"]
    stdout: StdioCollector {
      onStreamFinished: options.rounding = HyprOptionsCore.parseIntOption(text)
    }
  }
}
