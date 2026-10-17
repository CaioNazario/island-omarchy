pragma ComponentBehavior: Bound

import QtQuick

// Tile 38×38 raio 19 da linha de controles (specs/08-controles-rapidos.md):
// ligado `accent-600`/`neutral-100`, desligado `neutral-800`/`neutral-300`, 180ms.
Rectangle {
  id: tile

  required property string glyph
  property bool on: false

  signal clicked

  implicitWidth: 38
  implicitHeight: 38
  radius: 19
  color: on ? Tokens.accent600 : Tokens.neutral800
  border.width: activeFocus ? 2 : 0
  border.color: Tokens.accent
  activeFocusOnTab: true

  Behavior on color {
    ColorAnimation {
      duration: 180
    }
  }

  PhIcon {
    anchors.centerIn: parent
    glyph: tile.glyph
    size: 17
    color: tile.on ? Tokens.neutral100 : Tokens.neutral300
  }

  MouseArea {
    anchors.fill: parent
    cursorShape: Qt.PointingHandCursor
    onClicked: tile.clicked()
  }

  Keys.onReturnPressed: clicked()
  Keys.onSpacePressed: clicked()
}
