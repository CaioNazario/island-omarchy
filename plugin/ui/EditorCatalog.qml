pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/environments.mjs" as EnvironmentsCore
import "../core/environmentEditor.mjs" as EditorCore

// Linha 4 do editor (specs/17 "Linha 4: catálogo"): cabeçalho com "N em uso"
// e o seletor da pílula-alvo; grade de 4 colunas com um cartão por widget
// (`CatalogCard`).
ColumnLayout {
  id: catalog

  required property var bar
  property var dragProxy: null
  readonly property var env: bar.environment

  spacing: 10

  RowLayout {
    Layout.fillWidth: true
    spacing: 8

    IslandText {
      text: "Widgets"
    }

    Rectangle {
      implicitWidth: used.implicitWidth + 14
      implicitHeight: used.implicitHeight + 2
      radius: 9
      color: Tokens.neutral900

      IslandText {
        id: used

        anchors.centerIn: parent
        text: EditorCore.usedCount(catalog.env) + " em uso"
        px: 11
        font.weight: Tokens.weightBody
        color: Tokens.neutral300
      }
    }

    Item {
      Layout.fillWidth: true
    }

    IslandText {
      text: "Adicionar em"
      px: 11.5
      font.weight: Tokens.weightBody
      color: Tokens.neutral400
    }

    Rectangle {
      implicitWidth: sides.implicitWidth + 4
      implicitHeight: 26
      radius: 13
      color: Tokens.neutral900

      Row {
        id: sides

        anchors.centerIn: parent

        Repeater {
          model: [{ side: "left", label: "Esquerda" }, { side: "right", label: "Direita" }]

          Rectangle {
            id: sideChoice

            required property var modelData
            readonly property bool chosen: catalog.bar.editorTarget === modelData.side

            implicitWidth: sideLabel.implicitWidth + 20
            implicitHeight: 22
            radius: 11
            color: chosen ? Tokens.accent800 : "transparent"

            IslandText {
              id: sideLabel

              anchors.centerIn: parent
              text: sideChoice.modelData.label
              px: 11.5
              color: sideChoice.chosen ? Tokens.accent100 : Tokens.neutral400
            }

            MouseArea {
              anchors.fill: parent
              cursorShape: Qt.PointingHandCursor
              onClicked: catalog.bar.editorPickTarget(sideChoice.modelData.side)
            }
          }
        }
      }
    }
  }

  GridLayout {
    Layout.fillWidth: true
    columns: 4
    columnSpacing: 6
    rowSpacing: 6

    Repeater {
      model: EnvironmentsCore.WIDGET_IDS

      CatalogCard {
        required property string modelData

        bar: catalog.bar
        widgetId: modelData
        dragProxy: catalog.dragProxy
      }
    }
  }
}
