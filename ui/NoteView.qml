pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import "../core/note.mjs" as NoteCore

// Modo `note` (specs/16-widgets.md "Modo `note`", 420×132): cabeçalho com o
// contador e o campo de várias linhas. Grava com debounce de 300ms e ao
// fechar; Enter fecha (Esc é o da ilha).
Item {
  id: view

  required property var bar
  readonly property var settings: bar.service ? bar.service.settings.values : null

  function save() {
    if (settings) settings.noteText = NoteCore.sanitizeNote(field.text);
  }

  Component.onDestruction: save()

  ColumnLayout {
    anchors.fill: parent
    anchors.leftMargin: 14
    anchors.rightMargin: 14
    anchors.topMargin: 12
    anchors.bottomMargin: 12
    spacing: 8

    RowLayout {
      Layout.fillWidth: true
      Layout.preferredHeight: 22
      spacing: 8

      PhIcon {
        glyph: "note-fill"
        size: 15
        color: Tokens.accent300
      }

      IslandText {
        Layout.fillWidth: true
        text: "Nota"
      }

      IslandText {
        text: NoteCore.noteCounter(field.text)
        px: 11
        font.weight: Tokens.weightBody
        color: Tokens.neutral500
      }
    }

    Rectangle {
      Layout.fillWidth: true
      Layout.fillHeight: true
      radius: 10
      color: Tokens.neutral900
      border.width: 1
      border.color: field.activeFocus ? Tokens.accent : Tokens.neutral800

      TextEdit {
        id: field

        anchors.fill: parent
        anchors.leftMargin: 10
        anchors.rightMargin: 10
        anchors.topMargin: 8
        anchors.bottomMargin: 8
        text: view.settings ? view.settings.noteText : ""
        color: Tokens.text
        font.family: Tokens.fontFamily
        font.pointSize: 13 * 0.75
        wrapMode: TextEdit.Wrap
        selectByMouse: true
        // Quebra de linha colada vira espaço; limite de 80 (`sanitizeNote`).
        onTextChanged: {
          const clean = NoteCore.sanitizeNote(text);
          if (clean !== text) {
            text = clean;
            cursorPosition = text.length;
          }
          debounce.restart();
        }
        Keys.onReturnPressed: view.bar.closeAll()
        Keys.onEnterPressed: view.bar.closeAll()
        Component.onCompleted: {
          forceActiveFocus();
          cursorPosition = text.length;
        }

        IslandText {
          visible: field.text === ""
          text: "Escreva um recado para a barra"
          font.weight: Tokens.weightBody
          color: Tokens.neutral500
        }
      }
    }
  }

  Timer {
    id: debounce

    interval: 300
    onTriggered: view.save()
  }
}
