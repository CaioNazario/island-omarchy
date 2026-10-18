pragma ComponentBehavior: Bound

import QtQuick

// `.btn-primary` e `.btn-ghost` do design (design/tokens.css): texto `accent`
// 12px/500, 32px de altura; o primário tem anel `accent`. Hover/ativo pintam
// `accent` a 12/22% (primário) ou 10/18% (ghost).
Rectangle {
  id: button

  required property string label
  property bool primary: false

  signal clicked

  implicitHeight: 32
  implicitWidth: text.implicitWidth + (primary ? 24 : 20)
  radius: 8
  border.width: primary ? 1 : 0
  border.color: Tokens.accent
  color: pointer.pressed ? (primary ? Tokens.btnPrimaryActive : Tokens.btnGhostActive)
    : pointer.containsMouse ? (primary ? Tokens.btnPrimaryHover : Tokens.btnGhostHover)
    : "transparent"

  IslandText {
    id: text

    anchors.centerIn: parent
    text: button.label
    px: 12
    color: Tokens.accent
  }

  MouseArea {
    id: pointer

    anchors.fill: parent
    hoverEnabled: true
    cursorShape: Qt.PointingHandCursor
    onClicked: button.clicked()
  }
}
