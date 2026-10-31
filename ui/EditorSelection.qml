pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/environments.mjs" as EnvironmentsCore
import "../core/environmentEditor.mjs" as EditorCore

// Linha 3 do editor (specs/17 "Linha 3: seleção"): faixa de 40px, raio 12,
// `neutral-900`, padding 0 8px 0 12px. Sem seleção, a dica; com seleção, o
// widget, onde ele está e ‹ › · mover de pílula · remover.
Rectangle {
  id: strip

  required property var bar
  readonly property string selected: bar.editorSelected
  readonly property var place: selected !== "" ? EnvironmentsCore.findWidget(bar.environment, selected) : null
  readonly property var info: selected !== "" ? bar.widgetInfo(selected) : null

  implicitHeight: 40
  radius: 12
  color: Tokens.neutral900

  RowLayout {
    anchors.fill: parent
    anchors.leftMargin: 12
    anchors.rightMargin: 8
    spacing: 8
    visible: strip.place === null

    PhIcon {
      glyph: "cursor-click"
      size: 15
      color: Tokens.neutral400
    }

    IslandText {
      Layout.fillWidth: true
      text: "Clique num widget da barra para mover ou remover. Arraste da lista para uma pílula, ou reordene arrastando na própria barra."
      px: 12
      font.weight: Tokens.weightBody
      color: Tokens.neutral400
      elide: Text.ElideRight
    }
  }

  RowLayout {
    anchors.fill: parent
    anchors.leftMargin: 12
    anchors.rightMargin: 8
    spacing: 8
    visible: strip.place !== null

    PhIcon {
      glyph: strip.info ? strip.info.icon : "info"
      color: Tokens.accent300
    }

    IslandText {
      text: strip.info ? strip.info.name : ""
      px: 12.5
    }

    IslandText {
      Layout.fillWidth: true
      text: strip.selected !== "" ? EditorCore.selectionLabel(strip.bar.environment, strip.selected) : ""
      px: 11.5
      font.weight: Tokens.weightBody
      color: Tokens.neutral500
    }

    StepButton {
      glyph: "caret-left"
      enabledStep: strip.place !== null && strip.place.index > 0
      onPressed: strip.bar.editorStepSelected(-1)
    }

    StepButton {
      glyph: "caret-right"
      enabledStep: strip.place !== null && strip.place.index < strip.place.count - 1
      onPressed: strip.bar.editorStepSelected(1)
    }

    ActionButton {
      glyph: "arrows-left-right"
      label: strip.place !== null && strip.place.side === "left" ? "Mover para a direita" : "Mover para a esquerda"
      restingColor: Tokens.neutral800
      textColor: Tokens.text
      onPressed: strip.bar.editorMoveSelected()
    }

    ActionButton {
      glyph: "minus-circle"
      label: "Remover"
      textColor: Tokens.powerOffText
      onPressed: strip.bar.editorRemoveSelected()
    }
  }

  // ‹ e › 28×28, raio 14; opacidade .35 no limite.
  component StepButton: Rectangle {
    id: step

    required property string glyph
    property bool enabledStep: true

    signal pressed

    implicitWidth: 28
    implicitHeight: 28
    radius: 14
    opacity: enabledStep ? 1 : 0.35
    color: stepPointer.containsMouse && enabledStep ? Tokens.neutral800 : "transparent"

    PhIcon {
      anchors.centerIn: parent
      glyph: step.glyph
      size: 13
      color: Tokens.neutral300
    }

    MouseArea {
      id: stepPointer

      anchors.fill: parent
      enabled: step.enabledStep
      hoverEnabled: true
      cursorShape: Qt.PointingHandCursor
      onClicked: step.pressed()
    }
  }

  component ActionButton: Rectangle {
    id: action

    required property string glyph
    required property string label
    property color restingColor: "transparent"
    property color textColor: Tokens.text

    signal pressed

    implicitWidth: actionRow.implicitWidth + 20
    implicitHeight: 28
    radius: 14
    color: actionPointer.containsMouse ? Tokens.neutral700 : restingColor

    Row {
      id: actionRow

      anchors.centerIn: parent
      spacing: 6

      PhIcon {
        anchors.verticalCenter: parent.verticalCenter
        glyph: action.glyph
        size: 13
        color: action.textColor
      }

      IslandText {
        anchors.verticalCenter: parent.verticalCenter
        text: action.label
        px: 11.5
        color: action.textColor
      }
    }

    MouseArea {
      id: actionPointer

      anchors.fill: parent
      hoverEnabled: true
      cursorShape: Qt.PointingHandCursor
      onClicked: action.pressed()
    }
  }
}
