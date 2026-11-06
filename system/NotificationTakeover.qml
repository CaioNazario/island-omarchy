pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io
import "../core/takeover.mjs" as TakeoverCore

// Quem cuida das notificações e do OSD (specs/04-notificacoes.md "Quem cuida
// das notificações"). A Island só assume o que o Omarchy deixou desligado:
// com `omarchy.notifications` ligado ela não pede o nome D-Bus nem o alvo IPC
// `notifications`, e com `omarchy.osd` ligado não pede o `osd`. Dois donos do
// mesmo alvo dividem o controle (o último IPC vence e o primeiro D-Bus vence,
// specs/14-spikes.md, S7): as notificações aparecem de um lado e o "não
// perturbe" age no outro.
//
// Ligar e desligar passa pelo `omarchy plugin enable|disable`, que pede ao
// próprio shell para gravar o `shell.json`: a Island nunca escreve nele.
// Vive no Service.qml, porque o consentimento sobrevive ao hot-reload da barra.
Scope {
  id: takeover

  // Estado persistido (`takeoverPromptShown`) e a lista da ilha; sem eles
  // (harness mínimo) não há onde guardar nem mostrar a pergunta.
  property var store: null
  property var feed: null
  property string language: "en"
  // Quanto a pergunta fica no card aberto: dá tempo de ler e clicar (o padrão
  // dos avisos é 2500 ms).
  readonly property int promptHoldMs: 5000
  // O harness troca o `omarchy` por um falso (dev/fake-omarchy.sh): o real
  // mexeria nos plugins do shell do usuário.
  property string cli: Quickshell.env("ISLAND_OMARCHY_CLI") || "omarchy"

  // Built-ins ligados (`enabledBuiltins`) ou null enquanto a lista não veio.
  property var builtins: null
  property bool busy: false
  // O último liga/desliga falhou; some no próximo que dá certo.
  property bool failed: false
  // A Island já largou os alvos e está religando os built-ins.
  property bool handingBack: false
  property var queue: []
  // O que a lista terá quando os comandos acabarem: vale já ao terminar, sem
  // esperar outra leitura. O nome D-Bus fica com o processo do shell, então
  // quem recebe é o `NotificationServer` que existir; entre o `disable` do
  // Omarchy e a Island reivindicar, uma notificação não tem a quem chegar e
  // se perde, e esperar o `list` alongaria essa janela. A leitura que vem
  // depois confere (`matchesExpected`) e corrige se o shell não aplicou tudo.
  property var expected: null
  property bool verifying: false
  // Algum comando saiu com código diferente de 0. Não para a fila (a troca
  // pode ter valido mesmo assim): a lista lida no fim decide.
  property bool stepFailed: false
  // Cada troca faz o shell reconstruir os painéis de todos os plugins e ele
  // pode ficar sem responder por vários segundos (medido com o omaplug e o
  // radio-atlas: ~11 s). O wrapper `omarchy-shell` desiste do IPC em 2 s
  // (`OMARCHY_SHELL_IPC_TIMEOUT`) com a troca já aplicada e sai com 1: sem
  // esperar mais, o código de saída mente e a fila parava no meio.
  readonly property var shellEnv: ({ "OMARCHY_SHELL_IPC_TIMEOUT": "60s" })

  readonly property string status: TakeoverCore.takeoverStatus(builtins)
  // Cada alvo é reivindicado quando o plugin do Omarchy dele está desligado:
  // um liga/desligar que falhou no meio deixa a Island com o que sobrou.
  readonly property bool claimsNotifications: builtins !== null && !handingBack && builtins.indexOf("omarchy.notifications") === -1
  readonly property bool claimsOsd: builtins !== null && !handingBack && builtins.indexOf("omarchy.osd") === -1

  /** Relê o estado dos plugins; a barra chama ao abrir os ajustes. */
  function refresh() {
    if (busy || lister.running) return;
    lister.running = true;
  }

  /** "Ligar": desliga os built-ins que ainda estão ligados. */
  function takeOver() {
    if (busy || builtins === null) return;
    expected = [];
    run(TakeoverCore.pluginToggleArgs("disable", builtins), false);
  }

  /**
   * "Devolver": a Island larga os alvos primeiro (`handingBack`) e só depois
   * liga os built-ins, para não haver dois donos nem por um instante.
   */
  function handBack() {
    if (busy || builtins === null) return;
    if (feed) feed.releaseServerNotifications();
    expected = TakeoverCore.REPLACED_PLUGIN_IDS.slice();
    run(TakeoverCore.pluginToggleArgs("enable", TakeoverCore.REPLACED_PLUGIN_IDS), true);
  }

  function run(commands, giveBack) {
    failed = false;
    stepFailed = false;
    handingBack = giveBack;
    busy = true;
    queue = commands;
    runNext();
  }

  function runNext() {
    if (queue.length === 0) return finish(!stepFailed);
    toggler.command = [cli].concat(queue[0]);
    queue = queue.slice(1);
    toggler.running = true;
  }

  function finish(ok) {
    queue = [];
    if (ok) builtins = expected;
    busy = false;
    handingBack = false;
    failed = !ok;
    verifying = true;
    refresh();
  }

  // Estado ainda não lido: gravar agora perderia o resto do arquivo.
  function promptIfNeeded() {
    if (!store || !feed || !store.ready) return;
    if (!TakeoverCore.shouldPromptTakeover(store.values.takeoverPromptShown, status)) return;
    store.values.takeoverPromptShown = true;
    const message = TakeoverCore.takeoverPrompt(language);
    feed.pushInternal(message.title, message.body, "bell-fill", "takeover", promptHoldMs);
  }

  // A leitura depois de um liga/desliga manda: o resultado só vale se a lista
  // real é a esperada, mesmo com todos os comandos tendo saído com 0.
  function checkExpected(actual) {
    if (!verifying) return;
    verifying = false;
    if (expected !== null && !TakeoverCore.matchesExpected(actual, expected)) failed = true;
    else if (expected !== null) failed = false;
    expected = null;
  }

  Process {
    id: lister

    environment: takeover.shellEnv
    command: [takeover.cli, "plugin", "list", "--json"]
    stdout: StdioCollector {
      onStreamFinished: {
        // Falha ou formato inesperado: continua como estava (null = a Island
        // não assume nada) e o timer tenta de novo.
        const parsed = TakeoverCore.enabledBuiltins(text);
        if (parsed === null) return;
        // Alguém religou o Omarchy por fora: larga o servidor limpo, como no "Devolver".
        const leaving = takeover.claimsNotifications && parsed.indexOf("omarchy.notifications") !== -1;
        if (leaving && takeover.feed) takeover.feed.releaseServerNotifications();
        takeover.builtins = parsed;
        takeover.checkExpected(parsed);
        promptDelay.restart();
      }
    }
  }

  Process {
    id: toggler

    environment: takeover.shellEnv
    onExited: exitCode => {
      if (exitCode !== 0) takeover.stepFailed = true;
      takeover.runNext();
    }
  }

  // Dá tempo à barra de carregar antes da pergunta: sem barra, ninguém vê o
  // aviso, e o `takeoverPromptShown` já teria sido gasto.
  Timer {
    id: promptDelay

    interval: 4000
    onTriggered: takeover.promptIfNeeded()
  }

  // Lista ainda não lida (o shell pode não ter o IPC pronto na hora em que o
  // serviço sobe): tenta a cada 3s. Depois, confere a cada minuto, para
  // perceber um `omarchy plugin enable` feito na mão e largar o alvo.
  Timer {
    interval: takeover.builtins === null ? 3000 : 60000
    repeat: true
    running: true
    triggeredOnStart: true
    onTriggered: takeover.refresh()
  }
}
