pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts

// Cabeçalho dos painéis do v5 (`display`, `battery`, `wifi`): 44px, gap 12:
// ícone 26px · título 14px/500 + legenda 10.5px maiúscula `letter-spacing .1em`
// `neutral-400` · conteúdo extra à direita (valor grande, botões).
RowLayout {
  id: header

  required property string glyph
  property color glyphColor: Tokens.accent
  required property string title
  property string subtitle: ""
  default property alias trailing: extra.data

  implicitHeight: 44
  spacing: 12

  PhIcon {
    glyph: header.glyph
    size: 26
    color: header.glyphColor
  }

  ColumnLayout {
    Layout.fillWidth: true
    spacing: 2

    IslandText {
      Layout.fillWidth: true
      text: header.title
      px: 14
      elide: Text.ElideRight
    }

    IslandText {
      Layout.fillWidth: true
      visible: header.subtitle !== ""
      text: header.subtitle
      px: 10.5
      font.weight: Tokens.weightBody
      font.capitalization: Font.AllUppercase
      font.letterSpacing: 1.05
      color: Tokens.neutral400
      elide: Text.ElideRight
    }
  }

  Row {
    id: extra

    spacing: 4
  }
}
