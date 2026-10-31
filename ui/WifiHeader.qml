pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/wifi.mjs" as WifiCore

// Cabeçalho do `wifi` no design v5 (specs/08 "Modo `wifi`"): 48px, padding
// 0 6px, gap 12: ícone 24 · rede 14px/500 + estado 10.5px maiúsculo · QR e
// velocidade (com conexão) · switch 36×20.
RowLayout {
  id: header

  required property var bar
  readonly property var wifi: bar.system.wifi
  readonly property var look: WifiCore.wifiHeader(wifi.radioOn, wifi.active, I18n.language)
  readonly property bool connected: wifi.active !== null && wifi.active.status === "connected"

  implicitHeight: 48
  spacing: 12

  PhIcon {
    glyph: header.look.glyph
    size: 24
    color: header.look.on ? Tokens.accent : Tokens.neutral500
  }

  ColumnLayout {
    Layout.fillWidth: true
    spacing: 2

    IslandText {
      Layout.fillWidth: true
      text: header.look.title
      px: 14
      elide: Text.ElideRight
    }

    IslandText {
      Layout.fillWidth: true
      text: header.look.status
      px: 10.5
      font.weight: Tokens.weightBody
      font.capitalization: Font.AllUppercase
      font.letterSpacing: 1.05
      color: Tokens.neutral400
    }
  }

  Row {
    visible: header.connected
    spacing: 4

    ViewButton {
      glyph: "qr-code"
      view: "qr"
    }

    ViewButton {
      glyph: "gauge"
      view: "speed"
    }
  }

  ToggleSwitch {
    large: true
    on: header.wifi.radioOn
    onClicked: header.wifi.setRadio(!header.wifi.radioOn)
  }

  // 30×30 redondo; ativo `accent-900`/`accent-200`, hover `neutral-800`.
  component ViewButton: Rectangle {
    id: button

    required property string glyph
    required property string view
    readonly property bool active: header.bar.wifiView === view

    implicitWidth: 30
    implicitHeight: 30
    radius: 15
    color: active ? Tokens.accent900 : pointer.containsMouse ? Tokens.neutral800 : "transparent"

    PhIcon {
      anchors.centerIn: parent
      glyph: button.glyph
      color: button.active ? Tokens.accent200 : pointer.containsMouse ? Tokens.text : Tokens.neutral300
    }

    MouseArea {
      id: pointer

      anchors.fill: parent
      hoverEnabled: true
      cursorShape: Qt.PointingHandCursor
      onClicked: header.bar.toggleWifiView(button.view)
    }
  }
}
