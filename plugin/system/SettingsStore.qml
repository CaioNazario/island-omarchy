pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io

// Preferências da Island (specs/13-preferencias.md) em
// `$XDG_CONFIG_HOME/island/settings.json`. Vigiado: editar o arquivo (à mão ou pela
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
      // `en` ou `pt-BR` (specs/13 "Idioma"; `LANGUAGE_IDS` em i18n.ts).
      property string language: "en"
      // `auto`, `small`, `medium` ou `large` (spec 02 "Tamanho"; `BAR_SIZE_IDS` em barZoom.ts).
      property string barSize: "auto"
      // Tema do design (spec 01 "Temas"; `THEME_IDS` em themes.ts).
      property string theme: "Nocturne"
      // Cor de realce (spec 01 "Realce"; `ACCENT_IDS` em themes.ts).
      property string accent: "Roxo"
      // Aparência das pílulas e da ilha (spec 19; `sanitizeAppearance` em
      // appearance.ts). Null = o visual do design.
      property var appearance: null
      property string noteText: ""
      property string countdownName: ""
      // `AAAA-MM-DD` ou vazio.
      property string countdownDate: ""
    }
    // qmllint enable unresolved-type
  }
}
