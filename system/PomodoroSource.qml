pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io
import "../core/pomodoro.mjs" as PomodoroCore
import "../core/pomodoroConfig.mjs" as ConfigCore
import "../core/pomodoroSound.mjs" as SoundCore

// Pomodoro (specs/20-pomodoro.md). Vive no Service.qml: segue rodando no
// hot-reload da barra e no lock (o Omarchy não descarrega a barra ao
// bloquear). A configuração mora no `settings.json` (`pomodoro`) e o estado
// da contagem no `state.json` (`pomodoroState`, sempre salvo parado).
Scope {
  id: pomodoro

  required property var store
  // `SettingsStore`: precisa do `ready` para só restaurar depois da leitura.
  required property var settings
  required property var feed
  // Idioma da notificação de troca de etapa (specs/13 "Idioma").
  property string language: "en"
  // Seletor de arquivos do Omarchy (`omarchy file select`, portal do desktop).
  property string filePicker: "omarchy-file-select"

  // Saneada a cada leitura, como os ambientes e a aparência.
  readonly property var config: ConfigCore.sanitizePomodoroConfig(settings.values.pomodoro)
  property var applied: ConfigCore.defaultPomodoroConfig()
  property var current: PomodoroCore.initialPomodoro(applied, Date.now())
  readonly property bool running: current.endsAt !== null

  // Tela de pausa: a de verdade (`current.locked`) ou a pré-visualização do
  // "Testar pausa", que não mexe em sessão, etapa nem contador (spec 20).
  property bool previewing: false
  readonly property bool breakActive: current.locked || previewing
  // O que a tela de pausa mostra: a pausa real ou uma pausa de mentira, cheia e parada.
  readonly property var breakState: current.locked || !previewing ? current : PomodoroCore.previewBreak(current, applied)
  // Quando a tela de pausa apareceu: a animação de entrada parte daqui, e a
  // barra recriada pelo hot-reload retoma do ponto certo.
  property double breakSince: 0

  property bool restored: false
  readonly property bool loaded: store.ready && settings.ready

  signal wallpaperPickFinished

  property bool picking: false

  onLoadedChanged: if (loaded && !restored) restore()
  onBreakActiveChanged: if (breakActive) breakSince = Date.now()
  onCurrentChanged: armDeadline()
  onConfigChanged: if (restored) applyConfig()

  function restore() {
    restored = true;
    applied = config;
    current = PomodoroCore.parse(store.values.pomodoroState, applied, Date.now());
    settle();
  }

  // Uma mudança de configuração vale na hora (spec 20 "Mudar a configuração").
  function applyConfig() {
    const next = PomodoroCore.reconcile(current, applied, config, Date.now());
    applied = config;
    update(next);
  }

  function update(next) {
    current = next;
    if (current.locked) previewing = false;
    save();
  }

  function save() {
    if (restored) store.values.pomodoroState = PomodoroCore.serialize(current, Date.now());
  }

  function toggle() {
    update(PomodoroCore.toggle(current, Date.now()));
  }

  function restart() {
    update(PomodoroCore.reset(current, applied));
  }

  function skip() {
    update(PomodoroCore.skip(current, applied, Date.now()));
  }

  /** Urgência: sai da tela de pausa, a pausa segue correndo. */
  function release() {
    previewing = false;
    update(PomodoroCore.release(current));
  }

  function startPreview() {
    if (!current.locked) previewing = true;
  }

  function endPreview() {
    previewing = false;
  }

  function setConfig(next) {
    settings.values.pomodoro = next;
  }

  // Troca de etapa ao zerar, com a notificação pelo roteamento da spec 04.
  function settle() {
    const result = PomodoroCore.tick(current, applied, Date.now());
    if (!result.started) {
      // O `Timer` do Qt é grosso (5% do intervalo) e pode disparar antes da hora.
      if (running) armDeadline();
      return;
    }
    // Quanto o disparo passou do horário: depois de uma suspensão o som já não cabe.
    const late = Date.now() - current.endsAt;
    update(result.state);
    const sound = SoundCore.breakEndSound(applied, result.started, late);
    if (sound !== null) playSound(sound);
    const minutes = ConfigCore.minutesFor(applied, result.started, result.state.session);
    const message = PomodoroCore.phaseNotification(result.started, minutes, pomodoro.language);
    feed.pushInternal(message.title, message.body, "timer");
  }

  // Toca um arquivo do tema de sons pelo PipeWire (`pw-play`), com `paplay` de
  // reserva. O caminho vai como argumento do `sh`, não dentro do comando. Um som
  // já tocando não é cortado: o toque repetido (pré-ouvir) espera o anterior.
  function playSound(file) {
    if (player.running) return;
    player.command = ["sh", "-c", 'pw-play "$1" 2>/dev/null || paplay "$1"', "sh", file];
    player.running = true;
  }

  // Pré-ouvir o toque escolhido nas configurações.
  function previewSound(id) {
    const file = SoundCore.breakSoundFile(id);
    if (file !== null) playSound(file);
  }

  Process {
    id: player
  }

  // Um timeout único até o fim da etapa, esteja o widget visível ou não.
  function armDeadline() {
    deadline.stop();
    if (!running) return;
    deadline.interval = Math.max(1, current.endsAt - Date.now());
    deadline.start();
  }

  Timer {
    id: deadline

    onTriggered: pomodoro.settle()
  }

  // Imagem própria da pausa: o seletor de arquivos do Omarchy. O processo vive
  // aqui, não na ilha: a ilha fecha para o diálogo receber o teclado (spec 20).
  function pickWallpaper(title) {
    if (picking) return;
    picking = true;
    picker.command = [filePicker, "--title", title, "--extensions", "png jpg jpeg webp bmp gif"];
    picker.running = true;
  }

  Process {
    id: picker

    stdout: StdioCollector {
      onStreamFinished: {
        const path = text.trim();
        // Caminho absoluto de uma linha só; o resto (cancelou, erro) não muda nada.
        if (path.startsWith("/") && path.indexOf("\n") < 0) pomodoro.setConfig(ConfigCore.withWallpaper(pomodoro.config, "custom", path));
      }
    }
    // `running` cai também quando o programa nem existe (`onExited` não vem).
    onRunningChanged: {
      if (running || !pomodoro.picking) return;
      pomodoro.picking = false;
      pomodoro.wallpaperPickFinished();
    }
  }
}
