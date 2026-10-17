pragma ComponentBehavior: Bound

import QtQuick

// Switch 32×18 raio 9 dos cabeçalhos de `wifi` e `bt`
// (specs/08-controles-rapidos.md): ligado `accent-600`, desligado
// `neutral-700`, bolinha 14px `neutral-100`, 180ms.
Rectangle {
  id: toggle

  property bool on: false

  signal clicked

  implicitWidth: 32
  implicitHeight: 18
  radius: 9
  color: on ? Tokens.accent600 : Tokens.neutral700

  Behavior on color {
    ColorAnimation {
      duration: 180
    }
  }

  Rectangle {
    x: toggle.on ? 16 : 2
    y: 2
    width: 14
    height: 14
    radius: 7
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
