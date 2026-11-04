pragma ComponentBehavior: Bound

import QtQuick

// Botão redondo pequeno, só ícone (Wi-Fi: testar de novo, AI: atualizar).
// 22×22 redondo, ícone 13px, hover `neutral-800`/`text`.
Rectangle {
  id: small

  required property string glyph
  property color restingColor: Tokens.neutral400
  property int iconSize: 13

  signal clicked

  implicitWidth: 22
  implicitHeight: 22
  radius: width / 2
  color: smallPointer.containsMouse ? Tokens.neutral800 : "transparent"

  PhIcon {
    anchors.centerIn: parent
    glyph: small.glyph
    size: small.iconSize
    color: smallPointer.containsMouse ? Tokens.text : small.restingColor
  }

  MouseArea {
    id: smallPointer

    anchors.fill: parent
    hoverEnabled: true
    cursorShape: Qt.PointingHandCursor
    onClicked: small.clicked()
  }
}
