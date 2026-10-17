# 12 · Uso de IA

Origem: `design/components/TopbarWidget.html` (parte `w.isAi`) e camada `L.ai` em `design/markup.html`; `design/logic.js` `aiMap`/`lvl`/`lvlText`/`aiHpx`, `aiSummary`, `widgetData('ai')`.

Tudo vem do Omarchy, como no widget de agentes dele (`omarchy.agents`): os registros JSON que `omarchy-agent-usage-update` grava, com limites, plano e tokens. A Island não lê credencial nem fala com as APIs de uso (até o porte v5 ela fazia isso sozinha, pelos endpoints não documentados; o coletor do Omarchy já cobre o mesmo).

Código: formatação e faixas em `src/core/aiUsage.ts`, leitura dos registros em `src/core/agentUsage.ts`, fonte em `plugin/system/AiProvider.qml`/`AiUsageSource.qml`, views `AiWidget.qml`, `AiView.qml`, `AiProviderCard.qml`.

## Provedores

| | Claude | Codex |
|---|---|---|
| Nome exibido | Claude | Codex |
| Ícone | `ph-fill ph-asterisk` | `ph-fill ph-open-ai-logo` |
| Registro | `$XDG_STATE_HOME/omarchy/agents/usage/claude.json` | `…/codex.json` |
| Plano | `tierLabel` ("Pro", "Max 20x") | `tierLabel` |

- **Limites**: `limits[{label, percent, resetsAt}]`, `percent` de 0 a 1 e `resetsAt` ISO. Sessão é o rótulo com "Session"/"5-hour", semanal o com "Weekly"/"7-day", nunca pela posição. O coletor do Claude consulta o endpoint OAuth de uso com a credencial do CLI; o do Codex, o app-server dele.
- **Sem limites** (CLI sem login, coletor sem resposta): o provedor sai do widget e o cartão mostra o aviso no lugar das barras: `usageStatusText` como veio, ou "Faça login no CLI para ver os limites" quando o registro traz `authHelpText`; sem registro, "Sem dados do Omarchy ainda".
- **Com limites e aviso** (`usageStatusText`, ex.: limite de requisições): as barras e o aviso à direita do topo do cartão.

## Tokens (registros do Omarchy)

Os tokens por dia e por modelo do design v5 vêm dos mesmos registros (o coletor lê as transcrições locais do Claude Code e as sessões do Codex).

- Campos usados: `updatedAt`, `recentDays[{date, messageCount}]` (`messageCount` são os tokens do dia, como o painel do Omarchy lê) e `modelUsage{modelo: {inputTokens, outputTokens, cacheReadInputTokens, cacheCreationInputTokens}}`, somados por modelo.
- `FileView` com `watchChanges` em cada registro; como ele não percebe o arquivo nascer, os registros são relidos quando o coletor termina. Registro ausente ou inválido: o cartão mostra só o aviso.
- Com a Island no lugar da barra, o widget do Omarchy não roda e ninguém mais regenera os registros: a Island roda `omarchy-agent-usage-update <provedores ligados>` a cada 900s (o padrão do Omarchy) com o widget `ai` no ambiente ativo, e ao abrir o modo `ai` se o registro mais novo tiver mais de 5min. O coletor grava o cache dele em `~/.cache/omarchy/agent-usage/`, como quando o widget do Omarchy o roda.
- Formatação e nomes (`formatTokens`, `friendlyModelName`) seguem o `Main.qml` do widget do Omarchy: `225.7M`, `503.0K`, `2.4B`; `claude-opus-5-5` → "Opus 5.5", `claude-sonnet-4-5-20250929` → "Sonnet 4.5", `gpt-5.6-sol` → "GPT 5.6 Sol".

## Cores por nível (sessão e semanal)

| Uso | Barra | Texto do % |
|---|---|---|
| <70% | `accent` | `text` |
| ≥70% | `accent-300` | `text` |
| ≥90% | `#f75d59` | `#fd736d` |

## Widget `ai`

O antigo botão da pílula esquerda virou o widget `ai` (spec 16). No ambiente Padrão ele fica na pílula esquerda, como na v1.0.

- Moldura e padding do widget (spec 16: 24px, padding 0 9px, hover `neutral-900`); gap 12px entre provedores. O fundo `neutral-900` com `ai` aberto do design antigo saiu.
- Por provedor com limites no registro (gap 6px): ícone 13px `neutral-300` · mini barra 26×4 raio 2 (`neutral-800` + preenchimento da **sessão**, transição 600ms) · `62%` 11.5px/500 alinhado à direita, largura mínima 3.2ch.
- Nenhum provedor com limites (sem login no CLI, sem registro ou desligado nas preferências): `ph ph-sparkle` 14px + "IA" `neutral-400`.
- Clique abre/fecha `ai`.

## Modo `ai` (480 × `aiPanelHeight`)

- Padding 12px 14px, gap 6px. Cabeçalho 26px: `ph ph-sparkle` 14px `neutral-300`, "Uso de IA" 13px/500, resumo 11px `neutral-500` à direita ("2 conectados" / "1 conectado").
- **Abas** (design v5, só com mais de um provedor ligado): 30px, gap 6, uma por provedor com ícone 13px + nome 12px (ativa `accent-900` com anel `accent-700`). Clicar escolhe o provedor do cartão; sem escolha, o primeiro. A escolha vive na fonte e se perde no hot-reload.
- **Um cartão**, do provedor escolhido: padding 10px 10px 12px, raio 14, `neutral-900`.
  - Topo (margin-bottom 10px, gap 10px): bloco 28×28 raio 8 `accent-900` com ícone 16px `accent-300` · nome 13px/500 · chip do plano (10.5px, padding 1 7, raio 8, anel `neutral-700`, texto `neutral-300`).
  - Duas colunas (gap 14px): "Sessão · 5h" e "Semanal" (11px `neutral-400`) com o % à direita (500, cor da tabela) · barra 4px · "Reinicia {quando}" 10.5px `neutral-500` (margin-top 5px).
  - "Reinicia" da sessão é relativo: `em 2h 14min`, `em 45min`. Da semanal é absoluto: `seg, 09:00` (dia abreviado minúsculo + hora local).
  - **Tokens por dia** (com registro): divisor (margin 12px 0 10px), rótulo "Tokens por dia" com o total da semana à direita ("225.7M na semana"), sete linhas de 22px (gap 12): dia 34px 11.5px (`neutral-500`; hoje "Hoje" em `text`/500) · barra 4px relativa ao maior dia (`neutral-500`; hoje `accent`) · valor 48px à direita (`neutral-300`, zero `neutral-600`, hoje `text`/500). Um registro de ontem não marca nenhum dia como hoje.
  - **Tokens por modelo** (com modelos): divisor, rótulo "Tokens por modelo" com o total ("225.7M total"), uma pílula de 30px raio 15 `neutral-800` por modelo (gap 4) com a barra `accent-900` relativa ao maior por trás, nome 12px `neutral-200` à esquerda e valor `neutral-400` à direita.
- Altura (`aiPanelHeight`): 24 + 26 + 6, + 36 com abas, + cartão 106 (topo 28 + 10, limites 46, padding 22), + 195 com tokens por dia, + 41 + 34 por modelo; sem provedor, 56. É o `aiHpx` do design: 24 + 32 + 36 + 346 + 34·modelos − 4.
- Sem botões Conectar/Desconectar: quais provedores aparecem é decidido nas preferências (spec 13).
- Estados no cartão: os da seção "Provedores" (aviso no lugar das barras, ou à direita do topo).

## Critérios de aceite

- [x] Testes de `agentUsage.ts`: limites pelo rótulo, sem limites, aviso do coletor, registro inválido; de `aiUsage.ts`: "Reinicia" e faixas de cor.
- [x] Sem limites do Codex no registro, o Codex some do widget e o Claude funciona normalmente (visto no `make dev`).
- [x] Com o registro do Claude, o cartão mostra os 7 dias e os modelos (visto no `make dev` com os registros reais).
- [ ] Usar o Claude Code com o widget `ai` ativo faz o "Hoje" crescer em até 15min sem reiniciar o shell.
