pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts

// Pílula de brilho/volume da linha de controles (specs/08-controles-rapidos.md):
// `flex: 1`, 32px, raio 16, `neutral-900`, padding 0 11px, gap 8px, ícone 16px.
// Com `glyphAction`, o ícone vira um botão 24×24 (hover `neutral-800`) que
// abre o gerenciador de volume (design v4).
Rectangle {
  id: pill

  required property string glyph
  required property int value
  property bool glyphAction: false

  signal moved(int value)
  signal glyphClicked
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

    Rectangle {
      Layout.leftMargin: pill.glyphAction ? -5 : 0
      implicitWidth: pill.glyphAction ? 24 : 16
      implicitHeight: pill.glyphAction ? 24 : 16
      radius: 12
      color: pill.glyphAction && glyphPointer.containsMouse ? Tokens.neutral800 : "transparent"

      PhIcon {
        anchors.centerIn: parent
        glyph: pill.glyph
        color: pill.glyphAction ? Tokens.text : Tokens.neutral300
      }

      MouseArea {
        id: glyphPointer

        anchors.fill: parent
        enabled: pill.glyphAction
        hoverEnabled: true
        cursorShape: Qt.PointingHandCursor
        onClicked: pill.glyphClicked()
      }
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
