pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts

// Pílula de brilho/volume da linha de controles (specs/08-controles-rapidos.md):
// `flex: 1`, 38px, raio 19, `neutral-900`, padding 0 12px, gap 8px, ícone 16px.
Rectangle {
  id: pill

  required property string glyph
  required property int value

  signal moved(int value)
  signal dragStarted
  signal dragEnded

  Layout.fillWidth: true
  implicitHeight: 38
  radius: 19
  color: Tokens.neutral900

  RowLayout {
    anchors.fill: parent
    anchors.leftMargin: 12
    anchors.rightMargin: 12
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
