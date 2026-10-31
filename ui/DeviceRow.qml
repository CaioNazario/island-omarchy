pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/bluetooth.mjs" as BluetoothCore

// Linha de dispositivo (specs/08-controles-rapidos.md "Modo `bt`"): 38px,
// gap 10px: ícone `ph-fill` 17px · nome 12.5px · bateria (só conectado e com
// nível) · status 11px à direita.
ListRow {
  id: row

  required property var device
  readonly property var battery: BluetoothCore.visibleBattery(device)
  readonly property var statuses: ({
      connected: { text: I18n.tr("Connected"), color: Tokens.accent300 },
      disconnected: { text: I18n.tr("Disconnected"), color: Tokens.neutral500 },
      pair: { text: I18n.tr("Pair"), color: Tokens.accent300 },
      connecting: { text: I18n.tr("Connecting…"), color: Tokens.neutral400 },
      disconnecting: { text: I18n.tr("Disconnecting…"), color: Tokens.neutral400 },
      pairing: { text: I18n.tr("Pairing…"), color: Tokens.neutral400 }
    })
  readonly property var kindGlyphs: ({
      headphones: "headphones-fill",
      mouse: "mouse-fill",
      keyboard: "keyboard-fill",
      speaker: "speaker-hifi-fill",
      phone: "device-mobile-fill",
      computer: "laptop-fill",
      gamepad: "game-controller-fill",
      other: "bluetooth-fill"
    })

  implicitHeight: 38
  active: device.connected

  RowLayout {
    anchors.fill: parent
    spacing: 10

    PhIcon {
      glyph: row.kindGlyphs[row.device.kind]
      size: 17
      color: row.device.connected ? Tokens.accent : Tokens.neutral300
    }

    IslandText {
      text: row.device.name
      px: 12.5
      font.weight: Tokens.weightBody
      elide: Text.ElideRight
      Layout.maximumWidth: 260
    }

    Row {
      visible: row.battery !== null
      spacing: 4

      PhIcon {
        anchors.verticalCenter: parent.verticalCenter
        glyph: "battery-medium-fill"
        size: 13
        color: Tokens.neutral400
      }

      IslandText {
        anchors.verticalCenter: parent.verticalCenter
        text: row.battery + "%"
        px: 11
        font.weight: Tokens.weightBody
        color: Tokens.neutral400
      }
    }

    IslandText {
      Layout.fillWidth: true
      horizontalAlignment: Text.AlignRight
      text: row.statuses[row.device.status].text
      color: row.statuses[row.device.status].color
      px: 11
      font.weight: Tokens.weightBody
    }
  }
}
