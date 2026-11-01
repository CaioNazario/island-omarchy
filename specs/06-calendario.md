# 06 · Calendário

Origem: `design/logic.js` `calendar(off)`, `calWeeks`, `toggleCal`, `prevMonth`/`nextMonth`, `dows`, `events`; `design/markup.html` camadas `L.calendar` e `L.hub` (seção do cartão central).

## Grade

Regra pura em `src/core/calendar.ts`:
- Semana começa na **segunda**: cabeçalho `Seg Ter Qua Qui Sex Sáb Dom`.
- Mês completo em semanas inteiras (inclui dias do mês anterior/seguinte).
- Título `Mês Ano` no idioma da interface, capitalizado, sem "de" (`September 2026`, `Setembro 2026`; spec 13 "Idioma").
- **Semana**: só a linha que contém hoje (no mês atual) ou a primeira linha (em outro mês).
- Botão alterna **Mês** (`ph ph-caret-down`) ↔ **Semana** (`ph ph-caret-up`). Abre sempre em Semana.
- `‹` `›` navegam meses; reabrir a ilha/cartão volta ao mês atual.
- Dia: hoje com fundo `accent-600`, texto `neutral-100`, peso 600; dia do mês `text`; fora do mês `neutral-700`.

## Eventos

- Fonte: feed ICS privado (spec 14, S8), por exemplo o "Endereço secreto no formato iCal" do Google Calendar. `plugin/system/CalendarEvents.qml` lê a URL do chaveiro (`secret-tool lookup service island kind calendar-ics`, 5s de limite para um chaveiro bloqueado), baixa o feed por `curl -K -` e atualiza a cada 15 min; a lista de hoje é recalculada na virada do dia, sem novo download. Sem URL no chaveiro, sem `secret-tool` ou sem rede, a lista é vazia (ou a última baixada) e a UI mostra só o título.
- A URL é credencial (AGENTS.md "Segredos"): só em memória, entregue ao `curl` pela entrada padrão, nunca na linha de comando, em log, em arquivo de configuração ou em teste. Só `https://` (`webcal://` vira `https://`). Resposta que não é `VCALENDAR` (página de login, URL trocada) não apaga os eventos e faz a próxima atualização reler o chaveiro.
- Parser em `src/core/ics*.ts` (puro, sem `Intl`): fusos pelo `VTIMEZONE` do próprio feed (`TZID` sem `VTIMEZONE` vale como horário local), dia inteiro e flutuante no horário local, `RRULE` (DAILY/WEEKLY/MONTHLY/YEARLY com INTERVAL, COUNT, UNTIL, BYDAY com ordinal, BYMONTHDAY, BYMONTH; semana começa na segunda), `EXDATE`, `RECURRENCE-ID` (editada ou `CANCELLED`) e `STATUS:CANCELLED`. Não suporta `RDATE`, `BYSETPOS`, `BYWEEKNO`, `BYYEARDAY`, `WKST` nem frequência abaixo de dia: uma regra assim deixa o evento só na data de início.
  - O feed é de terceiros e a expansão roda na thread da UI (revisão do marketplace, #13501). Uma lista `BYDAY`, `BYMONTHDAY` ou `BYMONTH` com valor impossível (ordinal fora de ±1…5, que conta dentro do mês; dia fora de ±1…31; mês fora de 1…12; zero) invalida a regra, e o evento fica só na data de início. Valores repetidos entram uma vez só. A varredura para no primeiro período que começa depois do fim da janela (ou do UNTIL), mesmo que nenhum período gere data. Medido no Node: 200 eventos com regras que nunca casam levavam ~476 s; agora ~150 ms. A janela é ontem a amanhã e `icsPrefilter.ts` descarta antes do parse os `VEVENT` que certamente estão fora dela: no V4 um feed de 1,4 MB (3000 eventos + 60 séries) leva ~55 ms; sem o filtro levava ~1 s na thread da UI.
- O calendário de origem é identificado por `X-WR-CALNAME` (ou `ics`); um feed é um calendário só.
- Mostra os eventos de **hoje** em ordem de início, no máximo 10: ponto 8px colorido + nome + intervalo `HH:MM – HH:MM` (dia inteiro: "Dia inteiro").
- Cor do ponto: da paleta da ilha, não a do calendário de origem. Cada calendário ganha `accent-500`, `accent-300`, `neutral-400` em rotação, na ordem em que aparece na lista.
- Sem eventos: a coluna de eventos mostra só o título "Hoje, …".
- Clicar em evento não faz nada.

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
- [x] Testes de `ics*.ts`: fusos (com e sem horário de verão), dia inteiro, recorrência de cada frequência, EXDATE, RECURRENCE-ID, cancelados, URL do chaveiro, mesmos resultados com TZ=UTC, Asia/Tokyo, America/New_York e America/Sao_Paulo.
- [ ] Evento de uma conta real do Google aparece na lista de hoje sem reiniciar o shell (conferir com a URL real no `make dev`).
- [ ] Alternar Mês/Semana no modo `calendar` anima a altura 150 ↔ 214.
