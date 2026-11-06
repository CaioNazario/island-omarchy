# 09 · Configurações e energia

Origem: `design/markup.html` botões e linha de energia em `quick` (repetidos em `bt` e `wifi`); `design/logic.js` `openSettings`, `openPower`, `powerActions`, `powerBg`/`powerFg`.

Código: `plugin/ui/ControlsRow.qml`, `PowerRow.qml`, `plugin/system/SessionActions.qml`.

## Botões na linha de controles

Depois do divisor, na linha de controles de `quick`, `wifi` e `bt`:

- **Configurações**: 32×32 raio 16, `neutral-800`, `ph ph-gear-six` 15px `neutral-300`; hover `neutral-700` / `text`; pressionado `accent-800`. Fecha a ilha e abre o menu Setup do Omarchy (`omarchy menu summon setup`).
- **Energia**: mesmas medidas, `ph-bold ph-power` 15px. Fechado: `neutral-800` / `neutral-300`. Aberto: `#932b2a` / `neutral-100`. Clique alterna a linha de energia.

## Linha de energia

- Aparece abaixo da linha de controles. Em `quick` a ilha vai de 46 a 94px; em `wifi`/`bt` soma 48px. A linha tem padding 0 7px, alinhada à linha de controles.
- A linha fica num contêiner que corta o conteúdo e cuja altura anima 0 ↔ 48 na mola da spec 03, junto com a ilha. Em `wifi`/`bt` a lista abaixo desliza os 48px na mesma mola (o design pula de uma vez), e a linha é revelada de cima pra baixo ao abrir e coberta ao fechar.
- 5 botões `flex: 1`, 36px, raio 12, `neutral-900`, hover `neutral-800`, 12px, ícone 14px, gap 6px:

  | Botão | Ícone | Ação |
  |---|---|---|
  | Suspender | `ph ph-moon-stars` | `systemctl suspend` |
  | Reiniciar | `ph ph-arrow-clockwise` | `omarchy-system reboot` |
  | Desligar (texto `#ff958d`) | `ph-bold ph-power` | `omarchy-system shutdown` |
  | Sair | `ph ph-sign-out` | `omarchy-system logout` |
  | Bloquear | `ph ph-lock-simple` | `omarchy-system-lock` |

- Qualquer ação fecha a ilha antes de executar.
- Suspender e Bloquear rodam na hora. Reiniciar, Desligar e Sair pedem confirmação (abaixo); confirmados, fecham as janelas e agem em ~2s, como no menu de sistema do Omarchy. O OSD "Shutting down"/"Rebooting"/"Logging out" que os scripts mandam aparece na ilha (modo `osd`, spec 08).
- Trocar de modo, Esc ou clique fora fecham a linha de energia.

## Confirmação

Como o diálogo do GNOME: antes de reiniciar, desligar ou sair, a Island pergunta, e se ninguém responder a ação roda sozinha em 60s (`CONFIRM_SECONDS`, `src/core/powerConfirm.ts`).

- O clique troca os 5 botões, dentro dos mesmos 48px (a ilha não muda de altura), por: ícone de energia `#ff958d` + texto da contagem ("Shutting down in 60s", "Restarting in 60s", "Logging out in 60s"), **Cancelar** (`neutral-900`, hover `neutral-800`) e o botão da ação (texto `#ff958d`, fundo `#932b2a`), 36px de raio 12, ambos com largura do texto + 28px.
- A contagem segue o relógio (`Date.now()`), não tiques contados: um tique atrasado não alonga a espera. O texto atualiza a cada segundo e mostra 0 só no instante em que a ação roda.
- Confirmar (botão) ou chegar a 0 fecha a ilha e roda a ação, como qualquer outra.
- **Cancelar**, Esc, clique fora ou troca de modo fecham a linha de energia e **cancelam**: a contagem não pode seguir correndo escondida, com a tela sem aviso de que a máquina vai desligar. Cancelar pelo botão volta aos cinco botões, com a linha aberta.
- Recarregar o plugin (hot-reload) também cancela, porque a contagem vive na árvore da barra.

## Fonte

Os mesmos comandos do menu de sistema do Omarchy (`default/omarchy/omarchy-menu.jsonc`, entradas `system.*`; no Omarchy 4.5 reiniciar, desligar e sair são `omarchy-system <ação>`, os `omarchy-system-reboot|shutdown|logout` antigos não existem mais, #40). Suspender some quando o Omarchy o desligou (`omarchy-toggle-enabled suspend-off`), igual ao `when` do menu.

## Critérios de aceite

- [ ] Configurações abre o menu Setup do Omarchy e fecha a ilha.
- [ ] Energia alterna a linha, com a altura animando 46 ↔ 94 em `quick`.
- [ ] Cada botão roda o comando da tabela; Suspender some com `suspend-off` ligado.
- [ ] Reiniciar, Desligar e Sair não rodam no clique: mostram a confirmação com 60s; Suspender e Bloquear rodam na hora.
- [ ] Sem resposta, a ação roda em 60s; o botão da ação roda na hora.
- [ ] Cancelar, Esc, clique fora e troca de modo cancelam, sem a ação rodar depois.
