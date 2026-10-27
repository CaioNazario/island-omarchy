# 13 · Preferências

Origem: `design/props.json` (`clickAction`) e o estado persistido do protótipo (`localStorage` em `design/logic.js`: `LS`, `island-v3-edge`). `battery` e `charging` são controles de demonstração e **não** viram preferência. `barPosition` está fora de escopo (spec 00).

O design v3 muda o padrão de `clickAction` para "Calendário compacto" e só aplica a opção fora do ambiente Padrão. A Island mantém a opção global, com padrão cartão central.

## Arquivo de preferências

`$XDG_CONFIG_HOME/island/settings.json` (`plugin/system/SettingsStore.qml`, um `JsonAdapter` no `Service.qml`). O arquivo é vigiado: editar por fora (à mão ou pela janela de preferências) vale na hora. Chave ausente usa o padrão; JSON inválido também.

| Chave | Tipo | Padrão | Usada em |
|---|---|---|---|
| `clickAction` | `"card"` \| `"calendar"` | `"card"` | spec 03 (clique na ilha compacta) |
| `weatherLocation` | `{name, latitude, longitude}` ou `null` | `null` | spec 07 |
| `aiClaudeEnabled` | bool | `true` | spec 12 |
| `aiCodexEnabled` | bool | `true` | spec 12 |
| `environments` | `[[nome, ícone, [esquerda], [direita]], …]` | `[]` (= os 4 ambientes iniciais da spec 15) | spec 15, 17 |
| `environmentIndex` | int | `0` | spec 15 |
| `autoHide` | bool | `false` | spec 18 |
| `accent` | `"Roxo"` \| `"Branco"` (outro valor cai no Roxo) | `"Roxo"` | spec 01 "Realce", spec 17 |
| `theme` | `"Nocturne"` \| `"Alto contraste"` (outro valor cai no Nocturne) | `"Nocturne"` | spec 01 "Temas", spec 17 |
| `noteText` | string (até 80) | `""` | spec 16 |
| `countdownName` | string | `""` | spec 16 |
| `countdownDate` | `"AAAA-MM-DD"` ou `""` | `""` | spec 16 |

Listas lidas do arquivo chegam ao JS como objetos com `length` e índices em que `Array.isArray` dá `false` (o motor do QML, via `JsonAdapter`): o core as lê com `asList` (`environments.ts`). Quem validasse com `Array.isArray` jogaria fora o que o usuário guardou e a próxima gravação apagaria o arquivo. O `make smoke` semeia um `settings.json` com um ambiente próprio e falha se a barra não o carregar.

Estado que não é preferência fica em `$XDG_STATE_HOME/island/state.json` (`StateStore.qml`): `doNotDisturb` (spec 04), `pomodoroState` (spec 16), `weatherHintShown` (spec 07).

Atalhos não são preferência: são binds do Hyprland para o alvo IPC `island` (`toggleQuick`, `openStack`, `closeStack`, `nextEnvironment`, `previousEnvironment`; specs 03, 04 e 15).

## Janela de preferências (a fazer)

Ainda não existe. Ela vai falar só pelo `settings.json`; até lá, as preferências se editam no arquivo.

- **Geral**
  - "Clique na ilha abre": Calendário e música (cartão) · Calendário compacto (ilha)
- **Clima**
  - Cidade atual e de onde ela veio, pela mesma cadeia da spec 07: "Escolhida aqui", "Do Omarchy", "Automática" ou "Nenhuma"
  - Botão "Limpar", só com cidade escolhida aqui: volta à cadeia de fallback
  - Busca de cidade pelo nome, até 20 resultados
- **Uso de IA**
  - Um switch por provedor (Claude, Codex) + estado do registro do Omarchy (spec 12): "Com limites", "Faça login no CLI" ou "Sem dados"
- **Widgets**
  - Contagem regressiva: nome (até 20 caracteres) e data (seletor de data; "Limpar" apaga a data)
  - GitHub: estado do `gh`, "Conectado" ou "Não encontrado: rode `gh auth login`" (roda `gh auth status` ao abrir a página)

Ambientes, auto-ocultar e nota não aparecem na janela: são editados na barra (specs 16 e 17).

A notificação de dica do clima (spec 07) abre esta janela direto na página Clima, e o widget de contagem sem data (spec 16) na página Widgets.

## Critérios de aceite

- [ ] Cada chave do `settings.json` muda o comportamento na hora, com o shell rodando.
- [ ] A janela de preferências abre e grava no `settings.json`.
- [ ] Mudar a data da contagem atualiza o widget sem reiniciar.
