# 18 · Auto-ocultar (a fazer)

Origem: `design/logic.js` `autoHide`/`autoHideOn`, `hidden`, `barTf`/`hid`, `reveal`/`unreveal`, `toggleAutoHide`, `ahDesc`; `design/markup.html` faixa `reveal` (`rvInset`/`rvH`) e `transform:{{ barTf }}` da barra.

Opcional, desligado por padrão. Liga pelo editor (spec 17, linha 5) e fica na chave `autoHide` do `settings.json` (spec 13). As regras de quando a barra aparece e some estão em `src/core/autoHide.ts`; a barra ainda não as usa.

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

O design usa uma faixa sensível de 6px no topo. Isso roubaria o clique da primeira linha de pixels das janelas maximizadas (abas do navegador encostadas no topo): revelar precisa de pressão contra a borda, não de só encostar. Como fazer isso no Hyprland ainda é um spike.

## Por monitor

- Cada barra esconde e aparece por conta própria. A barreira e o ponteiro valem por monitor.
- A ilha aberta num monitor mostra só a barra daquele monitor.
- Tela cheia continua escondendo a barra do monitor (spec 02), com auto-ocultar ligado ou não.

## Desligado

Comportamento da spec 02: a barra sempre visível e reservando 28px.

## Critérios de aceite

- [ ] Ligar no editor tira o strut na hora: uma janela maximizada passa a começar em y=0. Desligar devolve os 28px.
- [ ] Clicar numa aba do navegador maximizado encostada no topo não revela a barra. Empurrar o ponteiro contra a borda revela.
- [ ] Notificação chegando com a barra escondida mostra a barra junto com o `notif` e esconde de novo depois.
- [ ] `Super+S` com a barra escondida mostra a barra com `quick` aberto.
- [ ] Lock/unlock com auto-ocultar ligado não deixa barreira nem strut para trás.
