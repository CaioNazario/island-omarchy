# 15 · Ambientes

Origem: `design/logic.js` `DEFAULT_ENVS`, `ENV_ICONS`, `loadEnvs`, `switchEnv`/`goEnv`, `wheel`, `envDots`, `envIcon`/`envName`, `slideTf`/`slideO`/`slideT`, `SIZES.env`, `TRANSIENT.env`, atalhos em `onKey` (`e.altKey`); `design/markup.html` botão `openEditor` (início da pílula esquerda) e camada `L.env`.

Um **ambiente** é um conjunto nomeado de widgets para as duas pílulas laterais. Só um está ativo por vez, igual em todos os monitores. Os widgets estão na spec 16; o editor, na spec 17.

## Modelo

Regra pura em `src/core/environments.ts`:

- Ambiente = nome (até 20 caracteres), ícone (um dos 9 de `ENV_ICONS`), lista de widgets da pílula esquerda e lista da direita.
- Um widget aparece no máximo uma vez por ambiente (em uma das duas pílulas). Ambientes diferentes podem repetir widgets.
- Um widget é do catálogo da Island (spec 16) ou de outro plugin do Omarchy, com o id `plugin:<id do manifesto>` (spec 16 "Widgets de plugins"). O id do plugin segue o formato do `omarchy-plugin-validate` (`^[A-Za-z0-9][A-Za-z0-9._-]*$`, até 64 caracteres).
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

O Padrão tem IA à esquerda e hardware à direita.

### Persistência

`settings.json` `environments` e `environmentIndex` (spec 13). Ao ler (`environmentsFromJson`, que antes descarta entradas fora da forma), `environments.ts` saneia o valor: descarta widget desconhecido ou repetido (o de plugin fica mesmo com o plugin ausente ou carregando: só não é desenhado) e ícone desconhecido (vira `ph-house`), corta nomes em 20 caracteres e a lista em 6, e usa os ambientes iniciais se a lista vier vazia ou inválida. Índice fora da faixa vira 0. Toda mudança grava na hora.

## Troca de ambiente

Troca circular: depois do último vem o primeiro.

| Gatilho | Efeito |
|---|---|
| Rolagem horizontal (dois dedos no touchpad) sobre a barra | próximo/anterior conforme o sentido |
| Roda inclinada (`SCROLL_LEFT`/`SCROLL_RIGHT` com origem `WHEEL`) sobre a barra | próximo/anterior, um passo por clique |
| `Super+Ctrl+Alt+→` / `Super+Ctrl+Alt+←` | próximo / anterior, de qualquer lugar |
| Clique num ponto do botão de ambiente | vai direto para aquele ambiente |
| Aba no editor (spec 17) | vai direto para aquele ambiente |

Atalhos numerados (`Alt+1–N` do design) não existem. `Alt+←/→` do design também não: roubaria o "voltar" do navegador. Os atalhos são binds do Hyprland para o alvo IPC `island` (`nextEnvironment`/`previousEnvironment`), em `hypr/island.lua`, que o `install.sh` instala (spec 03 "Atalho"). `Super+Ctrl+←/→` não serve: no Omarchy 4.0.4 troca a janela do grupo (`default/hypr/bindings/tiling.lua`), e `Super+Alt+←/→` move a janela para o grupo. `Super+Ctrl+Alt+←/→` não tem bind padrão.

### Rolagem suave

Só conta rolagem com componente horizontal maior que a vertical; o resto passa adiante. A regra é o `EnvironmentScroll` do core, com a unidade "clique de roda": um passo ≈ 10px de dedo, e a troca acontece acima de **11** (os 110px do design).

- O `WheelHandler` de cada pílula tem `orientation: Qt.Horizontal`: o padrão do Qt é vertical, e com ele o deslize horizontal de dois dedos nunca chegava ao código.
- No Qt, o touchpad chega com `pixelDelta` e fase (`phase`); cada evento vira `{dx: −pixelDelta.x/10, dy: −pixelDelta.y/10}` e `ScrollEnd` é o fim do gesto, que zera o acumulado e destrava.
- Enquanto não troca, o conteúdo das duas pílulas acompanha o dedo: deslocamento `−acumulado × 5`px, limitado a ±56px, sem animação.
- Passou de 11: troca e trava até o fim do gesto. Ir e voltar sem soltar troca só uma vez.
- Roda inclinada: só `angleDelta.x` (120 por clique), um passo por clique.

Não medido no Hyprland: o sinal do eixo com rolagem natural ligada e o tamanho real de um gesto no touchpad. Ajustar com o critério abaixo.

## Animação da troca

Anima só o conteúdo de widgets das duas pílulas. Botão de ambiente e botões fixos da pílula direita não se mexem. `d` = +1 para frente, −1 para trás (no clique em ponto, o sinal de destino − atual).

1. Saída: o conteúdo vai a `translateX(−d·44px)` e opacidade 0, 160ms ease-in.
2. Troca o conteúdo e posiciona em `translateX(d·44px)` sem animação.
3. Entrada: vai a 0 em 340ms na curva `cubic-bezier(.2,.9,.25,1)` (`set_cubic_bezier_progress`, como na spec 01), opacidade 1 em 240ms ease.

Trocar de novo durante a animação cancela a anterior e parte do estado atual.

## Botão de ambiente (início da pílula esquerda)

- Altura 22, padding 0 8px, raio 11, gap 7px, hover `neutral-900` (fundo `neutral-900` com o editor aberto).
- Ícone do ambiente 14px `accent-300` + pontos (gap 3px): um por ambiente, 4px de altura, raio 2; o ativo tem 12px de largura e é `accent`, os outros 4px e `neutral-700`. Largura e cor animam em 250ms.
- Clique no botão abre/fecha o editor (spec 17, ainda não portado). Clique num ponto troca de ambiente e não abre o editor.

## Modo `env` (260 × 32, raio 16, transitório 1500ms)

- Aparece em toda troca pedida (rolagem, ponto, atalho, editor), **só** se a ilha estiver em `compact` ou já em `env` (rearma o timer). Com outro modo aberto, a troca acontece sem mexer na ilha. Mudança de índice que não foi pedida (a barra achando o serviço no hot-reload, o arquivo editado por fora) troca o conteúdo sem mostrar `env`.
- Conteúdo centralizado, gap 9px: ícone do ambiente 16px `accent-300` · nome 13px/500 · pontos (mesma regra do botão, sempre horizontais).
- Não recebe clique nem hover (no design, `pointer-events: none`). Clicar na ilha em `env` não faz nada.

## Critérios de aceite

- [x] Testes de `environments.ts`: saneamento (widget desconhecido, repetido, ícone inválido, lista vazia, mais de 6, nome longo, forma inválida no JSON), troca circular nos dois sentidos, índice inválido, Padrão não excluível.
- [ ] Dois dedos para a esquerda no touchpad trocam **um** ambiente por gesto, com o conteúdo acompanhando o dedo antes da troca.
- [ ] Rolagem vertical sobre a barra não troca de ambiente.
- [ ] `Super+Ctrl+Alt+→` troca de ambiente com uma janela do navegador focada, e `Alt+←` continua voltando a página.
- [x] Trocar de ambiente pelo IPC com a ilha compacta abre `env` e anima as pílulas (captura no `make dev`).
- [ ] O ambiente ativo e as mudanças sobrevivem ao hot-reload e a reiniciar o shell.
