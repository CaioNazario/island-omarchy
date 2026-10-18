pragma ComponentBehavior: Bound

import QtQuick
import Quickshell

// Modo noturno do Omarchy (hyprsunset). A barra de terceiros recebe um proxy
// do serviço `omarchy.nightlight` por `firstPartyServiceFor`
// (specs/14-spikes.md, S6), com `enabled` e `toggle()` ao vivo. Fora do
// omarchy-shell (harness `dev/`) não há serviço e o tile some.
Scope {
  id: nightLight

  property var shell: null
  readonly property var service: shell && typeof shell.firstPartyServiceFor === "function"
    ? shell.firstPartyServiceFor("omarchy.nightlight") : null
  readonly property bool available: service !== null
  readonly property bool on: available && service.enabled === true

  function toggle() {
    if (available) service.toggle();
  }
}
