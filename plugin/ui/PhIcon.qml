pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Effects
import QtQuick.Window

// Ícone Phosphor (specs/01-design-tokens.md "Ícones"): `icons/<glifo>-symbolic.svg`,
// branco no build e tingido aqui. O glifo segue a classe do design:
// `ph ph-sun` → `sun`, `ph-bold ph-power` → `power-bold`, `ph-fill ph-moon` → `moon-fill`.
Item {
  id: icon

  required property string glyph
  property color color: Tokens.text
  property int size: 16

  implicitWidth: size
  implicitHeight: size

  Image {
    id: glyphImage

    anchors.fill: parent
    source: Qt.resolvedUrl("../icons/" + icon.glyph + "-symbolic.svg")
    // Rasteriza na densidade do monitor: com escala fracionária, um SVG
    // rasterizado em 1x fica borrado.
    sourceSize: Qt.size(Math.ceil(icon.size * Screen.devicePixelRatio), Math.ceil(icon.size * Screen.devicePixelRatio))
    smooth: true
    visible: false
    layer.enabled: true
  }

  MultiEffect {
    anchors.fill: glyphImage
    source: glyphImage
    colorization: 1
    colorizationColor: icon.color
  }
}
