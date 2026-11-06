pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Effects

// Botão redondo do Pomodoro (specs/20-pomodoro.md "Botões"): o elevado
// (Reiniciar, Pular) e o primário na cor da etapa (Iniciar/Pausar). Só ícone,
// então `label` é o nome acessível.
Rectangle {
  id: button

  required property string glyph
  required property string label
  property int diameter: 32
  property int iconSize: 13
  property bool primary: false
  property color accent: Tokens.pomodoroFocus
  property color iconColor: Tokens.neutral300

  signal clicked

  readonly property bool hovered: pointer.containsMouse

  implicitWidth: diameter
  implicitHeight: diameter
  radius: diameter / 2
  color: primary ? (hovered ? Qt.lighter(accent, 1.08) : accent) : hovered ? Qt.alpha(Tokens.text, 0.09) : Qt.alpha(Tokens.text, 0.05)
  border.width: primary ? 0 : 1
  border.color: activeFocus ? Tokens.accent : Qt.alpha(Tokens.text, 0.06)
  activeFocusOnTab: true
  Accessible.role: Accessible.Button
  Accessible.name: label

  Behavior on color {
    ColorAnimation {
      duration: 150
    }
  }

  // Brilho do primário: `0 10px 24px -6px` na cor da etapa a 55%.
  RectangularShadow {
    visible: button.primary
    z: -1
    anchors.fill: parent
    anchors.margins: 6
    offset: Qt.vector2d(0, 6)
    radius: button.radius
    blur: 18
    color: Qt.alpha(button.accent, 0.4)
  }

  PhIcon {
    anchors.centerIn: parent
    glyph: button.glyph
    size: button.iconSize
    color: button.primary ? Tokens.pomodoroOnAccent : button.hovered ? Tokens.text : button.iconColor
  }

  MouseArea {
    id: pointer

    anchors.fill: parent
    hoverEnabled: true
    cursorShape: Qt.PointingHandCursor
    onClicked: button.clicked()
  }

  Keys.onReturnPressed: clicked()
  Keys.onEnterPressed: clicked()
  Keys.onSpacePressed: clicked()
}
