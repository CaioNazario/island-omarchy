pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Effects
import QtQuick.Shapes
import Quickshell.Widgets

// Acabamento do design v5 (specs/01-design-tokens.md "Superfícies") das
// pílulas e da ilha: brilho de cima para baixo, halo do acento embaixo,
// `SOFT_IN` por dentro e `SOFT_OUT` por fora. Na ilha expandida, o `SOFT_OUT`
// dá lugar à sombra escura e ao brilho maior do acento (`islandShadow`).
// O brilho interno de 4% do acento do `SOFT_IN` fica de fora: não aparece
// sobre o `bg`.
Item {
  id: soft

  property real radius: height / 2
  property bool expanded: false
  // Pílula: `radial-gradient(80% 150% at 50% 135%, accent 9%, transparent 65%)`.
  // Ilha: `radial-gradient(70% 120% at 50% 125%, accent 8%, transparent 60%)`.
  property bool island: false

  readonly property real haloRx: width * (island ? 0.7 : 0.8)
  readonly property real haloRy: height * (island ? 1.2 : 1.5)
  readonly property real haloCy: height * (island ? 1.25 : 1.35)

  component Glow: RectangularShadow {
    // `box-shadow` com espalhamento negativo: a sombra encolhe pelas margens.
    property real spreadIn: 0
    property bool forExpanded: false

    anchors.fill: parent
    anchors.margins: spreadIn
    radius: Math.max(0, soft.radius - spreadIn)
    opacity: forExpanded === soft.expanded ? 1 : 0

    Behavior on opacity {
      NumberAnimation {
        duration: 300
      }
    }
  }

  // SOFT_OUT
  Glow {
    offset: Qt.vector2d(0, 10)
    blur: 30
    spreadIn: 6
    color: Qt.alpha(Tokens.accent, 0.34)
  }
  Glow {
    blur: 22
    spreadIn: 4
    color: Qt.alpha(Tokens.accent, 0.22)
  }
  Glow {
    offset: Qt.vector2d(0, 16)
    blur: 36
    spreadIn: 14
    color: Qt.rgba(0, 0, 0, 0.5)
  }

  // Ilha expandida: `--isl-drop` + brilho do acento.
  Glow {
    forExpanded: true
    offset: Qt.vector2d(0, 18)
    blur: 44
    color: Qt.rgba(0, 0, 0, 0.6)
  }
  Glow {
    forExpanded: true
    offset: Qt.vector2d(0, 14)
    blur: 48
    spreadIn: 8
    color: Qt.alpha(Tokens.accent, 0.38)
  }
  Glow {
    forExpanded: true
    blur: 34
    spreadIn: 6
    color: Qt.alpha(Tokens.accent, 0.26)
  }

  // `inset 0 1px 0 rgba(255,255,255,.07)`: o fundo deixa 1px do brilho à
  // mostra no topo, acompanhando o raio.
  ClippingRectangle {
    anchors.fill: parent
    radius: soft.radius
    color: Qt.rgba(1, 1, 1, 0.07)

    Rectangle {
      anchors.fill: parent
      anchors.topMargin: 1
      radius: soft.radius
      color: Tokens.bg
    }

    // O halo é um círculo de raio `haloRx` esticado na vertical até `haloRy`.
    Shape {
      anchors.fill: parent
      preferredRendererType: Shape.CurveRenderer
      transform: Scale {
        origin.y: soft.haloCy
        yScale: soft.haloRy / Math.max(1, soft.haloRx)
      }

      ShapePath {
        id: halo

        readonly property real k: soft.haloRx / Math.max(1, soft.haloRy)
        readonly property real top: soft.haloCy - soft.haloCy * k
        readonly property real bottom: soft.haloCy + (soft.height - soft.haloCy) * k

        strokeColor: "transparent"
        fillGradient: RadialGradient {
          centerX: soft.width / 2
          centerY: soft.haloCy
          centerRadius: soft.haloRx
          focalX: soft.width / 2
          focalY: soft.haloCy

          GradientStop {
            position: 0
            color: Qt.alpha(Tokens.accent, soft.island ? 0.08 : 0.09)
          }
          GradientStop {
            position: soft.island ? 0.6 : 0.65
            color: Qt.alpha(Tokens.accent, 0)
          }
        }
        startX: 0
        startY: top
        PathLine {
          x: soft.width
          y: halo.top
        }
        PathLine {
          x: soft.width
          y: halo.bottom
        }
        PathLine {
          x: 0
          y: halo.bottom
        }
        PathLine {
          x: 0
          y: halo.top
        }
      }
    }

    // Brilho de cima para baixo (pílula: .045 → .01 em 46% → preto .05;
    // ilha: .04 → .01 em 22% → transparente em 55% → preto .05).
    Rectangle {
      anchors.fill: parent
      gradient: Gradient {
        GradientStop {
          position: 0
          color: Qt.rgba(1, 1, 1, soft.island ? 0.04 : 0.045)
        }
        GradientStop {
          position: soft.island ? 0.22 : 0.46
          color: Qt.rgba(1, 1, 1, 0.01)
        }
        GradientStop {
          position: soft.island ? 0.55 : 0.46
          color: soft.island ? Qt.rgba(0, 0, 0, 0) : Qt.rgba(1, 1, 1, 0.01)
        }
        GradientStop {
          position: 1
          color: Qt.rgba(0, 0, 0, 0.05)
        }
      }
    }

    // `inset 0 -2px 6px rgba(0,0,0,.14)`
    Rectangle {
      anchors.left: parent.left
      anchors.right: parent.right
      anchors.bottom: parent.bottom
      height: 8
      gradient: Gradient {
        GradientStop {
          position: 0
          color: Qt.rgba(0, 0, 0, 0)
        }
        GradientStop {
          position: 1
          color: Qt.rgba(0, 0, 0, 0.14)
        }
      }
    }
  }

  // `inset 0 0 0 1px rgba(255,255,255,.05)`
  Rectangle {
    anchors.fill: parent
    radius: soft.radius
    color: "transparent"
    border.width: 1
    border.color: Qt.rgba(1, 1, 1, 0.05)
  }
}
