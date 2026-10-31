# Island

Plugin de barra do Omarchy (shell em Quickshell, sobre Hyprland) que substitui a barra padrão por três pílulas flutuantes (uso de IA · ilha · sistema). A ilha central se expande estilo Dynamic Island para notificações, música, volume/brilho, calendário, controles rápidos, Wi‑Fi, Bluetooth e uso de IA.

## Fonte da verdade

Cada fonte manda num eixo:

- **Visual** (medidas, cores, ícones, animação, estados): o design vence.
- **Comportamento e dados reais**: as specs vencem. Dado simulado ou item de protótipo no design (imagem de fundo, battery/charging como props, textos fixos) não é requisito.
- **Contexto de produto**: `prd.md`. Não decide nada sozinho.

Design: `design-source/Desktop Island.dc.html` (protótipo v5 do Claude Design, com `TopbarWidget.dc.html` e o CSS do Nocturne ao lado). Leia a versão extraída em `design/`:

- `design/markup.html`: estrutura, medidas, cores e ícones de cada estado
- `design/logic.js`: máquina de estados, tamanhos (`SIZES`), timers (`TRANSIENT`), limiares e regras de roteamento
- `design/tokens.css`: tokens Nocturne (bloco `:root`) e classes `.btn*`
- `design/props.json`: opções expostas no protótipo
- `design/components/`: subcomponentes importados pelo markup (`<dc-import name="…">`), um arquivo por componente

Specs: `specs/`. Comece por `specs/00-visao-geral.md` (mapa, glossário, ordem de implementação). Cada spec lista critérios de aceite e cita a origem no design por **âncora greppável** (nome do estado, seletor, chave de `SIZES`/`TRANSIENT`), nunca por número de linha.

Quando o design mudar, rode `python3 scripts/extract-design.py` e atualize as specs afetadas no mesmo commit. Na primeira execução ele baixa as fontes SVG do Phosphor 2.1.1 do unpkg para `node_modules/.cache/` (os ícones de `icons/` saem delas).

## Stack

- Omarchy 4+ (`omarchy-shell`), Quickshell 0.3+, Qt 6.11+, Hyprland. Nenhum código assume caminho, pacote ou driver do Arch fora do que o próprio Omarchy instala.
- A Island é um plugin `kind: "bar"` + `kind: "service"` carregado de `~/.config/omarchy/plugins/caionazario.island/`. O contrato de plugin está em `/usr/share/omarchy/shell/README.md` e `services/PluginRegistry.qml`. Leia, nunca edite `/usr/share/omarchy/`.
- UI em QML (QtQuick + módulos `Quickshell.*`). Antes de usar uma API do Quickshell, confira em `/usr/lib/qt6/qml/Quickshell/**/*.qmltypes` ou em quickshell.org/docs na versão instalada (`qs --version`).
- Lógica em TypeScript (`src/core`), compilada com `tsc` para módulos ES (`.mjs`) que o QML importa (`import "../core/island.mjs" as IslandCore`). O motor JS do QML (V4) não é navegador nem Node: sem DOM, `fetch`, `setTimeout`, `TextDecoder`, `Intl` nem class fields do ES2022. Por isso o core compila com `target: ES2017` (spec 14, S5).
- HTTP via `XMLHttpRequest` do QML, arquivos via `FileView`, processos via `Process` (`Quickshell.Io`). D-Bus sem módulo dedicado no Quickshell vai por `busctl`/`gdbus` em `Process`.
- UI em pt-BR; código, identificadores e commits em inglês. O Omarchy não usa gettext, então os textos ficam em pt-BR no código.

## Arquitetura

```
src/core/        lógica pura em TS: estados da ilha, roteamento de notificação, limiares, formatação, tamanhos
plugin/          o plugin, copiado como está para o build
  manifest.json
  Bar.qml        entrada `bar`: uma barra por monitor, recriada a cada hot-reload
  Service.qml    entrada `service` (keepLoaded): servidor de notificações, IPC `osd`/`notifications`, estado que sobrevive ao reload
  system/        fontes de dados (Pipewire, Mpris, UPower, Networking, Bluetooth, /proc, /sys, HTTP de IA), cada uma um QtObject com interface estável
  ui/            componentes QML: pílulas, ilha, modos, cartão central
dev/             harness que hospeda o plugin como o omarchy-shell, para rodar fora da sessão do usuário
scripts/         build do core (`build-core.mjs`) e extração do design
```

- `src/core/` nunca depende de QML, Quickshell nem Node em runtime. É onde mora toda regra testável. O QML só liga eventos ao core e renderiza o resultado.
- Todo serviço é opcional: sem a dependência (sem bateria, sem GPU conhecida, sem registro de IA do Omarchy, sem cidade), o bloco da UI some sem erro nem log ruidoso.
- A Island é dona da barra, das notificações e do OSD: `omarchy.notifications` e `omarchy.osd` ficam em `disabledPlugins`, e o `Service.qml` registra os mesmos alvos IPC (`notifications`, `osd`) que os scripts `omarchy-*` chamam.

## Ciclo de vida: hot-reload e serviço persistente

O host recria o `Bar.qml` a cada hot-reload de plugin (qualquer arquivo salvo em `~/.config/omarchy/plugins/`) e quando o usuário troca de barra. O `Service.qml` tem `keepLoaded: true` e só morre quando o shell reinicia.

- Tudo que a barra cria vive na árvore QML dela (`Timer`, `Process`, `FileView`, `Connections`) e morre com ela. Nada de `createObject(null)` nem de estado em singleton fora da árvore.
- Estado visível que precisa sobreviver ao reload (notificações, não lidas, ambiente ativo, pomodoro) mora no `Service.qml` ou no arquivo de configuração, nunca na barra.
- O lock do Omarchy (`WlSessionLock`) cobre a barra sem descarregá-la: não há enable/disable a cada bloqueio.
- O QML roda na thread da UI do shell: I/O, subprocess e HTTP sempre assíncronos (`Process`, `FileView` com `blockLoading: false`, `XMLHttpRequest`). Uma exceção em binding só gera aviso, mas um loop síncrono trava o shell inteiro.

## Comandos

| Comando | Faz |
|---|---|
| `make test` | Vitest em `src/core` |
| `make lint` | ESLint + Prettier + `tsc --noEmit` + `qmllint` no plugin |
| `make build` | core → `.mjs` + plugin + ícones em `dist/caionazario.island/` |
| `make dev` | build + Hyprland aninhado numa janela, com o harness `dev/` rodando o plugin dentro dele |
| `make smoke` | build + Hyprland aninhado sem interação: carrega o plugin, força 5 hot-reloads e falha se o log do Quickshell tiver `ERROR` ou `TypeError` |
| `scripts/shaders-in-sync.sh [--write]` | confere (no `make lint`) ou recompila os `.qsb` de `plugin/shaders/` depois de editar um `.frag`; precisa do `qt6-shadertools` |
| `./install.sh` / `./install.sh --uninstall` | copia o build para `~/.config/omarchy/plugins/caionazario.island/`, troca a barra, desliga/religa `omarchy.notifications` e `omarchy.osd` e instala/remove os atalhos e gestos (`hypr/island.lua` → `~/.config/hypr/island.lua` + `require` no `hyprland.lua`) |

- Logs do harness: `dist/dev.log`. Logs do omarchy-shell real: `qs log -p /usr/share/omarchy/shell`.
- Captura do Hyprland aninhado: `make shot` (grim no socket do aninhado) grava `dist/shot.png`.
- Dirigir o aninhado sem ponteiro (ele não simula mouse): `scripts/nested.sh serve` e `scripts/nested.sh ipc dev <open MODO|click|editor|editorDo AÇÃO ARG>`. Espere uns segundos depois de subir: antes de a barra achar o serviço, nada é gravado.

## Código

- Funções de 4–20 linhas. Máximo 2 níveis de indentação; prefira early return.
- Arquivos de no máximo 400 linhas (exceto os extraídos em `design/`). Antes de passar disso, divida o módulo.
- Nomes únicos e greppáveis. Evite `data`, `handler`, `Manager`, `Service` sozinhos.
- Sem `any` no TS. Em QML, tipe as propriedades (`property int`, `property list<…>`) e use `var` só para objetos JS do core.
- Mensagem de erro inclui o valor recebido e o formato esperado.
- Sem duplicação: extraia a lógica compartilhada para `core/`.

## Comentários

- Escreva POR QUE, não O QUE.
- Workaround de Quickshell/Hyprland/Omarchy cita o arquivo, a versão ou a issue de origem.
- Não remova comentários existentes em refactor. Eles carregam proveniência.

## Segredos

- A Island não lê credencial de IA: o uso vem dos registros do `omarchy-agent-usage-update` (spec 12). Credencial que algum serviço precise (token do `gh`, senha de Wi‑Fi, URL secreta do feed ICS do calendário, que vem do chaveiro) fica só em memória e vai a outro processo pela entrada padrão, nunca no arquivo de configuração, log, fixture, teste, linha de comando ou commit.
- Antes de commitar, confira `git diff --cached` procurando token, key ou `.env`.

## Nunca sem perguntar

- Instalar o plugin na sessão atual, trocar a barra ou mexer em `~/.config/omarchy/shell.json`. Para testar, use `make dev` ou `make smoke`.
- Rodar comando com `sudo` ou que escreva fora do repositório.
- Apagar arquivo que você não criou nesta tarefa.

## Testes

- TDD em `src/core`: teste vermelho primeiro, depois o código.
- Serviços são testados contra fakes nomeados que implementam a interface (`FakeMprisService`), não stubs inline.
- Bug fix entra com teste de regressão.

## Regras de trabalho

- CI obrigatória: todo push na `dev` e todo PR roda `make lint`, `make test` (todos os testes) e `make build`. CI vermelha não vira release.
- Só duas branches: `dev` recebe todo o trabalho; `main` só tem o plugin compilado (é o que o `omarchy plugin add` clona e o `omarchy plugin update` avança em fast-forward), com um commit `build: vX.Y.Z` por versão. O README da `main` é o da `dev`, copiado pelo workflow `release`: links e imagens dele usam URL absoluta da `dev`. Nunca commite na `main` à mão.
- Toda mudança visível entra em `## [Não lançada]` no `CHANGELOG.md`, no mesmo commit.
- Release: na `dev`, um commit `chore(release): X.Y.Z` move a seção `[Não lançada]` para `[X.Y.Z] - data` e troca a versão em `plugin/manifest.json`, `package.json` e `package-lock.json` (`npm version X.Y.Z --no-git-tag-version`). Depois, tag anotada `vX.Y.Z` nesse commit e push da `dev` e da tag: o workflow `release` confere a versão, publica o build na `main` e cria a GitHub Release com as notas do CHANGELOG.
- Numeração SemVer na série 0.x: `minor` para feature ou quebra de compatibilidade, `patch` só para correção.
- Mudou comportamento, atualize a spec correspondente no mesmo commit. Spec e código nunca divergem.
- API de Quickshell/Qt/Omarchy que você não confirmou nos `.qmltypes`, na doc da versão instalada ou no código do Omarchy: diga "não sei" e verifique, em vez de chutar.
- Ponto em aberto marcado como spike (`specs/14-spikes.md`) se resolve antes de implementar a feature que depende dele, e o resultado vai para a spec.
- Commits em Conventional Commits: `tipo(escopo): descrição` no imperativo, minúscula, sem ponto, ≤72 caracteres. Tipos: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `ci`, `perf`. Um commit = uma mudança lógica; `refactor` nunca junto com `feat`/`fix`. Breaking change: `!` + rodapé `BREAKING CHANGE:`.

## Hurdles

Problema já encontrado e sua solução. Adicione aqui toda vez que algo custar mais de uma tentativa.

- O V4 do QML recusa class fields (`Expected token '('`) , `catch {}` sem variável (`Syntax error`) e spread de objeto (`Unexpected token ...`): o core compila com `target: ES2017`.
- O QML só trata como módulo ES arquivos `.mjs`: o build renomeia a saída do `tsc` e reescreve os imports `./x.js` → `./x.mjs`.
- `JsonAdapter` (Quickshell 0.3.2) entrega os `var` lidos do arquivo como objetos com `length` e índices em que `Array.isArray` dá `false` (e `JSON.stringify` ainda mostra uma lista). Validar com `Array.isArray` joga fora o valor guardado: a Island subia com os ambientes iniciais a cada reinício e a edição seguinte regravava o arquivo por cima. Use `asList` (`environments.ts`) para ler lista do adapter; teste no Vitest com um fake de objeto com `length` e sem ser `Array`, e o `make smoke` confere no motor real (semente em `dist/xdg`). Ler o arquivo depois do teste não basta: confira também o que a barra enxerga (`nested.sh ipc dev environments`).
- O V4 não tem `setTimeout`, `TextDecoder` nem `Intl`: timers do core recebem um `Scheduler` feito de `Timer` QML, e bytes chegam ao core já como string.
- `FileView` com `preload: false` nunca emite `loaded` numa leitura assíncrona de `/proc` (tamanho 0): deixe o `preload` ligado e chame `reload()`.
- `qs ipc -p` só acha instâncias do display atual, e métodos com nome de subcomando do `qs` (`show`) precisam de `call --`.
- `Qt.quit()` não encerra o `qs` (sem receptor para `QQmlEngine::quit`): scripts usam `timeout` ou `Quickshell` IPC.
- `FileView` com `watchChanges` não percebe um arquivo que nasce depois (ex.: o registro do `omarchy-agent-usage-update`): chame `reload()` quando quem escreve terminar.
- Sem `Qt.clearComponentCache` (Qt 6.11), o hot-reload recria a barra com os componentes antigos, no harness (`ipc dev reload`) e no omarchy-shell real (`shell.qml` tem a mesma guarda). No harness, `nested.sh stop` e `serve` de novo; na sessão, o `install.sh` termina com `omarchy-restart-shell`.
- `implicitWidth` de `Column`/`Row` é só leitura e o `qmllint` não acusa dentro de componente inline: só o log do `make dev` mostra (`Invalid property assignment`). Dê `width` a quem usa o componente.
- O Qt entrega o evento de roda ao `WheelHandler` do pai mesmo quando um `ListView`/`Flickable` filho rola (testado com `qmltestrunner`: `QT_QPA_PLATFORM=offscreen qmltestrunner -input teste.qml`, `mouseWheel(item, x, y, dx, dy)`): quem precisa saber se a lista ainda rola olha `atYBeginning`, não a propagação. Um `WheelHandler` filho (ex.: o volume) bloqueia o do pai por padrão, e `MouseArea` sem `onWheel` deixa passar.
- `WheelHandler` só reage à roda vertical por padrão (`orientation: Qt.Vertical`): para rolagem horizontal (deslize de dois dedos), `orientation: Qt.Horizontal`.
- `console.log` do `qml`/`qs` vai para o journal, não para o terminal: rode com `QT_FORCE_STDERR_LOGGING=1` (o `check-core.mjs` imprime `modules ok` no console, então a saída dele sempre aparece vazia). `XMLHttpRequest` de `file://` precisa de `QML_XHR_ALLOW_FILE_READ=1`, e um `QtObject` sem janela encerra antes de uma resposta assíncrona: leia o arquivo de forma síncrona (`open(..., false)`) em scripts de experimento.
- Componente de widget de plugin vindo do `barWidgetRegistry` do omarchy-shell (criado por `Qt.createComponent`, sem pai) some depois que as instâncias dele são destruídas: a troca de ambiente apagava o widget de vez (ler a entrada dava `TypeError`), e um `gc()` sozinho, com instâncias vivas, não reproduz. A Island cria o próprio componente da `url` dele com pai (`PluginWidgetHost.qml`). O harness monta o catálogo com `Qt.createComponent` pelo mesmo motivo: um `Component {}` declarado escondia o bug.
- Senha ou lista de servidores para um comando vai pela entrada padrão (`stdinEnabled`, `write()` no `onStarted`, depois `stdinEnabled = false` fecha a entrada), nunca pela linha de comando.

## Antes de dizer que terminou

- [ ] `make lint`, `make test`, `make build` e `make smoke` verdes
- [ ] Spec afetada atualizada no mesmo commit
- [ ] Estado visível que precisa sobreviver ao hot-reload mora no `Service.qml`
- [ ] Nenhum I/O síncrono na thread da UI
- [ ] Nenhuma credencial em arquivo, log ou linha de comando
