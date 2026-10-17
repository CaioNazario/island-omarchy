import QtQuick
import Quickshell
import "../core/clock.mjs" as Clock

// Modo compacto (specs/03-ilha.md "Modo compacto"): `[clima] · [hora] · [dia]`,
// gap 10px, 13px/500. O clima entra com a spec 07.
Row {
  spacing: 10

  SystemClock {
    id: clock

    precision: SystemClock.Minutes
  }

  IslandText {
    anchors.verticalCenter: parent.verticalCenter
    text: Clock.formatClock(clock.date)
  }

  Rectangle {
    anchors.verticalCenter: parent.verticalCenter
    width: 3
    height: 3
    radius: 1.5
    color: Tokens.neutral600
  }

  IslandText {
    anchors.verticalCenter: parent.verticalCenter
    text: Clock.formatDay(clock.date)
  }
}
