pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts

// Modo `ai` (specs/12-uso-ia.md "Modo `ai`"; design v5): cabeçalho, uma aba
// por provedor ligado nas preferências (com mais de um) e o cartão do
// provedor escolhido. Abrir re-sonda os limites; o botão de atualizar força tudo.
Item {
  id: view

  required property var bar
  readonly property var ai: bar.system.ai

  Component.onCompleted: ai.refreshOnOpen()

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
        text: I18n.tr("AI usage")
      }

      SmallButton {
        implicitWidth: 20
        implicitHeight: 20
        glyph: "arrow-clockwise"
        iconSize: 12
        opacity: view.ai.running ? 0.3 : 1
        onClicked: view.ai.refresh()
      }

      IslandText {
        text: I18n.count(view.ai.withLimits.length, "1 connected", "{n} connected")
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
