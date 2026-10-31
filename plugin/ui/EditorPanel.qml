pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts

// Editor de ambientes (specs/17-editor-ambientes.md): 880px, `top: 48px`,
// padding 16px, raio 20, `bg` 94%, anel `neutral-800`. Cabeçalho com as abas
// Ambientes e Aparência e o "Concluir"; as linhas ficam na `EnvironmentsPage`
// e na `AppearancePage`.
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

  ColumnLayout {
    id: content

    anchors.fill: parent
    anchors.margins: 16
    spacing: 14

    RowLayout {
      Layout.fillWidth: true
      spacing: 6

      Repeater {
        model: [{ id: "environments", label: I18n.tr("Environments") }, { id: "appearance", label: I18n.tr("Appearance") }]

        EditorTab {
          required property var modelData

          label: modelData.label
          active: panel.bar.editorPage === modelData.id
          onClicked: panel.bar.editorPage = modelData.id
        }
      }

      Item {
        Layout.fillWidth: true
      }

      TextButton {
        implicitHeight: 30
        label: I18n.tr("Done")
        primary: true
        onClicked: panel.bar.closeEditor()
      }
    }

    EnvironmentsPage {
      Layout.fillWidth: true
      visible: panel.bar.editorPage === "environments"
      bar: panel.bar
      dragProxy: panel.dragProxy
    }

    AppearancePage {
      Layout.fillWidth: true
      visible: panel.bar.editorPage === "appearance"
      bar: panel.bar
    }
  }
}
