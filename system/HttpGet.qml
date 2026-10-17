import QtQuick
import Quickshell.Io

// GET por `curl`, uma requisição por vez. Os cabeçalhos vão pela entrada
// padrão (`-H @-`): um `Authorization` na linha de comando ficaria visível
// em /proc/<pid>/cmdline para qualquer processo do usuário. O status HTTP vem
// na última linha da saída (`-w`); falha de rede ou timeout (10s) = status 0.
// Corpo e cabeçalhos nunca vão para o log.
Process {
  id: request

  property var callback: null
  property string headerText: ""
  // A saída e a saída do processo chegam em sinais separados, sem ordem
  // garantida: a resposta só fecha com os dois.
  property int exitStatus: -1
  property bool streamDone: false

  stdinEnabled: true

  /** `headers`: `{nome: valor}`. `done({status, body})` sempre é chamado. */
  function get(url, headers, done) {
    if (running) return done({ status: 0, body: "" });
    callback = done;
    headerText = Object.keys(headers).map(name => name + ": " + headers[name]).join("\n") + "\n";
    exitStatus = -1;
    streamDone = false;
    command = ["curl", "-sS", "--max-time", "10", "-H", "@-", "-w", "\n%{http_code}", url];
    stdinEnabled = true;
    running = true;
  }

  onStarted: {
    write(headerText);
    headerText = "";
    // Fechar a entrada encerra a lista de cabeçalhos do `-H @-`.
    stdinEnabled = false;
  }

  stdout: StdioCollector {
    id: output

    onStreamFinished: {
      request.streamDone = true;
      request.finish();
    }
  }

  onExited: exitCode => {
    exitStatus = exitCode;
    finish();
  }

  function finish() {
    if (exitStatus < 0 || !streamDone || !callback) return;
    const text = output.text;
    const cut = text.lastIndexOf("\n");
    const status = exitStatus === 0 && cut >= 0 ? parseInt(text.slice(cut + 1), 10) || 0 : 0;
    const done = callback;
    callback = null;
    done({ status: status, body: cut >= 0 ? text.slice(0, cut) : "" });
  }
}
