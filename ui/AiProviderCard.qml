pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/aiUsage.mjs" as AiCore
import "../core/agentUsage.mjs" as AgentCore

// Cartão de um provedor (specs/12-uso-ia.md "Modo `ai`"): padding 10 10 12,
// raio 14, `neutral-900`. Tudo vem do registro do Omarchy: sem limites, o
// aviso do coletor no lugar das barras; com limites e aviso, o aviso no topo.
// Abaixo, tokens por dia e por modelo do registro do omarchy.agents (v5).
Rectangle {
  id: card

  required property var provider
  readonly property string notice: provider.hasLimits ? provider.status : ""

  readonly property var record: provider.record
  readonly property var days: record ? AgentCore.dayRows(record.days, Qt.formatDate(new Date(), "yyyy-MM-dd")) : []
  readonly property var models: record ? AgentCore.modelRows(record.models) : []

  implicitHeight: cardColumn.implicitHeight + 22
  radius: 14
  color: Tokens.neutral900

  ColumnLayout {
    id: cardColumn

    anchors.left: parent.left
    anchors.right: parent.right
    anchors.top: parent.top
    anchors.leftMargin: 10
    anchors.rightMargin: 10
    anchors.topMargin: 10
    spacing: 0

    RowLayout {
      Layout.fillWidth: true
      Layout.preferredHeight: 28
      Layout.bottomMargin: 10
      spacing: 10

      Rectangle {
        implicitWidth: 28
        implicitHeight: 28
        radius: 8
        color: Tokens.accent900

        PhIcon {
          anchors.centerIn: parent
          glyph: card.provider.glyph
          color: Tokens.accent300
        }
      }

      IslandText {
        text: card.provider.name
      }

      Rectangle {
        visible: card.provider.plan !== ""
        implicitWidth: plan.implicitWidth + 14
        implicitHeight: plan.implicitHeight + 2
        radius: 8
        color: "transparent"
        border.width: 1
        border.color: Tokens.neutral700

        IslandText {
          id: plan

          anchors.centerIn: parent
          text: card.provider.plan
          px: 10.5
          font.weight: Tokens.weightBody
          color: Tokens.neutral300
        }
      }

      IslandText {
        Layout.fillWidth: true
        horizontalAlignment: Text.AlignRight
        text: card.notice
        px: 11
        font.weight: Tokens.weightBody
        color: Tokens.neutral500
        elide: Text.ElideRight
      }
    }

    IslandText {
      Layout.preferredHeight: 46
      visible: !card.provider.hasLimits
      text: card.provider.status !== "" ? card.provider.status
        : card.record === null ? "Sem dados do Omarchy ainda" : "Sem limites para mostrar"
      px: 12
      font.weight: Tokens.weightBody
      color: Tokens.neutral400
    }

    RowLayout {
      Layout.fillWidth: true
      Layout.preferredHeight: 46
      visible: card.provider.hasLimits
      spacing: 14

      UsageColumn {
        title: "Sessão · 5h"
        window: card.provider.session
        reset: window && window.resetsAt ? "Reinicia " + AiCore.formatSessionReset(window.resetsAt, Date.now()) : ""
      }

      UsageColumn {
        title: "Semanal"
        window: card.provider.weekly
        reset: window && window.resetsAt ? "Reinicia " + AiCore.formatWeeklyReset(window.resetsAt) : ""
      }
    }

    // Tokens por dia: 7 linhas de 22px, hoje em destaque com a barra `accent`.
    ColumnLayout {
      Layout.fillWidth: true
      visible: card.days.length > 0
      spacing: 0

      FadeDivider {
        Layout.fillWidth: true
        Layout.topMargin: 12
        Layout.bottomMargin: 10
      }

      PanelLabel {
        Layout.fillWidth: true
        text: "Tokens por dia"
        value: card.record ? AgentCore.formatTokens(card.record.days.slice(-7).reduce((sum, day) => sum + day.tokens, 0)) + " na semana" : ""
      }

      Repeater {
        model: card.days

        RowLayout {
          id: day

          required property var modelData

          Layout.fillWidth: true
          Layout.preferredHeight: 22
          spacing: 12

          IslandText {
            Layout.preferredWidth: 34
            text: day.modelData.label
            px: 11.5
            font.weight: day.modelData.today ? Tokens.weightLabel : Tokens.weightBody
            color: day.modelData.today ? Tokens.text : Tokens.neutral500
          }

          Rectangle {
            Layout.fillWidth: true
            implicitHeight: 4
            radius: 2
            color: Tokens.neutral800

            Rectangle {
              width: parent.width * day.modelData.fraction
              height: parent.height
              radius: 2
              color: day.modelData.today ? Tokens.accent : Tokens.neutral500

              Behavior on width {
                NumberAnimation {
                  duration: 600
                }
              }
            }
          }

          IslandText {
            Layout.preferredWidth: 48
            horizontalAlignment: Text.AlignRight
            text: day.modelData.value
            px: 11.5
            font.weight: day.modelData.today ? Tokens.weightLabel : Tokens.weightBody
            color: day.modelData.today ? Tokens.text : day.modelData.fraction > 0 ? Tokens.neutral300 : Tokens.neutral600
          }
        }
      }
    }

    // Tokens por modelo: pílulas de 30px com a barra `accent-900` por trás.
    ColumnLayout {
      Layout.fillWidth: true
      visible: card.models.length > 0
      spacing: 4

      FadeDivider {
        Layout.fillWidth: true
        Layout.topMargin: 12
        Layout.bottomMargin: 6
      }

      PanelLabel {
        Layout.fillWidth: true
        text: "Tokens por modelo"
        value: card.record ? AgentCore.formatTokens(card.record.models.reduce((sum, model) => sum + model.tokens, 0)) + " total" : ""
      }

      Repeater {
        model: card.models

        Rectangle {
          id: modelRow

          required property var modelData

          Layout.fillWidth: true
          implicitHeight: 30
          radius: 15
          color: Tokens.neutral800
          clip: true

          Rectangle {
            width: parent.width * modelRow.modelData.fraction
            height: parent.height
            radius: 15
            color: Tokens.accent900

            Behavior on width {
              NumberAnimation {
                duration: 600
              }
            }
          }

          IslandText {
            anchors.left: parent.left
            anchors.leftMargin: 12
            anchors.verticalCenter: parent.verticalCenter
            text: modelRow.modelData.name
            px: 12
            font.weight: Tokens.weightBody
            color: Tokens.neutral200
          }

          IslandText {
            anchors.right: parent.right
            anchors.rightMargin: 12
            anchors.verticalCenter: parent.verticalCenter
            text: modelRow.modelData.value
            px: 12
            font.weight: Tokens.weightBody
            color: Tokens.neutral400
          }
        }
      }
    }
  }

  component UsageColumn: ColumnLayout {
    id: column

    required property string title
    required property var window
    required property string reset
    readonly property real percent: window ? window.percent : 0
    readonly property string level: AiCore.usageLevel(percent)

    Layout.fillWidth: true
    Layout.preferredWidth: 1
    spacing: 4

    RowLayout {
      Layout.fillWidth: true

      IslandText {
        Layout.fillWidth: true
        text: column.title
        px: 11
        font.weight: Tokens.weightBody
        color: Tokens.neutral400
      }

      IslandText {
        text: column.window ? AiCore.formatPercent(column.percent) : "–"
        px: 11
        color: column.level === "critical" ? Tokens.alertText : Tokens.text
      }
    }

    Rectangle {
      Layout.fillWidth: true
      implicitHeight: 4
      radius: 2
      color: Tokens.neutral800

      Rectangle {
        width: parent.width * Math.min(1, column.percent / 100)
        height: parent.height
        radius: 2
        color: column.level === "critical" ? Tokens.alertRed : column.level === "high" ? Tokens.accent300 : Tokens.accent
      }
    }

    IslandText {
      Layout.topMargin: 1
      text: column.reset
      px: 10.5
      font.weight: Tokens.weightBody
      color: Tokens.neutral500
    }
  }
}
