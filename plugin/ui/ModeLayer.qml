pragma ComponentBehavior: Bound

import QtQuick

// Camada de um modo (specs/03-ilha.md "Animação"): centrada no topo da ilha,
// no tamanho do seu modo, mesmo maior que a ilha durante a animação. A
// superfície corta o que sobra. O conteúdo só existe enquanto a camada
// aparece ou está saindo.
Item {
  id: layer

  required property string layerId
  required property string shownLayer
  // Troca entre `quick`, `wifi` e `bt`: sem fade nem escala.
  required property bool instant
  default property alias content: loader.sourceComponent

  readonly property bool shown: shownLayer === layerId
  readonly property real hiddenScale: layerId === "notif" ? 0.96 : Tokens.hiddenScale
  readonly property real hiddenOffsetY: layerId === "notif" ? -18 : 0
  property real offsetY: 0

  readonly property var item: loader.item

  opacity: 0
  visible: opacity > 0
  scale: hiddenScale
  transform: Translate {
    y: layer.offsetY
  }

  Component.onCompleted: if (shown) settle(1, 1, 0)
  onShownChanged: shown ? enter() : leave()

  Loader {
    id: loader

    anchors.fill: parent
    active: layer.visible || layer.shown
  }

  function settle(toOpacity, toScale, toOffset) {
    fade.stop();
    move.stop();
    opacity = toOpacity;
    scale = toScale;
    offsetY = toOffset;
  }

  function enter() {
    if (instant) return settle(1, 1, 0);
    animate(1, 1, 0);
  }

  function leave() {
    if (instant) return settle(0, hiddenScale, hiddenOffsetY);
    animate(0, hiddenScale, hiddenOffsetY);
  }

  // Opacidade em 220ms depois de 80ms; escala e deslocamento em 300ms.
  function animate(toOpacity, toScale, toOffset) {
    fadeTo.to = toOpacity;
    scaleTo.to = toScale;
    offsetTo.to = toOffset;
    fade.restart();
    move.restart();
  }

  SequentialAnimation {
    id: fade

    PauseAnimation {
      duration: Tokens.fadeDelayMs
    }
    NumberAnimation {
      id: fadeTo

      target: layer
      property: "opacity"
      duration: Tokens.fadeMs
      easing.type: Easing.InOutQuad
    }
  }

  ParallelAnimation {
    id: move

    NumberAnimation {
      id: scaleTo

      target: layer
      property: "scale"
      duration: Tokens.scaleMs
      easing.type: Easing.InOutQuad
    }
    NumberAnimation {
      id: offsetTo

      target: layer
      property: "offsetY"
      duration: Tokens.scaleMs
      easing.type: Easing.InOutQuad
    }
  }
}
