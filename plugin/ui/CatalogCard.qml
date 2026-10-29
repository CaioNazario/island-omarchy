import QtQuick
import QtQuick.Layouts
import "../core/environments.mjs" as EnvironmentsCore

// Cartão do catálogo do editor (specs/17 "Linha 4: catálogo"): um widget da
// Island ou de outro plugin (spec 16 "Widgets de plugins"). Fora do
// ambiente, adiciona ao fim da pílula-alvo (clique) ou onde for solto
// (arraste); já no ambiente, fica apagado e sem ação.
Rectangle {
  id: card

  required property var bar
  required property string widgetId
  property var dragProxy: null
  readonly property var info: bar.widgetInfo(widgetId)
  readonly property bool inUse: EnvironmentsCore.findWidget(bar.environment, widgetId) !== null

  Layout.fillWidth: true
  Layout.preferredWidth: 1
  implicitHeight: 48
  radius: 12
  opacity: inUse ? 0.45 : 1
  color: dragArea.containsMouse && !inUse ? Tokens.neutral800 : Tokens.neutral900

  RowLayout {
    anchors.fill: parent
    anchors.leftMargin: 10
    anchors.rightMargin: 10
    spacing: 10

    Rectangle {
      implicitWidth: 30
      implicitHeight: 30
      radius: 9
      color: Tokens.accent900

      PhIcon {
        anchors.centerIn: parent
        glyph: card.info.icon
        color: Tokens.accent300
      }
    }

    ColumnLayout {
      Layout.fillWidth: true
      spacing: 1

      IslandText {
        Layout.fillWidth: true
        text: card.info.name
        px: 12.5
        elide: Text.ElideRight
      }

      IslandText {
        Layout.fillWidth: true
        text: card.info.description
        px: 11
        font.weight: Tokens.weightBody
        color: Tokens.neutral500
        elide: Text.ElideRight
      }
    }

    PhIcon {
      glyph: card.inUse ? "check-circle-fill" : "plus"
      size: 13
      color: card.inUse ? Tokens.accent400 : Tokens.neutral400
    }
  }

  EditorDragArea {
    id: dragArea

    anchors.fill: parent
    enabled: !card.inUse
    widgetId: card.widgetId
    dragProxy: card.dragProxy
    onTapped: card.bar.editorPlace(card.widgetId, card.bar.editorTarget, null)
  }
}
