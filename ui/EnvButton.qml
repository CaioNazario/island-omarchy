pragma ComponentBehavior: Bound

import QtQuick

// Botão de ambiente no início da pílula esquerda (specs/15-ambientes.md):
// 22px, padding 0 8px, raio 11, gap 7px: ícone do ambiente 14px `accent-300`
// + pontos. O botão abre o editor (spec 17); um ponto troca de ambiente.
Rectangle {
  id: button

  required property var bar

  readonly property var environments: bar.environments
  readonly property int active: bar.environmentIndex

  implicitWidth: row.implicitWidth + 16
  implicitHeight: 22
  radius: 11
  color: pointer.containsMouse || bar.editorOpen ? Tokens.neutral900 : "transparent"

  MouseArea {
    id: pointer

    anchors.fill: parent
    hoverEnabled: true
    cursorShape: Qt.PointingHandCursor
    onClicked: button.bar.toggleEditor()
  }

  Row {
    id: row

    anchors.centerIn: parent
    spacing: 7

    PhIcon {
      anchors.verticalCenter: parent.verticalCenter
      glyph: button.environments.length > 0 ? button.environments[button.active].icon : "house"
      size: 14
      color: Tokens.accent300
    }

    EnvDots {
      anchors.verticalCenter: parent.verticalCenter
      count: button.environments.length
      active: button.active
      onPicked: index => button.bar.goEnvironment(index)
    }
  }
}
