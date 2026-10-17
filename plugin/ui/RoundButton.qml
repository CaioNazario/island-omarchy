pragma ComponentBehavior: Bound

import QtQuick

// Configurações e Energia (specs/09-sessao-energia.md): 32×32 raio 16,
// hover `neutral-700`/`text`, pressionado `accent-800`. `restingColor` e
// `restingIconColor` mudam com a linha de energia aberta.
Rectangle {
  id: button

  required property string glyph
  property color restingColor: Tokens.neutral800
  property color restingIconColor: Tokens.neutral300

  signal clicked

  readonly property bool hovered: pointer.containsMouse
  readonly property bool pressed: pointer.pressed

  implicitWidth: 32
  implicitHeight: 32
  radius: 16
  color: pressed ? Tokens.accent800 : hovered ? Tokens.neutral700 : restingColor
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
    glyph: button.glyph
    size: 15
    color: button.pressed || button.hovered ? Tokens.text : button.restingIconColor
  }

  MouseArea {
    id: pointer

    anchors.fill: parent
    hoverEnabled: true
    cursorShape: Qt.PointingHandCursor
    onClicked: button.clicked()
  }

  Keys.onReturnPressed: clicked()
  Keys.onSpacePressed: clicked()
}
