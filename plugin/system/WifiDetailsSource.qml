pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io
import "../core/wifiPanel.mjs" as PanelCore

// Estatísticas e DNS do modo `wifi` (specs/08 "Modo `wifi`"): como o painel
// de rede do Omarchy, `omarchy-network-status --verbose` a cada 1.5s com o
// modo aberto (as taxas saem do delta entre duas leituras) e `omarchy-dns`
// para ler e trocar o provedor de DNS.
Scope {
  id: details

  property bool watching: false

  property var previous: null
  property var current: null
  readonly property var stats: PanelCore.networkStats(previous, current)
  property string dnsProvider: "DHCP"
  property var customServers: []
  readonly property string dnsDetail: PanelCore.dnsDetail(dnsProvider, current ? current.gateway : "", customServers)
  property bool dnsBusy: false

  onWatchingChanged: {
    if (!watching) {
      previous = null;
      current = null;
      return;
    }
    poll();
    readDns();
  }

  function poll() {
    if (!statusProc.running) statusProc.running = true;
  }

  function readDns() {
    if (!dnsReadProc.running) dnsReadProc.running = true;
  }

  /** O script pede root pela regra do sudoers do Omarchy ou pelo polkit. */
  function setDns(provider) {
    if (dnsProc.running) return;
    dnsProc.servers = "";
    dnsProc.command = ["omarchy-dns", provider];
    dnsProc.running = true;
  }

  /** `omarchy-dns Custom` lê os servidores da entrada padrão. */
  function setCustomDns(servers) {
    const trimmed = String(servers).trim();
    if (dnsProc.running || trimmed === "") return;
    dnsProc.servers = trimmed;
    dnsProc.command = ["omarchy-dns", "Custom"];
    dnsProc.running = true;
  }

  Process {
    id: statusProc

    command: ["omarchy-network-status", "--verbose"]
    stdout: StdioCollector {
      onStreamFinished: {
        const sample = PanelCore.parseNetworkStatus(text, Date.now());
        details.previous = details.current;
        details.current = sample;
      }
    }
  }

  Timer {
    interval: 1500
    repeat: true
    running: details.watching
    onTriggered: details.poll()
  }

  Process {
    id: dnsReadProc

    command: ["omarchy-dns"]
    stdout: StdioCollector {
      onStreamFinished: details.dnsProvider = String(text).trim() || "DHCP"
    }
  }

  Process {
    id: dnsProc

    property string servers: ""

    stdinEnabled: true
    onStarted: {
      if (servers !== "") write(servers + "\n");
      stdinEnabled = false;
      details.dnsBusy = true;
    }
    onExited: {
      stdinEnabled = true;
      details.dnsBusy = false;
      details.readDns();
    }
  }

  // Servidores do DNS personalizado: a linha `DNS=` que o `omarchy-dns` grava.
  FileView {
    path: "/etc/systemd/resolved.conf"
    watchChanges: true
    printErrors: false
    onFileChanged: reload()
    onLoaded: details.customServers = PanelCore.parseResolvedServers(text())
  }
}
