pragma ComponentBehavior: Bound

import QtQuick
import Quickshell.Widgets

// Acabamento do design v5 (specs/01-design-tokens.md "Superfícies") das
// pílulas e da ilha: brilho de cima para baixo, halo do acento embaixo,
// `SOFT_IN` por dentro e só a sombra escura por fora (os brilhos `accent`
// externos do design saíram: vazavam roxo em volta da barra).
// O brilho interno de 4% do acento do `SOFT_IN` fica de fora: não aparece
// sobre o `bg`.
Item {
  id: soft

  property real radius: height / 2
  property bool expanded: false
  // Pílula ou ilha: o halo e o brilho têm medidas diferentes (SurfaceHalo,
  // SurfaceGloss).
  property bool island: false

  SurfaceShadow {
    anchors.fill: parent
    radius: soft.radius
    expanded: soft.expanded
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
      color: soft.island ? Tokens.islandBg : Tokens.laneBg
    }

    SurfaceHalo {
      anchors.fill: parent
      island: soft.island
    }

    SurfaceGloss {
      anchors.fill: parent
      island: soft.island
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
