pragma ComponentBehavior: Bound

import QtQuick

// Fundo em gradiente da `SoftSurface` (specs/19-aparencia.md "Gradiente"):
// o shader do omadock pinta a base (a cor do fundo com a opacidade) e as 3
// cores por cima, recortado pelo raio. A força anima ao mudar pela aba.
ShaderEffect {
  id: fill

  // `SurfaceGradient` do core (`surfaceStyle.ts`); null enquanto o Loader sai.
  property var gradient: null
  property real cornerRadius: 0

  readonly property var colors: gradient ? gradient.colors : ["#00000000", "#00000000", "#00000000"]
  property color base: gradient ? gradient.base : "transparent"
  property color c1: colors[0]
  property color c2: colors[1]
  property color c3: colors[2]
  property real count: 3
  property real strength: gradient ? gradient.strength : 0
  property real radius: cornerRadius
  property size size: Qt.size(width, height)

  fragmentShader: Qt.resolvedUrl("../shaders/gradient.frag.qsb")

  Behavior on strength {
    NumberAnimation {
      duration: Tokens.chromeMs
    }
  }
}
