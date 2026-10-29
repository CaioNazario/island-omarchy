# 02 · Barra

Origem: `design/markup.html` container `barRef`, pílula esquerda (`dropLeft`) e direita (`dropRight`); `design/logic.js` objeto `gTop` (medidas da barra no topo) e `laneW`/`laneH`/`lanePad`.

## Layout

- Container no topo de cada monitor: `left: 12px`, `right: 12px`, `top: 2px` (era 0 até o design v3), três filhos em linha com `gap: 6px`, alinhados pelo topo (a ilha cresce para baixo sem mover as laterais).
- **Pílulas laterais**: dividem igualmente o espaço que sobra da ilha (`flex: 1 1 0`); altura 26px, raio 13px, fundo `bg` com o acabamento do v5 (brilho, halo do acento, `SOFT_IN` e `SOFT_OUT`, spec 01 "Superfícies"), padding horizontal 6px. O blur do design é opcional (spec 19 "Blur").
- **Ilha**: largura/altura/raio do modo atual (spec 03), centralizada entre as laterais.

### Pílula esquerda

Botão de ambiente (spec 15) e, com gap 4px, a área de widgets do ambiente ativo **alinhada à direita** (encostada na ilha). Spec 16.

### Pílula direita

Da esquerda para a direita:

1. Área de widgets do ambiente ativo, **alinhada à esquerda** (encostada na ilha), ocupando o espaço livre. Spec 16.
2. Sino (`ph-fill ph-bell` 16px) com ponto de não lido 7×7 `accent` + anel 2px `bg`, em `top: 5px; right: 8px`. Abre `stack`.
3. Wi‑Fi (`ph-bold ph-wifi-high` / `ph-bold ph-wifi-slash` quando desligado). Abre `wifi`. Sem placa Wi‑Fi, some (como o tile e o modo, spec 08).
4. Volume (ícone conforme nível, spec 08). Abre o `mixer`; a rolagem muda o volume (spec 08 "Modo `mixer`").
5. Bateria (desenho com o nível dentro, spec 11). Abre `battery`.
6. Seta `ph ph-caret-down` 12px `neutral-300`. Abre `quick`.

Botões: 30×22, raio 11px, fundo transparente, hover `neutral-900`, gap 2px entre eles.

Clicar num gatilho cujo modo já está aberto fecha a ilha (`openFromBar`).

## Largura mínima

- Suporte a partir de **1280px lógicos** por monitor.
- Botão de ambiente e botões fixos da pílula direita nunca somem. Quando os widgets não cabem, a regra de corte é a da spec 16 (primeiro NET → GPU → TEMP do hardware, depois widgets inteiros, do mais longe da ilha para o mais perto).

## Superfícies

Cada monitor tem duas superfícies layer-shell (`plugin/ui/ScreenBar.qml`):

- **Faixa** (`island-strut`, camada `Bottom`): 28px no topo, transparente, sem entrada (`mask` vazia). Só reserva o espaço.
- **Camada** (`island`, camada `Top`): tela cheia, transparente, `ExclusionMode.Ignore`. Desenha pílulas, ilha e banner. A `mask` é a união dos retângulos das pílulas e da ilha, então o resto da tela recebe cliques normalmente.

Uma superfície só não serve: ancorada nas quatro bordas (para a ilha crescer para baixo), o layer-shell ignora a zona exclusiva.

## Monitores

- Uma barra por monitor (`Variants` sobre `Quickshell.screens`), criada e removida quando monitores entram/saem.
- Existe **um** estado de ilha (`IslandState` no `Bar.qml`). Ao abrir um modo, a ilha do monitor-alvo expande e as outras ficam em `compact`:
  - clique numa barra → monitor daquela barra
  - modos transitórios (notificação, música, volume, brilho) e atalhos → monitor focado no Hyprland (`Hyprland.focusedMonitor`; o primeiro da lista se não houver)

## Tela cheia e lock

- Monitor com janela em tela cheia: a barra daquele monitor some. O Hyprland desenha a janela em tela cheia acima da camada `Top`.
- Tela de bloqueio: o `WlSessionLock` do Omarchy cobre tudo, a barra continua carregada por baixo e nada dela aparece.

## Espaço reservado

A faixa reserva 28px no topo de cada monitor (2px de margem + 26px); janela maximizada começa em y=28. Com auto-ocultar ligado, não reserva nada (spec 18).

## Clique fora

Com modo fixo (`stack`, `calendar`, `quick`, `wifi`, `bt`, `ai`, `note`, `music` fixado) ou cartão central aberto, a camada do monitor-alvo troca a `mask` pela tela inteira e pega o foco de teclado (`WlrKeyboardFocus.Exclusive`). Um clique em qualquer ponto fora da ilha/cartão fecha tudo e é **consumido** (não chega à janela embaixo).

## Critérios de aceite

- [x] As duas laterais têm sempre a mesma largura e a ilha fica centralizada no monitor.
- [ ] Maximizar uma janela a deixa encostada em y=28 sem sobrepor a barra.
- [ ] Em 1280px lógicos com a ilha em `wifi` (660px) e o ambiente Trabalho, nenhum texto da barra é cortado (widgets somem inteiros, spec 16).
- [ ] Conectar/desconectar um segundo monitor cria/remove a barra dele sem reiniciar o shell.
- [ ] Uma janela em tela cheia esconde a barra só no monitor dela.
- [ ] Clique fora de um modo fixo fecha a ilha e não ativa a janela clicada.
