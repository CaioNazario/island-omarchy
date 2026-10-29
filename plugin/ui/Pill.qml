pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Effects

// Pílula lateral (specs/02-barra.md "Layout"): 26px de altura, raio 13, fundo
// `bg` com o acabamento do design v5; o blur é opcional (spec 19). Na
// edição de ambientes (spec 17), a pílula-alvo ganha anel `accent` com brilho
// de 18px e a outra anel `neutral-700`; clicar no espaço vazio a torna alvo.
Item {
  id: pill

  property bool editing: false
  property bool editTarget: false

  signal targetPicked

  height: Tokens.barHeight

  RectangularShadow {
    anchors.fill: parent
    visible: pill.editing && pill.editTarget
    radius: Tokens.pillRadius
    blur: 18
    color: Tokens.editorTargetGlow
  }

  SoftSurface {
    anchors.fill: parent
    radius: Tokens.pillRadius
  }

  MouseArea {
    anchors.fill: parent
    enabled: pill.editing
    onClicked: pill.targetPicked()
  }

  Rectangle {
    anchors.fill: parent
    z: 5
    visible: pill.editing
    radius: Tokens.pillRadius
    color: "transparent"
    border.width: 1
    border.color: pill.editTarget ? Tokens.accent : Tokens.neutral700
  }
}
