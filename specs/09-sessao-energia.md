# 09 · Configurações e energia

Origem: `design/markup.html` botões e linha de energia em `quick` (repetidos em `bt` e `wifi`); `design/logic.js` `openSettings`, `openPower`, `powerActions`, `powerBg`/`powerFg`.

Código: `plugin/ui/ControlsRow.qml`, `PowerRow.qml`, `plugin/system/SessionActions.qml`.

## Botões na linha de controles

Depois do divisor, na linha de controles de `quick`, `wifi` e `bt`:

- **Configurações**: 38×38 raio 19, `neutral-800`, `ph ph-gear-six` 17px `neutral-300`; hover `neutral-700` / `text`; pressionado `accent-800`. Fecha a ilha e abre o menu Setup do Omarchy (`omarchy menu summon setup`).
- **Energia**: mesmas medidas, `ph-bold ph-power` 17px. Fechado: `neutral-800` / `neutral-300`. Aberto: `#932b2a` / `neutral-100`. Clique alterna a linha de energia.

## Linha de energia

- Aparece abaixo da linha de controles. Em `quick` a ilha vai de 58 a 106px; em `wifi`/`bt` soma 48px.
- A linha fica num contêiner que corta o conteúdo e cuja altura anima 0 ↔ 48 na mola da spec 03, junto com a ilha. Em `wifi`/`bt` a lista abaixo desliza os 48px na mesma mola (o design pula de uma vez), e a linha é revelada de cima pra baixo ao abrir e coberta ao fechar.
- 5 botões `flex: 1`, 36px, raio 12, `neutral-900`, hover `neutral-800`, 12px, ícone 14px, gap 6px:

  | Botão | Ícone | Ação |
  |---|---|---|
  | Suspender | `ph ph-moon-stars` | `systemctl suspend` |
  | Reiniciar | `ph ph-arrow-clockwise` | `omarchy-system-reboot` |
  | Desligar (texto `#ff958d`) | `ph-bold ph-power` | `omarchy-system-shutdown` |
  | Sair | `ph ph-sign-out` | `omarchy-system-logout` |
  | Bloquear | `ph ph-lock-simple` | `omarchy-system-lock` |

- Qualquer ação fecha a ilha antes de executar.
- O Omarchy não tem o diálogo de encerramento do GNOME: Reiniciar, Desligar e Sair fecham as janelas e agem em ~2s, como no menu de sistema do Omarchy. O OSD "Shutting down"/"Rebooting"/"Logging out" que os scripts mandam aparece na ilha (modo `osd`, spec 08).
- Trocar de modo, Esc ou clique fora fecham a linha de energia.

## Fonte

Os mesmos comandos do menu de sistema do Omarchy (`default/omarchy/omarchy-menu.jsonc`, entradas `system.*`). Suspender some quando o Omarchy o desligou (`omarchy-toggle-enabled suspend-off`), igual ao `when` do menu.

## Critérios de aceite

- [ ] Configurações abre o menu Setup do Omarchy e fecha a ilha.
- [ ] Energia alterna a linha, com a altura animando 58 ↔ 106 em `quick`.
- [ ] Cada botão roda o comando da tabela; Suspender some com `suspend-off` ligado.
