# 08 · Controles rápidos, volume/brilho, Wi‑Fi e Bluetooth

Origem: `design/markup.html` camadas `volume`, `quick`, `bt` e `wifi` (+ senha); `design/logic.js` `tileDefs`/`tiles`, `slider`, `submitPw`, `nets`, `btPaired`/`btNearby`, `wifiH`/`btH`.

Código: `plugin/ui/ControlsRow.qml`, `WifiView.qml`, `BtView.qml`, `LevelRow.qml`; fontes em `plugin/system/` (`AudioSource`, `BrightnessSource`, `NightLightSource`, `WifiSource`, `BluetoothSource`).

## Linha de controles (comum a `quick`, `wifi` e `bt`)

46px de altura, padding 0 7px, gap 6px, da esquerda para a direita:

1. **Brilho**: pílula `flex: 1`, 32px, raio 16, `neutral-900`, padding 0 11px, gap 8px; `ph ph-sun` 16px + slider. Some se não houver backlight controlável (o volume ocupa o espaço).
2. **Volume**: igual, com o ícone de volume.
3. **Tiles** 32×32 raio 16, ícone 15px (ligado: `accent-600` / ícone `neutral-100`; desligado: `neutral-800` / `neutral-300`; transição 180ms):

   | Tile | Ícone | Clique |
   |---|---|---|
   | Wi‑Fi | `ph-bold ph-wifi-high` | abre `wifi`; em `wifi`, volta a `quick` |
   | Bluetooth | `ph-bold ph-bluetooth` | abre `bt`; em `bt`, volta a `quick` |
   | Modo noturno | `ph-fill ph-moon` | alterna o serviço `omarchy.nightlight` (hyprsunset), pelo proxy `firstPartyServiceFor`; sem o serviço, o tile some |
   | Não perturbe | `ph-fill ph-bell-slash` | alterna o não perturbe da própria Island (`Service.qml`), que é o servidor de notificações (spec 04) |

   Estado ligado dos tiles Wi‑Fi/BT = rádio ligado. Tile de rádio sem hardware some.
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
- Abre pelo ícone de volume da barra ou pela tecla de volume/mudo (regra 4 da spec 03).

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

## Modo `quick` (520×46)

Só a linha de controles. Com a linha de energia aberta: 94px (spec 09). Abre por `Super+I`, bateria, seta ou o widget Hardware (spec 16).

## Modo `wifi` (520×280)

Linha de controles · linha de energia (opcional) · divisor · seção de redes (padding 0 12px):

- **Cabeçalho** 26px: `ph ph-wifi-high` 14px `neutral-300`, "Redes Wi‑Fi" 13px/500, status 11px `neutral-500` ("Conectado a Casa" / "Conectando…" / "Desconectado" com rádio ligado e sem conexão / "Desligado") e **switch** 32×18 raio 9 (ligado `accent-600`, desligado `neutral-700`, bolinha 14px `neutral-100`, 180ms) que liga/desliga o rádio.
- **Redes** (fonte `Quickshell.Networking`, NetworkManager): redes visíveis deduplicadas por SSID (fica o sinal mais forte), conectada primeiro e depois por sinal. A busca (`scannerEnabled`) roda só com `wifi` aberto. Altura da ilha fixa: com mais de 5 redes, a lista rola.
- Linha 36px raio 10, padding 0 8px, gap 10px, hover `neutral-900`: sinal (`ph-bold ph-wifi-high` ≥67%, `ph-wifi-medium` ≥34%, `ph-wifi-low` abaixo) 16px (`accent` se conectada, senão `neutral-300`) · SSID 12.5px · cadeado `ph-fill ph-lock-simple` 11px `neutral-500` se protegida · status 11px à direita ("Conectado" `accent-300`, "Conectando…" `neutral-400`). Conectada com fundo `accent-900`.
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

- Margin 2px 0 6px, padding 10px, raio 12, `neutral-900`, anel interno 1px `neutral-800` (com erro `#bd413f`). A ilha cresce +58px (+76 com erro).
- Linha (gap 8px): campo 32px raio 9 fundo `bg` anel `neutral-800` padding 0 10px com `ph ph-key` 14px `neutral-400`, entrada 12.5px com placeholder "Senha de {SSID}" (texto mascarado) e olho 22×22 (`ph ph-eye` / `ph-eye-slash`) que alterna a visibilidade · **Cancelar** (`.btn-ghost`, 32px, 12px) · **Conectar** (`.btn-primary`, 32px, 12px, opacidade .45 com campo vazio).
- O campo recebe foco ao abrir. Enter = Conectar; Esc = Cancelar (spec 03, regra 9). Digitar limpa o erro.
- Erro (`ph ph-warning-circle` 13px + texto 11px `#fd736d`):
  - menos de 8 caracteres: "Senha precisa ter pelo menos 8 caracteres" (validação local, não chama o NM)
  - senha rejeitada pelo NM: "Senha incorreta"
  - sem ativação em 30s: "Não foi possível conectar"
- **Conectar**: `WifiNetwork.connectWithPsk(senha)` (Quickshell); o painel fecha e a rede mostra "Conectando…".
- **Falha** (`Network.connectionFailed`): `NoSecrets` ou `WifiAuthTimeout` → "Senha incorreta"; outro motivo ou 30s sem ativar → "Não foi possível conectar" (`connectFailureMessage`, mesma leitura do painel de rede do Omarchy). O perfil recém-criado sai (`forget()`) e o painel reabre com o erro. Sem agente de segredos na sessão, o NM não abre diálogo nenhum.

## Modo `bt` (520×336, desligado 288)

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
- [x] `osd` de mensagem e de progresso abre com 320×50 e volta a `compact` no tempo do pedido (captura no `make dev`).
