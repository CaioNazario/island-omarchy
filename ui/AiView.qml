pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/aiUsage.mjs" as AiCore

// Modo `ai` (specs/12-uso-ia.md, 480 × (24 + 32 + p·108 − 6)): cabeçalho e um
// cartão por provedor ligado nas preferências. Abrir atualiza o cache velho.
Item {
  id: view

  required property var bar
  readonly property var ai: bar.system.ai

  Component.onCompleted: ai.refreshIfStale()

  ColumnLayout {
    anchors.fill: parent
    anchors.leftMargin: 14
    anchors.rightMargin: 14
    anchors.topMargin: 12
    anchors.bottomMargin: 12
    spacing: 6

    RowLayout {
      Layout.fillWidth: true
      Layout.preferredHeight: 26
      spacing: 8

      PhIcon {
        glyph: "sparkle"
        size: 14
        color: Tokens.neutral300
      }

      IslandText {
        Layout.fillWidth: true
        text: "Uso de IA"
      }

      IslandText {
        text: view.ai.loggedIn.length === 1 ? "1 conectado" : view.ai.loggedIn.length + " conectados"
        px: 11
        font.weight: Tokens.weightBody
        color: Tokens.neutral500
      }
    }

    Repeater {
      model: view.ai.providers

      delegate: AiProviderCard {
        required property var modelData

        Layout.fillWidth: true
        provider: modelData
      }
    }
  }
}
