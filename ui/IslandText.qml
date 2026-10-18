pragma ComponentBehavior: Bound

import QtQuick

// Texto padrão da Island: Inter 13px/500 com dígitos tabulares
// (specs/01-design-tokens.md "Tipografia"). `px` aceita os meios pixels do
// design (12.5, 10.5, 8.5): `font.pixelSize` é inteiro, então o tamanho vai
// em pontos, com os 96 DPI lógicos do Qt no Wayland (1px = 0.75pt).
Text {
  property real px: 13

  color: Tokens.text
  font.family: Tokens.fontFamily
  font.pointSize: px * 0.75
  font.weight: Tokens.weightLabel
  font.features: { "tnum": 1 }
}
