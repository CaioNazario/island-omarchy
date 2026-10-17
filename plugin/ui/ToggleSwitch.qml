pragma ComponentBehavior: Bound

import QtQuick

// Switch dos cabeçalhos de `bt` (32×18, bolinha 14) e `wifi` (`large`, 36×20,
// bolinha 16, design v5) (specs/08-controles-rapidos.md): ligado
// `accent-600`, desligado `neutral-700`, bolinha `neutral-100`, 180ms.
Rectangle {
  id: toggle

  property bool on: false
  property bool large: false
  readonly property int knob: large ? 16 : 14

  signal clicked

  implicitWidth: large ? 36 : 32
  implicitHeight: knob + 4
  radius: height / 2
  color: on ? Tokens.accent600 : Tokens.neutral700

  Behavior on color {
    ColorAnimation {
      duration: 180
    }
  }

  Rectangle {
    x: toggle.on ? toggle.width - toggle.knob - 2 : 2
    y: 2
    width: toggle.knob
    height: toggle.knob
    radius: toggle.knob / 2
    color: Tokens.neutral100

    Behavior on x {
      NumberAnimation {
        duration: 180
        easing.type: Easing.OutQuad
      }
    }
  }

  MouseArea {
    anchors.fill: parent
    cursorShape: Qt.PointingHandCursor
    onClicked: toggle.clicked()
  }
}
