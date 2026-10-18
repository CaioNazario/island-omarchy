pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io

// Preferências da Island (specs/13-preferencias.md) em
// `$XDG_CONFIG_HOME/island/settings.json`: as chaves do antigo schema
// GSettings, com os mesmos padrões. Vigiado: editar o arquivo (à mão ou pela
// janela de preferências) vale na hora. Vive no Service.qml.
Scope {
  id: store

  readonly property string configHome: Quickshell.env("XDG_CONFIG_HOME") || Quickshell.env("HOME") + "/.config"
  readonly property string dir: configHome + "/island"
  readonly property alias values: adapter
  property bool ready: false

  Process {
    running: true
    command: ["mkdir", "-p", store.dir]
    onExited: file.path = store.dir + "/settings.json"
  }

  FileView {
    id: file

    atomicWrites: true
    watchChanges: true
    printErrors: false
    onFileChanged: reload()
    onLoaded: store.ready = true
    onLoadFailed: {
      store.ready = true;
      writeAdapter();
    }
    onAdapterUpdated: if (store.ready) writeAdapter()

    // O qmltypes do Quickshell 0.3.1 não exporta FileViewAdapter, o tipo da
    // propriedade padrão do FileView.
    // qmllint disable unresolved-type
    JsonAdapter {
      id: adapter

      // `card` (cartão central) ou `calendar` (spec 03, regra 5).
      property string clickAction: "card"
      // `{name, latitude, longitude}` ou null (spec 07).
      property var weatherLocation: null
      property bool aiClaudeEnabled: true
      property bool aiCodexEnabled: true
      // `[nome, ícone, [esquerda], [direita]]`; vazio = ambientes iniciais (spec 15).
      property var environments: []
      property int environmentIndex: 0
      property bool autoHide: false
      // Tema do design (spec 01 "Temas"; `THEME_IDS` em themes.ts).
      property string theme: "Nocturne"
      property string noteText: ""
      property string countdownName: ""
      // `AAAA-MM-DD` ou vazio.
      property string countdownDate: ""
    }
    // qmllint enable unresolved-type
  }
}
