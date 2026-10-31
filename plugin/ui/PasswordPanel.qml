pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts

// Painel de senha abaixo da rede escolhida (specs/08-controles-rapidos.md
// "Painel de senha"): margin 2px 0 6px, padding 10px, raio 12, `neutral-900`,
// anel 1px `neutral-800` (com erro `#bd413f`).
Item {
  id: panel

  required property string ssid
  required property string error

  signal submitted(string password)
  signal canceled
  signal typed

  property bool revealed: false

  implicitHeight: box.implicitHeight + 8

  function focusField() {
    input.forceActiveFocus();
  }

  Rectangle {
    id: box

    y: 2
    width: parent.width
    implicitHeight: content.implicitHeight + 20
    radius: 12
    color: Tokens.neutral900
    border.width: 1
    border.color: panel.error !== "" ? Tokens.passwordErrorBorder : Tokens.neutral800

    ColumnLayout {
      id: content

      anchors.fill: parent
      anchors.margins: 10
      spacing: 6

      RowLayout {
        spacing: 8

        Rectangle {
          Layout.fillWidth: true
          implicitHeight: 32
          radius: 9
          color: Tokens.bg
          border.width: 1
          border.color: Tokens.neutral800

          RowLayout {
            anchors.fill: parent
            anchors.leftMargin: 10
            anchors.rightMargin: 10
            spacing: 8

            PhIcon {
              glyph: "key"
              size: 14
              color: Tokens.neutral400
            }

            TextInput {
              id: input

              Layout.fillWidth: true
              color: Tokens.text
              font.family: Tokens.fontFamily
              font.pointSize: 12.5 * 0.75
              echoMode: panel.revealed ? TextInput.Normal : TextInput.Password
              passwordCharacter: "●"
              clip: true
              onTextEdited: panel.typed()
              onAccepted: panel.submitted(text)

              IslandText {
                visible: input.text === ""
                text: I18n.tr("Password for {ssid}", { ssid: panel.ssid })
                px: 12.5
                font.weight: Tokens.weightBody
                color: Tokens.neutral500
                elide: Text.ElideRight
                width: input.width
              }
            }

            PhIcon {
              glyph: panel.revealed ? "eye-slash" : "eye"
              size: 14
              color: Tokens.neutral400

              MouseArea {
                anchors.centerIn: parent
                width: 22
                height: 22
                cursorShape: Qt.PointingHandCursor
                onClicked: panel.revealed = !panel.revealed
              }
            }
          }
        }

        TextButton {
          label: I18n.tr("Cancel")
          onClicked: panel.canceled()
        }

        TextButton {
          label: I18n.tr("Connect")
          primary: true
          opacity: input.text === "" ? 0.45 : 1
          onClicked: panel.submitted(input.text)
        }
      }

      RowLayout {
        visible: panel.error !== ""
        spacing: 6

        PhIcon {
          glyph: "warning-circle"
          size: 13
          color: Tokens.alertText
        }

        IslandText {
          text: I18n.tr(panel.error)
          px: 11
          font.weight: Tokens.weightBody
          color: Tokens.alertText
        }
      }
    }
  }
}
