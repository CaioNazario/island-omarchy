# 05 · Música e cartão central

Origem: `design/markup.html` camadas `L.music` e `L.hub` (cartão central); `design/logic.js` `track`/`posLabel`/`posPct`/`togglePlay`/`prevTrack`/`nextTrack`, `SIZES.hub`, `hubH`, `musicPin`.

## Fonte: MPRIS

- Serviço em `src/system/mpris.ts`: acompanha nomes `org.mpris.MediaPlayer2.*` no barramento de sessão (entrada, saída, `PropertiesChanged`, `Seeked`).
- **Player atual**: o último que entrou em `Playing`. Pausado continua atual até outro tocar ou ele sair do barramento. `Stopped` ou sem título não é atual (o Brave fica no barramento em `Stopped` com metadados vazios quando o vídeo acaba) e volta a valer se tocar de novo. Na primeira leitura (o `enable()` roda a cada desbloqueio), os que já tocam têm prioridade sobre os pausados.
- Dados: `xesam:artist` (array, junto com ", "), `xesam:title`, `mpris:length`, `mpris:artUrl`, `Position`, `PlaybackStatus`, `CanGoPrevious`/`CanGoNext`.
- `Position` não gera sinal: ler ao abrir e avançar localmente a cada 1s enquanto tocando; ressincronizar em `Seeked` e em troca de faixa.
- Capa: `file://` (o que Brave, Chrome e Firefox mandam) vira fundo recortado no raio; `http(s)://` (Spotify nativo) carrega como no Shell (`Gio.FileIcon` na URI, o GVfs baixa), sem cache próprio e sem o raio. Sem capa: bloco `accent-900` com `ph-fill ph-music-note` 24px `accent-300`.
- Artista vazio: mostra o nome do player (`Identity`).

### Ícone da fonte

Pelo `Identity` do player, sem diferenciar maiúsculas:

| `Identity` | Ícone |
|---|---|
| `Spotify` (app nativo) | `ph-fill ph-spotify-logo` |
| `Chrome` / `Chromium` | `ph-fill ph-google-chrome-logo` |
| qualquer outro (inclui `Brave` e `Mozilla firefox`) | `ph-fill ph-music-note` |

O Phosphor não tem logo do Firefox, então ele fica com a nota.

Música tocando em aba de navegador mostra título/artista/capa que o MPRIS entrega. A Island não sabe qual site é: sem companion de navegador na v1.

## Modo `music` (500×82, transitório 2500ms)

- **Gatilho**: troca de faixa (`mpris:trackid` ou título muda; o Firefox manda sempre o mesmo `trackid`) com o player atual tocando, respeitando a regra 3 da spec 03. Compara com a última faixa vista tocando naquele player: o Spotify web pausa, troca de faixa e só então volta a tocar, e retomar a mesma faixa não dispara. Descobrir um player já tocando na primeira leitura não dispara; um player novo que já chega tocando dispara.
- Padding 0 14px, gap 14px: capa 56×56 raio 12 · bloco de texto · controles · ícone da fonte 22px `accent-400`.
- Texto: artista 13px/500, título 12px `neutral-400`. Progresso (margin-top 6px, 10px `neutral-500`): posição · barra 3px (`accent` sobre `neutral-800`) · duração. Tempo em `m:ss`.
- Controles: anterior 34×34 (`ph-fill ph-skip-back` 17px), tocar/pausar 38×38 (`ph-fill ph-play`/`ph-pause` 22px), próxima 34×34 (`ph-fill ph-skip-forward` 17px); hover `neutral-900`. Qualquer controle rearma o timer. Botão desabilitado quando `CanGo*` é falso.

### `music` fixado

- Aberto pelo clique no widget Música (spec 16). Mesmo visual do `music`.
- Sem timer: fica até clique fora, Esc, novo gatilho ou novo clique no widget. Conta como modo fixo (regra 3 da spec 03).
- Troca de faixa com ele aberto atualiza o conteúdo. O player sumir fecha a ilha.

## Cartão central

- Abre ao clicar na ilha em `compact` quando "Clique na ilha abre" = **Calendário e música** (padrão, spec 13). Esc ou clique fora fecha; clicar dentro do cartão é do conteúdo, como nos modos fixos.
- A ilha se expande no cartão, como num modo: vai a **440**×altura do conteúdo, raio 26, com a mola e o crossfade da ilha (spec 03, "Animação"); o relógio sai e o cartão entra. No design v3 o cartão é o modo `hub` da ilha, como a Island já fazia (até o v2 ele abria separado, em `top: 38px`).
- Fundo `bg`, anel `neutral-800`, sem o blur, a sombra escura e o brilho do design (spec 03, "Animação"). Padding 18px.
- **Seção de música**: capa 56×56 raio 12, artista 14px/500, título 12.5px `neutral-400`, ícone da fonte 22px `accent-400` alinhado ao topo. Progresso (margin-top 12px): barra 3px + `pos / duração` 10.5px `neutral-500`. Controles centralizados, gap 18px: 36/40/36 com ícones 17/24/17.
- Divisor: 1px, gradiente transparente → `neutral-800` (15%–85%) → transparente, sangrando até as bordas do cartão (margin 14px −18px).
- **Seção de calendário**: spec 06.
- **Nada tocando** (nenhum player atual): seção de música e divisor somem; o cartão vira só calendário.

## Critérios de aceite

- [x] Com Brave tocando um vídeo, o cartão mostra título, artista e capa do MPRIS e o ícone `ph-music-note`.
- [x] Trocar de faixa no player abre `music` com a faixa nova; com um modo fixo aberto (ex.: calendário), não abre.
- [x] Barra de progresso avança a cada segundo e corrige após seek no player.
- [x] Fechar o player remove a seção de música do cartão.
- [x] Dois players: o último a tocar é o exibido.
- [x] O cartão central abre com 440px de largura e raio 26.
- [x] Clicar no widget Música abre `music` sem timer; trocar de faixa atualiza sem fechar; clicar de novo fecha.
