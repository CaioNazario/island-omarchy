# 14 · Spikes

Pontos que ninguém verificou ainda. Cada spike se resolve **antes** de implementar a feature que depende dele: um experimento pequeno e descartável, e o resultado (o que funciona, com a API exata) entra na spec dependente. Depois disso, o spike sai desta lista.

Os spikes S5–S7 abriram o porte para o Omarchy (v2). Ficam aqui como registro até as specs dependentes serem reescritas; cada resultado já vale como regra.

## S4 · Publicação (futuro, fora da v2)

- **Pergunta**: o repositório de plugins do Omarchy aceita um plugin que lê credenciais de CLIs de terceiros e chama endpoints não documentados com User-Agent de outro cliente?
- **Pronto quando**: há uma resposta dos mantenedores; enquanto isso, a instalação é só via `install.sh`.

## S5 · O QML importa o `src/core` compilado? (resolvido)

- **Experimento**: `tsc` de `src/core` para ES modules, extensão renomeada para `.mjs`, imports `./x.js` reescritos para `./x.mjs`, e um `ShellRoot` com `import "core/island.mjs" as Island` rodando em `qs -p` (Quickshell 0.3.1, Qt 6.11.2).
- **Resultado**: funciona. `Island.getSize("compact")`, `Clock.formatClock(...)` e as funções de `notifications` respondem igual ao Vitest.
- **Restrições do V4** (motor JS do QML):
  - Class fields (ES2022), `catch {}` sem variável (ES2019) e spread de objeto (ES2018) não parseiam: o core compila com `target: ES2017`. `make lint` carrega todos os módulos no motor QML (`scripts/check-core.mjs`) para pegar a próxima sintaxe que faltar.
  - Sem `TextDecoder`, `Intl`, `setTimeout`/`clearTimeout`: o core não usa nenhum deles em runtime. Timers entram por injeção (`Scheduler` do `island.ts`), e o QML fornece um feito de `Timer`.
  - Só arquivos `.mjs` são tratados como módulo ES.

## S6 · Como um plugin `bar` de terceiros é carregado? (resolvido)

- **Fonte**: `/usr/share/omarchy/shell/shell.qml` (`pluginBarLoader`, `configureBar`) e `services/PluginShellApi.qml`, Omarchy 4.0.4.
- **Resultado**:
  - O host carrega `entryPoints.bar` num `Loader` assíncrono quando `shell.json` tem `bar.id` igual ao id do plugin. Se o QML falha (`Loader.Error`), o host volta para `omarchy.bar` sozinho.
  - Depois de carregar, o host injeta as propriedades que existirem no item raiz: `omarchyPath`, `shell` (uma `PluginShellApi` com escopo), `manifest`, `barConfig`, `pluginRegistry`, `barWidgetRegistry`.
  - A barra encontra o serviço do próprio plugin com `shell.serviceFor("<id do plugin>")`. Um manifesto pode declarar `kinds: ["bar", "service"]`, e o serviço com `keepLoaded: true` sobrevive ao hot-reload da barra.
  - A barra recebe `firstPartyServiceFor(id)` só para serviços sem autenticação. A Island não depende deles: tem fontes próprias.

## S7 · A Island pode assumir notificações e OSD? (resolvido)

- **Fonte**: `plugins/notifications/Service.qml`, `plugins/osd/Osd.qml`, `bin/omarchy-osd`, `bin/omarchy-notification-dismiss`, `bin/omarchy-toggle-notification-silencing`, Omarchy 4.0.4.
- **Resultado**:
  - O `omarchy.notifications` é dono de `org.freedesktop.Notifications` via `NotificationServer` (`Quickshell.Services.Notifications`). Com ele em `disabledPlugins`, o `NotificationServer` do `Service.qml` da Island assume o nome.
  - As teclas de volume/brilho do Omarchy chamam `omarchy-audio-output-volume` e `omarchy-brightness-display`, que terminam em `omarchy-shell -q osd show '<json>'` com `{icon, message, value, progressText, max, duration}`. Com `omarchy.osd` desligado, um `IpcHandler { target: "osd" }` na Island recebe essas chamadas e abre `volume`/`brightness`, sem mexer em atalho nenhum.
  - Os scripts de DND e de dispensar chamam o alvo IPC `notifications` (`dndState`, `toggleDnd`, `setDnd`, `isDnd`, `showHistory`, `clear`, `dismissAll`, `dismissOne`, `invokeLast`, `dismiss`, `ping`; todos devolvem string). A Island registra esse alvo com os mesmos nomes e retornos.
