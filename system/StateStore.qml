pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io

// Estado da Island que sobrevive ao reinício do shell (não perturbe; depois
// ambiente ativo, nota, pomodoro). Vive no Service.qml. É estado, não
// preferência: vai em `$XDG_STATE_HOME/island/state.json`. Sem arquivo ou com
// JSON inválido, valem os padrões e o próximo salvamento reescreve.
Scope {
  id: store

  readonly property string stateHome: Quickshell.env("XDG_STATE_HOME") || Quickshell.env("HOME") + "/.local/state"
  readonly property string dir: stateHome + "/island"
  readonly property alias values: adapter
  property bool ready: false

  // O FileView não cria o diretório; o arquivo só é lido depois do mkdir.
  Process {
    running: true
    command: ["mkdir", "-p", store.dir]
    onExited: file.path = store.dir + "/state.json"
  }

  FileView {
    id: file

    atomicWrites: true
    printErrors: false
    onLoaded: store.ready = true
    onLoadFailed: {
      store.ready = true;
      writeAdapter();
    }
    // Cada mudança do adaptador grava o arquivo inteiro (é pequeno).
    onAdapterUpdated: if (store.ready) writeAdapter()

    // O qmltypes do Quickshell 0.3.1 não exporta FileViewAdapter, o tipo da
    // propriedade padrão do FileView.
    // qmllint disable unresolved-type
    JsonAdapter {
      id: adapter

      property bool doNotDisturb: false
      // `serialize` do src/core/pomodoro.ts; vazio = Foco 25:00 pausado.
      property string pomodoroState: ""
      // A dica "Configure sua cidade" já apareceu (spec 07).
      property bool weatherHintShown: false
    }
    // qmllint enable unresolved-type
  }
}
