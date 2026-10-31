pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/calendar.mjs" as CalendarCore

// Cartão central (specs/05-musica.md "Cartão central"): a ilha a 440 × altura
// do conteúdo, raio 26, padding 18px. Música (se algo toca) · divisor ·
// calendário. A ilha lê `implicitHeight` para a altura.
Item {
  id: card

  required property var bar
  readonly property var music: bar.system.music
  readonly property var grid: CalendarCore.monthGrid(new Date(bar.nowMs), bar.calendarOffset, I18n.language)

  implicitHeight: content.implicitHeight + 36

  ColumnLayout {
    id: content

    anchors.left: parent.left
    anchors.right: parent.right
    anchors.top: parent.top
    anchors.margins: 18
    spacing: 0

    RowLayout {
      Layout.fillWidth: true
      visible: card.music.active
      spacing: 14

      AlbumArt {
        Layout.alignment: Qt.AlignTop
        implicitWidth: 56
        implicitHeight: 56
        url: card.music.artUrl
      }

      ColumnLayout {
        Layout.fillWidth: true
        spacing: 2

        IslandText {
          Layout.fillWidth: true
          text: card.music.artist
          px: 14
          elide: Text.ElideRight
        }

        IslandText {
          Layout.fillWidth: true
          text: card.music.title
          px: 12.5
          font.weight: Tokens.weightBody
          color: Tokens.neutral400
          elide: Text.ElideRight
        }
      }

      MusicWaves {
        count: 7
        barHeight: 26
        playing: card.music.playing
      }

      PhIcon {
        Layout.alignment: Qt.AlignTop
        glyph: card.music.sourceGlyph
        size: 22
        color: Tokens.accent400
      }
    }

    MusicProgress {
      Layout.fillWidth: true
      Layout.topMargin: 12
      visible: card.music.active
      music: card.music
      inline: false
      textPx: 10.5
    }

    MusicControls {
      Layout.alignment: Qt.AlignHCenter
      Layout.topMargin: 6
      visible: card.music.active
      music: card.music
      spacing: 18
      small: 36
      big: 40
      bigIcon: 24
    }

    // Degradê transparente → `neutral-800` (15%–85%) → transparente,
    // sangrando até as bordas do cartão (margin 14px −18px).
    Rectangle {
      Layout.fillWidth: true
      Layout.leftMargin: -18
      Layout.rightMargin: -18
      Layout.topMargin: 14
      Layout.bottomMargin: 14
      visible: card.music.active
      implicitHeight: 1
      gradient: Gradient {
        orientation: Gradient.Horizontal
        GradientStop {
          position: 0
          color: Tokens.dividerFadeEnd
        }
        GradientStop {
          position: 0.15
          color: Tokens.neutral800
        }
        GradientStop {
          position: 0.85
          color: Tokens.neutral800
        }
        GradientStop {
          position: 1
          color: Tokens.dividerFadeEnd
        }
      }
    }

    RowLayout {
      Layout.fillWidth: true
      spacing: 8

      PhIcon {
        glyph: "calendar-blank"
        color: Tokens.neutral300
      }

      IslandText {
        Layout.fillWidth: true
        text: I18n.tr("Calendar")
        px: 14
      }

      CalendarControls {
        bar: card.bar
        showNav: false
        toggleHeight: 24
      }
    }

    RowLayout {
      Layout.fillWidth: true
      Layout.topMargin: 8

      IslandText {
        Layout.fillWidth: true
        text: card.grid.title
      }

      CalendarControls {
        bar: card.bar
        showToggle: false
        navSize: 26
      }
    }

    CalendarDays {
      Layout.fillWidth: true
      Layout.topMargin: 4
      weeks: CalendarCore.visibleWeeks(card.grid, card.bar.calendarView)
      headerPx: 11
      numberPx: 12.5
      cellHeight: 26
      pillWidth: 26
      pillHeight: 22
    }

    TodayEvents {
      Layout.fillWidth: true
      Layout.topMargin: 12
      bar: card.bar
      showTitle: false
      gap: 9
      namePx: 12.5
      timePx: 11
      timeOnRight: true
    }
  }
}
