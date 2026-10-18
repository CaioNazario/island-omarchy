pragma ComponentBehavior: Bound

import QtQuick
import Quickshell

// "Manter tela acesa" (specs/08 "Linha de controles"): o serviço
// `omarchy.idle` do Omarchy, pelo proxy de `firstPartyServiceFor`
// (/usr/share/omarchy/shell/services/PluginFirstPartyServiceApi.qml), com
// `stayAwake` e `setIdleEnabled`. É o mesmo estado de `omarchy toggle idle`.
// Fora do omarchy-shell (harness `dev/`) não há serviço e o tile some.
Scope {
  id: idle

  property var shell: null
  readonly property var service: shell && typeof shell.firstPartyServiceFor === "function"
    ? shell.firstPartyServiceFor("omarchy.idle") : null
  readonly property bool available: service !== null
  readonly property bool stayAwake: available && service.stayAwake === true

  function toggle() {
    if (available) service.setIdleEnabled(stayAwake);
  }
}
