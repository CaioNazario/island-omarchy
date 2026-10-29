pragma ComponentBehavior: Bound

import QtQuick

// Editor de ambientes (specs/17-editor-ambientes.md): 880px, `top: 48px`,
// padding 16px, raio 20, `bg` 94%, anel `neutral-800`. As linhas ficam na
// `EnvironmentsPage`.
Rectangle {
  id: panel

  required property var bar
  property var dragProxy: null

  implicitWidth: 880
  implicitHeight: content.implicitHeight + 32
  radius: 20
  color: Tokens.editorBg
  border.width: 1
  border.color: Tokens.neutral800

  // Cliques no painel não chegam ao fundo, que fecha o editor.
  MouseArea {
    anchors.fill: parent
  }

  EnvironmentsPage {
    id: content

    anchors.fill: parent
    anchors.margins: 16
    bar: panel.bar
    dragProxy: panel.dragProxy
  }
}
