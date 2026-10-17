pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io
import "../core/hardware.mjs" as HardwareCore

// Hardware (specs/10-hardware.md): amostragem de 1s por delta, só com o
// widget `hw` no ambiente ativo. As leituras são `FileView` assíncronos; a
// conta é do core.
Scope {
  id: hardware

  property bool sampling: false
  property var blocks: []

  // De onde ler GPU e temperatura (detect-hardware.sh); vazio = o bloco some.
  property string gpuKind: ""
  property string gpuPath: ""
  property string tempPath: ""

  property var previous: null
  // Leituras do tique ainda em curso: o delta só sai com todas carregadas.
  property int pending: 0

  readonly property var files: [stat, meminfo, netDev, gpu, temp]

  function sample() {
    const active = files.filter(file => file.path !== "");
    pending = active.length;
    active.forEach(file => file.reload());
  }

  // A leitura inicial (ao definir o caminho) chega fora de um tique: ignorada.
  function fileLoaded() {
    if (pending <= 0) return;
    pending -= 1;
    if (pending === 0) compute();
  }

  function compute() {
    const now = Date.now();
    const current = {
      atMs: now,
      cpu: HardwareCore.parseCpuTimes(stat.text()),
      memory: HardwareCore.parseMeminfo(meminfo.text()),
      net: HardwareCore.parseNetDev(netDev.text()),
      gpuValue: gpu.path === "" ? null : parseFloat(gpu.text()),
      tempMilli: temp.path === "" ? null : parseFloat(temp.text())
    };
    if (previous && current.cpu && previous.cpu && current.memory) blocks = HardwareCore.hardwareBlocks(reading(previous, current));
    previous = current;
  }

  function reading(before, after) {
    const elapsedMs = Math.max(1, after.atMs - before.atMs);
    return {
      cpu: HardwareCore.cpuUsage(before.cpu, after.cpu),
      memory: after.memory,
      gpu: gpuBusy(before, after, elapsedMs),
      temp: after.tempMilli === null || isNaN(after.tempMilli) ? null : after.tempMilli / 1000,
      net: HardwareCore.netRates(before.net, after.net, elapsedMs)
    };
  }

  // amdgpu dá a ocupação direta; i915/xe dão o tempo ocioso acumulado.
  function gpuBusy(before, after, elapsedMs) {
    if (after.gpuValue === null || isNaN(after.gpuValue)) return null;
    if (gpuKind === "busy") return after.gpuValue;
    return HardwareCore.busyFromIdleResidency(before.gpuValue, after.gpuValue, elapsedMs);
  }

  onSamplingChanged: if (!sampling) previous = null

  Process {
    running: true
    command: ["bash", Qt.resolvedUrl("detect-hardware.sh").toString().replace("file://", "")]
    stdout: SplitParser {
      onRead: line => {
        if (line.startsWith("gpu=")) {
          const [kind, path] = line.slice(4).split(" ");
          hardware.gpuKind = kind;
          hardware.gpuPath = path;
        } else if (line.startsWith("temp=")) {
          hardware.tempPath = line.slice(5);
        }
      }
    }
  }

  // Sem `preload: false`: com ele, a leitura assíncrona de /proc nunca emite
  // `loaded` (Quickshell 0.3.1; os arquivos de /proc têm tamanho 0).
  component ProcFile: FileView {
    printErrors: false
    blockLoading: false
    onLoaded: hardware.fileLoaded()
    onLoadFailed: hardware.fileLoaded()
  }

  ProcFile {
    id: stat

    path: hardware.sampling ? "/proc/stat" : ""
  }
  ProcFile {
    id: meminfo

    path: hardware.sampling ? "/proc/meminfo" : ""
  }
  ProcFile {
    id: netDev

    path: hardware.sampling ? "/proc/net/dev" : ""
  }
  ProcFile {
    id: gpu

    path: hardware.sampling ? hardware.gpuPath : ""
  }
  ProcFile {
    id: temp

    path: hardware.sampling ? hardware.tempPath : ""
  }

  Timer {
    interval: 1000
    repeat: true
    running: hardware.sampling
    triggeredOnStart: true
    onTriggered: hardware.sample()
  }
}
