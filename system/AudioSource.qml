pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io
import Quickshell.Services.Pipewire

// Áudio pelo Pipewire (specs/08-controles-rapidos.md "Volume" e "Modo
// `mixer`"): volume da saída padrão, máximo 100% sem amplificação, e as
// listas do gerenciador de volume. Os cuidados vêm do painel de áudio do
// Omarchy (/usr/share/omarchy/shell/plugins/panels/audio/Panel.qml).
Scope {
  id: audio

  // Com o `mixer` aberto: liga as listas, os nós dos apps e a disponibilidade.
  property bool listing: false

  readonly property PwNode defaultSink: Pipewire.defaultAudioSink
  readonly property PwNode source: Pipewire.defaultAudioSource
  readonly property var nodes: Pipewire.nodes ? Pipewire.nodes.values : []

  // Um sink de DSP (afinação de alto-falante, EasyEffects) pode ser a saída
  // padrão sem ser onde o volume mora: `omarchy-audio-output-sink` resolve a
  // saída física, a mesma que as teclas de volume do Omarchy usam.
  property string volumeSinkName: ""
  readonly property PwNode sink: {
    if (volumeSinkName === "" || !defaultSink || volumeSinkName === String(defaultSink.name)) return defaultSink;
    for (const node of nodes) {
      if (node && node.isSink && !node.isStream && String(node.name) === volumeSinkName && node.audio) return node;
    }
    return defaultSink;
  }

  readonly property bool available: sink !== null && sink.audio !== null
  readonly property int percent: available ? Math.round(Math.min(1, sink.audio.volume) * 100) : 0
  readonly property bool muted: available && sink.audio.muted
  readonly property bool micAvailable: source !== null && source.audio !== null

  readonly property var candidateSinks: nodes.filter(node => node && node.isSink && !node.isStream)
  // Stream de reprodução: `isSink` sem ler `properties` (inválido até o nó
  // vincular; lido enquanto streams de captura surgem, desestabiliza o
  // Pipewire do Quickshell, segundo o painel do Omarchy).
  readonly property var candidateStreams: listing
    ? nodes.filter(node => node && node.isStream && node.isSink && String(node.name || "").indexOf("omarchy_speaker_tuning") !== 0)
    : []

  property var sinkAvailability: ({})
  // Listas mostradas: cópias atualizadas 75ms depois da mudança, porque
  // reconstruir um Repeater dentro do sinal de remoção do Pipewire já
  // derrubou o Quickshell (mesmo comentário no painel do Omarchy).
  property var outputs: []
  property var streams: []

  onDefaultSinkChanged: resolveVolumeSink()
  onCandidateSinksChanged: snapshotTimer.restart()
  onCandidateStreamsChanged: snapshotTimer.restart()
  onSinkAvailabilityChanged: snapshotTimer.restart()
  onListingChanged: {
    snapshotTimer.restart();
    if (listing && !availabilityProc.running) availabilityProc.running = true;
  }

  PwObjectTracker {
    objects: [audio.sink, audio.source].filter(node => node !== null)
  }
  PwObjectTracker {
    objects: audio.listing ? audio.candidateSinks : []
  }
  PwObjectTracker {
    objects: audio.candidateStreams
  }

  Timer {
    id: snapshotTimer

    interval: 75
    onTriggered: audio.snapshot()
  }

  function snapshot() {
    if (!listing) {
      outputs = [];
      streams = [];
      return;
    }
    const shown = candidateSinks.filter(node => sinkAvailability[String(node.name)] !== false);
    if (defaultSink && !shown.includes(defaultSink)) shown.unshift(defaultSink);
    outputs = shown;
    streams = candidateStreams.filter(node => node.audio !== null);
  }

  Process {
    id: availabilityProc

    command: ["omarchy-audio-sink-availability"]
    stdout: StdioCollector {
      onStreamFinished: audio.sinkAvailability = audio.parseAvailability(text)
    }
  }

  Timer {
    interval: 5000
    repeat: true
    running: audio.listing
    onTriggered: if (!availabilityProc.running) availabilityProc.running = true
  }

  Process {
    id: volumeSinkProc

    command: ["omarchy-audio-output-sink"]
    stdout: StdioCollector {
      onStreamFinished: audio.volumeSinkName = String(text).trim()
    }
  }

  // Rede de segurança para a afinação aplicada ou removida por baixo.
  Timer {
    interval: 15000
    repeat: true
    running: true
    triggeredOnStart: true
    onTriggered: audio.resolveVolumeSink()
  }

  function resolveVolumeSink() {
    if (!volumeSinkProc.running) volumeSinkProc.running = true;
  }

  /** `nome<TAB>0|1` por linha; sink com 0 não está ligado a nada. */
  function parseAvailability(raw) {
    const result = {};
    for (const line of String(raw || "").split("\n")) {
      const parts = line.trim().split("\t");
      if (parts.length >= 2) result[parts[0]] = parts[1] !== "0";
    }
    return result;
  }

  /** Mexer no slider tira do mudo, como o slider de volume do Omarchy. */
  function setPercent(value) {
    if (available) setNodePercent(sink, value);
  }

  function setNodePercent(node, value) {
    if (!node || !node.audio) return;
    const clamped = Math.max(0, Math.min(100, Math.round(value)));
    node.audio.volume = clamped / 100;
    if (clamped > 0 && node.audio.muted) node.audio.muted = false;
  }

  function toggleMute(node) {
    if (node && node.audio) node.audio.muted = !node.audio.muted;
  }

  /** Mesmo caminho do seletor de saída do Omarchy, para a escolha persistir. */
  function setDefaultSink(node) {
    if (!node) return;
    Pipewire.preferredDefaultAudioSink = node;
    if (node.id !== undefined && node.name) Quickshell.execDetached(["omarchy-audio-output-set-default", String(node.id), String(node.name)]);
  }
}
