pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/aiUsage.mjs" as AiCore

// Modo `ai` (specs/12-uso-ia.md "Modo `ai`"; design v5): cabeçalho, uma aba
// por provedor ligado nas preferências (com mais de um) e o cartão do
// provedor escolhido. Abrir atualiza o cache velho.
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

    RowLayout {
      Layout.fillWidth: true
      visible: view.ai.providers.length > 1
      spacing: 6

      Repeater {
        model: view.ai.providers

        ChoiceButton {
          required property var modelData

          Layout.fillWidth: true
          label: modelData.name
          glyph: modelData.glyph
          glyphSize: 13
          active: modelData === view.ai.current
          onClicked: view.ai.selectedId = modelData.providerId
        }
      }
    }

    AiProviderCard {
      Layout.fillWidth: true
      visible: view.ai.current !== null
      provider: view.ai.current
    }

    Item {
      Layout.fillHeight: true
    }
  }
}
