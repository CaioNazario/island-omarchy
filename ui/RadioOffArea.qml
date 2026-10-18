pragma ComponentBehavior: Bound

import QtQuick

// Rádio desligado (specs/08-controles-rapidos.md): ícone 22px + texto 12.5px
// `neutral-500`, centralizados na altura da área.
Item {
  id: area

  required property string glyph
  required property string text

  Column {
    anchors.centerIn: parent
    spacing: 8

    PhIcon {
      anchors.horizontalCenter: parent.horizontalCenter
      glyph: area.glyph
      size: 22
      color: Tokens.neutral500
    }

    IslandText {
      anchors.horizontalCenter: parent.horizontalCenter
      text: area.text
      px: 12.5
      font.weight: Tokens.weightBody
      color: Tokens.neutral500
    }
  }
}
