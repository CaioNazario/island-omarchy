pragma ComponentBehavior: Bound

import QtQuick
import "../core/environments.mjs" as EnvironmentsCore

// O que segue o ponteiro ao arrastar um widget no editor (specs/17
// "Arrastar e soltar"): um chip leve, não o widget, para a origem poder ser
// recriada quando o ambiente for gravado. Vive na camada da barra, por cima
// de tudo; as `DropArea` das pílulas recebem o `Drag` dele.
Rectangle {
  id: proxy

  property string widgetId: ""
  readonly property var info: widgetId !== "" ? EnvironmentsCore.WIDGET_CATALOG[widgetId] : null

  visible: Drag.active
  z: 1000
  width: chip.implicitWidth + 20
  height: 26
  radius: 13
  color: Tokens.accent900
  border.width: 1
  border.color: Tokens.accent

  Drag.keys: ["island-widget"]
  Drag.hotSpot.x: width / 2
  Drag.hotSpot.y: height / 2

  /** `x`/`y` em coordenadas da janela, como o `scenePosition` dos handlers. */
  function start(id, sceneX, sceneY) {
    widgetId = id;
    moveTo(sceneX, sceneY);
    Drag.active = true;
  }

  function moveTo(sceneX, sceneY) {
    x = sceneX - width / 2;
    y = sceneY - height / 2;
  }

  /** Solta onde estiver; fora de uma pílula, nada acontece. */
  function finish() {
    if (!Drag.active) return;
    Drag.drop();
    Drag.active = false;
    widgetId = "";
  }

  Row {
    id: chip

    anchors.centerIn: parent
    spacing: 6

    PhIcon {
      anchors.verticalCenter: parent.verticalCenter
      glyph: proxy.info ? proxy.info.icon : "info"
      size: 14
      color: Tokens.accent300
    }

    IslandText {
      anchors.verticalCenter: parent.verticalCenter
      text: proxy.info ? proxy.info.name : ""
      px: 12
      color: Tokens.accent100
    }
  }
}
