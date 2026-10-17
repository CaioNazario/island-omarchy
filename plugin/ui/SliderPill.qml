pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts

// Pílula de brilho/volume da linha de controles (specs/08-controles-rapidos.md):
// `flex: 1`, 32px, raio 16, `neutral-900`, padding 0 11px, gap 8px, ícone 16px.
Rectangle {
  id: pill

  required property string glyph
  required property int value

  signal moved(int value)
  signal dragStarted
  signal dragEnded

  Layout.fillWidth: true
  implicitHeight: 32
  radius: 16
  color: Tokens.neutral900

  RowLayout {
    anchors.fill: parent
    anchors.leftMargin: 11
    anchors.rightMargin: 11
    spacing: 8

    PhIcon {
      glyph: pill.glyph
      color: Tokens.neutral300
    }

    IslandSlider {
      Layout.fillWidth: true
      value: pill.value
      thumbSize: 12
      onMoved: value => pill.moved(value)
      onDragStarted: pill.dragStarted()
      onDragEnded: pill.dragEnded()
    }
  }
}
