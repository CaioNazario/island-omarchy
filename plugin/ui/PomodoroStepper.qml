pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts

// Stepper `–  valor  +` das configurações do Pomodoro (specs/20 "Sessões e
// durações"): botões redondos de `size` px e, no meio, um texto ou, com
// `editable`, um campo de dois dígitos que aplica no `blur` ou no Enter.
RowLayout {
  id: stepper

  property int size: 24
  property string text: ""
  property bool editable: false
  property int valueWidth: 54
  property real valuePx: 12
  property color valueColor: Tokens.neutral300
  // Nomes acessíveis dos botões.
  property string decreaseLabel: "−"
  property string increaseLabel: "+"

  signal decrease
  signal increase
  // O texto digitado, para o core validar (`parseCycleLength`).
  signal committed(string text)

  spacing: 2

  component StepButton: Rectangle {
    id: step

    required property string symbol
    required property string label

    signal clicked

    implicitWidth: stepper.size
    implicitHeight: stepper.size
    radius: stepper.size / 2
    color: stepPointer.containsMouse ? Qt.alpha(Tokens.text, 0.12) : Qt.alpha(Tokens.text, 0.07)
    Accessible.role: Accessible.Button
    Accessible.name: label

    IslandText {
      anchors.centerIn: parent
      text: step.symbol
      px: stepper.size > 20 ? 14 : 12.5
      color: Tokens.neutral200
    }

    MouseArea {
      id: stepPointer

      anchors.fill: parent
      hoverEnabled: true
      cursorShape: Qt.PointingHandCursor
      onClicked: step.clicked()
    }
  }

  StepButton {
    symbol: "–"
    label: stepper.decreaseLabel
    onClicked: stepper.decrease()
  }

  IslandText {
    visible: !stepper.editable
    Layout.preferredWidth: stepper.valueWidth
    horizontalAlignment: Text.AlignHCenter
    text: stepper.text
    px: stepper.valuePx
    font.weight: Tokens.weightBody
    color: stepper.valueColor
  }

  // Campo rebaixado: `rgba(0,0,0,.28)` e foco com anel claro.
  Rectangle {
    visible: stepper.editable
    Layout.preferredWidth: 44
    Layout.preferredHeight: stepper.size
    Layout.leftMargin: 3
    Layout.rightMargin: 3
    radius: height / 2
    color: Qt.alpha("#000000", 0.28)
    border.width: 1
    border.color: field.activeFocus ? Qt.alpha(Tokens.text, 0.28) : Qt.alpha(Tokens.text, 0.04)

    TextInput {
      id: field

      anchors.fill: parent
      horizontalAlignment: TextInput.AlignHCenter
      verticalAlignment: TextInput.AlignVCenter
      text: stepper.text
      color: Tokens.neutral200
      font.family: Tokens.fontFamily
      font.pointSize: stepper.valuePx * 0.75
      inputMethodHints: Qt.ImhDigitsOnly
      maximumLength: 2
      selectByMouse: true
      validator: RegularExpressionValidator {
        regularExpression: /\d{0,2}/
      }
      Accessible.name: stepper.text
      onAccepted: commit()
      onActiveFocusChanged: if (!activeFocus) commit()

      function commit() {
        stepper.committed(text);
        // Vazio ou inválido volta ao valor anterior (o core devolve o mesmo número).
        text = Qt.binding(() => stepper.text);
      }
    }
  }

  StepButton {
    symbol: "+"
    label: stepper.increaseLabel
    onClicked: stepper.increase()
  }
}
