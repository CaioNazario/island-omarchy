pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Shapes

// Halo do acento embaixo da `SoftSurface` (specs/01-design-tokens.md
// "Superfícies"). Pílula: `radial-gradient(80% 150% at 50% 135%, accent 9%,
// transparent 65%)`. Ilha: `radial-gradient(70% 120% at 50% 125%, accent 8%,
// transparent 60%)`. Quem usa recorta pelo raio.
Shape {
  id: halo

  property bool island: false

  readonly property real haloRx: width * (island ? 0.7 : 0.8)
  readonly property real haloRy: height * (island ? 1.2 : 1.5)
  readonly property real haloCy: height * (island ? 1.25 : 1.35)

  preferredRendererType: Shape.CurveRenderer
  // O halo é um círculo de raio `haloRx` esticado na vertical até `haloRy`.
  transform: Scale {
    origin.y: halo.haloCy
    yScale: halo.haloRy / Math.max(1, halo.haloRx)
  }

  ShapePath {
    id: haloPath

    readonly property real k: halo.haloRx / Math.max(1, halo.haloRy)
    readonly property real top: halo.haloCy - halo.haloCy * k
    readonly property real bottom: halo.haloCy + (halo.height - halo.haloCy) * k

    strokeColor: "transparent"
    fillGradient: RadialGradient {
      centerX: halo.width / 2
      centerY: halo.haloCy
      centerRadius: halo.haloRx
      focalX: halo.width / 2
      focalY: halo.haloCy

      GradientStop {
        position: 0
        color: Qt.alpha(Tokens.accent, halo.island ? 0.08 : 0.09)
      }
      GradientStop {
        position: halo.island ? 0.6 : 0.65
        color: Qt.alpha(Tokens.accent, 0)
      }
    }
    startX: 0
    startY: top
    PathLine {
      x: halo.width
      y: haloPath.top
    }
    PathLine {
      x: halo.width
      y: haloPath.bottom
    }
    PathLine {
      x: 0
      y: haloPath.bottom
    }
    PathLine {
      x: 0
      y: haloPath.top
    }
  }
}
