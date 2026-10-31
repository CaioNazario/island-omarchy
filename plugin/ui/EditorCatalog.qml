pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/environments.mjs" as EnvironmentsCore
import "../core/environmentEditor.mjs" as EditorCore

// Linha 4 do editor (specs/17 "Linha 4: catálogo"): cabeçalho com "N em uso"
// e o seletor da pílula-alvo; grade de 4 colunas com um cartão por widget
// (`CatalogCard`), e outra com os widgets de outros plugins.
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
      text: I18n.tr("Widgets")
    }

    Rectangle {
      implicitWidth: used.implicitWidth + 14
      implicitHeight: used.implicitHeight + 2
      radius: 9
      color: Tokens.neutral900

      IslandText {
        id: used

        anchors.centerIn: parent
        text: I18n.tr("{n} in use", { n: EditorCore.usedCount(catalog.env) })
        px: 11
        font.weight: Tokens.weightBody
        color: Tokens.neutral300
      }
    }

    Item {
      Layout.fillWidth: true
    }

    IslandText {
      text: I18n.tr("Add to")
      px: 11.5
      font.weight: Tokens.weightBody
      color: Tokens.neutral400
    }

    SegmentedSwitch {
      options: [{ id: "left", label: I18n.tr("Left") }, { id: "right", label: I18n.tr("Right") }]
      current: catalog.bar.editorTarget
      onChosen: id => catalog.bar.editorPickTarget(id)
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

  // Widgets de barra de outros plugins (spec 16 "Widgets de plugins"); some
  // sem nenhum carregado.
  IslandText {
    Layout.topMargin: 4
    visible: catalog.bar.pluginWidgets.catalog.length > 0
    text: I18n.tr("Omarchy plugins")
  }

  GridLayout {
    Layout.fillWidth: true
    visible: catalog.bar.pluginWidgets.catalog.length > 0
    columns: 4
    columnSpacing: 6
    rowSpacing: 6

    Repeater {
      model: catalog.bar.pluginWidgets.catalog

      // Largura de uma coluna da grade de cima: com menos de 4 cartões, o
      // `fillWidth` esticaria um só pela linha inteira.
      CatalogCard {
        required property var modelData

        Layout.fillWidth: false
        Layout.preferredWidth: (catalog.width - 3 * 6) / 4
        bar: catalog.bar
        widgetId: modelData.id
        dragProxy: catalog.dragProxy
      }
    }
  }
}
