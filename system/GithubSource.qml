pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io
import "../core/github.mjs" as GithubCore

// Widget GitHub (specs/16-widgets.md `github`): token do `gh auth token`, só
// em memória (nunca em log ou arquivo; o stderr do gh é descartado), e duas
// buscas a cada 300s enquanto o widget está no ambiente ativo.
Scope {
  id: github

  property bool polling: false
  property string token: ""
  property bool tokenTried: false
  property var counts: null
  // Um 401 pede um token novo uma vez; o segundo seguido deixa indisponível.
  property bool retriedAfter401: false
  readonly property var view: GithubCore.githubView(counts)

  property var partial: ({})

  function refresh() {
    if (token === "") return tokenTried ? undefined : readToken();
    search("mine", mine);
    search("review", review);
  }

  function readToken() {
    tokenTried = true;
    tokenReader.running = true;
    tokenTimeout.restart();
  }

  function search(key, http) {
    const headers = {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "island-omarchy-plugin"
    };
    http.get(GithubCore.searchUrl(GithubCore.SEARCH_QUERIES[key]), headers, response => github.accept(key, response));
  }

  function accept(key, response) {
    const outcome = GithubCore.outcomeForStatus(response.status);
    if (outcome === "unauthorized") return unauthorized();
    const count = outcome === "ok" ? GithubCore.parseTotalCount(response.body) : null;
    // Rede, 5xx ou corpo estranho: mantém o último valor.
    if (count === null) return;
    retriedAfter401 = false;
    const next = Object.assign({}, partial);
    next[key] = count;
    partial = next;
    if (next.mine !== undefined && next.review !== undefined) counts = { mine: next.mine, review: next.review };
  }

  function unauthorized() {
    token = "";
    if (retriedAfter401) {
      counts = null;
      return;
    }
    retriedAfter401 = true;
    tokenTried = false;
    readToken();
  }

  Process {
    id: tokenReader

    command: ["gh", "auth", "token"]
    stdout: StdioCollector {
      id: tokenOutput
    }
    onExited: exitCode => {
      tokenTimeout.stop();
      const token = GithubCore.tokenFromOutput(exitCode, tokenOutput.text);
      github.token = token || "";
      if (token) github.refresh();
      else github.counts = null;
    }
  }

  // "Mais de 5s sem terminar conta como sem credencial" (keyring bloqueado).
  Timer {
    id: tokenTimeout

    interval: 5000
    onTriggered: tokenReader.signal(9)
  }

  HttpGet {
    id: mine
  }

  HttpGet {
    id: review
  }

  Timer {
    interval: 300000
    repeat: true
    running: github.polling
    triggeredOnStart: true
    onTriggered: github.refresh()
  }
}
