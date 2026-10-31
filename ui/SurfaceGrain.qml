pragma ComponentBehavior: Bound

import QtQuick

// Grão de filme da `SoftSurface` (specs/19-aparencia.md "Grão"): o shader do
// omadock, pontos cinza estáticos de até 27% × força, um por pixel lógico,
// recortado pelo raio. Estático: não custa nada entre quadros.
ShaderEffect {
  property real strength: 0
  property real cornerRadius: 0
  property real radius: cornerRadius
  property size size: Qt.size(width, height)

  fragmentShader: Qt.resolvedUrl("../shaders/grain.frag.qsb")
}
