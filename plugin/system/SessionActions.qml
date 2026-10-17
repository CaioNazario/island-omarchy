pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io

// Configurações e linha de energia (specs/09-sessao-energia.md) pelos mesmos
// comandos do menu de sistema do Omarchy (default/omarchy/omarchy-menu.jsonc,
// `system.*`). Suspender some quando o Omarchy o desligou (`suspend-off`).
Scope {
  id: session

  property bool canSuspend: false

  readonly property var commands: ({
      suspend: ["systemctl", "suspend"],
      reboot: ["omarchy-system-reboot"],
      shutdown: ["omarchy-system-shutdown"],
      logout: ["omarchy-system-logout"],
      lock: ["omarchy-system-lock"]
    })

  function run(action) {
    const command = commands[action];
    if (!command) throw new Error("unknown power action '" + action + "', expected one of " + Object.keys(commands).join(", "));
    Quickshell.execDetached(command);
  }

  function openSettings() {
    Quickshell.execDetached(["omarchy", "menu", "summon", "setup"]);
  }

  /** Terminal flutuante do Omarchy: rede enterprise (`nmtui`) e PIN de Bluetooth. */
  function openInTerminal(command) {
    Quickshell.execDetached(["omarchy-launch-floating-terminal-with-presentation", command]);
  }

  Process {
    running: true
    command: ["omarchy-toggle-enabled", "suspend-off"]
    // Sai 0 quando o toggle está ligado, isto é, suspender desligado.
    onExited: exitCode => session.canSuspend = exitCode !== 0
  }
}
