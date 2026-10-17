pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/aiUsage.mjs" as AiCore

// Cartão de um provedor (specs/12-uso-ia.md "Modo `ai`"): padding 10 10 12,
// raio 14, `neutral-900`. Sem credencial, uma linha "Faça login" no lugar das
// barras; expirado ou sem conexão, as barras do cache e o aviso no topo.
Rectangle {
  id: card

  required property var provider
  readonly property var usage: provider.usage
  readonly property string notice: !provider.loggedIn ? ""
    : provider.expired ? (provider.providerId === "claude" ? "Abra o Claude Code para renovar" : "Abra o Codex para renovar")
    : provider.offline ? "Sem conexão" : ""

  implicitHeight: 102
  radius: 14
  color: Tokens.neutral900

  ColumnLayout {
    anchors.fill: parent
    anchors.leftMargin: 10
    anchors.rightMargin: 10
    anchors.topMargin: 10
    anchors.bottomMargin: 12
    spacing: 10

    RowLayout {
      Layout.fillWidth: true
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
      visible: !card.provider.loggedIn
      text: card.provider.providerId === "claude" ? "Faça login no Claude" : "Faça login no Codex"
      px: 12
      font.weight: Tokens.weightBody
      color: Tokens.neutral400
    }

    RowLayout {
      Layout.fillWidth: true
      visible: card.provider.loggedIn
      spacing: 14

      UsageColumn {
        title: "Sessão · 5h"
        window: card.usage ? card.usage.session : null
        reset: window && window.resetsAt ? "Reinicia " + AiCore.formatSessionReset(window.resetsAt, Date.now()) : ""
      }

      UsageColumn {
        title: "Semanal"
        window: card.usage ? card.usage.weekly : null
        reset: window && window.resetsAt ? "Reinicia " + AiCore.formatWeeklyReset(window.resetsAt) : ""
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
