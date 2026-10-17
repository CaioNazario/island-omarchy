pragma ComponentBehavior: Bound

import QtQuick

// Pílula lateral (specs/02-barra.md "Layout"): 26px de altura, raio 13, fundo
// `bg` com o acabamento do design v5. Sem o blur do design por enquanto.
Item {
  height: Tokens.barHeight

  SoftSurface {
    anchors.fill: parent
    radius: Tokens.pillRadius
  }
}
