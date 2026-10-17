pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/notifications.mjs" as NotificationsCore

// Modo `stack` (specs/04-notificacoes.md): padding 12px, cabeçalho 28px,
// itens de 50px com 2px entre eles, 6 visíveis com rolagem fina; vazia, 72px.
Item {
  id: view

  required property var bar
  readonly property var feed: bar.service ? bar.service.notifications : null
  readonly property var entries: feed ? feed.entries : []

  ColumnLayout {
    anchors.fill: parent
    anchors.margins: 12
    spacing: 4

    RowLayout {
      Layout.fillWidth: true
      Layout.preferredHeight: 28
      spacing: 8

      PhIcon {
        glyph: "bell-fill"
        size: 14
        color: Tokens.neutral300
      }

      IslandText {
        text: "Notificações"
      }

      Rectangle {
        implicitWidth: count.implicitWidth + 14
        implicitHeight: count.implicitHeight + 2
        radius: 9
        color: Tokens.neutral900

        IslandText {
          id: count

          anchors.centerIn: parent
          text: view.entries.length
          px: 11
          color: Tokens.neutral300
        }
      }

      Item {
        Layout.fillWidth: true
      }

      Rectangle {
        visible: view.entries.length > 0
        implicitWidth: clearLabel.implicitWidth + 20
        implicitHeight: 24
        radius: 12
        color: clearPointer.containsMouse ? Tokens.neutral800 : Tokens.neutral900

        IslandText {
          id: clearLabel

          anchors.centerIn: parent
          text: "Limpar tudo"
          px: 11
          font.weight: Tokens.weightBody
        }

        MouseArea {
          id: clearPointer

          anchors.fill: parent
          hoverEnabled: true
          cursorShape: Qt.PointingHandCursor
          onClicked: view.feed.clearAll()
        }
      }
    }

    Item {
      Layout.fillWidth: true
      Layout.preferredHeight: 72
      visible: view.entries.length === 0

      Row {
        anchors.centerIn: parent
        spacing: 8

        PhIcon {
          anchors.verticalCenter: parent.verticalCenter
          glyph: "bell-slash"
          color: Tokens.neutral500
        }

        IslandText {
          anchors.verticalCenter: parent.verticalCenter
          text: "Nenhuma notificação"
          px: 12.5
          font.weight: Tokens.weightBody
          color: Tokens.neutral500
        }
      }
    }

    ListView {
      Layout.fillWidth: true
      Layout.fillHeight: true
      visible: view.entries.length > 0
      clip: true
      spacing: 2
      boundsBehavior: Flickable.StopAtBounds
      model: view.entries

      delegate: StackItem {
        required property var modelData

        width: ListView.view.width
        entry: modelData
        nowMs: view.bar.nowMs
        flashed: view.bar.flashKey === modelData.key
        onActivated: {
          view.bar.closeAll();
          view.feed.activate(modelData.key);
        }
        onDismissed: view.feed.dismiss(modelData.key)
      }
    }
  }

  component StackItem: Rectangle {
    id: item

    required property var entry
    required property real nowMs
    property bool flashed: false

    signal activated
    signal dismissed

    implicitHeight: 50
    radius: 12
    // Notificação nova com `stack` aberto: `accent-900` por 2500ms (600ms).
    color: flashed ? Tokens.accent900 : pointer.containsMouse ? Tokens.neutral900 : "transparent"

    Behavior on color {
      ColorAnimation {
        duration: 600
      }
    }

    MouseArea {
      id: pointer

      anchors.fill: parent
      hoverEnabled: true
      cursorShape: Qt.PointingHandCursor
      onClicked: item.activated()
    }

    RowLayout {
      anchors.fill: parent
      anchors.leftMargin: 6
      anchors.rightMargin: 6
      spacing: 10

      NotificationIcon {
        implicitWidth: 32
        implicitHeight: 32
        radius: 9
        entry: item.entry
        iconSize: 18
      }

      ColumnLayout {
        Layout.fillWidth: true
        spacing: 1

        RowLayout {
          Layout.fillWidth: true

          IslandText {
            Layout.fillWidth: true
            text: item.entry.name
            px: 12.5
            elide: Text.ElideRight
          }

          IslandText {
            text: NotificationsCore.formatRelativeTime(item.nowMs - item.entry.timeMs)
            px: 11
            font.weight: Tokens.weightBody
            color: Tokens.neutral500
          }
        }

        IslandText {
          Layout.fillWidth: true
          text: item.entry.text
          px: 12
          font.weight: Tokens.weightBody
          color: Tokens.neutral400
          elide: Text.ElideRight
          maximumLineCount: 1
        }
      }

      PhIcon {
        glyph: "x"
        size: 12
        color: Tokens.neutral500

        MouseArea {
          anchors.centerIn: parent
          width: 22
          height: 22
          cursorShape: Qt.PointingHandCursor
          onClicked: item.dismissed()
        }
      }
    }
  }
}
