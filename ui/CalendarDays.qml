pragma ComponentBehavior: Bound

import QtQuick
import "../core/calendar.mjs" as CalendarCore

// Cabeçalho dos dias e semanas visíveis (specs/06-calendario.md "Grade"):
// hoje `accent-600`/`neutral-100`/600; do mês `text`; fora do mês `neutral-700`.
// Tamanhos do modo `calendar` por padrão; o cartão passa os seus.
Column {
  id: days

  required property var weeks
  property real headerPx: 10.5
  property real numberPx: 12
  property int cellHeight: 22
  property int pillWidth: 24
  property int pillHeight: 20

  Row {
    width: parent.width

    Repeater {
      model: CalendarCore.WEEKDAY_HEADERS

      delegate: IslandText {
        required property string modelData

        width: days.width / 7
        horizontalAlignment: Text.AlignHCenter
        text: modelData
        px: days.headerPx
        font.weight: Tokens.weightBody
        color: Tokens.neutral500
      }
    }
  }

  Repeater {
    model: days.weeks

    delegate: Row {
      id: week

      required property var modelData

      width: days.width
      height: days.cellHeight

      Repeater {
        model: week.modelData

        delegate: Item {
          id: cell

          required property var modelData
          readonly property bool today: modelData.kind === "today"

          width: days.width / 7
          height: days.cellHeight

          Rectangle {
            anchors.centerIn: parent
            width: days.pillWidth
            height: days.pillHeight
            radius: height / 2
            color: cell.today ? Tokens.accent600 : "transparent"
          }

          IslandText {
            anchors.centerIn: parent
            text: cell.modelData.day
            px: days.numberPx
            font.weight: cell.today ? Font.DemiBold : Tokens.weightBody
            color: cell.today ? Tokens.neutral100 : cell.modelData.kind === "in-month" ? Tokens.text : Tokens.neutral700
          }
        }
      }
    }
  }
}
