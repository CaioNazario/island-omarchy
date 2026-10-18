pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Effects
import "../core/waves.mjs" as WavesCore

// Ondas da música (specs/05-musica.md "Ondas"): barras `accent` com brilho
// de 8px que pulsam no ritmo enquanto toca e voltam a 15% ao pausar. O
// quadro a quadro para quando as barras assentam ou o item some.
Row {
  id: waves

  property int count: 5
  property int barHeight: 20
  property int barWidth: 3
  property bool playing: false

  property var waveState: WavesCore.createWaves(count)
  readonly property bool settled: WavesCore.wavesSettled(waveState)

  spacing: 3
  height: barHeight

  onCountChanged: waveState = WavesCore.createWaves(count)

  FrameAnimation {
    id: frames

    running: waves.visible && (waves.playing || !waves.settled)
    onTriggered: {
      waves.waveState = WavesCore.stepWaves(waves.waveState, {
        dtSec: frames.frameTime,
        nowSec: frames.elapsedTime,
        playing: waves.playing
      });
    }
  }

  Repeater {
    model: waves.count

    Item {
      id: column

      required property int index

      width: waves.barWidth
      height: waves.barHeight
      transform: Scale {
        origin.y: column.height / 2
        yScale: waves.waveState.levels[column.index] ?? WavesCore.WAVES_REST
      }

      RectangularShadow {
        anchors.fill: parent
        radius: waves.barWidth / 2
        blur: 8
        color: Qt.alpha(Tokens.accent, 0.45)
      }

      Rectangle {
        anchors.fill: parent
        radius: waves.barWidth / 2
        color: Tokens.accent
      }
    }
  }
}
