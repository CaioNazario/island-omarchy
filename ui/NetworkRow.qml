pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/wifi.mjs" as WifiCore

// Linha de rede do `wifi` (specs/08 "Modo `wifi`"; design v5), gap 10px:
// sinal 16px (`accent` se conectada) · SSID 12.5px · cadeado 11px se
// protegida. Rede conhecida (`known`): 40px, com "Conectado"/"Conectando…"/
// "Salva" 11px embaixo do nome. Outra: 34px, "Conectando…" à direita.
ListRow {
  id: row

  required property var network
  property bool known: false
  readonly property bool connected: network.status === "connected"
  readonly property bool connecting: network.status === "connecting"
  readonly property var signalGlyphs: ({ high: "wifi-high-bold", medium: "wifi-medium-bold", low: "wifi-low-bold" })

  implicitHeight: known ? 40 : 34
  active: connected

  RowLayout {
    anchors.fill: parent
    spacing: 10

    PhIcon {
      glyph: row.signalGlyphs[WifiCore.signalLevel(row.network.strength)]
      color: row.connected ? Tokens.accent : Tokens.neutral300
    }

    ColumnLayout {
      Layout.fillWidth: true
      spacing: 1

      IslandText {
        Layout.fillWidth: true
        text: row.network.ssid
        px: 12.5
        font.weight: Tokens.weightBody
        elide: Text.ElideRight
      }

      IslandText {
        visible: row.known
        text: row.connected ? "Conectado" : row.connecting ? "Conectando…" : "Salva"
        px: 11
        font.weight: Tokens.weightBody
        color: row.connected ? Tokens.accent300 : Tokens.neutral400
      }
    }

    IslandText {
      visible: !row.known && row.connecting
      text: "Conectando…"
      px: 11
      font.weight: Tokens.weightBody
      color: Tokens.neutral400
    }

    PhIcon {
      visible: row.network.security !== "open"
      glyph: "lock-simple-fill"
      size: 11
      color: Tokens.neutral500
    }
  }
}
