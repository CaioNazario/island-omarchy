# 03 · Ilha

Origem: `design/logic.js` `SIZES`/`TRANSIENT`, `setMode`/`arm`/`closeAll`, `onKey`, `renderVals`, `islandClick`/`islandEnter`/`islandLeave`, `musicPin`; `design/markup.html` camadas `L.<modo>` dentro da ilha.

A máquina de estados vive em `src/core/island.ts` (pura, testada). A UI só renderiza o estado.

## Modos e tamanhos

| Modo | L × A (px) | Raio | Tipo | Spec |
|---|---|---|---|---|
| `compact` | 240 × 26 | 13 | — | abaixo |
| `notif` | 400 × 48 | 24 | transitório 2500ms (navegador 2100ms) | 04 |
| `stack` | 400 × (56 + min(6, n)·52), vazia 56 + 72 | 24 | fixo | 04 |
| `music` | 500 × 58 | 29 | transitório 2500ms; fixo quando aberto pelo widget Música | 05, 16 |
| `volume` | 320 × 36 | 18 | transitório 1500ms | 08 |
| `brightness` | 320 × 36 | 18 | transitório 1500ms | 08 |
| `calendar` | 480 × 150 (semana) / 214 (mês) | 24 | fixo | 06 |
| `quick` | 660 × 46, com linha de energia 94 | 23 | fixo | 08, 09 |
| `wifi` | 660 × `wifiPanelHeight` (vista, DNS, redes conhecidas e outras; +48 energia, +58/+76 senha, +38 DNS personalizado) | 24 | fixo | 08 |
| `bt` | 660 × 336 (BT ligado) / 288 (desligado), +48 energia | 24 | fixo | 08 |
| `ai` | 480 × `aiPanelHeight` (abas, cartão do provedor escolhido, tokens) | 24 | fixo | 12 |
| `env` | 260 × 32 | 16 | transitório 1500ms | 15 |
| `note` | 420 × 132 | 24 | fixo | 16 |
| `osd` | 320 × 36 | 18 | transitório 1500ms ou a duração do pedido | 08 |
| `mixer` | 440 × altura do conteúdo (`mixerHeight`), até 560 | 24 | fixo | 08 |
| `display` | 440 × 277, sem backlight 212 | 24 | fixo | 08 |
| `battery` | 440 × 225, sem perfis de energia 142 | 24 | fixo | 11 |

Os tempos dos transitórios são mais curtos que o `TRANSIENT` do design (4200/4500/2600ms) por decisão do usuário. O `env` segue o design (1500ms).

O cartão central (spec 05) também é um estado da ilha: 440 × altura do conteúdo, raio 26 (`SIZES.hub`).

`brightness` não existe no design: é um clone de `volume` com ícone `ph ph-sun` e o valor do brilho. `osd` também não: é o mesmo layout para os demais pedidos de OSD do Omarchy (spec 08).

## Modo compacto

240×26, conteúdo centralizado, gap 10px, 13px/500 (a hora em 600):

`[clima] · [hora] · [dia]`

- Clima: `ph-fill` da condição 15px `accent-300` + temperatura `neutral-300` (gap 4px). Spec 07; sem clima, o item e seu separador somem.
- Separador: ponto 3×3 `neutral-600`.
- Hora: `HH:MM` 24h, locale pt-BR.
- Dia: dia da semana abreviado sem ponto, capitalizado, + dia do mês (`Sex, 25`).

## Animação

- Largura e altura: 460ms na mola `cubic-bezier(.3,1.2,.4,1)` (spec 01), em toda mudança de tamanho: troca de modo, voltar a `compact`, linha de energia, senha do `wifi`, rádio do `bt`. Raio: 460ms ease. O raio desenhado é `min(raio da tabela + 10, altura / 2)` (`displayRadius` em `src/core/island.ts`, `islandR` do design v5); as camadas de cada modo continuam medidas pela tabela.
- Cada modo é uma camada própria, centrada no topo da ilha, com o tamanho do seu modo. Troca de modo = crossfade: a camada que entra vai a opacidade 1 em 220ms com atraso de 80ms e escala 0.94→1 (300ms); a que sai faz o inverso. A camada `notif` entra de `translateY(-18px) scale(.96)`.
- Entre `quick`, `wifi` e `bt`, em qualquer direção, a troca de camada é instantânea, sem fade nem escala: os três repetem a fileira de tiles no topo e só a ilha anima a altura. Abrir `wifi`/`bt` direto da barra (vindo de `compact` ou outro modo) usa o crossfade normal.
- Linha de acento: 36×2 no topo central, `accent`, raio inferior 2px; opacidade 1 quando a ilha não está em `compact` ou o cartão central está aberto (300ms).
- Superfície e sombras: spec 01 "Superfícies". Compacta, a ilha usa o `SOFT_OUT` das pílulas; expandida, a sombra escura e o brilho maior do `accent`. O `RectangularShadow` acompanha o raio.
- Cursor de mão só em `compact` e `notif`.

## Regras de transição

1. **Abrir por gatilho do usuário** (clique na barra ou num widget, `Super+S`): substitui qualquer modo e fecha cartão central, linha de energia e painel de senha.
2. Clicar no gatilho do modo já aberto fecha a ilha.
3. **Eventos automáticos nunca substituem modo fixo nem cartão aberto**:
   - notificação: regras da spec 04
   - troca de faixa: abre `music` só se a ilha estiver em `compact` ou num modo transitório; com `music` fixado aberto, só atualiza o conteúdo
   - troca de ambiente: abre `env` só se a ilha estiver em `compact` ou em `env` (spec 15)
4. **Tecla de volume/brilho** e demais pedidos de OSD: abrem `volume`/`brightness`/`osd` se a ilha estiver em `compact` ou num modo transitório. Com modo fixo aberto, só altera o valor (os sliders de `quick`/`wifi`/`bt` refletem na hora); um `osd` recusado não aparece.
5. **Clique na ilha**: em `compact` executa a opção "Clique na ilha abre" (spec 13: cartão central, padrão, ou modo `calendar`), igual em todos os ambientes (o design v3 condiciona ao ambiente; a Island não); em `notif` abre `stack` e marca tudo como lido; em `env` não faz nada; nos outros modos, cliques são do conteúdo.
6. **Timer transitório**: armado ao entrar no modo; ao vencer, volta a `compact` só se o modo ainda for o mesmo. `music` fixado não arma timer.
7. **Hover** na ilha cancela o timer; sair do hover rearma o timer do modo atual.
8. Interagir com um slider cancela o timer durante o arraste e rearma ao soltar.
9. **Esc** fecha tudo (modo, cartão, linha de energia), exceto quando o campo de senha de Wi‑Fi tem foco: aí Esc só fecha o painel de senha. No modo `note`, Esc (e Enter) grava e fecha.

## Foco de teclado

Modos fixos (inclusive `note` e `music` fixado) e o cartão central tomam o foco de teclado enquanto abertos: a camada do monitor-alvo passa a `WlrKeyboardFocus.Exclusive` (spec 02). É isso que permite Esc, setas nos sliders, digitar a senha de Wi‑Fi e a nota. Ao fechar, volta a `None`. Modos transitórios não tomam foco.

## Atalho `Super+S`

- Alterna `quick`: de qualquer modo vai para `quick`; de `quick` volta a `compact`.
- A Island expõe o alvo IPC `island` com `toggleQuick` (`Service.qml`). O atalho é do Hyprland: `hl.unbind("SUPER + S")` seguido de `o.bind("SUPER + S", "Island: controles", "omarchy-shell island toggleQuick")`, sem `repeating` (segurar a tecla não repete). No Omarchy 4.0.4 o `Super+S` é o scratchpad (`default/hypr/bindings/tiling.lua`); o `unbind` tira esse bind para a Island ficar com a tecla.
- Atalhos e gestos da Island são padrão do projeto: ficam em `hypr/island.lua`. O `install.sh` copia esse arquivo para `~/.config/hypr/island.lua` e acrescenta `require("hypr.island")` no fim do `~/.config/hypr/hyprland.lua` (uma vez, com backup `.bak.<epoch>`), depois `hyprctl reload`. O `--uninstall` tira a linha e o arquivo. O resto da config do usuário não é editado, e os mesmos binds não devem ficar repetidos no `bindings.lua`: o Hyprland rodaria os dois (o `toggleQuick` abriria e fecharia).

## Critérios de aceite

- [x] `src/core/island.ts` tem teste para cada regra de transição acima, incluindo timers com relógio falso.
- [ ] Cada modo abre com as medidas da tabela (±1px).
- [ ] Uma notificação chegando com `wifi` aberto não altera a ilha (vira banner, spec 04).
- [ ] Trocar de faixa com `calendar` aberto não abre `music`.
- [ ] Segurar `Super+S` não faz a ilha piscar.
- [ ] Com o mouse sobre a ilha em `notif`, ela não fecha; ao sair, fecha 2500ms depois.
- [ ] Esc com o campo de senha focado fecha só o painel de senha; um segundo Esc fecha a ilha.
- [x] Testes de `island.ts` para `env` (só abre de `compact`/`env`, rearma), `note` como modo fixo e `music` fixado (sem timer, troca de faixa não fecha).
- [ ] `env`, `note` e o cartão central (440) abrem com as medidas da tabela (±1px).
