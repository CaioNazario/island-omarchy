# 09 · Configurações e energia

Origem: `design/markup.html` 147–157 (botões e linha de energia em `quick`; repetidos em `bt` e `wifi`); `design/logic.js` `openSettings`, `openPower`, `powerActions`, `powerBg`/`powerFg` (~350–361).

## Botões na linha de controles

Depois do divisor, na linha de controles de `quick`, `wifi` e `bt`:

- **Configurações**: 38×38 raio 19, `neutral-800`, `ph ph-gear-six` 17px `neutral-300`; hover `neutral-700` / `text`; pressionado `accent-800`. Fecha a ilha e abre o app Configurações do GNOME (`gnome-control-center`).
- **Energia**: mesmas medidas, `ph-bold ph-power` 17px. Fechado: `neutral-800` / `neutral-300`. Aberto: `#932b2a` / `neutral-100`. Clique alterna a linha de energia.

## Linha de energia

- Aparece abaixo da linha de controles. Em `quick` a ilha vai de 58 a 106px; em `wifi`/`bt` soma 48px.
- A linha ocupa o espaço na hora e a altura da ilha anima na mola da spec 03; em `quick` a ilha corta a linha enquanto cresce. Em `wifi`/`bt` a lista abaixo desliza os 48px na mesma mola (o design pula de uma vez), e a linha só aparece acima do topo da lista, revelada de cima pra baixo ao abrir e coberta ao fechar.
- 5 botões `flex: 1`, 36px, raio 12, `neutral-900`, hover `neutral-800`, 12px, ícone 14px, gap 6px:

  | Botão | Ícone | Ação |
  |---|---|---|
  | Suspender | `ph ph-moon-stars` | suspende direto |
  | Reiniciar | `ph ph-arrow-clockwise` | diálogo nativo de reinício |
  | Desligar (texto `#ff958d`) | `ph-bold ph-power` | diálogo nativo de desligamento |
  | Sair | `ph ph-sign-out` | diálogo nativo de encerrar sessão |
  | Bloquear | `ph ph-lock-simple` | bloqueia direto |

- Qualquer ação fecha a ilha antes de executar.
- "Diálogo nativo" = o mesmo `EndSessionDialog` do GNOME: contagem regressiva, aviso de apps com trabalho não salvo, e o usuário pode cancelar.
- Trocar de modo, Esc ou clique fora fecham a linha de energia.

## Fonte

Mesmas chamadas que o menu de sistema nativo do Shell usa (`SystemActions` na 50.x, confirmado no código-fonte). Ação indisponível (ex.: suspender bloqueado por política) → o botão some.

## Critérios de aceite

- [x] Configurações abre o `gnome-control-center` e fecha a ilha.
- [x] Energia alterna a linha, com a altura animando 58 ↔ 106 em `quick`.
- [x] Desligar, Reiniciar e Sair abrem o diálogo nativo e dá pra cancelar; Suspender e Bloquear agem direto.
- [x] Com um documento não salvo aberto, Desligar mostra o aviso do app no diálogo.
