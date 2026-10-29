pragma ComponentBehavior: Bound

import QtQuick

// Amostra de cor sólida da aba Aparência (specs/19-aparencia.md): círculo de
// 24px com anel `neutral-700`; escolhida, anel de 2px `accent`.
Rectangle {
  id: swatch

  property bool chosen: false

  signal clicked

  implicitWidth: 24
  implicitHeight: 24
  radius: 12
  border.width: chosen ? 2 : 1
  border.color: chosen ? Tokens.accent : pointer.containsMouse ? Tokens.neutral400 : Tokens.neutral700

  MouseArea {
    id: pointer

    anchors.fill: parent
    hoverEnabled: true
    cursorShape: Qt.PointingHandCursor
    onClicked: swatch.clicked()
  }
}
