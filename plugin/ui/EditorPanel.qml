pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/environments.mjs" as EnvironmentsCore

// Editor de ambientes (specs/17-editor-ambientes.md): 880px, `top: 48px`,
// padding 16px, raio 20, `bg` 94%, anel `neutral-800`, linhas com gap 14px:
// ambientes · ambiente ativo · seleção · catálogo · rodapé.
Rectangle {
  id: panel

  required property var bar
  property var dragProxy: null
  readonly property var env: bar.environment
  readonly property int index: bar.environmentIndex

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

  ColumnLayout {
    id: content

    anchors.fill: parent
    anchors.margins: 16
    spacing: 14

    // Linha 1: ambientes.
    RowLayout {
      Layout.fillWidth: true
      spacing: 6

      IslandText {
        Layout.rightMargin: 8
        text: "Ambientes"
        px: 14
      }

      Repeater {
        model: panel.bar.environments

        Rectangle {
          id: tab

          required property var modelData
          required property int index
          readonly property bool active: index === panel.index

          implicitWidth: tabRow.implicitWidth + 24
          implicitHeight: 30
          radius: 15
          color: active ? Tokens.accent900 : tabPointer.containsMouse ? Tokens.neutral800 : Tokens.neutral900
          border.width: active ? 1 : 0
          border.color: Tokens.accent700

          Row {
            id: tabRow

            anchors.centerIn: parent
            spacing: 7

            PhIcon {
              anchors.verticalCenter: parent.verticalCenter
              glyph: tab.modelData.icon
              size: 14
              color: tab.active ? Tokens.accent100 : Tokens.neutral300
            }

            IslandText {
              anchors.verticalCenter: parent.verticalCenter
              text: tab.modelData.name || "Sem nome"
              px: 12.5
              font.weight: Tokens.weightBody
              color: tab.active ? Tokens.accent100 : Tokens.neutral300
            }
          }

          MouseArea {
            id: tabPointer

            anchors.fill: parent
            hoverEnabled: true
            cursorShape: Qt.PointingHandCursor
            onClicked: panel.bar.editorSwitch(tab.index)
          }
        }
      }

      Rectangle {
        visible: panel.bar.environments.length < EnvironmentsCore.MAX_ENVIRONMENTS
        implicitWidth: 30
        implicitHeight: 30
        radius: 15
        color: newPointer.containsMouse ? Tokens.neutral900 : "transparent"
        border.width: 1
        border.color: Tokens.neutral800

        PhIcon {
          anchors.centerIn: parent
          glyph: "plus"
          size: 13
          color: Tokens.neutral300
        }

        MouseArea {
          id: newPointer

          anchors.fill: parent
          hoverEnabled: true
          cursorShape: Qt.PointingHandCursor
          onClicked: panel.bar.editorAddEnvironment()
        }
      }

      Item {
        Layout.fillWidth: true
      }

      TextButton {
        implicitHeight: 30
        label: "Concluir"
        primary: true
        onClicked: panel.bar.closeEditor()
      }
    }

    // Linha 2: nome, ícone e excluir.
    RowLayout {
      Layout.fillWidth: true
      spacing: 6

      Rectangle {
        Layout.rightMargin: 8
        implicitWidth: 240
        implicitHeight: 34
        radius: 10
        color: Tokens.neutral900
        border.width: 1
        border.color: Tokens.neutral800

        RowLayout {
          anchors.fill: parent
          anchors.leftMargin: 10
          anchors.rightMargin: 10
          spacing: 8

          PhIcon {
            glyph: "pencil-simple"
            size: 14
            color: Tokens.neutral400
          }

          TextInput {
            id: nameField

            Layout.fillWidth: true
            color: Tokens.text
            font.family: Tokens.fontFamily
            font.pointSize: 12.5 * 0.75
            maximumLength: EnvironmentsCore.MAX_NAME_LENGTH
            clip: true
            text: panel.env.name
            // Grava enquanto digita (spec 17).
            onTextEdited: panel.bar.editorRename(text)
            Keys.onEscapePressed: panel.bar.closeEditor()

            IslandText {
              visible: nameField.text === ""
              text: "Nome do ambiente"
              px: 12.5
              font.weight: Tokens.weightBody
              color: Tokens.neutral500
            }
          }
        }
      }

      Repeater {
        model: EnvironmentsCore.ENV_ICONS

        Rectangle {
          id: iconChoice

          required property string modelData
          readonly property bool chosen: panel.env.icon === modelData

          implicitWidth: 32
          implicitHeight: 32
          radius: 10
          color: chosen ? Tokens.accent900 : iconPointer.containsMouse ? Tokens.neutral900 : "transparent"
          border.width: chosen ? 1 : 0
          border.color: Tokens.accent700

          PhIcon {
            anchors.centerIn: parent
            glyph: iconChoice.modelData
            color: iconChoice.chosen ? Tokens.accent200 : Tokens.neutral400
          }

          MouseArea {
            id: iconPointer

            anchors.fill: parent
            hoverEnabled: true
            cursorShape: Qt.PointingHandCursor
            onClicked: panel.bar.editorSetIcon(iconChoice.modelData)
          }
        }
      }

      Item {
        Layout.fillWidth: true
      }

      // Some no Padrão; exclui na hora, sem confirmação.
      Rectangle {
        visible: panel.index > 0
        implicitWidth: deleteRow.implicitWidth + 20
        implicitHeight: 30
        radius: 9
        color: deletePointer.containsMouse ? Tokens.neutral900 : "transparent"

        Row {
          id: deleteRow

          anchors.centerIn: parent
          spacing: 6

          PhIcon {
            anchors.verticalCenter: parent.verticalCenter
            glyph: "trash"
            size: 14
            color: Tokens.powerOffText
          }

          IslandText {
            anchors.verticalCenter: parent.verticalCenter
            text: "Excluir ambiente"
            px: 12
            font.weight: Tokens.weightBody
            color: Tokens.powerOffText
          }
        }

        MouseArea {
          id: deletePointer

          anchors.fill: parent
          hoverEnabled: true
          cursorShape: Qt.PointingHandCursor
          onClicked: panel.bar.editorRemoveEnvironment()
        }
      }
    }

    EditorSelection {
      Layout.fillWidth: true
      bar: panel.bar
    }

    EditorCatalog {
      Layout.fillWidth: true
      bar: panel.bar
      dragProxy: panel.dragProxy
    }

    RowLayout {
      Layout.fillWidth: true
      spacing: 8

      PhIcon {
        glyph: "hand-swipe-left"
        size: 15
        color: Tokens.neutral500
      }

      IslandText {
        Layout.fillWidth: true
        text: "Deslize com dois dedos sobre a barra para trocar de ambiente. No teclado: Super+Ctrl+Alt+← / Super+Ctrl+Alt+→."
        px: 11.5
        font.weight: Tokens.weightBody
        color: Tokens.neutral500
        elide: Text.ElideRight
      }
    }
  }
}
