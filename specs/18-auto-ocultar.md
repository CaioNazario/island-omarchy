# 18 · Auto-ocultar

Origem: `design/logic.js` `autoHide`/`autoHideOn`, `hidden`, `barTf`/`hid`, `reveal`/`unreveal`, `toggleAutoHide`, `ahDesc`; `design/markup.html` faixa `reveal` (`rvInset`/`rvH`) e `transform:{{ barTf }}` da barra.

Opcional, desligado por padrão. Liga pelo editor (spec 17, linha 5) e fica na chave GSettings `auto-hide` (spec 13).

## Ligado

- A barra **não reserva** espaço: sem strut, janela maximizada começa em y=0.
- **Escondida**: a barra inteira (pílulas e ilha) sobe 60px, 320ms na curva `cubic-bezier(.2,.8,.2,1)`. Fica sem reação a clique enquanto escondida.
- **Aparece** quando qualquer destes vale, e fica visível enquanto valer:
  - o ponteiro foi revelado na borda de cima daquele monitor (abaixo) e ainda está sobre a barra
  - a ilha não está em `compact` (qualquer modo, inclusive transitórios como `notif`, `volume` e `env`) ou o cartão central está aberto
  - o editor de ambientes está aberto
  - o overview está aberto
- **Some de novo** quando nada disso vale: o ponteiro saiu da barra e a ilha voltou a `compact`.
- Ligar o switch deixa a barra visível até o ponteiro sair dela, para não sumir debaixo do cursor.

## Revelar pela borda

O design usa uma faixa sensível de 6px no topo. No Shell, isso roubaria o clique da primeira linha de pixels das janelas maximizadas (abas do navegador encostadas no topo). A Island usa uma **barreira de pressão** no topo de cada monitor (`Layout.PressureBarrier` do Shell, o mesmo mecanismo do canto ativo): empurrar o ponteiro contra a borda revela a barra, e só encostar não. 
API medida no spike S9 (Shell 50, um monitor 1920×1080):

- Uma `Meta.Barrier({ backend: global.backend, x1: monitor.x, x2: monitor.x + monitor.width, y1: monitor.y, y2: monitor.y, directions: Meta.BarrierDirection.POSITIVE_Y })` por monitor, dentro de um `Layout.PressureBarrier(100, 1000, Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW)` (os valores do canto ativo); o sinal `trigger` revela a barra. O `PressureBarrier` existe no runtime mas não está nos tipos do `@girs/gnome-shell`.
- Funciona sem strut e com janela maximizada encostada em y=0. Clicar nas abas do navegador maximizado não dispara; empurrar contra a borda dispara. Não briga com o canto ativo.
- Recriar o `PressureBarrier` e a barreira no `monitors-changed`; no disable, `destroy()` nos dois.
- Não medido: dois monitores (sem segundo monitor para testar).

## Por monitor

- Cada barra esconde e aparece por conta própria. A barreira e o ponteiro valem por monitor.
- A ilha aberta num monitor mostra só a barra daquele monitor.
- Tela cheia continua escondendo a barra do monitor (spec 02), com auto-ocultar ligado ou não.

## Desligado

Comportamento da spec 02: a barra sempre visível e reservando 32px.

## Critérios de aceite

- [x] Ligar no editor tira o strut na hora: uma janela maximizada passa a começar em y=0. Desligar devolve os 32px.
- [x] Clicar numa aba do navegador maximizado encostada no topo não revela a barra. Empurrar o ponteiro contra a borda revela.
- [x] Notificação chegando com a barra escondida mostra a barra junto com o `notif` e esconde de novo depois.
- [x] `Super+S` com a barra escondida mostra a barra com `quick` aberto.
- [x] Lock/unlock com auto-ocultar ligado não deixa barreira nem strut para trás.
