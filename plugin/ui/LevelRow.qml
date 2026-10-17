pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts

// Modos `volume`, `brightness` e `osd` (specs/08-controles-rapidos.md):
// padding 0 18px, gap 14px: ícone 18px · slider · valor `70%` (34px, à
// direita, 12px `neutral-300`). No `osd` de mensagem, o texto toma o lugar do
// slider; no de progresso, a barra é só leitura.
Item {
  id: row

  required property string glyph
  property int value: 0
  property bool interactive: true
  property string message: ""

  signal moved(int value)
  signal dragStarted
  signal dragEnded

  RowLayout {
    anchors.fill: parent
    anchors.leftMargin: 18
    anchors.rightMargin: 18
    spacing: 14

    PhIcon {
      glyph: row.glyph
      size: 18
      color: Tokens.neutral300
    }

    IslandSlider {
      Layout.fillWidth: true
      visible: row.message === ""
      value: row.value
      thumbSize: 14
      glow: true
      interactive: row.interactive
      onMoved: value => row.moved(value)
      onDragStarted: row.dragStarted()
      onDragEnded: row.dragEnded()
    }

    IslandText {
      Layout.preferredWidth: 34
      visible: row.message === ""
      horizontalAlignment: Text.AlignRight
      text: row.value + "%"
      color: Tokens.neutral300
      px: 12
      font.weight: Tokens.weightBody
    }

    IslandText {
      Layout.fillWidth: true
      visible: row.message !== ""
      text: row.message
      elide: Text.ElideRight
      px: 12.5
      font.weight: Tokens.weightBody
    }
  }
}
