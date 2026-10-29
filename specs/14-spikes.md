# 14 · Spikes

Pontos que ninguém verificou ainda. Cada spike se resolve **antes** de implementar a feature que depende dele: um experimento pequeno e descartável, e o resultado (o que funciona, com a API exata) entra na spec dependente. Depois disso, o spike sai desta lista.

Os spikes resolvidos ficam aqui como registro; cada resultado já vale como regra.

## S4 · Publicação (futuro)

- **Pergunta**: o repositório de plugins do Omarchy aceita um plugin que lê credenciais de CLIs de terceiros e chama endpoints não documentados com User-Agent de outro cliente?
- **Pronto quando**: há uma resposta dos mantenedores; enquanto isso, a instalação é só via `install.sh`.

## S8 · Fonte de eventos do calendário (resolvido: feed ICS)

- **Pergunta**: de onde vêm os eventos de hoje (spec 06) e do widget Próximo evento (spec 16) no Omarchy? O Omarchy não instala o Evolution Data Server.
- **Escolha** (2026-10-18): URL ICS privada (o Google Calendar a chama de "Endereço secreto no formato iCal"), baixada por `curl` e lida por um parser no core. Descartados: Evolution Data Server (não vem no Omarchy) e `khal`/vdirsyncer (exigem OAuth do Google e mais um daemon para o mesmo resultado).
- **Resultado**: funciona no V4 com um feed de 1,4 MB (3000 eventos + 60 séries), ~55 ms por interpretação. Regras e limites do parser estão na spec 06. Pendente só a conferência com uma conta real.
- **Restrições encontradas**:
  - O V4 não tem `Intl`, então `TZID=America/Sao_Paulo` não resolve pelo nome: o deslocamento sai do `VTIMEZONE` que o próprio Google põe no feed (`icsZones.ts`).
  - O V4 é ~7× mais lento que o Node e o parser roda na thread da UI: sem o pré-filtro (`icsPrefilter.ts`) um feed com anos de histórico levava ~1 s; recorrência sem COUNT começa a varredura perto da janela.
  - A URL é credencial: chaveiro + `curl -K -` (AGENTS.md "Segredos").

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

## S9 · Blur nativo atrás das pílulas e da ilha (resolvido)

- **Pergunta**: o `backdrop-filter: blur(16px)` do design pode ser feito pelo compositor, só sob as pílulas e a ilha, sem regra de camada no Hyprland e sem mudar a configuração global de blur?
- **Experimento** (2026-10-28): Hyprland 0.56.2 aninhado, Quickshell 0.3.2. Na `PanelWindow` `island`, `BackgroundEffect.blurRegion` (anexado, de `Quickshell.Wayland`, protocolo `ext-background-effect-v1`) com um `Region` por superfície: `Region { item: leftPill; radius: 13 }`, o mesmo para a pílula direita e, na ilha, o raio animado da `SoftSurface`. Pílulas e ilha com `bg` 82% sobre um fundo de listras e texto.
- **Resultado**: funciona.
  - O blur fica só dentro de cada `Region` e respeita o raio: pílulas, ilha compacta e ilha aberta (`quick`, `wifi`).
  - A região acompanha a ilha durante a animação de tamanho e de raio, sem atraso visível.
  - A sombra da ilha fica fora da região e não é borrada. Uma regra de camada no namespace `island` borraria a camada de tela cheia inteira onde o alfa passasse do `ignore_alpha`, sombra incluída.
  - Sobrevive ao hot-reload da barra e vale em cada monitor (testado com uma segunda saída criada com o shell rodando).
  - Nenhum aviso no log.
- **Restrições encontradas**:
  - A força do blur é a do `decoration:blur:size` global do Hyprland, e o cliente não controla. Com `size = 3`, o blur fica visivelmente mais fraco. A Island não muda esse valor: mudar afetaria todas as janelas.
  - Com `decoration:blur:enabled = false`, o compositor não borra nada e o fundo 82% fica legível através da pílula. A Island só usa o fundo translúcido quando o blur do sistema está ligado (`hyprctl getoption decoration:blur:enabled -j`, lido de novo no `configreloaded`). Senão, o fundo é opaco.
  - O banner de notificação é outra superfície da mesma camada e precisa do seu próprio `Region` quando visível.

## S10 · Shaders de fundo dentro do plugin (resolvido)

- **Pergunta**: os shaders de gradiente e grão do omadock (`gradient.frag`, `grain.frag`, MIT) rodam na Island como `ShaderEffect`, carregados de dentro do plugin e acompanhando a ilha animada?
- **Experimento** (2026-10-28): Hyprland 0.56.2 aninhado, Qt 6.12. `.qsb` copiados para `shaders/` no build e dois `ShaderEffect` na `SoftSurface` (`fragmentShader: Qt.resolvedUrl("../shaders/gradient.frag.qsb")`), com `size` e `radius` ligados à superfície. Paleta Aurora com força 0.55 e grão 0.6.
- **Resultado**: funciona.
  - Os dois shaders carregam pelo caminho relativo ao plugin (`file://`, como o host carrega a barra) e recortam pelo raio nas pílulas, na ilha compacta e na ilha aberta.
  - Durante a animação de tamanho e de raio, o recorte acompanha a ilha quadro a quadro.
  - Custo: com os shaders, o tempo de render por quadro (`QSG_RENDER_TIMING=1`) fica em 0–2 ms, igual à barra sem eles, abrindo e fechando `wifi` e `quick`.
  - No omarchy-shell real, o omadock instalado em `~/.config/omarchy/plugins/omadock` carrega os mesmos `.qsb` do mesmo jeito, com gradiente e grão ligados.
  - O `qsb` do `qt6-shadertools` 6.12 gera bytes idênticos aos `.qsb` do omadock (`--glsl "100 es,120,150" --hlsl 50 --msl 12`). Dá para commitar os `.qsb` e conferir na CI recompilando.
  - Nenhum aviso no log.
- **Restrições encontradas**:
  - Na ilha aberta, a Aurora com força 0.55 apaga os textos `neutral-*` sobre o fundo claro (rótulos do `wifi` quase ilegíveis). A força do gradiente precisa de um teto calculado pelo contraste dos textos sobre a cor média do fundo (C4), ou um teto menor na ilha aberta.
  - O shader pinta a própria base (`base` com a opacidade). O brilho, o halo e a borda da `SoftSurface` precisam ficar por cima dele.
