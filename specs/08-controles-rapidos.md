# 08 · Controles rápidos, volume/brilho, Wi‑Fi e Bluetooth

Origem: `design/markup.html` camadas `volume`, `quick`, `bt` e `wifi` (+ senha); `design/logic.js` `tileDefs`/`tiles`, `slider`, `submitPw`, `nets`, `btPaired`/`btNearby`, `wifiH`/`btH`.

Código: `plugin/ui/ControlsRow.qml`, `WifiView.qml`, `BtView.qml`, `LevelRow.qml`; fontes em `plugin/system/` (`AudioSource`, `BrightnessSource`, `NightLightSource`, `WifiSource`, `BluetoothSource`).

## Linha de controles (comum a `quick`, `wifi` e `bt`)

46px de altura, padding 0 7px, gap 6px, da esquerda para a direita:

1. **Brilho**: pílula `flex: 1`, 32px, raio 16, `neutral-900`, padding 0 11px, gap 8px; `ph ph-sun` 16px + slider. Some se não houver backlight controlável (o volume ocupa o espaço).
2. **Volume**: igual, com o ícone de volume.
3. **Tiles** 32×32 raio 16, ícone 15px (ligado `tileOn` / ícone `tileOnIcon`; desligado `tileOff` / `tileOffIcon`; transição 180ms). No Nocturne com realce Roxo são as cores do design: ligado `accent-600` / `neutral-100`, desligado `neutral-800` / `neutral-300`. No Alto contraste e no realce Branco o `accent-600` é claro ou cinza e o ícone claro sumia sobre ele: ligado é o `accent` cheio com ícone na cor do `bg`; no Alto contraste, desligado é `#262938` com ícone `#f7f8fc` (spec 01 "Temas"). Configurações e Energia em repouso seguem o tile desligado:

   | Tile | Ícone | Clique |
   |---|---|---|
   | Wi‑Fi | `ph-bold ph-wifi-high` | abre `wifi`; em `wifi`, volta a `quick` |
   | Bluetooth | `ph-bold ph-bluetooth` | abre `bt`; em `bt`, volta a `quick` |
   | Modo noturno | `ph-fill ph-moon` | alterna o serviço `omarchy.nightlight` (hyprsunset), pelo proxy `firstPartyServiceFor`; sem o serviço, o tile some |
   | Não perturbe | `ph-fill ph-bell-slash` | alterna o não perturbe da própria Island (`Service.qml`), que é o servidor de notificações (spec 04) |
   | Tela | `ph ph-monitor` | abre o modo `display`; nunca fica ligado |
   | Manter tela acesa | `ph-fill ph-coffee` | alterna o `stayAwake` do serviço `omarchy.idle` (`setIdleEnabled`, pelo proxy `firstPartyServiceFor`), o mesmo estado de `omarchy toggle idle`; sem o serviço, o tile some |
   | Gravar tela | `ph-fill ph-record`; gravando `ph-fill ph-stop` | ligado = `gpu-screen-recorder` vivo (`pgrep`, a cada 2s com a linha de controles à vista), fundo `oklch(0.58 0.2 25)` (`#d73337`). Gravando, para com `omarchy-capture-screenrecording --stop-recording`; parado, fecha a ilha e abre o menu de captura do Omarchy (`omarchy-menu toggle trigger.capture.screenrecord`), como o indicador de gravação do Omarchy |
   | Ditado | `ph ph-microphone`; gravando `ph-fill ph-microphone` | ligado = Voxtype gravando (`omarchy-voxtype-status`, seguido com a linha de controles à vista); clique `voxtype record toggle`, o mesmo do atalho `Super+Ctrl+X`; sem `voxtype`, o tile some |

   Estado ligado dos tiles Wi‑Fi/BT = rádio ligado. Tile de rádio sem hardware some. O design mostra no título dos tiles o estado e o tempo de gravação ("Gravando tela · 01:23"); a Island não tem dica de ferramenta e deixa isso de fora.
4. Divisor 1×22 `neutral-800` (margin 0 2px).
5. **Configurações** e **Energia**: spec 09.

### Slider

- Trilho 4px raio 2 `neutral-800`, preenchimento `accent`, thumb 12×12 `neutral-100` (no modo `volume`: 14×14 com brilho `accent` 60% 12px).
- Pressionar posiciona pelo x; arrastar continua fora do trilho até soltar. Setas do teclado ±5 com foco.
- Valor 0–100, inteiro.

## Volume

- Fonte: `Pipewire.defaultAudioSink` (Quickshell). Máximo 100%, sem amplificação. Mexer no slider acima de 0 tira do mudo.
- Ícone (`ph-fill`): mudo ou 0 → `ph-speaker-x`; <40 → `ph-speaker-low`; senão `ph-speaker-high`.
- **Modo `volume`** (320×36, 1500ms): padding 0 16px, gap 12px: ícone 16px · slider (puxador 12px) · valor `70%` (34px, alinhado à direita, 12px `neutral-300`).
- Abre pela tecla de volume/mudo (regra 4 da spec 03) ou pela rolagem no botão de volume da barra. Clicar no modo `volume` fora do slider abre o `mixer`.
- Na linha de controles, o ícone da pílula de volume é um botão 24×24 raio 12 (margin-left −5px, ícone `text`, hover `neutral-800`) que abre o `mixer`.

## Modo `display`

Painel do design v5 (`display`), fixo, 440×277 (212 sem backlight, sem a seção de brilho). Abre pelo tile Tela. Padding 14px 16px; entre as seções, divisor em degradê (margin 10px 0). Os rótulos de seção são 11px maiúsculos `letter-spacing .08em` `neutral-500`, com o valor à direita em `neutral-300` (18px + 6px até o controle).

- **Cabeçalho** 44px, gap 12: `ph ph-monitor` 26px `accent`; "Tela" 14px/500; legenda 10.5px maiúscula `letter-spacing .1em` `neutral-400` com descrição · resolução · taxa do monitor desta ilha (`monitorSubtitle`, pelo IPC do Hyprland; `lastIpcObject.refreshRate` depois de um `refreshMonitors`).
- **Brilho**: rótulo + `70%`, slider de 20px (puxador 12px) no backlight da spec 08 "Brilho". Sem backlight, a seção e o divisor dela somem.
- **Tamanho do texto**: rótulo + `12px`; sete segmentos de 10 a 16px (gap 3, trilho 4px raio 2), preenchidos com `accent` até o atual e o puxador 12px `neutral-100` na ponta do atual. Clicar roda `omarchy-display-text-size N`, que muda junto o texto do shell, do GTK e dos terminais; o segmento muda na hora e a leitura (`omarchy-display-text-size` sem argumento, `text size: 12 px`) confirma 1.2s depois. Tamanho fora de 10–16 (o Omarchy aceita 9–20) não mostra puxador.
- **Escala**: seis opções `1x 1.25x 1.6x 2x 3x 4x` (30px, raio 9, gap 6; ativa `accent-900` com anel `accent-700` e texto `accent-100`). Clicar foca o monitor desta ilha e roda `omarchy-hyprland-monitor-scaling ESCALA`, que só age no monitor focado e grava a escala no `monitors.lua`. O script ajusta a escala a um divisor da resolução (1.6 em 1920×1080 vira 1.666667), então a opção ativa é a mais próxima da escala do monitor, até 0.1 de distância (`activeScale`). Nome de monitor fora de `[A-Za-z0-9._-]` não é passado ao Hyprland.

## Modo `mixer`

Gerenciador de volume do design v4 (`mixer`), fixo, 440 de largura e a altura do conteúdo (`mixerHeight` em `src/core/mixer.ts`, até 560; acima disso o conteúdo rola). Abre pelo clique no botão de volume da barra, no modo `volume` ou no ícone da pílula de volume. Padding 12px 12px 10px:

- **Cabeçalho** 26px (padding 0 6px, margin-bottom 8px): `ph ph-sliders-horizontal` 14px `neutral-300`, "Volume" 13px/500; à direita o ícone 12px e o nome 11px `neutral-500` da saída atual.
- **Volume geral**: 42px, raio 14, `neutral-900`, padding 0 12px 0 6px, gap 10px: botão de mudo 30×30 (ícone de volume 16px `text`) · slider com brilho · valor 38px à direita, 12px `neutral-300` (`70%` ou "Mudo").
- **Rótulos de seção** ("Saída", "Aplicativos", "Entrada"): 10.5px maiúsculo, `letter-spacing .06em`, `neutral-500`, padding 12px 8px 4px. Seção vazia some com o rótulo.
- **Saída**: uma linha de 36px por sink (raio 10, padding 0 8px, gap 10px): ícone 16px (`accent` na atual, senão `neutral-300`) · nome 12.5px · tipo 11px `neutral-500` · `ph-bold ph-check` 13px `accent-300` só na atual (fundo `accent-900`). Clicar torna a saída padrão por `Pipewire.preferredDefaultAudioSink` e `omarchy-audio-output-set-default`, como o seletor de saída do Omarchy.
  - Tipo e ícone (`outputDevice`): fone (nome com headphone/headset/earbud/airpod) `ph-fill ph-headphones`, "Bluetooth" ou "Fone"; outro Bluetooth `ph-fill ph-bluetooth`; HDMI/DisplayPort `ph ph-monitor` "HDMI"; o resto `ph ph-laptop` "Integrado". O nome limpa os prefixos e sufixos do ALSA como o painel de áudio do Omarchy.
  - Lista: sinks que não são stream, sem os que `omarchy-audio-sink-availability` marca como desligados (lido a cada 5s com o `mixer` aberto); a saída padrão aparece sempre. O design mostra a bateria do fone Bluetooth na linha; o Pipewire não informa, então fica de fora.
- **Aplicativos**: um stream de reprodução por linha (`MixerLevelRow`, 42px, raio 12, padding 0 6px 0 8px, hover `neutral-900`): ícone 16px `accent-300` num quadrado 28 raio 8 `accent-900` · nome 12.5px/500 + sub 11px `neutral-500` (124px, reticências) · slider (puxador 10px) · valor 34px 11.5px `neutral-300` · botão de mudo 26×26 (`ph ph-speaker-simple-high` 14px `neutral-400`; mudo `ph-fill ph-speaker-x` vermelho claro sobre `neutral-800`). Com o volume geral no mudo, as linhas ficam com opacidade 0.45.
  - Nome e ícone (`streamApp`): `application.name` (ou a descrição do nó); Spotify, Discord, navegadores e sons do sistema têm ícone próprio, o resto `ph-fill ph-speaker-high`. Sub: `media.name` (a faixa, a aba), escondida se repetir o nome.
  - O stream de afinação de alto-falante do Omarchy (`omarchy_speaker_tuning*`) não aparece.
- **Entrada**: a mesma linha para o microfone padrão (`ph-fill ph-microphone` / `ph-microphone-slash`), sub com o nome do dispositivo ou "Silenciado".
- O volume geral mexe na saída física que `omarchy-audio-output-sink` resolve (a mesma das teclas de volume do Omarchy): com uma afinação de alto-falante ou EasyEffects na frente, mexer no sink virtual mudaria o tom e não o volume.
- As listas são cópias atualizadas 75ms depois de cada mudança nos nós, e as propriedades dos streams só são lidas com o nó vinculado: o painel de áudio do Omarchy registra que reconstruir a lista dentro do sinal de remoção do Pipewire e ler `properties` de nó não vinculado derrubam o Quickshell.

### Rolagem no botão de volume

Cada 120 unidades de rolagem (um entalhe; o touchpad acumula, inverter o sentido zera) mudam o volume em 5%, como a barra do Omarchy (`Util.wheelSteps`). Um entalhe gigante conta como um passo. A ilha mostra `volume` pela regra 4 da spec 03, como uma tecla de volume. O design usa passos de 2% a cada 25px de rolagem de navegador; a Island segue o passo do Omarchy.

## Brilho

- Fonte: `omarchy-brightness-display`, o mesmo script das teclas do Omarchy (backlight interno, DDC ou monitor Apple do monitor focado). Sem argumento imprime a porcentagem; escrita com `--no-osd N%`, um processo por vez (arrastar guarda só o último valor). Sem resposta numérica, a pílula de brilho some. Cada pedido de OSD de brilho já traz o valor novo.
- **Modo `brightness`** (320×50, 1500ms): clone do `volume` com `ph ph-sun`. Abre pela tecla de brilho.

## OSD do Omarchy

As teclas de volume e brilho do Omarchy rodam `omarchy-audio-output-volume`/`omarchy-brightness-display`, que terminam em `omarchy-osd`. Com `omarchy.osd` desligado, a Island responde pelo alvo IPC `osd` (`show`, `close`, `state`, `ping`; spec 14, S7). Nenhum atalho muda.

`src/core/osd.ts` traduz o payload (`{icon, message, value, progressText, max, duration}`, tudo string), com as regras de progresso do `OsdModel.stateForShow` do Omarchy:

| Pedido | Exemplo | Ilha |
|---|---|---|
| ícone `volume*`/`mute` com progresso | tecla de volume | `volume` com o valor (regra 4 da spec 03) |
| ícone `brightness` com progresso | tecla de brilho | `brightness` com o valor |
| outro ícone com progresso | luz do teclado, download | `osd`: ícone 16px · barra · `NN%` |
| mensagem | microfone mudo, toggles, "Shutting down", troca de saída de áudio | `osd`: ícone 16px · texto 12.5px |

- `osd` usa o layout do modo `volume` (320×36, padding 0 16px, gap 12px). A barra é o trilho do slider, só leitura.
- Duração: a do pedido (`-d`), senão 1500ms.
- Ícone: o nome do Omarchy vira Phosphor (`osdGlyph`): microfone → `ph-microphone`/`ph-microphone-slash`, teclado → `ph-fill ph-keyboard`, reiniciar → `ph-arrow-clockwise`, desligar → `ph-bold ph-power`, sair → `ph-sign-out`, mídia → `ph-fill ph-play`/`pause`/`skip-*`, download → `ph-download-simple`, desconhecido → `ph-info`.
- Payload sem mensagem nem progresso, ou JSON inválido: ignorado.

## Modo `quick` (660×46)

Só a linha de controles. Com a linha de energia aberta: 94px (spec 09). Abre por `Super+S`, seta ou o widget Hardware (spec 16).

## Modo `wifi` (660 × `wifiPanelHeight`)

Painel do design v5. Linha de controles · linha de energia (opcional) · divisor em degradê (margin 0 0 8px) · cabeçalho · com o rádio ligado: vista de 80px, divisor, DNS, divisor, redes; desligado: área de 150px. Seção com padding 0 12px; cabeçalho, vista e DNS com mais 6px.

- **Altura** (`wifiPanelHeight` em `src/core/wifiPanel.ts`, `renderVals()` do design): 46 (+48 energia) + 9 + 56 + ligado: 88 + 11 + 58 (+38 com o campo do DNS personalizado) + 11 + lista + 10; desligado: 160. Lista = (20 + 40 por rede conhecida, se houver) + (20 + 34 por outra rede, se houver) + senha (+58, +76 com erro), até 196 + senha; acima disso rola.
- **Cabeçalho** 48px, gap 12 (`wifiHeader` em `src/core/wifi.ts`): `ph-fill ph-wifi-high` 24px `accent` (desligado `ph-fill ph-wifi-slash` `neutral-500`) · rede atual 14px/500 ("Wi‑Fi" sem conexão) + estado 10.5px maiúsculo `letter-spacing .1em` `neutral-400` ("Transmitindo pacotes", texto do design para conectado; "Conectando…", "Desconectado", "Desligado") · com conexão, botões 30×30 `ph ph-qr-code` e `ph ph-gauge` (ativo `accent-900`/`accent-200`, hover `neutral-800`) que alternam a vista · **switch** 36×20 raio 10 (bolinha 16px; o do `bt` continua 32×18) que liga/desliga o rádio.
- **Vista** (80px, uma por vez, `bar.wifiView`; volta a estatísticas ao sair do modo):
  - **Estatísticas**: duas colunas (gap 28) de linhas de 20px 12px, rótulo `neutral-500` e valor `neutral-200`: Ping, Ping do roteador, Recebendo, Enviando, Baixado, Enviado, Endereço IP, Gateway (`networkStats`). Fonte: `omarchy-network-status --verbose` a cada 1.5s com o modo aberto e o rádio ligado, como o painel de rede do Omarchy; taxas pelo delta de `rx_bytes`/`tx_bytes` entre duas leituras (KB/s, MB/s acima de 1024 KB/s), totais em MB/GB. O design mostra perda de pacotes, que o Omarchy não mede: no lugar entra o ping do roteador (`router_ping_ms`). Sem leitura, travessão.
  - **QR**: quadrado 80×80 raio 8 `neutral-100` com a matriz de `omarchy-network-qr --meta` (já com a margem branca; módulos `bg`, desenhados num `Canvas`); ao lado "Compartilhar {rede}" 13px/500, linha 26px raio 8 `neutral-900` com `ph ph-key` 13px, a senha mascarada e botões 22×22 de mostrar (`ph ph-eye`/`ph-eye-slash`) e copiar (`ph ph-copy`, `ph-bold ph-check` `accent-300` por 1.4s depois de copiar), e "Aponte a câmera do celular para entrar na rede" 11px `neutral-500`. Rede aberta: "Rede aberta · sem senha", sem botões. A senha só é lida (`omarchy-network-password <iface>`) ao mostrar ou copiar, vai ao `wl-copy` pela entrada padrão e é esquecida ao sair da vista. Erro do script (rede corporativa, sem conexão) aparece no lugar do título.
  - **Velocidade**: rótulo "Teste de velocidade" com o estado à direita ("Medindo download…", "Medindo upload…", "Concluído · ping 14 ms", "Falhou") e botão 20×20 `ph ph-arrow-clockwise` que roda de novo (opacidade .3 medindo); duas colunas de 44px com `ph-bold ph-arrow-down`/`arrow-up` 15px (`accent` na fase em curso), valor 24px/500 (`neutral-600` em zero) e "Mbps" 11px; barra de 3px `accent`: download até 55%, upload o resto. Como o painel de velocidade do Omarchy: `omarchy-network-speedtest down` e depois `up`, cada fase parada em 5s, cada linha da saída é a medida em Mbps. Abrir a vista roda o teste, salvo se já houver resultado; sair da vista ou do modo para o teste.
- **Servidor DNS** (padding 0 6px, margin-bottom 10px): rótulo com os servidores à direita (`dnsDetail`: "Automático · {gateway}", "1.1.1.1 · 1.0.0.1", "8.8.8.8 · 8.8.4.4" ou os servidores IPv4 da linha `DNS=` do `/etc/systemd/resolved.conf`; "Aplicando…" enquanto o script roda) e quatro opções de 30px: DHCP, Cloudflare, Google, Personalizado. O provedor atual vem de `omarchy-dns` sem argumento. Escolher roda `omarchy-dns <provedor>` (que pede root pela regra do sudoers do Omarchy ou pelo polkit). Personalizado abre um campo de 32px (raio 9, fundo `bg`, anel `neutral-800`, `ph ph-globe-simple` 14px, placeholder "ex.: 9.9.9.9, 149.112.112.112") preenchido com os servidores atuais; Enter passa os servidores ao `omarchy-dns Custom` pela entrada padrão, Esc desiste. O painel do Omarchy abre um terminal para o Personalizado; a Island usa o campo do design.
- **Redes** (fonte `Quickshell.Networking`, NetworkManager): redes visíveis deduplicadas por SSID (fica o sinal mais forte), conectada primeiro e depois por sinal, divididas em "Redes conhecidas" (com perfil salvo, ou a ativa) e "Outras redes" (`splitNetworks`); rótulos de 20px, 11px maiúsculos, que somem com o grupo vazio. A busca (`scannerEnabled`) roda só com `wifi` aberto.
  - Conhecida: linha de 40px raio 10, padding 0 8px, gap 10px, hover `neutral-900`: sinal (`ph-bold ph-wifi-high` ≥67%, `ph-wifi-medium` ≥34%, `ph-wifi-low` abaixo) 16px (`accent` se conectada, senão `neutral-300`) · SSID 12.5px com "Conectado" (`accent-300`), "Conectando…" ou "Salva" (`neutral-400`) 11px embaixo · cadeado `ph-fill ph-lock-simple` 11px `neutral-500` se protegida. Conectada com fundo `accent-900`.
  - Outra: linha de 34px: sinal · SSID · "Conectando…" 11px à direita enquanto ativa · cadeado.
- **Rádio desligado**: área de 150px com `ph ph-wifi-slash` 22px + "Wi‑Fi desligado" 12.5px `neutral-500`.

### Clique numa rede

| Rede | Ação |
|---|---|
| conectada ou conectando | nada |
| aberta ou com perfil salvo | ativa; status "Conectando…" |
| protegida (WPA/WPA2/WPA3 pessoal) sem perfil | abre o **painel de senha** abaixo dela; clicar de novo fecha |
| WPA‑Enterprise (802.1X) sem perfil | fecha a ilha e abre `nmtui connect '<SSID>'` no terminal flutuante do Omarchy (o Omarchy não tem app de rede) |

Captive portal não é detectável antes de conectar: a rede aparece como aberta e ativa normalmente.

### Painel de senha

- Margin 2px 0 6px, padding 10px, raio 12, `neutral-900`, anel interno 1px `neutral-800` (com erro `#bd413f`). A lista cresce +58px (+76 com erro), e o teto dela também.
- Linha (gap 8px): campo 32px raio 9 fundo `bg` anel `neutral-800` padding 0 10px com `ph ph-key` 14px `neutral-400`, entrada 12.5px com placeholder "Senha de {SSID}" (texto mascarado) e olho 22×22 (`ph ph-eye` / `ph-eye-slash`) que alterna a visibilidade · **Cancelar** (`.btn-ghost`, 32px, 12px) · **Conectar** (`.btn-primary`, 32px, 12px, opacidade .45 com campo vazio).
- O campo recebe foco ao abrir. Enter = Conectar; Esc = Cancelar (spec 03, regra 9). Digitar limpa o erro.
- Erro (`ph ph-warning-circle` 13px + texto 11px `#fd736d`):
  - menos de 8 caracteres: "Senha precisa ter pelo menos 8 caracteres" (validação local, não chama o NM)
  - senha rejeitada pelo NM: "Senha incorreta"
  - sem ativação em 30s: "Não foi possível conectar"
- **Conectar**: `WifiNetwork.connectWithPsk(senha)` (Quickshell); o painel fecha e a rede mostra "Conectando…".
- **Falha** (`Network.connectionFailed`): `NoSecrets` ou `WifiAuthTimeout` → "Senha incorreta"; outro motivo ou 30s sem ativar → "Não foi possível conectar" (`connectFailureMessage`, mesma leitura do painel de rede do Omarchy). O perfil recém-criado sai (`forget()`) e o painel reabre com o erro. Sem agente de segredos na sessão, o NM não abre diálogo nenhum.

## Modo `bt` (660×336, desligado 288)

Linha de controles · linha de energia (opcional) · divisor · seção (padding 0 12px):

- **Cabeçalho** 26px: `ph-bold ph-bluetooth` 14px, "Bluetooth" 13px/500, status ("2 conectados" / "1 conectado" / "0 conectados" / "Desligado") e switch (mesmo estilo do Wi‑Fi) que liga/desliga o rádio.
- Fonte: `Quickshell.Bluetooth` (adaptador padrão, dispositivos, bateria). Rádio e ações pelos scripts do Omarchy: `omarchy-bluetooth-power on|off` (lida com rfkill) e `omarchy-bluetooth-device pair|connect|disconnect <endereço>` (confia, conecta, timeout de 20s).
- **Meus dispositivos** (pareados, conectados primeiro) e **Disponíveis** (não pareados e com nome anunciado, com `ph ph-circle-notch` 11px girando 1.2s; sem nome, a busca só teria o endereço e o dispositivo não aparece): rótulos 10.5px maiúsculos, `letter-spacing .06em`, `neutral-500`.
- A busca (discovery) roda **só enquanto `bt` está aberto**. Liga e desliga por timers presos ao estado confirmado do BlueZ (`adapter.discovering`), como o painel de Bluetooth do Omarchy: o Quickshell ignora escrita igual ao último estado confirmado, e uma busca esquecida ligada engasga o áudio A2DP.
- Linha 38px raio 10, padding 0 8px, gap 10px: ícone `ph-fill` 17px (`accent` se conectado, senão `neutral-300`) · nome 12.5px · bateria (`ph-fill ph-battery-medium` 13px + `72%` 11px `neutral-400`, só conectado e com nível em porcentagem; o nível aproximado do `battery_type` `COARSE` não aparece) · status 11px à direita. Conectado com fundo `accent-900`. Alturas fixas; listas longas rolam.
- Ícone pelo `Icon` do BlueZ (`kindFromBluezIcon`): fone/headset → `ph-headphones`, mouse → `ph-mouse`, teclado → `ph-keyboard`, caixa de som → `ph-speaker-hifi`, celular → `ph-device-mobile`, computador → `ph-laptop`, controle → `ph-game-controller`, outro → `ph-bluetooth`.

| Dispositivo | Status | Clique |
|---|---|---|
| pareado conectado | "Conectado" `accent-300` | desconecta ("Desconectando…") |
| pareado desconectado | "Desconectado" `neutral-500` | conecta ("Conectando…") |
| não pareado | "Parear" `accent-300` | pareia, confia e conecta ("Pareando…"); se não parear, volta a "Parear" |

Só uma operação por vez; cliques durante uma operação são ignorados.

A operação termina quando o script sai. O Quickshell não expõe o erro do `Pair()`, então um dispositivo que pede PIN não é distinguível de uma falha comum: a linha volta a "Parear". Para esses, o caminho é o `bluetoothctl` (fora de escopo na ilha).

- **Rádio desligado**: área de 190px com `ph ph-bluetooth-slash` 22px + "Bluetooth desligado".

## Critérios de aceite

- [ ] Arrastar os sliders de brilho/volume em `quick` muda o sistema em tempo real, e o valor volta certo após reabrir.
- [ ] Tecla de volume com a ilha compacta abre `volume`; com `quick` aberto só move o slider; o OSD do Omarchy nunca aparece.
- [ ] Tiles de modo noturno e não perturbe refletem mudanças feitas por `omarchy toggle nightlight` e pelo IPC `notifications`.
- [ ] Conectar numa rede WPA2 nova pela ilha funciona sem abrir diálogo nenhum; senha errada mostra "Senha incorreta" inline.
- [ ] Senha de 7 caracteres mostra o erro local sem tentativa de conexão.
- [ ] Rede 802.1X abre o `nmtui` no terminal flutuante.
- [ ] Parear um mouse Bluetooth sem PIN pela ilha funciona; a busca para ao fechar `bt`.
- [x] `wifi` mostra estatísticas reais (ping, taxas, IP, gateway), o DNS atual e a rede conhecida (visto no `make dev`).
- [x] A vista QR desenha a matriz do `omarchy-network-qr` com a senha mascarada (visto no `make dev`).
- [ ] O teste de velocidade mede download e depois upload, 5s cada, e para ao sair da vista.
- [ ] Trocar o DNS para Cloudflare pela ilha muda o `omarchy-dns`, e Personalizado aplica os servidores digitados.
- [ ] Copiar a senha põe a senha certa na área de transferência sem ela aparecer em `ps`.
- [x] `osd` de mensagem e de progresso abre com 320×50 e volta a `compact` no tempo do pedido (captura no `make dev`).
