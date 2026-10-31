pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import "../core/pomodoro.mjs" as PomodoroCore

// Pomodoro (specs/16-widgets.md `pomodoro`). Vive no Service.qml: segue
// rodando no hot-reload da barra e no lock (o Omarchy não descarrega a barra
// ao bloquear). O estado vai para o state.json a cada mudança; ao reiniciar o
// shell volta como estava (`serialize`/`parse` do core).
Scope {
  id: pomodoro

  required property var store
  required property var feed
  // Idioma da notificação de troca de fase (specs/13 "Idioma").
  property string language: "en"

  property var current: PomodoroCore.parse(store.values.pomodoroState)
  readonly property bool running: current.endsAt !== null

  function toggle() {
    current = PomodoroCore.toggle(current, Date.now());
    save();
  }

  function save() {
    store.values.pomodoroState = PomodoroCore.serialize(current, Date.now());
  }

  // Troca de fase ao zerar, com notificação pelo roteamento da spec 04.
  function settle() {
    const result = PomodoroCore.advance(current, Date.now());
    current = result.state;
    if (!result.started) return;
    save();
    const message = PomodoroCore.phaseNotification(result.started, pomodoro.language);
    feed.pushInternal(message.title, message.body, "timer");
  }

  onCurrentChanged: deadline.restart()

  // Um timeout único até o fim da fase, esteja o widget visível ou não.
  Timer {
    id: deadline

    interval: Math.max(0, pomodoro.running ? pomodoro.current.endsAt - Date.now() : 0)
    running: pomodoro.running
    onTriggered: pomodoro.settle()
  }

  Component.onCompleted: settle()
}
