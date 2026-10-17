# 08 · Controles rápidos, volume/brilho, Wi‑Fi e Bluetooth

Origem: `design/markup.html` 92–101 (`volume`), 134–157 (`quick`), 158–215 (`bt`), 216–280 (`wifi` + senha); `design/logic.js` `tileDefs`/`tiles` (~209), `slider` (~106), `submitPw` (~126), `nets`, `btPaired`/`btNearby`, `wifiH`/`btH`.

## Linha de controles (comum a `quick`, `wifi` e `bt`)

58px de altura, padding 0 10px, gap 8px, da esquerda para a direita:

1. **Brilho**: pílula `flex: 1`, 38px, raio 19, `neutral-900`, padding 0 12px, gap 8px; `ph ph-sun` 16px + slider. Some se não houver backlight controlável (o volume ocupa o espaço).
2. **Volume**: igual, com o ícone de volume.
3. **Tiles** 38×38 raio 19 (ligado: `accent-600` / ícone `neutral-100`; desligado: `neutral-800` / `neutral-300`; transição 180ms):

   | Tile | Ícone | Clique |
   |---|---|---|
   | Wi‑Fi | `ph-bold ph-wifi-high` | abre `wifi`; em `wifi`, volta a `quick` |
   | Bluetooth | `ph-bold ph-bluetooth` | abre `bt`; em `bt`, volta a `quick` |
   | Modo noturno | `ph-fill ph-moon` | alterna `org.gnome.settings-daemon.plugins.color night-light-enabled` |
   | Não perturbe | `ph-fill ph-bell-slash` | alterna `org.gnome.desktop.notifications show-banners` (invertido) |

   Estado ligado dos tiles Wi‑Fi/BT = rádio ligado. Tile de rádio sem hardware some.
4. Divisor 1×22 `neutral-800` (margin 0 2px).
5. **Configurações** e **Energia**: spec 09.

### Slider

- Trilho 4px raio 2 `neutral-800`, preenchimento `accent`, thumb 12×12 `neutral-100` (no modo `volume`: 14×14 com brilho `accent` 60% 12px).
- Pressionar posiciona pelo x; arrastar continua fora do trilho até soltar. Setas do teclado ±5 com foco.
- Valor 0–100, inteiro.

## Volume

- Fonte: `Gvc.MixerControl` do Shell (saída padrão). Máximo 100%, sem amplificação.
- Ícone (`ph-fill`): mudo ou 0 → `ph-speaker-x`; <40 → `ph-speaker-low`; senão `ph-speaker-high`.
- **Modo `volume`** (320×50, 1500ms): padding 0 18px, gap 14px: ícone 18px · slider · valor `70%` (34px, alinhado à direita, 12px `neutral-300`).
- Abre pelo ícone de volume da barra ou pela tecla de volume/mudo (regra 4 da spec 03).

## Brilho

- Fonte: o mesmo mecanismo que o slider de brilho nativo do Shell 50.x usa (confirmar no código-fonte antes de implementar).
- **Modo `brightness`** (320×50, 1500ms): clone do `volume` com `ph ph-sun`. Abre pela tecla de brilho.

## Teclas de mídia

O OSD nativo de volume e brilho não aparece: o pedido de OSD do Shell é redirecionado para a ilha (injeção no `OsdWindowManager` ou equivalente da 50.x, confirmado no código-fonte) e restaurado no `disable()`. OSDs de outros tipos (ex.: teclado) continuam nativos.

## Modo `quick` (520×58)

Só a linha de controles. Com a linha de energia aberta: 106px (spec 09). Abre por `Super+S`, bateria, seta ou o widget Hardware (spec 16).

## Modo `wifi` (520×292)

Linha de controles · linha de energia (opcional) · divisor · seção de redes (padding 0 12px):

- **Cabeçalho** 26px: `ph ph-wifi-high` 14px `neutral-300`, "Redes Wi‑Fi" 13px/500, status 11px `neutral-500` ("Conectado a Casa" / "Conectando…" / "Desconectado" com rádio ligado e sem conexão / "Desligado") e **switch** 32×18 raio 9 (ligado `accent-600`, desligado `neutral-700`, bolinha 14px `neutral-100`, 180ms) que liga/desliga o rádio.
- **Redes** (fonte `NM.Client`): APs visíveis deduplicados por SSID (fica o sinal mais forte), conectada primeiro e depois por sinal. Altura da ilha fixa: com mais de 5 redes, a lista rola.
- Linha 36px raio 10, padding 0 8px, gap 10px, hover `neutral-900`: sinal (`ph-bold ph-wifi-high` ≥67%, `ph-wifi-medium` ≥34%, `ph-wifi-low` abaixo) 16px (`accent` se conectada, senão `neutral-300`) · SSID 12.5px · cadeado `ph-fill ph-lock-simple` 11px `neutral-500` se protegida · status 11px à direita ("Conectado" `accent-300`, "Conectando…" `neutral-400`). Conectada com fundo `accent-900`.
- **Rádio desligado**: área de 150px com `ph ph-wifi-slash` 22px + "Wi‑Fi desligado" 12.5px `neutral-500`.

### Clique numa rede

| Rede | Ação |
|---|---|
| conectada ou conectando | nada |
| aberta ou com perfil salvo | ativa; status "Conectando…" |
| protegida (WPA/WPA2/WPA3 pessoal) sem perfil | abre o **painel de senha** abaixo dela; clicar de novo fecha |
| WPA‑Enterprise (802.1X) sem perfil | abre Configurações → Wi‑Fi (`gnome-control-center wifi`) |

Captive portal não é detectável antes de conectar: a rede aparece como aberta e ativa normalmente; depois de conectada, o portal fica com o helper nativo do Shell.

### Painel de senha

- Margin 2px 0 6px, padding 10px, raio 12, `neutral-900`, anel interno 1px `neutral-800` (com erro `#bd413f`). A ilha cresce +58px (+76 com erro).
- Linha (gap 8px): campo 32px raio 9 fundo `bg` anel `neutral-800` padding 0 10px com `ph ph-key` 14px `neutral-400`, entrada 12.5px com placeholder "Senha de {SSID}" (texto mascarado) e olho 22×22 (`ph ph-eye` / `ph-eye-slash`) que alterna a visibilidade · **Cancelar** (`.btn-ghost`, 32px, 12px) · **Conectar** (`.btn-primary`, 32px, 12px, opacidade .45 com campo vazio).
- O campo recebe foco ao abrir. Enter = Conectar; Esc = Cancelar (spec 03, regra 9). Digitar limpa o erro.
- Erro (`ph ph-warning-circle` 13px + texto 11px `#fd736d`):
  - menos de 8 caracteres: "Senha precisa ter pelo menos 8 caracteres" (validação local, não chama o NM)
  - senha rejeitada pelo NM: "Senha incorreta"
  - sem ativação em 30s: "Não foi possível conectar"
- **Conectar**: cria o perfil com a PSK (`key-mgmt` `sae` para WPA3, senão `wpa-psk`) e ativa (`add_and_activate_connection`); o painel fecha e a rede mostra "Conectando…". Perfis criados pela ilha (inclusive de rede aberta) são só do usuário (`permissions=user:<nome>`), o que não pede senha de admin; o Shell faz o mesmo quando o polkit nega `settings.modify.system`. Em falha (senha errada ou 30s), o perfil é apagado.
- **Senha errada**: o pedido de novo segredo que o NM faz para essa conexão é interceptado (o diálogo nativo do Shell não aparece), o perfil recém-criado é apagado e o painel reabre com "Senha incorreta". A interceptação é uma injeção (`InjectionManager`) em `_showNotification`/`_handleRequest` do protótipo do agente de rede do Shell (`js/ui/components/networkAgent.js`), filtrando pelo UUID do perfil criado pela ilha e respondendo `USER_CANCELED` (com `INTERNAL_ERROR` o NM repassa o pedido pra outro agente).

## Modo `bt` (520×348, desligado 300)

Linha de controles · linha de energia (opcional) · divisor · seção (padding 0 12px):

- **Cabeçalho** 26px: `ph-bold ph-bluetooth` 14px, "Bluetooth" 13px/500, status ("2 conectados" / "1 conectado" / "0 conectados" / "Desligado") e switch (mesmo estilo do Wi‑Fi) que liga/desliga o rádio.
- Fonte: `GnomeBluetooth.Client`, o mesmo que o Shell usa.
- **Meus dispositivos** (pareados, conectados primeiro) e **Disponíveis** (não pareados e com nome anunciado, com `ph ph-circle-notch` 11px girando 1.2s; sem nome, a busca só teria o endereço e o dispositivo não aparece): rótulos 10.5px maiúsculos, `letter-spacing .06em`, `neutral-500`.
- A busca (discovery) roda **só enquanto `bt` está aberto**: `client.default_adapter_setup_mode = true` ao abrir, `false` ao fechar.
- Linha 38px raio 10, padding 0 8px, gap 10px: ícone `ph-fill` 17px (`accent` se conectado, senão `neutral-300`) · nome 12.5px · bateria (`ph-fill ph-battery-medium` 13px + `72%` 11px `neutral-400`, só conectado e com nível em porcentagem; o nível aproximado do `battery_type` `COARSE` não aparece) · status 11px à direita. Conectado com fundo `accent-900`. Alturas fixas; listas longas rolam.
- Ícone pelo tipo do dispositivo: fone/headset → `ph-headphones`, mouse → `ph-mouse`, teclado → `ph-keyboard`, caixa de som → `ph-speaker-hifi`, celular → `ph-device-mobile`, computador → `ph-laptop`, controle → `ph-game-controller`, outro → `ph-bluetooth`.

| Dispositivo | Status | Clique |
|---|---|---|
| pareado conectado | "Conectado" `accent-300` | desconecta ("Desconectando…") |
| pareado desconectado | "Desconectado" `neutral-500` | conecta ("Conectando…") |
| não pareado | "Parear" `accent-300` | pareia e conecta ("Pareando…"); se o dispositivo pedir PIN/código, abre Configurações → Bluetooth (`gnome-control-center bluetooth`) |

Só uma operação por vez; cliques durante uma operação são ignorados.

**Parear** (sem agente BlueZ registrado; o `GnomeBluetooth.Client` não tem método de parear):

1. `Pair()` no `org.bluez.Device1` do dispositivo, pelo `device.proxy`.
2. Sucesso: `Trusted = true` pelo `org.freedesktop.DBus.Properties.Set` e depois `client.connect_service(path, true)`.
3. Erro `org.bluez.Error.AuthenticationFailed`, `AuthenticationRejected` ou `AuthenticationCanceled`: o dispositivo pediu PIN/código → abre Configurações → Bluetooth. Não testado com dispositivo real.
4. Sem resposta em 30s: `CancelPairing()` e a linha volta a "Parear". Com o dispositivo fora do modo de pareamento, o `Pair()` não falha, fica pendente.
5. Qualquer outro erro: a linha volta a "Parear".

Pareamento "Just Works" (fone) sem agente: validado no GNOME 50.4 / BlueZ 5.87 / gnome-bluetooth 47.2, pareia e conecta em ~3s.

- **Rádio desligado**: área de 190px com `ph ph-bluetooth-slash` 22px + "Bluetooth desligado".

## Critérios de aceite

- [x] Arrastar os sliders de brilho/volume em `quick` muda o sistema em tempo real, e o valor volta certo após reabrir.
- [x] Tecla de volume com a ilha compacta abre `volume`; com `quick` aberto só move o slider; o OSD nativo nunca aparece.
- [x] Tiles de modo noturno e não perturbe refletem mudanças feitas pelo app Configurações.
- [x] Conectar numa rede WPA2 nova pela ilha funciona sem abrir diálogo nativo; senha errada mostra "Senha incorreta" inline.
- [x] Senha de 7 caracteres mostra o erro local sem tentativa de conexão.
- [x] Rede 802.1X abre Configurações → Wi‑Fi.
- [x] Parear um mouse Bluetooth sem PIN pela ilha funciona; a busca para ao fechar `bt`.
