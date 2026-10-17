pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io
import "../core/wifiPanel.mjs" as PanelCore

// Compartilhar a rede por QR (specs/08 "Modo `wifi`"), como o cartão de QR do
// Omarchy: matriz de `omarchy-network-qr --meta` e a senha só quando pedida,
// por `omarchy-network-password`. A senha não fica guardada depois de fechar.
Scope {
  id: share

  property var qr: ({ iface: "", ssid: "", secured: false, rows: [] })
  property string error: ""
  property string password: ""
  property bool revealed: false
  property bool copied: false
  // Pedido de cópia esperando a senha chegar.
  property bool copyPending: false

  function load() {
    reset();
    if (!qrProc.running) qrProc.running = true;
  }

  function reset() {
    qr = { iface: "", ssid: "", secured: false, rows: [] };
    error = "";
    password = "";
    revealed = false;
    copied = false;
    copyPending = false;
  }

  function fetchPassword() {
    if (passwordProc.running || qr.iface === "") return;
    passwordProc.command = ["omarchy-network-password", qr.iface];
    passwordProc.running = true;
  }

  function toggleReveal() {
    if (revealed) {
      revealed = false;
      return;
    }
    revealed = true;
    if (password === "") fetchPassword();
  }

  function copyPassword() {
    if (!qr.secured) return;
    if (password === "") {
      copyPending = true;
      fetchPassword();
      return;
    }
    copyProc.running = true;
  }

  Process {
    id: qrProc

    command: ["omarchy-network-qr", "--meta"]
    stdout: StdioCollector {
      onStreamFinished: share.qr = PanelCore.parseQr(text)
    }
    stderr: StdioCollector {
      onStreamFinished: share.error = String(text).trim()
    }
  }

  Process {
    id: passwordProc

    stdout: StdioCollector {
      onStreamFinished: {
        share.password = String(text).replace(/\n$/, "");
        if (share.copyPending && share.password !== "") {
          share.copyPending = false;
          copyProc.running = true;
        }
      }
    }
  }

  // A senha vai pela entrada padrão do wl-copy, não pela linha de comando.
  Process {
    id: copyProc

    command: ["wl-copy"]
    stdinEnabled: true
    onStarted: {
      write(share.password);
      stdinEnabled = false;
    }
    onExited: {
      stdinEnabled = true;
      share.copied = true;
      copiedTimer.restart();
    }
  }

  Timer {
    id: copiedTimer

    interval: 1400
    onTriggered: share.copied = false
  }
}
