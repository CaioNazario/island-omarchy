# 12 · Uso de IA

Origem: `design/components/TopbarWidget.html` (parte `w.isAi`) e camada `L.ai` em `design/markup.html`; `design/logic.js` `aiMap`/`lvl`/`lvlText`/`aiHpx`, `aiSummary`, `widgetData('ai')`.

Referência de como os dados são obtidos: [ai-usagebar](https://github.com/akitaonrails/ai-usagebar) (`src/anthropic/`, `src/openai/`). A Island reimplementa em TS, **sem** depender do binário.

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
- `Gio.FileMonitor` nos dois arquivos: quando o CLI renova o token, a Island relê e atualiza.
- Arquivo ausente → cartão mostra, no lugar das barras, "Faça login no Claude" / "Faça login no Codex", e o provedor some do widget.
- Token expirado (pela data ou HTTP 401) → mantém os últimos valores do cache e mostra "Abra o Claude Code para renovar" / "Abra o Codex para renovar".

## Atualização

- Polling a cada **300s** por provedor, só com o widget `ai` no ambiente ativo (spec 16).
- Abrir o modo `ai` força atualização se o cache tiver mais de **60s**.
- HTTP 429 → mantém cache e dobra o intervalo até 1200s; volta a 300s no próximo sucesso.
- Erro de rede → mantém cache sem mensagem; após 3 falhas seguidas, "Sem conexão" no cartão.
- Todo HTTP via `Soup.Session` assíncrono, timeout 10s.

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

## Modo `ai` (480 × (24 + 32 + p·108 − 6))

- Padding 12px 14px, gap 6px. Cabeçalho 26px: `ph ph-sparkle` 14px `neutral-300`, "Uso de IA" 13px/500, resumo 11px `neutral-500` à direita ("2 conectados" / "1 conectado").
- Cartão por provedor: padding 10px 10px 12px, raio 14, `neutral-900`.
  - Topo (margin-bottom 10px, gap 10px): bloco 28×28 raio 8 `accent-900` com ícone 16px `accent-300` · nome 13px/500 · chip do plano (10.5px, padding 1 7, raio 8, anel `neutral-700`, texto `neutral-300`).
  - Duas colunas (gap 14px): "Sessão · 5h" e "Semanal" (11px `neutral-400`) com o % à direita (500, cor da tabela) · barra 4px · "Reinicia {quando}" 10.5px `neutral-500` (margin-top 5px).
  - "Reinicia" da sessão é relativo: `em 2h 14min`, `em 45min`. Da semanal é absoluto: `seg, 09:00` (dia abreviado minúsculo + hora local).
- Sem botões Conectar/Desconectar: quais provedores aparecem é decidido nas preferências (spec 13).

## Critérios de aceite

- [x] Testes de `aiUsage.ts`: parse dos dois payloads, janelas do Codex fora de ordem, campos ausentes, formatação de "Reinicia", faixas de cor.
- [x] Nenhuma escrita em `~/.claude` ou `~/.codex` durante a execução (verificável por `inotifywait`).
- [x] Sem `~/.codex/auth.json`, o cartão do Codex mostra "Faça login no Codex", o Codex some do widget e o Claude funciona normalmente.
- [x] Rodar o Claude Code (que renova o token) faz o cartão sair do estado expirado sem reiniciar a extensão.
- [x] Resposta HTTP malformada não gera exceção no log do Shell.
