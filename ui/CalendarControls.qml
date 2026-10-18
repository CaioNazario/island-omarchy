pragma ComponentBehavior: Bound

import QtQuick

// Botão Mês/Semana (`ph-caret-down` ↔ `ph-caret-up`) e `‹` `›`
// (specs/06-calendario.md). Os tamanhos mudam entre o modo e o cartão.
Row {
  id: controls

  required property var bar
  property bool showToggle: true
  property bool showNav: true
  property int toggleHeight: 22
  property int navSize: 22
  property real textPx: 11

  spacing: 4

  Rectangle {
    visible: controls.showToggle
    anchors.verticalCenter: parent.verticalCenter
    implicitWidth: toggle.implicitWidth + 16
    implicitHeight: controls.toggleHeight
    radius: height / 2
    color: toggleArea.containsMouse ? Tokens.neutral800 : Tokens.neutral900

    Row {
      id: toggle

      anchors.centerIn: parent
      spacing: 4

      IslandText {
        anchors.verticalCenter: parent.verticalCenter
        text: controls.bar.calendarView === "week" ? "Mês" : "Semana"
        px: controls.textPx
        font.weight: Tokens.weightBody
      }

      PhIcon {
        anchors.verticalCenter: parent.verticalCenter
        glyph: controls.bar.calendarView === "week" ? "caret-down" : "caret-up"
        size: 10
        color: Tokens.neutral300
      }
    }

    MouseArea {
      id: toggleArea

      anchors.fill: parent
      hoverEnabled: true
      cursorShape: Qt.PointingHandCursor
      onClicked: controls.bar.toggleCalendarView()
    }
  }

  Repeater {
    model: controls.showNav ? [-1, 1] : []

    delegate: Rectangle {
      id: nav

      required property int modelData

      anchors.verticalCenter: parent.verticalCenter
      implicitWidth: controls.navSize
      implicitHeight: controls.navSize
      radius: width / 2
      color: navArea.containsMouse ? Tokens.neutral900 : "transparent"

      PhIcon {
        anchors.centerIn: parent
        glyph: nav.modelData < 0 ? "caret-left" : "caret-right"
        size: 12
        color: Tokens.neutral300
      }

      MouseArea {
        id: navArea

        anchors.fill: parent
        hoverEnabled: true
        cursorShape: Qt.PointingHandCursor
        onClicked: controls.bar.stepMonth(nav.modelData)
      }
    }
  }
}
