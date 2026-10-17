pragma ComponentBehavior: Bound

import QtQuick

// Botão da pílula direita (specs/02-barra.md): 24px de altura, raio 12,
// transparente, hover `neutral-900`. Botões de ícone têm 30px de largura.
Rectangle {
  id: button

  property bool active: false
  default property alias content: inner.data
  property int horizontalPadding: 0

  signal clicked

  implicitWidth: horizontalPadding > 0 ? inner.childrenRect.width + 2 * horizontalPadding : 30
  implicitHeight: 24
  radius: 12
  color: pointer.containsMouse || active ? Tokens.neutral900 : "transparent"

  Item {
    id: inner

    anchors.fill: parent
    anchors.leftMargin: button.horizontalPadding
    anchors.rightMargin: button.horizontalPadding
  }

  MouseArea {
    id: pointer

    anchors.fill: parent
    hoverEnabled: true
    cursorShape: Qt.PointingHandCursor
    onClicked: button.clicked()
  }
}
