import QtQuick

// Texto padrão da Island: Inter 13px/500 com dígitos tabulares
// (specs/01-design-tokens.md "Tipografia").
Text {
  color: Tokens.text
  font.family: Tokens.fontFamily
  font.pixelSize: 13
  font.weight: Tokens.weightLabel
  font.features: { "tnum": 1 }
  renderType: Text.NativeRendering
}
