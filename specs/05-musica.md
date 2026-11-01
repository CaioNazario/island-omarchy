# 05 · Música e cartão central

Origem: `design/markup.html` camadas `L.music` e `L.hub` (cartão central); `design/logic.js` `track`/`posLabel`/`posPct`/`togglePlay`/`prevTrack`/`nextTrack`, `SIZES.hub`, `hubH`, `musicPin`.

## Fonte: MPRIS

- `plugin/system/MusicSource.qml`, pelo `Mpris` do Quickshell (players, `PlaybackStatus`, metadados, `CanGo*`). O `PlayerTracker` do core decide o player atual e a troca de faixa.
- **Player atual**: o último que entrou em `Playing`. Pausado continua atual até outro tocar ou ele sair do barramento. `Stopped` ou sem título não é atual (o Brave fica no barramento em `Stopped` com metadados vazios quando o vídeo acaba) e volta a valer se tocar de novo. Na primeira leitura (cada carga da barra, inclusive no hot-reload), os que já tocam têm prioridade sobre os pausados.
- Dados: artista, título, `mpris:trackid`, duração, capa, posição, `CanGoPrevious`/`CanGoNext`. O Quickshell dá tempo em segundos; o core trabalha em microssegundos.
- A posição não se atualiza sozinha: enquanto toca, `positionChanged()` uma vez por segundo (padrão da doc do `MprisPlayer`). Seek e troca de faixa entram na leitura seguinte.
- Capa: `file://` e `http(s)://` carregam pela `Image` do Qt (rede pelo `QNetworkAccessManager`), recortadas no raio, sem cache próprio, como o widget de mídia do Omarchy. A imagem é decodificada no tamanho em que aparece (`sourceSize` com DPR e zoom), nunca no tamanho que o player mandar. O `make lint` (`scripts/check-qml-rules.mjs`) falha com uma `Image` sem `sourceSize`. Sem capa: bloco `accent-900` com `ph-fill ph-music-note` 24px `accent-300`.
- Artista vazio: mostra o nome do player (`Identity`).
- Teste local: `dev/fake-mpris.py` no D-Bus privado do harness (`SIGUSR1` troca de faixa).

### Ícone da fonte

Pelo `Identity` do player, sem diferenciar maiúsculas:

| `Identity` | Ícone |
|---|---|
| `Spotify` (app nativo) | `ph-fill ph-spotify-logo` |
| `Chrome` / `Chromium` | `ph-fill ph-google-chrome-logo` |
| qualquer outro (inclui `Brave` e `Mozilla firefox`) | `ph-fill ph-music-note` |

O Phosphor não tem logo do Firefox, então ele fica com a nota.

Música tocando em aba de navegador mostra título/artista/capa que o MPRIS entrega. A Island não sabe qual site é: sem companion de navegador.

## Modo `music` (500×58, transitório 2500ms)

- **Gatilho**: troca de faixa (`mpris:trackid` ou título muda; o Firefox manda sempre o mesmo `trackid`) com o player atual tocando, respeitando a regra 3 da spec 03. Compara com a última faixa vista tocando naquele player: o Spotify web pausa, troca de faixa e só então volta a tocar, e retomar a mesma faixa não dispara. Descobrir um player já tocando na primeira leitura não dispara; um player novo que já chega tocando dispara.
- Padding 0 14px 0 9px, gap 12px: capa 40×40 raio 20 (círculo) · bloco de texto · ondas (5 barras 3×20) · controles · ícone da fonte 19px `accent-400`.
- Texto: artista 13px/500, título 12px `neutral-400`. Progresso (margin-top 3px, 10px `neutral-500`): posição · barra 3px (`accent` sobre `neutral-800`) · duração. Tempo em `m:ss`.
- Controles: anterior 30×30 (`ph-fill ph-skip-back` 17px), tocar/pausar 34×34 (`ph-fill ph-play`/`ph-pause` 22px), próxima 30×30 (`ph-fill ph-skip-forward` 17px); hover `neutral-900`. Qualquer controle rearma o timer. Botão desabilitado quando `CanGo*` é falso.

### Ondas

Barras `accent` com raio igual à largura e brilho `0 0 8px accent 45%` (`MusicWaves.qml`; `Waves` do design v4). Cada barra escala na vertical (origem no centro) entre 15% e 100%, perseguindo um alvo feito de bumbo (mais forte nas barras da esquerda), chimbal (nas da direita) e um balanço senoidal; sobe a 28/s e desce a 9/s. As regras ficam em `src/core/waves.ts`.

- O design usa o andamento de cada faixa (`bpm`). O MPRIS não informa andamento, então todas as faixas usam 112 bpm.
- Pausado, as barras voltam a 15% e a animação para quando assentam. Item invisível não anima.
- Aparecem no modo `music` (5 barras 3×20, gap 3), no cartão central (7 barras 3×26, gap 3) e no widget Música (4 barras 2×13, gap 2; spec 16).

### `music` fixado

- Aberto pelo clique no widget Música (spec 16). Mesmo visual do `music`.
- Sem timer: fica até clique fora, Esc, novo gatilho ou novo clique no widget. Conta como modo fixo (regra 3 da spec 03).
- Troca de faixa com ele aberto atualiza o conteúdo. O player sumir fecha a ilha.

## Cartão central

- Abre ao clicar na ilha em `compact` quando "Clique na ilha abre" = **Calendário e música** (padrão, spec 13). Esc ou clique fora fecha; clicar dentro do cartão é do conteúdo, como nos modos fixos.
- A ilha se expande no cartão, como num modo: vai a **440**×altura do conteúdo, raio 26, com a mola e o crossfade da ilha (spec 03, "Animação"); o relógio sai e o cartão entra. No design v3 o cartão é o modo `hub` da ilha, como a Island já fazia (até o v2 ele abria separado, em `top: 38px`).
- Fundo `bg`, anel `neutral-800`, sem o blur, a sombra escura e o brilho do design (spec 03, "Animação"). Padding 18px.
- **Seção de música**: capa 56×56 raio 12, artista 14px/500, título 12.5px `neutral-400`, ondas (7 barras), ícone da fonte 22px `accent-400` alinhado ao topo. Progresso (margin-top 12px): barra 3px + `pos / duração` 10.5px `neutral-500`. Controles centralizados, gap 18px: 36/40/36 com ícones 17/24/17.
- Divisor: 1px, gradiente transparente → `neutral-800` (15%–85%) → transparente, sangrando até as bordas do cartão (margin 14px −18px).
- **Seção de calendário**: spec 06.
- **Nada tocando** (nenhum player atual): seção de música e divisor somem; o cartão vira só calendário.

## Critérios de aceite

- [ ] Com Brave tocando um vídeo, o cartão mostra título, artista e capa do MPRIS e o ícone `ph-music-note`.
- [ ] Trocar de faixa no player abre `music` com a faixa nova (visto no `make dev` com o player falso); com um modo fixo aberto (ex.: calendário), não abre.
- [ ] Barra de progresso avança a cada segundo e corrige após seek no player.
- [ ] Com o player tocando, as ondas pulsam; ao pausar, voltam a 15% e param.
- [x] Fechar o player remove a seção de música do cartão (captura no `make dev`).
- [ ] Dois players: o último a tocar é o exibido.
- [x] O cartão central abre com 440px de largura e raio 26 (captura no `make dev`).
- [ ] Clicar no widget Música abre `music` sem timer; trocar de faixa atualiza sem fechar; clicar de novo fecha.
