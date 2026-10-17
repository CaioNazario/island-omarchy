pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Effects

// Slider 0–100 (specs/08-controles-rapidos.md "Slider"): trilho 4px raio 2
// `neutral-800`, preenchimento `accent`, thumb `neutral-100`. Pressionar
// posiciona pelo x; o arraste continua fora do trilho até soltar. Setas ±5.
Item {
  id: slider

  // Valor da fonte. Durante o arraste vale o do ponteiro, para a fonte (que
  // responde depois) não puxar o thumb de volta.
  property int value: 0
  property int thumbSize: 12
  // Brilho `accent` 60% de 12px do modo `volume`.
  property bool glow: false
  property bool interactive: true

  readonly property bool dragging: pointer.pressed
  property int dragValue: 0
  readonly property int shownValue: dragging ? dragValue : value

  signal moved(int value)
  signal dragStarted
  signal dragEnded

  implicitHeight: Math.max(thumbSize, 4)
  activeFocusOnTab: interactive

  Rectangle {
    id: track

    anchors.verticalCenter: parent.verticalCenter
    width: parent.width
    height: 4
    radius: 2
    color: Tokens.neutral800

    Rectangle {
      width: track.width * slider.shownValue / 100
      height: parent.height
      radius: 2
      color: Tokens.accent
    }
  }

  RectangularShadow {
    anchors.fill: thumb
    visible: slider.glow && slider.interactive
    radius: thumb.radius
    blur: 12
    spread: 0
    color: Tokens.volumeThumbGlow
  }

  Rectangle {
    id: thumb

    visible: slider.interactive
    anchors.verticalCenter: parent.verticalCenter
    x: track.width * slider.shownValue / 100 - width / 2
    width: slider.thumbSize
    height: slider.thumbSize
    radius: width / 2
    color: Tokens.neutral100
    border.width: slider.activeFocus ? 2 : 0
    border.color: Tokens.accent
  }

  MouseArea {
    id: pointer

    enabled: slider.interactive
    // Área maior que o trilho de 4px: o alvo de clique é a altura do thumb.
    anchors.fill: parent
    anchors.topMargin: -6
    anchors.bottomMargin: -6
    preventStealing: true
    onPressed: mouse => {
      slider.forceActiveFocus();
      slider.dragStarted();
      slider.pointTo(mouse.x);
    }
    onPositionChanged: mouse => slider.pointTo(mouse.x)
    onReleased: slider.dragEnded()
    onCanceled: slider.dragEnded()
  }

  function pointTo(x) {
    dragValue = Math.round(Math.max(0, Math.min(1, x / track.width)) * 100);
    moved(dragValue);
  }

  function step(delta) {
    moved(Math.max(0, Math.min(100, value + delta)));
  }

  Keys.onLeftPressed: step(-5)
  Keys.onRightPressed: step(5)
  Keys.onDownPressed: step(-5)
  Keys.onUpPressed: step(5)
}
