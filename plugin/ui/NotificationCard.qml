pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/notifications.mjs" as NotificationsCore

// Conteúdo do `notif` (400×48) e do banner (specs/04-notificacoes.md): bloco
// do ícone · nome 13px/500 + tempo 11px · texto 12px `neutral-400` numa
// linha · ×. O `notif` usa padding 0 10px 0 8px, gap 10, bloco 32 redondo,
// ícone 17 e × 24; o banner, padding 0 12px, gap 12, bloco 34 raio 10,
// ícone 19 e × 24.
Item {
  id: card

  required property var entry
  required property real nowMs
  property int blockSize: 32
  property int blockRadius: 16
  property int iconSize: 17
  property int closeSize: 24
  property int leftPadding: 8
  property int rightPadding: 10
  property int gap: 10

  signal closed

  RowLayout {
    anchors.fill: parent
    anchors.leftMargin: card.leftPadding
    anchors.rightMargin: card.rightPadding
    spacing: card.gap

    NotificationIcon {
      implicitWidth: card.blockSize
      implicitHeight: card.blockSize
      radius: card.blockRadius
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
          text: NotificationsCore.formatRelativeTime(card.nowMs - card.entry.timeMs, I18n.language)
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
