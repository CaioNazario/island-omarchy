import QtQuick

// Pílula lateral (specs/02-barra.md "Layout"): 30px de altura, raio 15, fundo
// `bg`, anel 1px `neutral-800`. Sem o blur do design por enquanto.
Rectangle {
  height: Tokens.barHeight
  radius: Tokens.pillRadius
  color: Tokens.bg
  border.width: 1
  border.color: Tokens.neutral800
}
