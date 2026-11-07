pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts

// Diálogo de confirmação da Urgência (specs/20 "Urgência"): "Interromper a
// pausa?". Cobre a tela de pausa e engole o clique. "Continuar na pausa" é o
// foco inicial: sair do bloqueio tem de ser deliberado.
Rectangle {
  id: dialog

  property color accent: Tokens.pomodoroBreak

  signal canceled
  signal confirmed

  color: Qt.alpha("#030304", 0.78)

  MouseArea {
    anchors.fill: parent
    // Clicar fora do cartão não faz nada: só os dois botões decidem.
    acceptedButtons: Qt.AllButtons
  }

  Rectangle {
    anchors.centerIn: parent
    width: 364
    height: content.implicitHeight + 52
    radius: 28
    border.width: 1
    border.color: Qt.alpha("#ffffff", 0.06)
    gradient: Gradient {
      GradientStop {
        position: 0
        color: "#18181b"
      }
      GradientStop {
        position: 1
        color: "#0f0f12"
      }
    }

    ColumnLayout {
      id: content

      anchors.fill: parent
      anchors.margins: 26
      spacing: 0

      IslandText {
        Layout.bottomMargin: 8
        text: I18n.tr("Stop the break?")
        px: 15
        color: "#f4f3ef"
      }

      IslandText {
        Layout.fillWidth: true
        Layout.bottomMargin: 18
        text: I18n.tr("The break screen closes and the break timer keeps running.")
        px: 13
        font.weight: Tokens.weightBody
        wrapMode: Text.WordWrap
        lineHeight: 1.5
        color: "#8d8c92"
      }

      RowLayout {
        Layout.alignment: Qt.AlignRight
        spacing: 8

        Rectangle {
          id: stay

          implicitWidth: stayLabel.implicitWidth + 36
          implicitHeight: stayLabel.implicitHeight + 22
          radius: height / 2
          color: stayPointer.containsMouse ? Qt.alpha("#ffffff", 0.09) : Qt.alpha("#ffffff", 0.05)
          border.width: activeFocus ? 2 : 1
          border.color: activeFocus ? dialog.accent : Qt.alpha("#ffffff", 0.06)
          focus: true
          activeFocusOnTab: true
          Accessible.role: Accessible.Button
          Accessible.name: stayLabel.text

          IslandText {
            id: stayLabel

            anchors.centerIn: parent
            text: I18n.tr("Stay on break")
            px: 12.5
            font.weight: Tokens.weightBody
            color: "#cfcec9"
          }

          MouseArea {
            id: stayPointer

            anchors.fill: parent
            hoverEnabled: true
            cursorShape: Qt.PointingHandCursor
            onClicked: dialog.canceled()
          }

          Keys.onReturnPressed: dialog.canceled()
          Keys.onEnterPressed: dialog.canceled()
          Keys.onSpacePressed: dialog.canceled()
        }

        Rectangle {
          id: confirm

          implicitWidth: confirmLabel.implicitWidth + 36
          implicitHeight: confirmLabel.implicitHeight + 22
          radius: height / 2
          color: confirmPointer.containsMouse ? Qt.lighter(dialog.accent, 1.08) : dialog.accent
          border.width: activeFocus ? 2 : 0
          border.color: "#ffffff"
          activeFocusOnTab: true
          Accessible.role: Accessible.Button
          Accessible.name: confirmLabel.text

          IslandText {
            id: confirmLabel

            anchors.centerIn: parent
            text: I18n.tr("Confirm emergency")
            px: 12.5
            color: Tokens.pomodoroOnAccent
          }

          MouseArea {
            id: confirmPointer

            anchors.fill: parent
            hoverEnabled: true
            cursorShape: Qt.PointingHandCursor
            onClicked: dialog.confirmed()
          }

          Keys.onReturnPressed: dialog.confirmed()
          Keys.onEnterPressed: dialog.confirmed()
          Keys.onSpacePressed: dialog.confirmed()
        }
      }
    }
  }

  Component.onCompleted: stay.forceActiveFocus()
}
