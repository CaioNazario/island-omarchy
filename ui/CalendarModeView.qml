pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/calendar.mjs" as CalendarCore

// Modo `calendar` (specs/06-calendario.md, 480 × 150/214): padding 14px 16px,
// gap 16px, duas colunas separadas por divisor vertical em degradê.
Item {
  id: view

  required property var bar
  readonly property var grid: CalendarCore.monthGrid(new Date(bar.nowMs), bar.calendarOffset)

  RowLayout {
    anchors.fill: parent
    anchors.leftMargin: 16
    anchors.rightMargin: 16
    anchors.topMargin: 14
    anchors.bottomMargin: 14
    spacing: 16

    ColumnLayout {
      // Fixa: a grade mede pela largura dada (width / 7), sem largura própria.
      Layout.preferredWidth: 264
      Layout.maximumWidth: 264
      Layout.alignment: Qt.AlignTop
      spacing: 6

      RowLayout {
        Layout.fillWidth: true

        IslandText {
          Layout.fillWidth: true
          text: view.grid.title
        }

        CalendarControls {
          bar: view.bar
        }
      }

      CalendarDays {
        Layout.fillWidth: true
        weeks: CalendarCore.visibleWeeks(view.grid, view.bar.calendarView)
      }
    }

    Rectangle {
      Layout.fillHeight: true
      implicitWidth: 1
      gradient: Gradient {
        GradientStop {
          position: 0
          color: Tokens.dividerFadeEnd
        }
        GradientStop {
          position: 0.5
          color: Tokens.neutral800
        }
        GradientStop {
          position: 1
          color: Tokens.dividerFadeEnd
        }
      }
    }

    Flickable {
      id: eventsArea

      Layout.fillWidth: true
      Layout.fillHeight: true
      clip: true
      contentHeight: events.implicitHeight
      boundsBehavior: Flickable.StopAtBounds

      TodayEvents {
        id: events

        // No Flickable, `parent` é o contentItem, de largura 0.
        width: eventsArea.width
        bar: view.bar
      }
    }
  }
}
