# 04 · Notificações

Origem: `design/logic.js` `pushNotif`, `stack`/`latest`/`unreadDot`/`openPeek`; `design/markup.html` modos `notif` e `stack` e o banner.

Código: `plugin/system/NotificationFeed.qml` (no `Service.qml`), roteamento no `Bar.qml`, views `NotificationCard.qml`, `StackView.qml`, `Banner.qml`.

## Fonte

- A Island é o servidor de notificações da sessão: um `NotificationServer` (Quickshell) no `Service.qml` é dono de `org.freedesktop.Notifications`, com `omarchy.notifications` desligado (spec 14, S7). Os toasts do Omarchy não existem enquanto a Island está ativa.
- A lista vive no serviço (`keepLoaded`): sobrevive ao hot-reload da barra e ao lock. Não sobrevive ao reinício do shell (o servidor some junto).
- Cada notificação fica `tracked` (senão o objeto morre ao fim do handler). Atualização por `replaces_id` chega no mesmo objeto e atualiza o item. Quando o app fecha a notificação (`closed`), o item sai da lista.
- Hint `transient`: aparece (`notif`/banner) mas não entra na lista.
- O alvo IPC `notifications` tem o contrato do Omarchy (spec 14, S7): `toggleDnd`/`setDnd`/`isDnd`/`dndState`, `showHistory` (abre `stack`), `clear`/`dismissAll` (limpa a lista), `dismissOne` (a mais recente), `invokeLast` (ação padrão da mais recente), `dismiss <trecho do título>`, `ping`. Os atalhos `Super+vírgula` do Omarchy seguem funcionando.
- O alvo IPC `island` tem `openStack` e `closeStack`, para os gestos de três dedos do Hyprland:
  - `openStack` (três dedos para baixo) abre `stack` no monitor focado. Com `stack` já aberto, não faz nada: repetir o gesto não fecha a lista.
  - `closeStack` (três dedos para cima) volta a `compact` só se o modo for `stack`. Em outro modo, não faz nada.
  - Os dois gestos vêm em `hypr/island.lua`, que o `install.sh` instala (spec 03 "Atalho").

## Identificação da origem

Regra pura em `src/core/notificationSource.ts`, com a tabela como constante no mesmo módulo. Mudar a tabela exige atualizar o plugin.

1. **Notificação de navegador** (app Brave, Google Chrome, Chromium): o Chromium põe o domínio de origem na primeira linha do corpo, seguido de uma linha em branco (`"web.whatsapp.com\n\noi"`, payloads reais do Brave e do Chrome, fixtures nos testes). O Chromium foi assumido pelo mesmo código, sem payload colhido. Com `body-markup`, o domínio pode vir dentro de um `<a>`. Se a primeira linha não for um domínio (com porta opcional), a notificação fica como app nativo. O **Firefox** não manda a origem em nenhum campo nem hint (só `app_name` "Firefox", título e corpo), então a notificação web dele fica como app nativo.
2. Domínio na tabela → nome + ícone da tabela:

   | Domínio | Nome | Ícone |
   |---|---|---|
   | `music.youtube.com` | YouTube Music | `ph-fill ph-youtube-logo` |
   | `youtube.com` | YouTube | `ph-fill ph-youtube-logo` |
   | `open.spotify.com` | Spotify | `ph-fill ph-spotify-logo` |
   | `web.whatsapp.com` | WhatsApp | `ph-fill ph-whatsapp-logo` |

   A comparação ignora `www.` e casa o subdomínio mais específico primeiro.
3. Domínio fora da tabela → nome = rótulo principal do domínio registrável, capitalizado (`twitch.tv` → "Twitch", `www.github.com` → "Github"); ícone `ph ph-globe`. Sem a Public Suffix List: uma lista curta de sufixos de segundo nível (`com.br`, `co.uk`…) evita que `globo.com.br` vire "Com".
4. A linha do domínio é removida do texto exibido. Nunca mostrar "Brave" nem `www.youtube.com`.
5. **App nativo**: nome do app; ícone simbólico do tema (`<ícone>-symbolic`, por `Quickshell.iconPath`) tingido de `accent-300`, ou `ph-fill ph-bell` se o tema não tiver o simbólico ou o ícone for um caminho de arquivo.

## Roteamento de uma notificação nova

| Estado da ilha | Resultado |
|---|---|
| `compact` sem cartão aberto | abre `notif` (2500ms; 2100ms se o app for navegador: Brave, Google Chrome, Chromium ou Firefox) |
| `notif` | troca o conteúdo pela nova e rearma o timer |
| `stack` | entra no topo da lista com fundo `accent-900` por 2500ms (transição 600ms) |
| qualquer outro modo, ou cartão central aberto | **banner** abaixo da ilha; nada aberto é substituído |

Toda notificação nova acende o ponto de não lido do sino.

### Não perturbe

O não perturbe é da Island (tile da spec 08 e IPC `notifications`), guardado em `$XDG_STATE_HOME/island/state.json` para sobreviver ao reinício do shell. Ligado, a notificação vai direto para a lista, sem abrir `notif` nem banner. Urgência **crítica** fura o DND e segue a tabela acima; `notif` de notificação crítica não fecha sozinho.

Notificação de urgência **baixa** vai só para a lista.

## Modo `notif` (400×48)

Padding 0 10px 0 8px, gap 10px:
- Bloco do ícone 32×32, raio 16 (círculo), fundo `accent-900`, ícone 17px `accent-300`.
- Linha 1: nome 13px/500 + tempo 11px `neutral-500` à direita. Linha 2: texto 12px `neutral-400`, uma linha com reticências.
- × 24×24, raio 12, fundo `neutral-900`: fecha a ilha (a notificação continua na lista).
- Clicar no resto da ilha abre `stack`.

## Modo `stack` (lista)

- Padding 12px. Cabeçalho 28px: `ph-fill ph-bell` 14px `neutral-300`, "Notificações" 13px/500, chip com a contagem (11px, padding 1 7, raio 9, `neutral-900`), e "Limpar tudo" à direita (24px de altura, raio 12, `neutral-900`, 11px; some com a lista vazia).
- Itens de 50px, raio 12, padding 0 6px, gap 2px entre itens, hover `neutral-900`. Bloco do ícone 32×32 raio 9, ícone 18px. × 22×22 transparente `neutral-500` (título "Dispensar").
- Mostra as **8 mais recentes**, 6 visíveis, com rolagem fina.
- Vazia: 72px, `ph ph-bell-slash` 16px + "Nenhuma notificação" 12.5px `neutral-500`.
- Abrir a lista (pelo sino, pelo `notif` ou pelo banner) marca tudo como lido.
- **Clique num item**: executa a ação padrão da notificação (abre/foca o app ou site), remove o item e fecha a ilha. **×**: só remove. **Limpar tudo**: remove todas.

## Rolagem (mouse e touchpad)

Regra pura em `src/core/stackScroll.ts` (`StackScroll`); a ligação é `Bar.wheelStack` + um `WheelHandler` vertical em cada pílula (`BarRow.qml`) e um no `StackView.qml`.
- Rolar **para baixo** sobre qualquer uma das três pílulas, com a ilha em `compact` ou `notif`, abre o `stack` (como o gesto de três dedos). Rolar **para cima** com o `stack` aberto o fecha.
- Só estes dois casos: com música, calendário, controles, Wi‑Fi, cartão central etc. abertos a rolagem não faz nada, e o sentido oposto ao do modo passa adiante.
- Dentro do `stack`, rolar para cima rola a lista; só fecha com a lista no topo, e o giro que chegou ao topo não fecha (precisa de uma pausa ou de levantar os dedos). O Qt entrega o evento ao pai mesmo quando a lista rola, então o `atTop` vem do `StackView`, não da propagação.
- Roda do mouse: um giro age uma vez; 250ms sem evento (`Timer` do `Bar.qml`) libera o próximo. Touchpad: soma 40px na vertical e age uma vez por gesto (o fim vem da fase `ScrollEnd`, com o mesmo timer de reserva).
- O gesto horizontal de dois dedos continua sendo a troca de ambiente (spec 15): evento com `|dx| ≥ |dy|` não é desta regra. O botão de volume mantém a roda dele (o handler mais específico bloqueia o do pai).

## Banner

- 380px de largura, centralizado, `top` = altura atual da ilha + 8px (acompanha a ilha com a mesma mola). 58px de altura, raio 22, fundo `bg`, anel `neutral-800`, sem a sombra escura e o brilho do design (spec 03, "Animação").
- Mesmo conteúdo do `notif` (bloco 34×34, ícone 19px, × 24×24).
- Entra de `translateY(-16px)`, fica 2600ms. Clique abre `stack`; × dispensa só o banner.

## Tempo relativo

"agora" (<1 min), "há N min" (<60 min), "há N h". Atualiza a cada minuto enquanto visível.

## Critérios de aceite

- [x] Testes de `notificationSource.ts` cobrem cada linha da tabela, domínio desconhecido, `www.`, subdomínio mais específico e app nativo.
- [x] Testes do roteamento cobrem os quatro estados da tabela e o DND com e sem urgência crítica.
- [ ] Notificação de qualquer site no Brave aparece com o nome do site, sem a linha do domínio: site da tabela com o ícone dele, os outros com o globo (testado com o WhatsApp).
- [x] Com `wifi` aberto, uma notificação vira banner e o modo `wifi` continua intacto (captura no `make dev`).
- [ ] Nenhum toast do Omarchy aparece com a Island ativa; `./install.sh --uninstall` os devolve.
- [ ] Lock/unlock e hot-reload da barra mantêm a lista de notificações.
- [x] Testes de `stackScroll.ts`: roda e touchpad, modos que não reagem, lista fora do topo, gesto horizontal, inversão de sentido, trava até a pausa.
- [ ] Com o mouse sobre a pílula esquerda, a central e a direita, rolar para baixo abre o `stack` e para cima o fecha; sobre o botão de volume a roda continua mudando o volume (conferir na sessão real: o harness não injeta ponteiro).
- [x] Notificação do Brave com `web.whatsapp.com` abre `notif` com "WhatsApp" e o ícone dele, e fecha em 2100ms (captura no `make dev`).
