import QtQuick
import Quickshell
import Quickshell.Wayland

// Widget de barra de um plugin de mentira, para o harness exercitar a ponte
// da Island (specs/16-widgets.md "Widgets de plugins") sem o qs.Ui do
// Omarchy. Usa o `bar` como os widgets dele: alvo de clique, um painel por
// vez e o painel aberto a `anchorWindow.height` do topo
// (`qs.Ui/KeyboardPanel.qml` `cardOrigin`, Omarchy 4).
Item {
  id: widget

  property var bar: null
  property string moduleName: ""
  property var settings: ({})
  readonly property bool opened: popup.visible
  readonly property QsWindow anchorWindow: button.QsWindow.window as QsWindow
  readonly property int popupY: anchorWindow ? anchorWindow.height + 5 : -1

  implicitWidth: 27
  implicitHeight: 26

  function open() {
    popup.visible = true;
    bar.requestPopout(widget);
  }

  function close() {
    popup.visible = false;
    if (bar.activePopout === widget) bar.releasePopout(widget);
  }

  function closeForPopoutSwitch() {
    close();
  }

  function toggle() {
    if (opened) close();
    else open();
  }

  Rectangle {
    id: button

    function triggerPress(mouseButton) {
      widget.toggle();
    }

    anchors.fill: parent
    radius: 6
    color: widget.opened ? "#7c5cff" : "#3a3a48"
    Component.onCompleted: if (widget.bar) widget.bar.registerClickTarget(button)
    Component.onDestruction: if (widget.bar) widget.bar.unregisterClickTarget(button)

    MouseArea {
      anchors.fill: parent
      onClicked: widget.toggle()
    }
  }

  onBarChanged: if (bar) bar.registerClickTarget(button)

  // Como o KeyboardPanel: camada de cima com o cartão a `popupY` do topo.
  PanelWindow {
    id: popup

    visible: false
    screen: widget.anchorWindow ? widget.anchorWindow.screen : null
    anchors.top: true
    anchors.left: true
    anchors.right: true
    implicitHeight: widget.popupY + 80
    exclusionMode: ExclusionMode.Ignore
    color: "transparent"
    mask: Region {
      item: card
    }
    WlrLayershell.layer: WlrLayer.Overlay
    WlrLayershell.namespace: "island-dev-plugin-popup"

    Rectangle {
      id: card

      x: 200
      y: widget.popupY
      width: 160
      height: 80
      radius: 12
      color: "#7c5cff"
    }
  }
}
