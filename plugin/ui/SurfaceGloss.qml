pragma ComponentBehavior: Bound

import QtQuick

// Brilho de cima para baixo e sombra interna embaixo da `SoftSurface`
// (specs/01-design-tokens.md "Superfícies"). Quem usa recorta pelo raio.
Item {
  id: gloss

  property bool island: false

  // Brilho de cima para baixo (pílula: .045 → .01 em 46% → preto .05;
  // ilha: .04 → .01 em 22% → transparente em 55% → preto .05).
  Rectangle {
    anchors.fill: parent
    gradient: Gradient {
      GradientStop {
        position: 0
        color: Qt.rgba(1, 1, 1, gloss.island ? 0.04 : 0.045)
      }
      GradientStop {
        position: gloss.island ? 0.22 : 0.46
        color: Qt.rgba(1, 1, 1, 0.01)
      }
      GradientStop {
        position: gloss.island ? 0.55 : 0.46
        color: gloss.island ? Qt.rgba(0, 0, 0, 0) : Qt.rgba(1, 1, 1, 0.01)
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
