pragma ComponentBehavior: Bound

import QtQuick

// `Scheduler` do src/core/island.ts feito de `Timer`: o motor JS do QML não
// tem `setTimeout` (specs/14-spikes.md, S5). Cada timer é filho deste objeto
// e morre com ele no hot-reload da barra.
QtObject {
  id: scheduler

  property int nextId: 1
  property var pending: ({})

  component SchedulerTimer: Timer {
    property var callback: null
    property int timerId: 0

    repeat: false
  }

  readonly property Component timerComponent: Component {
    SchedulerTimer {
      onTriggered: scheduler.fire(timerId)
    }
  }

  function setTimeout(callback, ms) {
    const id = nextId++;
    const timer = timerComponent.createObject(scheduler, { callback: callback, timerId: id, interval: ms }) as SchedulerTimer;
    pending[id] = timer;
    timer.start();
    return id;
  }

  function clearTimeout(id) {
    const timer = pending[id] as SchedulerTimer;
    if (!timer) return;
    delete pending[id];
    timer.stop();
    timer.destroy();
  }

  function fire(id) {
    const timer = pending[id] as SchedulerTimer;
    if (!timer) return;
    const callback = timer.callback;
    clearTimeout(id);
    callback();
  }
}
