pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/notifications.mjs" as NotificationsCore

// Conteúdo do `notif` (400×62) e do banner (specs/04-notificacoes.md):
// padding 0 12px, gap 12px: bloco do ícone · nome 13px/500 + tempo 11px ·
// texto 12px `neutral-400` numa linha · ×. O banner usa bloco 34, ícone 19 e
// × 24; o `notif`, 36, 20 e 26.
Item {
  id: card

  required property var entry
  required property real nowMs
  property int blockSize: 36
  property int iconSize: 20
  property int closeSize: 26

  signal closed

  RowLayout {
    anchors.fill: parent
    anchors.leftMargin: 12
    anchors.rightMargin: 12
    spacing: 12

    NotificationIcon {
      implicitWidth: card.blockSize
      implicitHeight: card.blockSize
      radius: 10
      entry: card.entry
      iconSize: card.iconSize
    }

    ColumnLayout {
      Layout.fillWidth: true
      spacing: 2

      RowLayout {
        Layout.fillWidth: true

        IslandText {
          Layout.fillWidth: true
          text: card.entry.name
          elide: Text.ElideRight
        }

        IslandText {
          text: NotificationsCore.formatRelativeTime(card.nowMs - card.entry.timeMs)
          px: 11
          font.weight: Tokens.weightBody
          color: Tokens.neutral500
        }
      }

      IslandText {
        Layout.fillWidth: true
        text: card.entry.text
        px: 12
        font.weight: Tokens.weightBody
        color: Tokens.neutral400
        elide: Text.ElideRight
        maximumLineCount: 1
      }
    }

    Rectangle {
      implicitWidth: card.closeSize
      implicitHeight: card.closeSize
      radius: card.closeSize / 2
      color: Tokens.neutral900

      PhIcon {
        anchors.centerIn: parent
        glyph: "x"
        size: 12
        color: Tokens.neutral300
      }

      MouseArea {
        anchors.fill: parent
        cursorShape: Qt.PointingHandCursor
        onClicked: card.closed()
      }
    }
  }
}
