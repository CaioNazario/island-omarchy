pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/music.mjs" as MusicCore

// Progresso (specs/05-musica.md): barra 3px `accent` sobre `neutral-800`, tempo
// em `m:ss`. `inline`: posição · barra · duração (modo `music`); senão a
// barra e, abaixo à direita, `pos / duração` (cartão central).
ColumnLayout {
  id: progress

  required property var music
  property bool inline: true
  property real textPx: 10

  readonly property string position: MusicCore.formatTrackTime(music.positionUs)
  readonly property string length: MusicCore.formatTrackTime(music.lengthUs)

  spacing: 4

  RowLayout {
    Layout.fillWidth: true
    spacing: 8

    ProgressLabel {
      visible: progress.inline
      text: progress.position
    }

    Rectangle {
      Layout.fillWidth: true
      implicitHeight: 3
      radius: 1.5
      color: Tokens.neutral800

      Rectangle {
        width: parent.width * MusicCore.progressFraction(progress.music.positionUs, progress.music.lengthUs)
        height: parent.height
        radius: 1.5
        color: Tokens.accent
      }
    }

    ProgressLabel {
      visible: progress.inline
      text: progress.length
    }
  }

  ProgressLabel {
    Layout.alignment: Qt.AlignRight
    visible: !progress.inline
    text: progress.position + " / " + progress.length
  }

  component ProgressLabel: IslandText {
    px: progress.textPx
    font.weight: Tokens.weightBody
    color: Tokens.neutral500
  }
}
