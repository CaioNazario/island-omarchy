# 06 · Calendário

Origem: `design/logic.js` `calendar(off)`, `calWeeks`, `toggleCal`, `prevMonth`/`nextMonth`, `dows`, `events`; `design/markup.html` camadas `L.calendar` e `L.hub` (seção do cartão central).

## Grade

Regra pura em `src/core/calendar.ts`:
- Semana começa na **segunda**: cabeçalho `Seg Ter Qua Qui Sex Sáb Dom`.
- Mês completo em semanas inteiras (inclui dias do mês anterior/seguinte).
- Título `Mês Ano` em pt-BR, capitalizado, sem "de" (`Setembro 2026`).
- **Semana**: só a linha que contém hoje (no mês atual) ou a primeira linha (em outro mês).
- Botão alterna **Mês** (`ph ph-caret-down`) ↔ **Semana** (`ph ph-caret-up`). Abre sempre em Semana.
- `‹` `›` navegam meses; reabrir a ilha/cartão volta ao mês atual.
- Dia: hoje com fundo `accent-600`, texto `neutral-100`, peso 600; dia do mês `text`; fora do mês `neutral-700`.

## Eventos

- Fonte: `CalendarServer` do Shell (Evolution Data Server, ou seja, contas online do GNOME), a mesma que o menu de data nativo usa.
- Mostra os eventos de **hoje** em ordem de início, no máximo 10: ponto 8px colorido + nome + intervalo `HH:MM – HH:MM` (dia inteiro: "Dia inteiro").
- Cor do ponto: da paleta da ilha, não a do calendário de origem. Cada calendário ganha `accent-500`, `accent-300`, `neutral-400` em rotação, na ordem em que aparece na lista.
- Sem eventos: a coluna de eventos mostra só o título "Hoje, …".
- Clicar em evento não faz nada na v1.

## Modo `calendar` (ilha, 480 × 150/214)

Aberto quando "Clique na ilha abre" = **Calendário compacto**, ou pelo clique no widget Próximo evento (spec 16), com qualquer opção.
- Padding 14px 16px, gap 16px, duas colunas separadas por divisor vertical em gradiente.
- Esquerda (264px): título 13px/500 + botão Mês/Semana (22px, raio 11, `neutral-900`, 11px) + `‹` `›` 22×22; cabeçalho de dias 10.5px `neutral-500`; células 22px de altura, número 12px em pílula 24×20 raio 10.
- Direita: "Hoje, sex, 25" 13px/500 (dia da semana minúsculo, como no design) e eventos (nome 12px, horário 10.5px `neutral-500`), gap 12px, sem quebra de linha; o que não cabe rola (barra sobreposta, como no `stack`).
- Altura 150 em Semana, 214 em Mês.

## Seção no cartão central

- Cabeçalho: `ph ph-calendar-blank` 16px `neutral-300` + "Calendário" 14px/500 + botão Mês/Semana (24px, raio 12).
- Linha do mês: título 13px + `‹` `›` 26×26.
- Dias 11px `neutral-500`; células 26px de altura, número 12.5px em pílula 26×22 raio 11.
- Eventos (margin-top 12px, gap 9px): ponto 8px + nome 12.5px + horário 11px `neutral-500` à direita.

## Critérios de aceite

- [x] Testes de `calendar.ts`: meses começando em cada dia da semana, fevereiro bissexto, semana de hoje, navegação entre anos.
- [x] Evento criado no GNOME Calendar aparece na lista de hoje sem reiniciar a extensão.
- [x] Alternar Mês/Semana no modo `calendar` anima a altura 150 ↔ 214.
