# 16 · Widgets

Origem: `design/logic.js` `WIDGETS`, `widgetData`, `simple`, `act`, `lane`; `design/components/TopbarWidget.html` (visual de cada widget); `design/markup.html` `leftW`/`rightW`, `L.note`.

Widgets ocupam as pílulas laterais conforme o ambiente ativo (spec 15). Visual comum em `src/ui/`, regras de dado em `src/core/` (uma função pura por widget).

## Catálogo

| Id | Nome | Ícone no catálogo | Descrição |
|---|---|---|---|
| `ai` | Uso de IA | `ph ph-sparkle` | Sessão e limite semanal |
| `hw` | Hardware | `ph ph-cpu` | CPU, RAM, GPU, temperatura e rede |
| `event` | Próximo evento | `ph ph-calendar-blank` | O próximo compromisso do dia |
| `pomodoro` | Pomodoro | `ph ph-timer` | Ciclos de foco e pausa |
| `music` | Música | `ph ph-music-note` | O que está tocando agora |
| `github` | GitHub | `ph ph-github-logo` | PRs esperando revisão |
| `progress` | Progresso do dia | `ph ph-hourglass-medium` | Quanto do dia já passou |
| `countdown` | Contagem regressiva | `ph ph-airplane-tilt` | Dias até a data que importa |
| `note` | Nota | `ph ph-note` | Um recado fixo na barra |

## Pílulas

- **Esquerda**: botão de ambiente (spec 15), gap 4px, e a área de widgets **encostada à direita** (junto da ilha).
- **Direita**: área de widgets **encostada à esquerda** (junto da ilha) e depois os botões fixos (sino, Wi‑Fi, volume, bateria, seta; spec 02).
- Widgets com gap 2px. Moldura de cada um: raio 12, fundo transparente, hover `neutral-900` (150ms), cursor de mão só se o widget tiver ação de clique.

### Quando não cabe

A área de widgets nunca empurra a ilha nem os botões fixos. Decisão por medida do espaço, não por breakpoint:

1. O `hw` perde blocos na ordem **NET → GPU → TEMP** (CPU e RAM ficam).
2. Ainda sem espaço: somem widgets **inteiros**, primeiro o mais longe da ilha (na esquerda, o primeiro da lista; na direita, o último). Nunca corta um widget pela metade, diferente do design.

## Visual comum (`TopbarWidget`)

Linha de 24px, padding 0 9px, gap 6px, 12px/500, `text`, dígitos tabulares, sem quebra. As partes aparecem nesta ordem, cada uma só se o widget usar:

| Parte | Visual |
|---|---|
| anel | 13×13: arco `accent` sobre `neutral-800`, miolo `bg` com 3px de borda (desenhado com `St.DrawingArea`/Cairo) |
| ícone | 14px, cor do widget (padrão `neutral-300`) |
| rótulo | largura máxima do widget (padrão 140px), reticências |
| barra | 34×4 raio 2, `accent` sobre `neutral-800` |
| sub | peso 400, `neutral-400` |
| ícone final | 13px `neutral-300` |

`ai` e `hw` têm visual próprio, descrito nas specs 12 e 10. As partes `ticks` do componente não são usadas por nenhum widget e não existem.

## Widgets

| Id | Visual | Clique |
|---|---|---|
| `ai` | spec 12 | abre/fecha `ai` |
| `hw` | spec 10 | abre/fecha `quick` |
| `event` | ícone `ph-calendar-blank` · rótulo (máx. 130px) · sub | abre `calendar` |
| `pomodoro` | anel · rótulo `mm:ss` · sub | alterna rodando/pausado |
| `music` | ícone da fonte (spec 05) `accent-400` · título (máx. 120px) · sub artista · ícone final `ph-fill ph-play`/`ph-pause` do estado | com player: abre/fecha `music` fixado |
| `github` | ícone `ph-fill ph-github-logo` · rótulo · sub | nenhum |
| `progress` | ícone `ph-hourglass-medium` · "Dia" · barra · sub `%` | nenhum |
| `countdown` | ícone `ph-airplane-tilt` · rótulo · sub | só sem data configurada: abre as preferências na página Widgets |
| `note` | ícone `ph-fill ph-note` · texto (máx. 150px) | abre/fecha `note` |

### `event`

- Fonte: eventos de hoje da spec 06.
- Próximo = primeiro evento com hora (não "dia inteiro") que começa depois de agora.
- Rótulo: nome do evento. Sub: `em N min` se começa em até 90 min, senão `HH:MM`.
- Sem próximo: o primeiro evento de dia inteiro de hoje, com sub "dia inteiro".
- Sem nenhum dos dois: rótulo "Sem eventos", sub "hoje".
- Atualiza a cada minuto e quando os eventos mudam.

### `pomodoro`

- Ciclo: **Foco 25:00 → Pausa 05:00 → Foco…**, trocando de fase sozinho ao zerar.
- Rótulo: tempo restante `mm:ss`. Sub: "Foco" ou "Pausa" rodando, "Pausado" parado. Anel: fração já decorrida da fase.
- Estado inicial: Foco 25:00, pausado.
- Ao trocar de fase, uma notificação da Island entra pelo roteamento da spec 04, com ícone `ph ph-timer`:
  - fim do foco: "Hora da pausa" / "5 min de pausa"
  - fim da pausa: "Hora de focar" / "25 min de foco"
- Sem botão de reiniciar nesta versão.
- Estado em GSettings `pomodoro-state` (spec 13): fase e tempo restante. O bloqueio de tela pausa o pomodoro (o `disable()` roda a cada bloqueio) e ele volta pausado, com o restante guardado; o tempo bloqueado não conta.
- O relógio de 1s só roda com o widget visível e o pomodoro rodando. O vencimento de fase é um timeout único, esteja o widget visível ou não.

### `music`

- Dados do player atual (spec 05).
- Sem player atual, o widget continua na barra: ícone `ph-music-note` e rótulo "Nada tocando", ambos `neutral-400`, sem sub, sem ícone final e sem clique.
- Clique abre o modo `music` **fixado** (spec 05); clicar de novo com ele aberto fecha.

### `github`

- Credencial: `gh auth token` via `Gio.Subprocess` assíncrono. Somente leitura; o token fica só em memória, nunca em log, GSettings ou erro. O stderr do `gh` também não vai para o log.
- Casos medidos no spike S10 (gh 2.100):
  - Token no keyring ou no `hosts.yml`: sai 0 com o token e `\n` no stdout, em ~50ms. O keyring é consultado mesmo sem `hosts.yml`.
  - Sem login (nem keyring nem `hosts.yml`): sai 1, stdout vazio, stderr `no oauth token found for github.com`.
  - Keyring bloqueado: não medido (abre o prompt de desbloqueio). Coberto pelo timeout.
  - Sem `gh` no PATH: o spawn falha (`G_SPAWN_ERROR_NOENT`).
- Credencial = stdout sem espaços nas pontas, só com saída 0 e não vazio. Qualquer outro resultado, ou mais de **5s** sem terminar (o processo é encerrado com `force_exit`), conta como sem credencial.
- Duas buscas (`GET https://api.github.com/search/issues`, `per_page=1`, lê `total_count`):
  - `is:pr is:open author:@me` → rótulo `N PRs` (`1 PR`)
  - `is:pr is:open review-requested:@me` → sub `M para revisar` (some com M = 0)
- Cabeçalhos: `Authorization: Bearer`, `Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28`, `User-Agent: island-gnome-extension`.
- Polling a cada 300s, `Soup.Session` assíncrono, timeout 10s. Erro de rede ou 5xx: mantém o último valor. 401: roda `gh auth token` de novo uma vez.
- Sem `gh` no PATH, sem login ou 401 persistente: ícone + rótulo "GitHub" `neutral-400`, sem sub.
- Parse das respostas e textos em `src/core/github.ts`, testado.

### `progress`

- Rótulo "Dia". Barra e sub = `round(minutos desde 00:00 / 14.4)` %.
- Atualiza a cada minuto.

### `countdown`

- Nome e data em GSettings `countdown-name`/`countdown-date` (spec 13), editados nas preferências.
- Rótulo: nome, ou "Contagem" com nome vazio.
- Sub: dias de calendário de hoje até a data (`N dias`, `1 dia`, "hoje"). Data passada: "encerrada".
- Sem data: rótulo "Sem data" `neutral-400`, sem sub. É o único estado com clique.
- Conta pela data local (`daysUntil` puro), atualiza à meia-noite.

### `note`

- Texto em GSettings `note-text` (spec 13), até 80 caracteres, sem quebra de linha. Um texto só para todos os ambientes.
- Ícone `accent-300`; vazio: ícone `neutral-500` e rótulo "Nota vazia".

## Modo `note` (420 × 132, raio 24, fixo)

- Padding 12px 14px, gap 8px.
- Cabeçalho 22px: `ph-fill ph-note` 15px `accent-300` · "Nota" 13px/500 · à direita `{n}/80 · Enter para salvar` 11px `neutral-500`.
- Campo: ocupa o resto, padding 8px 10px, raio 10, `neutral-900`, anel 1px `neutral-800` (focado: `accent`), 13px, entrelinha 1.4, várias linhas com quebra automática, placeholder "Escreva um recado para a barra". Quebra de linha colada vira espaço; limite de 80 caracteres.
- Abre com o foco no campo e o cursor no fim.
- Grava a cada mudança (debounce 300ms) e ao fechar. Enter ou Esc fecham a ilha.
- Clique fora fecha, como nos outros modos fixos.

## Fontes só quando visíveis

Fonte de dado usada só por widget (hardware, IA, GitHub) roda apenas enquanto um widget dela está no ambiente ativo; troca de ambiente liga/desliga. MPRIS, calendário e clima continuam sempre ligados (usados também pela ilha).

## Critérios de aceite

- [x] Testes puros: próximo evento (sem eventos, dia inteiro como reserva, ≤90 min, >90 min), fases do pomodoro (troca ao zerar, pausar e retomar), `daysUntil` (hoje, amanhã, passado, virada de ano), progresso do dia, parse das buscas do GitHub e textos no singular/plural.
- [x] Com a barra estreita, o `hw` perde NET, GPU e TEMP antes de qualquer widget sumir, e nenhum widget aparece cortado. (adiado: testar com o editor da spec 17)
- [x] O pomodoro notifica a troca de fase e volta pausado, com o mesmo restante, depois de lock/unlock.
- [x] Sem `gh` instalado, o widget GitHub mostra "GitHub" sem erro no journal. Com login, os números batem com `gh search prs`.
- [x] Nota editada na ilha aparece no widget ao fechar e sobrevive a lock/unlock.
- [x] Ambiente sem `hw` nem `ai`: nenhuma leitura de `/proc` e nenhuma chamada HTTP de IA acontecem.
