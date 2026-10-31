pragma ComponentBehavior: Bound

import QtQuick

// Paleta de gradiente na aba Aparência (specs/19-aparencia.md), como no
// omadock: faixa 64×30 com as 3 cores em 0/50/100% e o nome embaixo.
// Escolhida: anel de 2px `accent` e nome `accent`; as outras, anel `neutral-700`.
Item {
  id: tile

  required property string name
  required property var colors
  property bool chosen: false

  signal clicked

  implicitWidth: 64
  implicitHeight: 30 + 4 + caption.implicitHeight

  Rectangle {
    id: strip

    width: 64
    height: 30
    radius: 8
    border.width: tile.chosen ? 2 : 1
    border.color: tile.chosen ? Tokens.accent : pointer.containsMouse ? Tokens.neutral400 : Tokens.neutral700
    gradient: Gradient {
      orientation: Gradient.Horizontal

      GradientStop {
        position: 0
        color: tile.colors[0]
      }
      GradientStop {
        position: 0.5
        color: tile.colors[1]
      }
      GradientStop {
        position: 1
        color: tile.colors[2]
      }
    }
  }

  IslandText {
    id: caption

    anchors.top: strip.bottom
    anchors.topMargin: 4
    anchors.horizontalCenter: strip.horizontalCenter
    text: tile.name
    px: 11
    font.weight: Tokens.weightBody
    color: tile.chosen ? Tokens.accent : Tokens.neutral400
  }

  MouseArea {
    id: pointer

    anchors.fill: parent
    hoverEnabled: true
    cursorShape: Qt.PointingHandCursor
    onClicked: tile.clicked()
  }
}
