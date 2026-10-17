pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import "../core/clock.mjs" as Clock

// Modo compacto (specs/03-ilha.md "Modo compacto"): `[clima] · [hora] · [dia]`,
// gap 10px, 13px/500. Sem clima (spec 07), o item e seu separador somem.
Row {
  id: compact

  required property var weather

  spacing: 10

  SystemClock {
    id: clock

    precision: SystemClock.Minutes
  }

  Row {
    anchors.verticalCenter: parent.verticalCenter
    visible: compact.weather.available
    spacing: 4

    PhIcon {
      anchors.verticalCenter: parent.verticalCenter
      glyph: compact.weather.glyph || "sun-fill"
      size: 15
      color: Tokens.accent300
    }

    IslandText {
      anchors.verticalCenter: parent.verticalCenter
      text: compact.weather.temperature
      color: Tokens.neutral300
    }
  }

  Dot {
    visible: compact.weather.available
  }

  IslandText {
    anchors.verticalCenter: parent.verticalCenter
    text: Clock.formatClock(clock.date)
  }

  Dot {}

  IslandText {
    anchors.verticalCenter: parent.verticalCenter
    text: Clock.formatDay(clock.date)
  }

  component Dot: Rectangle {
    anchors.verticalCenter: parent ? parent.verticalCenter : undefined
    width: 3
    height: 3
    radius: 1.5
    color: Tokens.neutral600
  }
}
