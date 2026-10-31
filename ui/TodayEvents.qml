pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/calendar.mjs" as CalendarCore

// Eventos de hoje (specs/06-calendario.md "Eventos"): ponto 8px + nome +
// horário. Sem fonte de eventos (spec 14, S8) ou sem eventos, só o título.
ColumnLayout {
  id: list

  required property var bar
  property bool showTitle: true
  property real namePx: 12
  property real timePx: 10.5
  property bool timeOnRight: false
  property int gap: 12

  readonly property var events: CalendarCore.todayEvents(bar.system.calendar.events, new Date(bar.nowMs), I18n.language)
  readonly property var dotColors: ({ accent500: Tokens.accent500, accent300: Tokens.accent300, neutral400: Tokens.neutral400 })

  spacing: gap

  IslandText {
    visible: list.showTitle
    text: CalendarCore.todayTitle(new Date(list.bar.nowMs), I18n.language)
  }

  Repeater {
    model: list.events

    delegate: RowLayout {
      id: event

      required property var modelData

      Layout.fillWidth: true
      spacing: 8

      Rectangle {
        implicitWidth: 8
        implicitHeight: 8
        radius: 4
        color: list.dotColors[event.modelData.dot]
      }

      IslandText {
        Layout.fillWidth: list.timeOnRight
        text: event.modelData.name
        px: list.namePx
        font.weight: Tokens.weightBody
        elide: Text.ElideRight
      }

      IslandText {
        text: event.modelData.time
        px: list.timePx
        font.weight: Tokens.weightBody
        color: Tokens.neutral500
      }
    }
  }
}
