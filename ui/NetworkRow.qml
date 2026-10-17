pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/wifi.mjs" as WifiCore

// Linha de rede (specs/08-controles-rapidos.md): 36px, gap 10px: sinal 16px
// (`accent` se conectada) · SSID 12.5px · cadeado 11px se protegida · status
// 11px à direita.
ListRow {
  id: row

  required property var network
  readonly property bool connected: network.status === "connected"
  readonly property var signalGlyphs: ({ high: "wifi-high-bold", medium: "wifi-medium-bold", low: "wifi-low-bold" })

  implicitHeight: 36
  active: connected

  RowLayout {
    anchors.fill: parent
    spacing: 10

    PhIcon {
      glyph: row.signalGlyphs[WifiCore.signalLevel(row.network.strength)]
      color: row.connected ? Tokens.accent : Tokens.neutral300
    }

    IslandText {
      text: row.network.ssid
      px: 12.5
      font.weight: Tokens.weightBody
      elide: Text.ElideRight
      Layout.maximumWidth: 300
    }

    PhIcon {
      visible: row.network.security !== "open"
      glyph: "lock-simple-fill"
      size: 11
      color: Tokens.neutral500
    }

    IslandText {
      Layout.fillWidth: true
      horizontalAlignment: Text.AlignRight
      visible: row.network.status !== "idle"
      text: row.connected ? "Conectado" : "Conectando…"
      px: 11
      font.weight: Tokens.weightBody
      color: row.connected ? Tokens.accent300 : Tokens.neutral400
    }

    Item {
      Layout.fillWidth: true
      visible: row.network.status === "idle"
    }
  }
}
