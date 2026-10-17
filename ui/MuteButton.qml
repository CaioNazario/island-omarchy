pragma ComponentBehavior: Bound

import QtQuick

// Botão de mudo do `mixer` (specs/08 "Modo `mixer`"): redondo, hover
// `neutral-800`; mudo com fundo `neutral-800` e ícone vermelho claro.
Rectangle {
  id: button

  required property string glyph
  property bool muted: false
  property color restingIconColor: Tokens.neutral400
  property int iconSize: 14

  signal clicked

  implicitWidth: 26
  implicitHeight: 26
  radius: width / 2
  color: muted || pointer.containsMouse ? Tokens.neutral800 : "transparent"

  Behavior on color {
    ColorAnimation {
      duration: 180
    }
  }

  PhIcon {
    anchors.centerIn: parent
    glyph: button.glyph
    size: button.iconSize
    color: button.muted ? Tokens.powerOffText : pointer.containsMouse ? Tokens.text : button.restingIconColor
  }

  MouseArea {
    id: pointer

    anchors.fill: parent
    hoverEnabled: true
    cursorShape: Qt.PointingHandCursor
    onClicked: button.clicked()
  }
}
