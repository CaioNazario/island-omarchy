# 15 · Ambientes

Origem: `design/logic.js` `DEFAULT_ENVS`, `ENV_ICONS`, `loadEnvs`, `switchEnv`/`goEnv`, `wheel`, `envDots`, `envIcon`/`envName`, `slideTf`/`slideO`/`slideT`, `SIZES.env`, `TRANSIENT.env`, atalhos em `onKey` (`e.altKey`); `design/markup.html` botão `openEditor` (início da pílula esquerda) e camada `L.env`.

Um **ambiente** é um conjunto nomeado de widgets para as duas pílulas laterais. Só um está ativo por vez, igual em todos os monitores. Os widgets estão na spec 16; o editor, na spec 17.

## Modelo

Regra pura em `src/core/environments.ts`:

- Ambiente = nome (até 20 caracteres), ícone (um dos 9 de `ENV_ICONS`), lista de widgets da pílula esquerda e lista da direita.
- Um widget aparece no máximo uma vez por ambiente (em uma das duas pílulas). Ambientes diferentes podem repetir widgets.
- Máximo de **6** ambientes, mínimo 1.
- O primeiro ambiente é o **Padrão**: pode ser renomeado e ter os widgets trocados, mas não pode ser excluído nem sair da primeira posição.
- Ícones (`ENV_ICONS`): `ph ph-house`, `ph-briefcase`, `ph-book-open`, `ph-sun-horizon`, `ph-code`, `ph-game-controller`, `ph-moon-stars`, `ph-barbell`, `ph-coffee`.

Ambientes iniciais (`DEFAULT_ENVS`):

| Ambiente | Ícone | Esquerda | Direita |
|---|---|---|---|
| Padrão | `ph-house` | IA | Hardware |
| Trabalho | `ph-briefcase` | Próximo evento, Pomodoro, IA | Hardware, GitHub |
| Estudos | `ph-book-open` | Progresso do dia, Pomodoro | Nota |
| Fim de semana | `ph-sun-horizon` | Música | Contagem regressiva |

O Padrão reproduz a barra da v1.0 (IA à esquerda, hardware à direita).

### Persistência

GSettings `environments` e `environment-index` (spec 13). Ao ler, `environments.ts` saneia o valor: descarta widget desconhecido ou repetido e ícone desconhecido (vira `ph-house`), corta nomes em 20 caracteres e a lista em 6, e usa os ambientes iniciais se a lista vier vazia ou inválida. Índice fora da faixa vira 0. Toda mudança grava na hora.

## Troca de ambiente

Troca circular: depois do último vem o primeiro.

| Gatilho | Efeito |
|---|---|
| Rolagem horizontal (dois dedos no touchpad) sobre a barra | próximo/anterior conforme o sentido |
| Roda inclinada (`SCROLL_LEFT`/`SCROLL_RIGHT` com origem `WHEEL`) sobre a barra | próximo/anterior, um passo por clique |
| `Super+Ctrl+→` / `Super+Ctrl+←` | próximo / anterior, de qualquer lugar |
| Clique num ponto do botão de ambiente | vai direto para aquele ambiente |
| Aba no editor (spec 17) | vai direto para aquele ambiente |

Atalhos numerados (`Alt+1–N` do design) não existem. `Alt+←/→` do design também não: roubaria o "voltar" do navegador e do Nautilus. Os atalhos são keybindings do Shell (`Main.wm.addKeybinding`) com as chaves `switch-environment-next`/`-previous` (spec 13), removidos no `disable()`. Sem editor de atalho na UI.

`Super+Alt+←/→` do design não serve: no GNOME 50 é o padrão de `switch-to-workspace-left/right` (`org.gnome.desktop.wm.keybindings`). Também ocupados: `Super+Shift+←/→` (`move-to-monitor-*`), `Super+Shift+Alt+←/→` (`move-to-workspace-*`), `Ctrl+Alt+←/→` (`switch-to-workspace-*`) e `Super+←/→` (`toggle-tiled-*` do Mutter). `Super+Ctrl+←/→` não aparece em `org.gnome.desktop.wm.keybindings`, `org.gnome.mutter.keybindings`, `org.gnome.shell.keybindings` nem `org.gnome.settings-daemon.plugins.media-keys` (conferido no GNOME Shell 50.4).

### Rolagem suave

Só conta rolagem com componente horizontal maior que a vertical; o resto passa adiante. No touchpad o libinput trava o eixo: um gesto vertical chega com dx 0 e um horizontal quase sem dy.

- Acumula o `get_scroll_delta()` horizontal dos eventos `SMOOTH`. A unidade é o clique de roda: o Shell emite um evento discreto a cada 1.0 acumulado, e cada evento traz 0.1–3.0 a cada ~7ms. Um passo equivale a ~10px de dedo (deduzido, não medido), então os 110px do design viram **11**.
- Enquanto não troca, o conteúdo das duas pílulas acompanha o dedo: deslocamento `−acumulado × 5`px (os 0.5 do design com 10px por unidade), limitado a ±56px, sem animação.
- Passou de **11**: troca e trava até o fim do gesto.
- Fim do gesto: evento `SMOOTH` com `get_scroll_finish_flags()` diferente de `NONE` e delta 0, que chega 6–28ms depois do último delta. Zera o acumulado, destrava e o conteúdo volta a 0. Substitui o timeout de 180ms do design: com os dedos parados no touchpad a trava continua, e ir e voltar sem soltar troca só uma vez.
- Junto com os `SMOOTH`, o Shell emite eventos discretos emulados (`UP`/`DOWN`/`LEFT`/`RIGHT`) com origem `FINGER`. Eles são ignorados: só o discreto com `get_scroll_source()` `WHEEL` conta como roda inclinada. Sem esse filtro um gesto troca dezenas de ambientes.

Medido no GNOME Shell 50.4 com touchpad (spike S8): gesto horizontal curto acumulou 16.6, longos 25–38. A roda inclinada não foi medida.

## Animação da troca

Anima só o conteúdo de widgets das duas pílulas. Botão de ambiente e botões fixos da pílula direita não se mexem. `d` = +1 para frente, −1 para trás (no clique em ponto, o sinal de destino − atual).

1. Saída: o conteúdo vai a `translateX(−d·44px)` e opacidade 0, 160ms ease-in.
2. Troca o conteúdo e posiciona em `translateX(d·44px)` sem animação.
3. Entrada: vai a 0 em 340ms na curva `cubic-bezier(.2,.9,.25,1)` (`set_cubic_bezier_progress`, como na spec 01), opacidade 1 em 240ms ease.

Trocar de novo durante a animação cancela a anterior e parte do estado atual.

## Botão de ambiente (início da pílula esquerda)

- Altura 24, padding 0 8px, raio 12, gap 7px, hover `neutral-900` (fundo `neutral-900` com o editor aberto).
- Ícone do ambiente 14px `accent-300` + pontos (gap 3px): um por ambiente, 4px de altura, raio 2; o ativo tem 12px de largura e é `accent`, os outros 4px e `neutral-700`. Largura e cor animam em 250ms.
- Clique no botão abre/fecha o editor (spec 17). Clique num ponto troca de ambiente e não abre o editor.

## Modo `env` (260 × 40, raio 20, transitório 1500ms)

- Aparece em toda troca de ambiente, **só** se a ilha estiver em `compact` ou já em `env` (rearma o timer). Com outro modo aberto, a troca acontece sem mexer na ilha.
- Conteúdo centralizado, gap 10px: ícone do ambiente 16px `accent-300` · nome 13px/500 · pontos (mesma regra do botão, sempre horizontais).
- Não recebe clique nem hover (no design, `pointer-events: none`). Clicar na ilha em `env` não faz nada.

## Critérios de aceite

- [x] Testes de `environments.ts`: saneamento (widget desconhecido, repetido, ícone inválido, lista vazia, mais de 6, nome longo), troca circular nos dois sentidos, índice inválido, Padrão não excluível.
- [x] Dois dedos para a esquerda no touchpad trocam **um** ambiente por gesto, com o conteúdo acompanhando o dedo antes da troca.
- [x] Rolagem vertical sobre a barra não troca de ambiente.
- [x] `Super+Ctrl+→` troca de ambiente com uma janela do navegador focada, e `Alt+←` continua voltando a página.
- [x] Trocar de ambiente com `wifi` aberto não mexe na ilha. Com a ilha compacta, abre `env` por 1500ms.
- [x] O ambiente ativo e as mudanças sobrevivem a lock/unlock e a reiniciar a sessão.
