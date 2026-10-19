pragma ComponentBehavior: Bound

import QtQuick

// Três filhos em linha, alinhados pelo topo: a ilha cresce para baixo sem
// mover as laterais, que dividem igualmente o espaço que sobra dela
// (`flex: 1 1 0` no design, specs/02-barra.md "Layout").
Item {
  id: row

  required property var bar
  required property string mode
  required property string screenName
  // Proxy de arraste do editor de ambientes (spec 17), da camada da barra.
  property var dragProxy: null

  readonly property alias leftPill: leftPill
  readonly property alias island: island
  readonly property alias rightPill: rightPill
  readonly property alias banner: banner
  readonly property real pillWidth: Math.max(0, (width - island.width - 2 * Tokens.pillGap) / 2)

  height: island.height

  // Rolagem sobre a barra troca de ambiente (specs/15 "Rolagem suave"). No
  // Qt, touchpad chega com `pixelDelta` e fase; roda inclinada só com
  // `angleDelta` (120 por clique). Um passo do core ≈ 10px de dedo.
  function wheel(event) {
    const touchpad = event.pixelDelta.x !== 0 || event.pixelDelta.y !== 0 || event.phase !== Qt.NoScrollPhase;
    const input = touchpad ? {
      kind: "smooth",
      dx: -event.pixelDelta.x / 10,
      dy: -event.pixelDelta.y / 10,
      finished: event.phase === Qt.ScrollEnd
    } : wheelInput(event);
    event.accepted = input !== null && bar.scrollBar(input);
  }

  // Rolagem vertical sobre qualquer pílula abre/fecha o `stack` (specs/04 "Rolagem").
  function stackWheel(event) {
    event.accepted = bar.wheelStack(event, screenName, mode, true);
  }

  function wheelInput(event) {
    if (event.angleDelta.x === 0) return null;
    return { kind: "discrete", direction: event.angleDelta.x > 0 ? "left" : "right", fromWheel: true };
  }

  Pill {
    id: leftPill

    anchors.left: parent.left
    width: row.pillWidth
    editing: row.bar.editingOn(row.screenName)
    editTarget: row.bar.editorTarget === "left"
    onTargetPicked: row.bar.editorPickTarget("left")

    // A orientação padrão do `WheelHandler` é vertical: sem isto, o deslize
    // horizontal de dois dedos nunca chega ao `wheel` (specs/15 "Rolagem suave").
    WheelHandler {
      acceptedDevices: PointerDevice.Mouse | PointerDevice.TouchPad
      orientation: Qt.Horizontal
      onWheel: event => row.wheel(event)
    }

    WheelHandler {
      acceptedDevices: PointerDevice.Mouse | PointerDevice.TouchPad
      orientation: Qt.Vertical
      onWheel: event => row.stackWheel(event)
    }

    EnvButton {
      id: envButton

      anchors.left: parent.left
      anchors.leftMargin: Tokens.pillPaddingH
      anchors.verticalCenter: parent.verticalCenter
      bar: row.bar
      screenName: row.screenName
    }

    WidgetArea {
      anchors.left: envButton.right
      anchors.leftMargin: 4
      anchors.right: parent.right
      anchors.rightMargin: Tokens.pillPaddingH
      height: parent.height
      bar: row.bar
      screenName: row.screenName
      dragProxy: row.dragProxy
      ids: row.bar.environment.left
      side: "left"
    }
  }

  Island {
    id: island

    anchors.horizontalCenter: parent.horizontalCenter
    bar: row.bar
    displayMode: row.mode
    onClicked: row.bar.islandClick(row.screenName)

    // Em `stack` a lista de notificações cuida da rolagem (StackView.qml).
    WheelHandler {
      acceptedDevices: PointerDevice.Mouse | PointerDevice.TouchPad
      orientation: Qt.Vertical
      enabled: row.mode !== "stack"
      onWheel: event => row.stackWheel(event)
    }
  }

  // Só o monitor-alvo mostra o banner (specs/02 "Monitores").
  Banner {
    id: banner

    anchors.horizontalCenter: island.horizontalCenter
    y: island.height + 8
    bar: row.bar
    entry: row.bar.targetScreen === row.screenName ? row.bar.bannerEntry : null
    onOpened: row.bar.openFromBar(row.screenName, "stack")
  }

  Pill {
    id: rightPill

    anchors.right: parent.right
    width: row.pillWidth
    editing: row.bar.editingOn(row.screenName)
    editTarget: row.bar.editorTarget === "right"
    onTargetPicked: row.bar.editorPickTarget("right")

    // A orientação padrão do `WheelHandler` é vertical: sem isto, o deslize
    // horizontal de dois dedos nunca chega ao `wheel` (specs/15 "Rolagem suave").
    WheelHandler {
      acceptedDevices: PointerDevice.Mouse | PointerDevice.TouchPad
      orientation: Qt.Horizontal
      onWheel: event => row.wheel(event)
    }

    WheelHandler {
      acceptedDevices: PointerDevice.Mouse | PointerDevice.TouchPad
      orientation: Qt.Vertical
      onWheel: event => row.stackWheel(event)
    }

    WidgetArea {
      anchors.left: parent.left
      anchors.leftMargin: Tokens.pillPaddingH
      anchors.right: buttons.left
      anchors.rightMargin: 4
      height: parent.height
      bar: row.bar
      screenName: row.screenName
      dragProxy: row.dragProxy
      ids: row.bar.environment.right
      side: "right"
    }

    RightButtons {
      id: buttons

      anchors.right: parent.right
      anchors.rightMargin: Tokens.pillPaddingH
      anchors.verticalCenter: parent.verticalCenter
      bar: row.bar
      screenName: row.screenName
    }
  }
}
