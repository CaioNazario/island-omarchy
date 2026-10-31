pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Effects

// Sombras de fora da `SoftSurface` (specs/01-design-tokens.md "Superfícies"):
// `SOFT_OUT` em repouso e `--isl-drop` na ilha expandida, com fade entre as
// duas. O alfa de cada uma vem das opções de aparência (spec 19
// "Superfície"); no padrão, 0.5 e 0.6, os do design.
Item {
  id: shadow

  property real radius: height / 2
  property bool expanded: false
  property real strength: 0.5
  property real expandedStrength: 0.6

  component Glow: RectangularShadow {
    // `box-shadow` com espalhamento negativo: a sombra encolhe pelas margens.
    property real spreadIn: 0
    property bool forExpanded: false

    anchors.fill: parent
    anchors.margins: spreadIn
    radius: Math.max(0, shadow.radius - spreadIn)
    opacity: forExpanded === shadow.expanded ? 1 : 0
    visible: color.a > 0

    Behavior on opacity {
      NumberAnimation {
        duration: 300
      }
    }
  }

  // SOFT_OUT sem os dois brilhos `accent` do design: em volta da barra eles
  // viravam um vazamento roxo (pedido do usuário). Fica a sombra escura.
  Glow {
    offset: Qt.vector2d(0, 16)
    blur: 36
    spreadIn: 14
    color: Qt.rgba(0, 0, 0, shadow.strength)
  }

  // Ilha expandida: `--isl-drop`, também sem o brilho `accent` em volta.
  Glow {
    forExpanded: true
    offset: Qt.vector2d(0, 18)
    blur: 44
    color: Qt.rgba(0, 0, 0, shadow.expandedStrength)
  }
}
