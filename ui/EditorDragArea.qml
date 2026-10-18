pragma ComponentBehavior: Bound

import QtQuick

// Clique ou arraste de um widget no editor (specs/17 "Arrastar e soltar"):
// toma o clique (o widget da barra não executa a ação dele) e, passando de
// 6px, leva o widget pelo proxy da camada da barra até uma pílula.
MouseArea {
  id: area

  required property string widgetId
  property var dragProxy: null

  property point pressAt: Qt.point(0, 0)
  property bool dragging: false

  signal tapped

  cursorShape: dragging ? Qt.ClosedHandCursor : Qt.OpenHandCursor
  hoverEnabled: true
  preventStealing: true

  onPressed: mouse => {
    pressAt = Qt.point(mouse.x, mouse.y);
    dragging = false;
  }
  onPositionChanged: mouse => {
    if (!pressed || !dragProxy) return;
    const scene = mapToItem(null, mouse.x, mouse.y);
    if (!dragging && Math.hypot(mouse.x - pressAt.x, mouse.y - pressAt.y) > 6) {
      dragging = true;
      dragProxy.start(widgetId, scene.x, scene.y);
    }
    if (dragging) dragProxy.moveTo(scene.x, scene.y);
  }
  onReleased: {
    if (!dragging) {
      tapped();
      return;
    }
    dragging = false;
    dragProxy.finish();
  }
  onCanceled: {
    if (dragging) dragProxy.finish();
    dragging = false;
  }
}
