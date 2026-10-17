pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts

// Cabeçalho das seções de `wifi` e `bt` (specs/08-controles-rapidos.md):
// 26px, padding 0 6px, gap 8px: ícone 14px `neutral-300` · título 13px/500 ·
// status 11px `neutral-500` à direita · switch do rádio.
RowLayout {
  id: header

  required property string glyph
  required property string title
  required property string status
  required property bool radioOn

  signal toggled

  implicitHeight: 26
  spacing: 8

  PhIcon {
    Layout.leftMargin: 6
    glyph: header.glyph
    size: 14
    color: Tokens.neutral300
  }

  IslandText {
    text: header.title
  }

  IslandText {
    Layout.fillWidth: true
    horizontalAlignment: Text.AlignRight
    text: header.status
    px: 11
    font.weight: Tokens.weightBody
    color: Tokens.neutral500
  }

  ToggleSwitch {
    Layout.rightMargin: 6
    on: header.radioOn
    onClicked: header.toggled()
  }
}
