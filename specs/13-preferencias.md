# 13 · Preferências

Origem: `design/props.json` (`clickAction`) e o estado persistido do protótipo (`localStorage` em `design/logic.js`: `LS`, `island-v3-edge`). `battery` e `charging` são controles de demonstração e **não** viram preferência. `barPosition` está fora de escopo (spec 00).

O design v3 muda o padrão de `clickAction` para "Calendário compacto" e só aplica a opção fora do ambiente Padrão. A Island mantém o comportamento da v1.0: opção global, padrão cartão central.

## Schema GSettings

`org.gnome.shell.extensions.island`, em `schemas/`:

| Chave | Tipo | Padrão | Usada em |
|---|---|---|---|
| `click-action` | enum `center-card` \| `calendar` | `center-card` | spec 03 (clique na ilha compacta) |
| `weather-location` | `v` (localização GWeather serializada) | vazio | spec 07 |
| `weather-hint-shown` | `b` | `false` | spec 07 (interna, sem UI) |
| `prefs-page` | `s` | vazio | página a abrir nas preferências (interna, sem UI) |
| `ai-claude-enabled` | `b` | `true` | spec 12 |
| `ai-codex-enabled` | `b` | `true` | spec 12 |
| `environments` | `a(ssasas)` (nome, ícone, widgets da esquerda, widgets da direita) | os 4 ambientes iniciais da spec 15 | spec 15, 17 |
| `environment-index` | `u` | `0` | spec 15 |
| `switch-environment-next` | `as` | `['<Super><Control>Right']` | spec 15 (keybinding, sem UI) |
| `switch-environment-previous` | `as` | `['<Super><Control>Left']` | spec 15 (keybinding, sem UI) |
| `auto-hide` | `b` | `false` | spec 18 (editada no editor de ambientes) |
| `note-text` | `s` (até 80) | vazio | spec 16 (editada na ilha) |
| `countdown-name` | `s` | vazio | spec 16 |
| `countdown-date` | `s` (`AAAA-MM-DD`) | vazio | spec 16 |
| `pomodoro-state` | `s` | vazio (Foco 25:00, pausado) | spec 16 (interna, sem UI) |

A extensão reage a `changed::<chave>` sem reiniciar.

O atalho de controles rápidos não é preferência: a Island usa o `toggle-quick-settings` do próprio Shell (`Super+S`, spec 03).

## Janela de preferências (`prefs.ts`, GTK4 + libadwaita)

Roda em outro processo e só conversa com a extensão via GSettings. Textos em pt-BR via gettext.

- **Geral**
  - "Clique na ilha abre": Calendário e música (cartão) · Calendário compacto (ilha)
- **Clima**
  - Cidade atual e de onde ela veio, pela mesma cadeia da spec 07: "Escolhida aqui", "Do GNOME", "Automática" (sem nome: a janela roda em outro processo e não sabe o que o Geoclue achou) ou "Nenhuma"
  - Botão "Limpar", só com cidade escolhida aqui: volta à cadeia de fallback
  - Busca de cidade própria (o GWeather 4 não tem mais o `GWeatherLocationEntry`): sem acento nem caixa, cada palavra casa com o começo de uma palavra do nome, estado ou país; até 20 resultados
- **Uso de IA**
  - Um switch por provedor (Claude, Codex) + estado da credencial: "Encontrada", "Não encontrada: faça login no Claude", "Expirada" (só pela data do arquivo; o 401 da spec 12 não chega aqui)
- **Widgets**
  - Contagem regressiva: nome (até 20 caracteres) e data (seletor de data; "Limpar" apaga a data)
  - GitHub: estado do `gh`, "Conectado" ou "Não encontrado: rode `gh auth login`" (roda `gh auth status` ao abrir a página)

Ambientes, auto-ocultar e nota não aparecem na janela: são editados no Shell (specs 16 e 17).

A notificação de dica do clima (spec 07) abre esta janela direto na página Clima, e o widget de contagem sem data (spec 16) na página Widgets. O `openPreferences()` do Shell não escolhe página, então a extensão grava `weather` em `prefs-page` antes de abrir; a janela mostra a página e zera a chave (também com a janela já aberta).

## Critérios de aceite

- [x] Cada chave do schema muda o comportamento na hora, com a extensão rodando.
- [x] `glib-compile-schemas` roda sem aviso no build e no `install.sh`.
- [x] A janela abre pelo app Extensões e por `gnome-extensions prefs island@caionazario.dev`.
- [x] As chaves novas da v1.1 mudam o comportamento na hora, com a extensão rodando.
- [x] Mudar a data da contagem nas preferências atualiza o widget sem reiniciar.
