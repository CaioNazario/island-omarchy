# 03 · Ilha

Origem: `design/logic.js` `SIZES`/`TRANSIENT`, `setMode`/`arm`/`closeAll`, `onKey`, `renderVals`, `islandClick`/`islandEnter`/`islandLeave`, `musicPin`; `design/markup.html` camadas `L.<modo>` dentro da ilha.

A máquina de estados vive em `src/core/island.ts` (pura, testada). A UI só renderiza o estado.

## Modos e tamanhos

| Modo | L × A (px) | Raio | Tipo | Spec |
|---|---|---|---|---|
| `compact` | 240 × 30 | 15 | — | abaixo |
| `notif` | 400 × 62 | 22 | transitório 2500ms (navegador 2100ms) | 04 |
| `stack` | 400 × (56 + min(6, n)·52), vazia 56 + 72 | 24 | fixo | 04 |
| `music` | 500 × 82 | 26 | transitório 2500ms; fixo quando aberto pelo widget Música | 05, 16 |
| `volume` | 320 × 50 | 25 | transitório 1500ms | 08 |
| `brightness` | 320 × 50 | 25 | transitório 1500ms | 08 |
| `calendar` | 480 × 150 (semana) / 214 (mês) | 24 | fixo | 06 |
| `quick` | 520 × 58, com linha de energia 106 | 29 | fixo | 08, 09 |
| `wifi` | 520 × 292 (+48 energia, +58 senha, +76 senha com erro) | 26 | fixo | 08 |
| `bt` | 520 × 348 (BT ligado) / 300 (desligado), +48 energia | 26 | fixo | 08 |
| `ai` | 480 × (24 + 32 + p·108 − 6), p = provedores | 24 | fixo | 12 |
| `env` | 260 × 40 | 20 | transitório 1500ms | 15 |
| `note` | 420 × 132 | 24 | fixo | 16 |

Os tempos dos transitórios são mais curtos que o `TRANSIENT` do design (4200/4500/2600ms) por decisão do usuário. O `env` segue o design (1500ms).

O cartão central (spec 05) também é um estado da ilha: 440 × altura do conteúdo, raio 26 (`SIZES.hub`).

`brightness` não existe no design: é um clone de `volume` com ícone `ph ph-sun` e o valor do brilho.

## Modo compacto

240×30, conteúdo centralizado, gap 10px, 13px/500:

`[clima] · [hora] · [dia]`

- Clima: `ph-fill` da condição 15px `accent-300` + temperatura `neutral-300` (gap 4px). Spec 07; sem clima, o item e seu separador somem.
- Separador: ponto 3×3 `neutral-600`.
- Hora: `HH:MM` 24h, locale pt-BR.
- Dia: dia da semana abreviado sem ponto, capitalizado, + dia do mês (`Sex, 25`).

## Animação

- Largura e altura: 460ms na mola `cubic-bezier(.3,1.2,.4,1)` (spec 01), em toda mudança de tamanho: troca de modo, voltar a `compact`, linha de energia, senha do `wifi`, rádio do `bt`. Raio: 460ms ease.
- Cada modo é uma camada própria, centrada no topo da ilha, com o tamanho do seu modo. Troca de modo = crossfade: a camada que entra vai a opacidade 1 em 220ms com atraso de 80ms e escala 0.94→1 (300ms); a que sai faz o inverso. A camada `notif` entra de `translateY(-18px) scale(.96)`.
- Entre `quick`, `wifi` e `bt`, em qualquer direção, a troca de camada é instantânea, sem fade nem escala: os três repetem a fileira de tiles no topo e só a ilha anima a altura. Abrir `wifi`/`bt` direto da barra (vindo de `compact` ou outro modo) usa o crossfade normal.
- Linha de acento: 36×2 no topo central, `accent`, raio inferior 2px; opacidade 1 quando a ilha não está em `compact` ou o cartão central está aberto (300ms).
- Contorno: só o anel 1px `neutral-800` (`border` da superfície), expandida ou compacta. A sombra escura e o brilho `accent` do design saíram de propósito: no Shell eles aparecem como um halo quadrado em volta da ilha.
- Cursor de mão só em `compact` e `notif`.

## Regras de transição

1. **Abrir por gatilho do usuário** (clique na barra ou num widget, `Super+S`): substitui qualquer modo e fecha cartão central, linha de energia e painel de senha.
2. Clicar no gatilho do modo já aberto fecha a ilha.
3. **Eventos automáticos nunca substituem modo fixo nem cartão aberto**:
   - notificação: regras da spec 04
   - troca de faixa: abre `music` só se a ilha estiver em `compact` ou num modo transitório; com `music` fixado aberto, só atualiza o conteúdo
   - troca de ambiente: abre `env` só se a ilha estiver em `compact` ou em `env` (spec 15)
4. **Tecla de volume/brilho**: abre `volume`/`brightness` se a ilha estiver em `compact` ou num modo transitório. Com modo fixo aberto, só altera o valor (os sliders de `quick`/`wifi`/`bt` refletem na hora).
5. **Clique na ilha**: em `compact` executa a opção "Clique na ilha abre" (spec 13: cartão central, padrão, ou modo `calendar`), igual em todos os ambientes (o design v3 condiciona ao ambiente; a Island não); em `notif` abre `stack` e marca tudo como lido; em `env` não faz nada; nos outros modos, cliques são do conteúdo.
6. **Timer transitório**: armado ao entrar no modo; ao vencer, volta a `compact` só se o modo ainda for o mesmo. `music` fixado não arma timer.
7. **Hover** na ilha cancela o timer; sair do hover rearma o timer do modo atual.
8. Interagir com um slider cancela o timer durante o arraste e rearma ao soltar.
9. **Esc** fecha tudo (modo, cartão, linha de energia), exceto quando o campo de senha de Wi‑Fi tem foco: aí Esc só fecha o painel de senha. No modo `note`, Esc (e Enter) grava e fecha.

## Foco de teclado

Modos fixos (inclusive `note` e `music` fixado) e o cartão central tomam o foco de teclado (grab modal, como os menus do Shell) enquanto abertos. É isso que permite Esc, setas nos sliders, digitar a senha de Wi‑Fi e a nota. O grab é liberado ao fechar e no `disable()`. Modos transitórios não tomam foco.

## Atalho `Super+S`

- Alterna `quick`: de qualquer modo vai para `quick`; de `quick` volta a `compact`.
- Ignora repetição ao segurar a tecla.
- A Island assume o atalho `toggle-quick-settings` do Shell no `enable()` (o painel nativo está escondido) e devolve o comportamento original no `disable()`.

## Critérios de aceite

- [x] `src/core/island.ts` tem teste para cada regra de transição acima, incluindo timers com relógio falso.
- [x] Cada modo abre com as medidas da tabela (±1px).
- [x] Uma notificação chegando com `wifi` aberto não altera a ilha (vira banner, spec 04).
- [x] Trocar de faixa com `calendar` aberto não abre `music`.
- [x] Segurar `Super+S` não faz a ilha piscar.
- [x] Com o mouse sobre a ilha em `notif`, ela não fecha; ao sair, fecha 2500ms depois.
- [x] Esc com o campo de senha focado fecha só o painel de senha; um segundo Esc fecha a ilha.
- [x] Testes de `island.ts` para `env` (só abre de `compact`/`env`, rearma), `note` como modo fixo e `music` fixado (sem timer, troca de faixa não fecha).
- [x] `env`, `note` e o cartão central (440) abrem com as medidas da tabela (±1px).
