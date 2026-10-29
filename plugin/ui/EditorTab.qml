pragma ComponentBehavior: Bound

import QtQuick

// Aba do cabeçalho do editor (specs/17-editor-ambientes.md "Abas"), no estilo
// das abas de ambiente: 30px, raio 15, padding 0 14px, 13px. Ativa
// `accent-900` com anel `accent-700` e texto `accent-100`; inativa
// `neutral-900`, texto `neutral-300`, hover `neutral-800`.
Rectangle {
  id: tab

  required property string label
  property bool active: false

  signal clicked

  implicitWidth: caption.implicitWidth + 28
  implicitHeight: 30
  radius: 15
  color: active ? Tokens.accent900 : pointer.containsMouse ? Tokens.neutral800 : Tokens.neutral900
  border.width: active ? 1 : 0
  border.color: Tokens.accent700

  IslandText {
    id: caption

    anchors.centerIn: parent
    text: tab.label
    color: tab.active ? Tokens.accent100 : Tokens.neutral300
  }

  MouseArea {
    id: pointer

    anchors.fill: parent
    hoverEnabled: true
    cursorShape: Qt.PointingHandCursor
    onClicked: tab.clicked()
  }
}
