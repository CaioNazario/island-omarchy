pragma ComponentBehavior: Bound

import QtQuick
import "../core/aiUsage.mjs" as AiCore

// Widget `ai` (specs/12-uso-ia.md "Widget `ai`"): por provedor com limites no
// registro do Omarchy, ícone 13px · mini barra 26×4 da sessão (600ms) · `62%`
// 11.5px/500, gap 12px entre provedores. Nenhum: `ph-sparkle` + "IA".
WidgetFrame {
  id: widget

  required property var ai
  readonly property var levelColors: ({ normal: Tokens.accent, high: Tokens.accent300, critical: Tokens.alertRed })
  readonly property var textColors: ({ normal: Tokens.text, high: Tokens.text, critical: Tokens.alertText })

  clickable: true
  spacing: 12

  Row {
    visible: widget.ai.withLimits.length === 0
    spacing: 6

    PhIcon {
      anchors.verticalCenter: parent.verticalCenter
      glyph: "sparkle"
      size: 14
      color: Tokens.neutral400
    }

    IslandText {
      anchors.verticalCenter: parent.verticalCenter
      text: I18n.tr("AI")
      px: 12
      color: Tokens.neutral400
    }
  }

  Repeater {
    model: widget.ai.withLimits

    delegate: Row {
      id: provider

      required property var modelData
      readonly property var session: modelData.session
      readonly property real percent: session ? session.percent : 0
      readonly property string level: AiCore.usageLevel(percent)

      spacing: 6

      PhIcon {
        anchors.verticalCenter: parent.verticalCenter
        glyph: provider.modelData.glyph
        size: 13
        color: Tokens.neutral300
      }

      Rectangle {
        anchors.verticalCenter: parent.verticalCenter
        width: 26
        height: 4
        radius: 2
        color: Tokens.neutral800

        Rectangle {
          width: parent.width * Math.min(1, provider.percent / 100)
          height: parent.height
          radius: 2
          color: widget.levelColors[provider.level]

          Behavior on width {
            NumberAnimation {
              duration: 600
            }
          }
        }
      }

      IslandText {
        anchors.verticalCenter: parent.verticalCenter
        // Largura mínima de 3.2ch para "100%" não empurrar o vizinho.
        width: Math.max(implicitWidth, 30)
        horizontalAlignment: Text.AlignRight
        text: provider.session ? AiCore.formatPercent(provider.percent) : "–"
        px: 11.5
        color: widget.textColors[provider.level]
      }
    }
  }
}
