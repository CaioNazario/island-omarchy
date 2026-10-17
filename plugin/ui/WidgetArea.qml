pragma ComponentBehavior: Bound

import QtQuick
import "../core/widgetFit.mjs" as WidgetFit
import "../core/environmentEditor.mjs" as EditorCore

// Área de widgets de uma pílula (specs/16-widgets.md "Pílulas" e "Quando não
// cabe"): encostada na ilha, gap 2px, nunca empurra a ilha nem os botões
// fixos. Sem espaço, o `hw` perde blocos e depois somem widgets inteiros, do
// mais longe da ilha para o mais perto. A troca de ambiente anima o conteúdo
// (specs/15-ambientes.md "Animação da troca").
Item {
  id: area

  required property var bar
  required property string screenName
  required property var ids
  // `left`: alinhada à direita (junto da ilha), corta do começo da lista.
  required property string side
  // Proxy de arraste do editor (spec 17), da camada da barra.
  property var dragProxy: null
  readonly property bool editing: bar.editingOn(screenName)

  property var shownIds: ids
  property var fit: []
  property real slide: 0

  clip: true

  onIdsChanged: area.bar.envDirection === 0 ? (shownIds = ids) : swap.restart()
  onWidthChanged: relayout()

  function relayout() {
    const sizes = [];
    for (let i = 0; i < slots.count; i++) {
      const slot = slots.itemAt(i) as WidgetSlot;
      sizes.push(slot ? { natural: slot.naturalWidth, min: slot.minWidth } : { natural: 0, min: 0 });
    }
    fit = WidgetFit.fitWidgets(sizes, width, 2, side === "left" ? "start" : "end");
  }

  Item {
    id: content

    width: parent.width
    height: parent.height
    transform: Translate {
      x: area.slide + area.bar.envDrag
    }

    Row {
      id: row

      anchors.verticalCenter: parent.verticalCenter
      x: area.side === "left" ? content.width - width : 0
      spacing: 2

      Repeater {
        id: slots

        model: area.shownIds

        delegate: WidgetSlot {
          required property string modelData
          required property int index

          widgetId: modelData
          bar: area.bar
          screenName: area.screenName
          side: area.side
          dragProxy: area.dragProxy
          budget: area.fit[index] || 0
          visible: area.fit[index] !== null && area.fit[index] !== undefined
          onNaturalWidthChanged: Qt.callLater(area.relayout)
        }
      }
    }
  }

  // Pílula vazia na edição (spec 17).
  IslandText {
    anchors.verticalCenter: parent.verticalCenter
    x: area.side === "left" ? parent.width - width - 10 : 10
    visible: area.editing && area.ids.length === 0
    text: "Solte widgets aqui"
    px: 11.5
    font.weight: Tokens.weightBody
    color: Tokens.neutral500
  }

  // Soltar do catálogo ou da própria barra: sobre um widget entra na posição
  // dele; no espaço livre, no fim (`dropIndex`).
  DropArea {
    anchors.fill: parent
    enabled: area.editing
    keys: ["island-widget"]
    onDropped: drop => {
      const boxes = [];
      for (let i = 0; i < slots.count; i++) {
        const slot = slots.itemAt(i);
        boxes.push(slot && slot.visible ? { x: slot.mapToItem(area, 0, 0).x, width: slot.width } : { x: -1, width: 0 });
      }
      area.bar.editorPlace((drop.source as EditorDragProxy).widgetId, area.side, EditorCore.dropIndex(boxes, drop.x));
      drop.accept();
    }
  }

  // Saída 160ms ease-in para −d·44px; troca; entrada de d·44px a 0 em 340ms
  // na curva `cubic-bezier(.2,.9,.25,1)`, opacidade em 240ms.
  SequentialAnimation {
    id: swap

    ParallelAnimation {
      NumberAnimation {
        target: area
        property: "slide"
        to: -area.bar.envDirection * 44
        duration: 160
        easing.type: Easing.InQuad
      }
      NumberAnimation {
        target: content
        property: "opacity"
        to: 0
        duration: 160
        easing.type: Easing.InQuad
      }
    }
    ScriptAction {
      script: {
        area.shownIds = area.ids;
        area.slide = area.bar.envDirection * 44;
      }
    }
    ParallelAnimation {
      NumberAnimation {
        target: area
        property: "slide"
        to: 0
        duration: 340
        easing.type: Easing.BezierSpline
        easing.bezierCurve: [0.2, 0.9, 0.25, 1, 1, 1]
      }
      NumberAnimation {
        target: content
        property: "opacity"
        to: 1
        duration: 240
      }
    }
  }
}
