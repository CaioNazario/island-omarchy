pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Services.Pipewire

// Volume da saída padrão (specs/08-controles-rapidos.md "Volume"): Pipewire,
// máximo 100% sem amplificação.
Scope {
  id: audio

  readonly property PwNode sink: Pipewire.defaultAudioSink
  readonly property bool available: sink !== null && sink.audio !== null
  readonly property int percent: available ? Math.round(Math.min(1, sink.audio.volume) * 100) : 0
  readonly property bool muted: available && sink.audio.muted

  // Sem o tracker, o Pipewire não vincula o nó e `audio.volume` fica parado.
  PwObjectTracker {
    objects: audio.sink ? [audio.sink] : []
  }

  /** Mexer no slider tira do mudo, como o slider de volume do Omarchy. */
  function setPercent(value) {
    if (!available) return;
    const clamped = Math.max(0, Math.min(100, Math.round(value)));
    sink.audio.volume = clamped / 100;
    if (clamped > 0 && sink.audio.muted) sink.audio.muted = false;
  }
}
