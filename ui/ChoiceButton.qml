pragma ComponentBehavior: Bound

import QtQuick

// Opção dos grupos de escolha do v5 (escala, DNS, perfil de energia, abas de
// IA): `flex: 1`, raio 9, 12px. Ativa: `accent-900`, anel interno `accent-700`,
// texto `accent-100`. Inativa: transparente, anel `neutral-800`, `neutral-300`;
// hover `neutral-900`/`text`.
Rectangle {
  id: choice

  required property string label
  property string glyph: ""
  property int glyphSize: 14
  property bool active: false

  signal clicked

  implicitHeight: 30
  radius: 9
  color: active ? Tokens.accent900 : pointer.containsMouse ? Tokens.neutral900 : "transparent"
  border.width: 1
  border.color: active ? Tokens.accent700 : Tokens.neutral800

  Behavior on color {
    ColorAnimation {
      duration: 180
    }
  }

  Row {
    anchors.centerIn: parent
    spacing: 7

    PhIcon {
      anchors.verticalCenter: parent.verticalCenter
      visible: choice.glyph !== ""
      glyph: choice.glyph || "info"
      size: choice.glyphSize
      color: text.color
    }

    IslandText {
      id: text

      anchors.verticalCenter: parent.verticalCenter
      text: choice.label
      px: 12
      font.weight: Tokens.weightBody
      color: choice.active ? Tokens.accent100 : pointer.containsMouse ? Tokens.text : Tokens.neutral300
    }
  }

  MouseArea {
    id: pointer

    anchors.fill: parent
    hoverEnabled: true
    cursorShape: Qt.PointingHandCursor
    onClicked: choice.clicked()
  }
}
