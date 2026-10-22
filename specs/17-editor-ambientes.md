# 17 · Editor de ambientes

Origem: `design/markup.html` bloco `editing` (`envTabs`, `envNameVal`, `envIcons`, `delEnv`, `hasSel`/`noSel`, `catalog`, `setTargetLeft`/`setTargetRight`, `toggleAutoHide`); `design/logic.js` `placeW`, `openEditor`/`closeEditor`, `selPrev`/`selNext`/`selMove`/`selRemove`, `addEnv`, `delEnv`, `laneSh`.

Painel na camada da barra (a mesma `PanelWindow` de tela cheia onde a ilha cresce) para criar, editar e excluir ambientes e escolher os widgets (specs 15 e 16). As regras de mover e inserir widget ficam em `src/core/environments.ts` (`placeWidget` segue `placeW`) e `src/core/environmentEditor.ts` (renomear, ícone, ‹ ›, trocar de pílula, rótulo da seleção, índice do soltar). O estado (aberto, pílula-alvo, selecionado) mora no `Bar.qml`; a UI em `EditorPanel.qml`, `EditorSelection.qml`, `EditorCatalog.qml`, `EditorDragArea.qml` e `EditorDragProxy.qml`.

## Abrir e fechar

- Abre pelo clique no botão de ambiente (spec 15), no monitor daquela barra. Ao abrir, a ilha volta a `compact` e fecha tudo que estiver aberto.
- Fecha por "Concluir", Esc, clique no fundo escurecido ou novo clique no botão de ambiente.
- Toma o foco de teclado (`WlrKeyboardFocus.Exclusive` e a camada inteira como máscara, como um modo fixo) enquanto aberto. A barra continua clicável por cima do fundo. Esc com um modo da ilha aberto fecha o modo; com a ilha em `compact`, fecha o editor.

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

Ainda não existe: o auto-ocultar (spec 18) não está implementado na barra, e a linha só entra junto com ele. Quando entrar:

- Linha clicável inteira, padding 10px 12px, raio 12, `neutral-900`, hover `neutral-800`: `ph ph-eye-slash` 16px `neutral-300`; "Ocultar barra automaticamente" 12.5px/500 + "A barra some e reaparece quando o ponteiro encosta na borda de cima da tela" 11px `neutral-500`; switch 32×18 (ligado: trilho `accent-800`, anel `accent`, bolinha `accent-200` em 16px; desligado: trilho `neutral-800`, bolinha `neutral-400` em 2px; 200ms).
- A linha "Posição da barra" do design não existe: a barra fica só no topo (spec 00).

## Tema

Linha com "Tema" 13px/500 e duas opções de 30px (`ChoiceButton`, ativa `accent-900` com anel `accent-700`): Nocturne e Alto contraste. Vale para a barra inteira, não por ambiente; troca na hora (spec 01 "Temas"). Não existe no design, onde o tema é uma opção do protótipo.

Logo abaixo, a linha "Realce" com as mesmas opções de 30px: Roxo e Branco (spec 01 "Realce"). Também vale para a barra inteira e troca na hora. Os rótulos "Tema" e "Realce" têm a mesma largura, então as opções das duas linhas alinham.

## Rodapé

`ph ph-hand-swipe-left` 15px + "Deslize com dois dedos sobre a barra para trocar de ambiente. No teclado: Super+Ctrl+Alt+← / Super+Ctrl+Alt+→." 11.5px `neutral-500`.

## Barra durante a edição

- Widgets: anel 1px `neutral-800` e cursor de arrastar. Clique **seleciona** (não executa a ação do widget). Selecionado: `accent-900` + anel `accent`.
- Pílula-alvo: anel 1px `accent` com brilho `accent` 22% de 18px. A outra: anel 1px `neutral-700`. Clique no espaço vazio de uma pílula a torna alvo e limpa a seleção.
- Pílula vazia: "Solte widgets aqui" 11.5px `neutral-500`, padding 0 10px.
- A pílula-alvo começa na esquerda a cada abertura.

## Arrastar e soltar

- Do catálogo para uma pílula: solto sobre um widget, entra na posição dele; solto no espaço livre, vai para o fim.
- Da barra para a barra: reordena ou troca de pílula, pelas mesmas regras.
- Mover ou adicionar seleciona o widget movido e torna alvo a pílula de destino.
- Soltar fora de uma pílula cancela.

Em QML, sem o arraste do sistema (o layer-shell não tem onde soltar fora da janela):

- Origem: `EditorDragArea` (um `MouseArea`) em cada widget da barra e em cada cartão livre do catálogo. Toma o clique (o widget não executa a ação dele); passando de 6px, liga o `Drag` do `EditorDragProxy`, um chip `accent-900` com ícone e nome do widget que segue o ponteiro em coordenadas da janela. O widget da barra não se move: a origem pode ser recriada quando o ambiente for gravado.
- Alvo: uma `DropArea` (chave `island-widget`) em cada `WidgetArea`. O índice é o do widget sob o ponteiro, pela caixa de cada slot na área (`dropIndex`); fora de qualquer widget, o fim. Widget cortado por falta de espaço tem caixa vazia e nunca é alvo, mas conta na lista de ids do ambiente.
- A gravação depois de um soltar vai para um `Qt.callLater`: gravar dentro do `onDropped` reconstrói a área e destrói a origem no meio do sinal.

## Critérios de aceite

- [x] Testes de `placeWidget` e de `environmentEditor.ts`: inserir no fim, antes de um widget, reordenar para frente/para trás, trocar de pílula, widget já presente não duplica, ‹ › no limite, índice do soltar no espaço livre.
- [x] Criar, renomear, trocar ícone e excluir ambiente, e adicionar, mover e remover widget gravam no `settings.json` e refletem na barra (visto no `make dev` pelo IPC `dev editorDo`).
- [x] O Padrão não mostra "Excluir ambiente"; com 6 ambientes, "Novo" some.
- [ ] Clicar num widget da barra seleciona; arrastar um widget do catálogo para a pílula direita e reordenar na barra funcionam (o aninhado não simula ponteiro: conferir na sessão).
- [ ] Esc e clique no fundo fecham o editor; clique no fundo não chega à janela embaixo.
