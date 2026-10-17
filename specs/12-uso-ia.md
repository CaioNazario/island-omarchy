# 12 · Uso de IA

Origem: `design/components/TopbarWidget.html` (parte `w.isAi`) e camada `L.ai` em `design/markup.html`; `design/logic.js` `aiMap`/`lvl`/`lvlText`/`aiHpx`, `aiSummary`, `widgetData('ai')`.

Referência de como os dados são obtidos: [ai-usagebar](https://github.com/akitaonrails/ai-usagebar) (`src/anthropic/`, `src/openai/`). A Island reimplementa em TS, **sem** depender do binário.

Código: regras e requisições em `src/core/aiUsage.ts` (`usageRequest`, `fetchOutcome`), tokens em `src/core/agentUsage.ts`, fonte em `plugin/system/AiProvider.qml`/`AiUsageSource.qml`, views `AiWidget.qml`, `AiView.qml`, `AiProviderCard.qml`.

## Provedores

| | Claude | Codex |
|---|---|---|
| Nome exibido | Claude | Codex |
| Ícone | `ph-fill ph-asterisk` | `ph-fill ph-open-ai-logo` |
| Credencial | `~/.claude/.credentials.json` | `~/.codex/auth.json` |
| Token | `claudeAiOauth.accessToken` | `tokens.access_token` (+ `tokens.account_id`) |
| Expiração | `claudeAiOauth.expiresAt` (ms epoch) | `tokens.expires_at`, senão `exp` do `tokens.id_token` |
| Plano | `claudeAiOauth.subscriptionType` capitalizado ("Max", "Pro") | `plan_type` da resposta, senão `chatgpt_plan_type` do `id_token` ("Plus", "Pro") |
| Endpoint | `GET https://api.anthropic.com/api/oauth/usage` | `GET https://chatgpt.com/backend-api/wham/usage` |
| Cabeçalhos | `Authorization: Bearer`, `anthropic-beta: oauth-2025-04-20`, `User-Agent: claude-cli/<versão publicada> (external, cli)` | `Authorization: Bearer`, `ChatGPT-Account-Id`, `User-Agent: codex-cli` |
| Sessão (5h) | `five_hour.utilization` (0–100), `five_hour.resets_at` (ISO) | janela com `limit_window_seconds = 18000` em `rate_limit.primary_window`/`secondary_window`: `used_percent`, `reset_at` (unix) |
| Semanal | `seven_day.utilization`, `seven_day.resets_at` | janela com `limit_window_seconds = 604800` |

- O parse de cada resposta é função pura em `src/core/aiUsage.ts`, testada com payloads de exemplo (os do ai-usagebar servem de fixture). Classificar as janelas do Codex por `limit_window_seconds`, nunca pela posição.
- **Risco aceito**: os dois endpoints são não documentados e o do Claude exige User-Agent do `claude-cli`. Podem quebrar a qualquer momento. Resposta com formato inesperado vira estado de erro no cartão, nunca exceção.

## Credenciais: somente leitura

- A Island **nunca** escreve nos arquivos de credencial e **nunca** renova token.
- `FileView` com `watchChanges` nos dois arquivos: quando o CLI renova o token, a Island relê, sai do estado expirado e busca de novo.
- Arquivo ausente → cartão mostra, no lugar das barras, "Faça login no Claude" / "Faça login no Codex", e o provedor some do widget.
- Token expirado (pela data ou HTTP 401) → mantém os últimos valores do cache e mostra "Abra o Claude Code para renovar" / "Abra o Codex para renovar".

## Atualização

- Polling a cada **300s** por provedor, só com o widget `ai` no ambiente ativo (spec 16).
- Abrir o modo `ai` força atualização se o cache tiver mais de **60s**.
- HTTP 429 → mantém cache e dobra o intervalo até 1200s; volta a 300s no próximo sucesso.
- Erro de rede → mantém cache sem mensagem; após 3 falhas seguidas, "Sem conexão" no cartão.
- Todo HTTP por `curl` (`plugin/system/HttpGet.qml`), timeout 10s, com os cabeçalhos pela entrada padrão (`-H @-`): o token nunca aparece na linha de comando do processo.

## Tokens (registros do Omarchy)

Os tokens por dia e por modelo do design v5 vêm de onde o widget de agentes do Omarchy (`omarchy.agents`) os tira: os registros JSON que `omarchy-agent-usage-update` grava em `$XDG_STATE_HOME/omarchy/agents/usage/<claude|codex>.json` (o coletor lê as transcrições locais do Claude Code e as sessões do Codex). Os limites de sessão e semanal continuam pela busca da Island acima.

- Campos usados: `tierLabel` (plano, quando a credencial e a resposta não trazem), `updatedAt`, `recentDays[{date, messageCount}]` (`messageCount` são os tokens do dia, como o painel do Omarchy lê) e `modelUsage{modelo: {inputTokens, outputTokens, cacheReadInputTokens, cacheCreationInputTokens}}`, somados por modelo.
- `FileView` com `watchChanges` em cada registro; como ele não percebe o arquivo nascer, os registros são relidos quando o coletor termina. Registro ausente ou inválido: o cartão fica só com os limites.
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
- Por provedor logado (gap 6px): ícone 13px `neutral-300` · mini barra 26×4 raio 2 (`neutral-800` + preenchimento da **sessão**, transição 600ms) · `62%` 11.5px/500 alinhado à direita, largura mínima 3.2ch.
- Nenhum provedor logado (sem credencial ou desligado nas preferências): `ph ph-sparkle` 14px + "IA" `neutral-400`.
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
- Estados no cartão: sem credencial, "Faça login no …" no lugar das barras; expirado ("Abra o … para renovar") ou sem conexão ("Sem conexão"), as barras do cache e o aviso à direita do topo.

## Critérios de aceite

- [x] Testes de `aiUsage.ts`: parse dos dois payloads, janelas do Codex fora de ordem, campos ausentes, formatação de "Reinicia", faixas de cor, requisição por provedor e status HTTP → resultado.
- [ ] Nenhuma escrita em `~/.claude` ou `~/.codex` durante a execução (verificável por `inotifywait`).
- [x] Sem `~/.codex/auth.json`, o Codex some do widget e o Claude funciona normalmente (visto no `make dev` com a conta real).
- [ ] Rodar o Claude Code (que renova o token) faz o cartão sair do estado expirado sem reiniciar o shell.
- [x] Resposta HTTP malformada não gera exceção (`fetchOutcome` → `malformed`).
- [x] Com o registro do Claude, o cartão mostra os 7 dias e os modelos (visto no `make dev` com os registros reais).
- [ ] Usar o Claude Code com o widget `ai` ativo faz o "Hoje" crescer em até 15min sem reiniciar o shell.
