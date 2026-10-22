pragma ComponentBehavior: Bound

import QtQuick

// Tile 32×32 raio 16 da linha de controles (specs/08-controles-rapidos.md):
// ligado `tileOn` (ou `onColor`)/`tileOnIcon`, desligado `tileOff`/`tileOffIcon`
// (no Nocturne Roxo, `accent-600`/`neutral-100` e `neutral-800`/`neutral-300`
// do design), 180ms.
Rectangle {
  id: tile

  required property string glyph
  property bool on: false
  property color onColor: Tokens.tileOn
  // Ícone sobre o `onColor`; o vermelho da gravação pede o claro.
  property color onIconColor: Tokens.tileOnIcon

  signal clicked

  implicitWidth: 32
  implicitHeight: 32
  radius: 16
  color: on ? onColor : Tokens.tileOff
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
    size: 15
    color: tile.on ? tile.onIconColor : Tokens.tileOffIcon
  }

  MouseArea {
    anchors.fill: parent
    cursorShape: Qt.PointingHandCursor
    onClicked: tile.clicked()
  }

  Keys.onReturnPressed: clicked()
  Keys.onSpacePressed: clicked()
}
