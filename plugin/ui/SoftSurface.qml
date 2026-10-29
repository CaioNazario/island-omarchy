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
  // Opções de aparência (specs/19-aparencia.md "Superfície"), já resolvidas
  // pelo core.
  readonly property var style: island ? Tokens.islandStyle : Tokens.pillStyle
  // No gradiente o fundo é a base do shader, e não o retângulo.
  readonly property color paint: style.gradient ? style.gradient.base : style.fill
  readonly property bool opaqueFill: paint.a >= 1

  SurfaceShadow {
    anchors.fill: parent
    radius: soft.radius
    expanded: soft.expanded
  }

  // `inset 0 1px 0 rgba(255,255,255,.07)`: o fundo deixa 1px do brilho à
  // mostra no topo, acompanhando o raio. Com fundo translúcido o branco
  // apareceria por trás dele inteiro: o brilho só fica sobre fundo opaco.
  ClippingRectangle {
    anchors.fill: parent
    radius: soft.radius
    color: soft.style.finish && soft.opaqueFill ? Qt.rgba(1, 1, 1, 0.07) : "transparent"

    Rectangle {
      id: fillRect

      anchors.fill: parent
      anchors.topMargin: soft.opaqueFill ? 1 : 0
      radius: soft.radius
      color: soft.style.fill
    }

    Loader {
      anchors.fill: fillRect
      active: soft.style.gradient !== null

      sourceComponent: SurfaceGradient {
        gradient: soft.style.gradient
        cornerRadius: soft.radius
      }
    }

    Loader {
      anchors.fill: parent
      active: soft.style.grain > 0

      sourceComponent: SurfaceGrain {
        strength: soft.style.grain
        cornerRadius: soft.radius
      }
    }

    SurfaceHalo {
      anchors.fill: parent
      visible: soft.style.finish
      island: soft.island
    }

    SurfaceGloss {
      anchors.fill: parent
      visible: soft.style.finish
      island: soft.island
    }
  }

  // `inset 0 0 0 1px rgba(255,255,255,.05)` no padrão; largura e opacidade
  // vêm das opções (spec 19 "Superfície"). Por dentro: não muda o tamanho.
  Rectangle {
    anchors.fill: parent
    visible: soft.style.borderWidth > 0
    radius: soft.radius
    color: "transparent"
    border.width: soft.style.borderWidth
    border.color: soft.style.borderColor
  }
}
