# 17 · Editor de ambientes

Origem: `design/markup.html` bloco `editing` (`envTabs`, `envNameVal`, `envIcons`, `delEnv`, `hasSel`/`noSel`, `catalog`, `setTargetLeft`/`setTargetRight`, `toggleAutoHide`); `design/logic.js` `placeW`, `openEditor`/`closeEditor`, `selPrev`/`selNext`/`selMove`/`selRemove`, `addEnv`, `delEnv`, `laneSh`.

Painel dentro do Shell para criar, editar e excluir ambientes e escolher os widgets (specs 15 e 16). As regras de mover e inserir widget ficam em `src/core/environments.ts` (`placeWidget` segue `placeW`).

## Abrir e fechar

- Abre pelo clique no botão de ambiente (spec 15), no monitor daquela barra. Ao abrir, a ilha volta a `compact` e fecha tudo que estiver aberto.
- Fecha por "Concluir", Esc, clique no fundo escurecido ou novo clique no botão de ambiente.
- Toma o foco de teclado (grab modal) enquanto aberto. A barra continua clicável por cima do fundo.

## Fundo e painel

- Fundo: tela inteira, `bg` com 50% de opacidade, sem o blur de 2px do design.
- Painel: centralizado, 880px, `top: 48px`, padding 16px, raio 20, `bg` com 94% de opacidade, anel 1px `neutral-800`, sem blur e sem sombra (spec 03, "Animação"). Colunas com gap 14px.

## Linha 1: ambientes

- "Ambientes" 14px/500 (margin-right 8px).
- Uma aba por ambiente: 30px, padding 0 12px, raio 15, gap 7px, ícone 14px + nome 12.5px.
  - Ativa: `accent-900`, anel `accent-700`, texto `accent-100`.
  - Inativa: `neutral-900`, texto `neutral-300`, hover `neutral-800`.
  - Sem o chip `Alt+N` do design (não há atalho numerado, spec 15).
  - Clique troca de ambiente (com animação e modo `env`, spec 15).
- **Novo** (só com menos de 6): 30px, anel `neutral-800`, `ph ph-plus` 13px, `neutral-300`. Cria "Ambiente N" com o ícone `ENV_ICONS[n % 9]`, pílulas vazias, e troca para ele.
- **Concluir** à direita: `.btn-primary`, 30px, 12.5px.

## Linha 2: ambiente ativo

- Nome: campo 240×34, raio 10, `neutral-900`, anel `neutral-800`, `ph ph-pencil-simple` 14px `neutral-400`, 12.5px, placeholder "Nome do ambiente", até 20 caracteres. Grava enquanto digita. Vazio aparece como "Sem nome".
- Ícones: os 9 de `ENV_ICONS`, 32×32 raio 10. Escolhido: `accent-900`, anel `accent-700`, `accent-200`. Outros: transparente, `neutral-400`, hover `neutral-900`.
- **Excluir ambiente** à direita: `ph ph-trash` 14px + texto 12px `#ff958d`, hover `neutral-900`. Some no Padrão. Exclui na hora, sem confirmação, e vai para o ambiente anterior.

## Linha 3: seleção

Faixa de 40px, raio 12, `neutral-900`, padding 0 8px 0 12px.

- **Sem seleção**: `ph ph-cursor-click` 15px + "Clique num widget da barra para mover ou remover. Arraste da lista para uma pílula, ou reordene arrastando na própria barra." 12px `neutral-400`.
- **Com seleção**: ícone do widget 16px `accent-300` · nome 12.5px/500 · "Pílula esquerda · 2 de 3" 11.5px `neutral-500` · à direita:
  - ‹ e › 28×28, raio 14: movem uma posição (opacidade .35 no limite).
  - "Mover para a direita"/"Mover para a esquerda" (`ph ph-arrows-left-right` 13px, `neutral-800`, 11.5px): passa o widget para o fim da outra pílula.
  - "Remover" (`ph ph-minus-circle`, `#ff958d`): tira o widget do ambiente e limpa a seleção.

## Linha 4: catálogo

- Cabeçalho: "Widgets" 13px/500 + chip "N em uso" (11px, padding 1 7, raio 9, `neutral-900`). À direita, "Adicionar em" 11.5px `neutral-400` + seletor de duas opções **Esquerda | Direita** (22px, raio 11; escolhida `accent-800`/`accent-100`, outra `neutral-400`) que define a **pílula-alvo**.
- Grade de 4 colunas, gap 6px, um cartão por widget do catálogo (spec 16):
  - Cartão: padding 9px 10px, raio 12, `neutral-900`, hover `neutral-800`.
  - Conteúdo: bloco 30×30 raio 9 `accent-900` com ícone 16px `accent-300` · nome 12.5px/500 e descrição 11px `neutral-500`, ambos com reticências · marca 13px.
  - Fora do ambiente: marca `ph ph-plus` `neutral-400`, arrastável. Clique adiciona ao fim da pílula-alvo.
  - Já no ambiente: marca `ph-fill ph-check-circle` `accent-400`, opacidade .45, sem clique nem arraste.

## Linha 5: auto-ocultar

Linha clicável inteira, padding 10px 12px, raio 12, `neutral-900`, hover `neutral-800`:

- `ph ph-eye-slash` 16px `neutral-300`.
- "Ocultar barra automaticamente" 12.5px/500 + "A barra some e reaparece quando o ponteiro encosta na borda de cima da tela" 11px `neutral-500`.
- Switch 32×18: ligado com trilho `accent-800`, anel `accent` e bolinha `accent-200` em 16px; desligado com trilho `neutral-800` e bolinha `neutral-400` em 2px; 200ms.

Comportamento na spec 18. A linha "Posição da barra" do design não existe: a barra fica só no topo (spec 00).

## Rodapé

`ph ph-hand-swipe-left` 15px + "Deslize com dois dedos sobre a barra para trocar de ambiente. No teclado: Super+Ctrl+← / Super+Ctrl+→." 11.5px `neutral-500`.

## Barra durante a edição

- Widgets: anel 1px `neutral-800` e cursor de arrastar. Clique **seleciona** (não executa a ação do widget). Selecionado: `accent-900` + anel `accent`.
- Pílula-alvo: anel 1px `accent` com brilho `accent` 22% de 18px. A outra: anel 1px `neutral-700`. Clique no espaço vazio de uma pílula a torna alvo e limpa a seleção.
- Pílula vazia: "Solte widgets aqui" 11.5px `neutral-500`, padding 0 10px.
- A pílula-alvo começa na esquerda a cada abertura.

## Arrastar e soltar

Com o `dnd.js` do Shell (spike S5):

- Do catálogo para uma pílula: solto sobre um widget, entra na posição dele; solto no espaço livre, vai para o fim.
- Da barra para a barra: reordena ou troca de pílula, pelas mesmas regras.
- Mover ou adicionar seleciona o widget movido e torna alvo a pílula de destino.
- Soltar fora de uma pílula cancela.

API medida no spike S5 (Shell 50):

- Origem: `DND.makeDraggable(actor, {})` em cada widget da barra e em cada cartão do catálogo. O `actor._delegate` leva o id e a pílula de origem (ou catálogo), mais `getDragActor()` (um ator leve novo, não o widget) e `getDragActorSource()` (o próprio ator).
- Alvo: o `WidgetArea` de cada pílula, com `_delegate.handleDragOver(source, actor, x, y)` devolvendo `DND.DragMotionResult.MOVE_DROP` e `_delegate.acceptDrop(source, actor, x, y)` devolvendo `true`. O `x` vem local à área.
- Camadas: editor em `Main.layoutManager.modalDialogGroup` com `Main.pushModal(Main.uiGroup, { actionMode: Shell.ActionMode.POPUP })`. O drop acha o `WidgetArea` dentro de `Pill`/`RightPill` na barra, e arrastar a partir da barra funciona com o grab ativo.
- Gravar o ambiente dentro do `acceptDrop` reconstrói os widgets da área e destrói a origem no meio do arraste: a gravação vai para um `GLib.idle_add`.
- Índice de destino: o do widget sob o ponteiro (pela caixa alocada); fora de qualquer widget, o fim. Calcular pelo meio do widget mais próximo manda o espaço livre da pílula esquerda (que fica antes dos widgets) para o começo, contra a regra acima. O índice é sempre na lista de ids do ambiente, contando os widgets cortados por falta de espaço.
- Não medido: se o `clicked` do `St.Button` continua chegando com o `makeDraggable` no mesmo ator (o clique seleciona/adiciona).

## Critérios de aceite

- [x] Testes de `placeWidget`: inserir no fim, antes de um widget, reordenar para frente/para trás na mesma pílula (ajuste de índice), trocar de pílula, widget já presente não duplica.
- [x] Criar, renomear, trocar ícone e excluir ambiente reflete na barra na hora e sobrevive a lock/unlock.
- [x] O Padrão não mostra "Excluir ambiente"; com 6 ambientes, "Novo" some.
- [x] Arrastar um widget do catálogo para a pílula direita e reordenar na barra funcionam sem deixar ator órfão (Looking Glass).
- [x] Esc e clique no fundo fecham o editor; clique no fundo não chega à janela embaixo.
