# 04 · Notificações

Origem: `design/logic.js` `pushNotif`, `stack`/`latest`/`unreadDot`/`openPeek`; `design/markup.html` modos `notif` e `stack` e o banner.

Código: `plugin/system/NotificationFeed.qml` e `NotificationTakeover.qml` (no `Service.qml`), roteamento no `Bar.qml`, views `NotificationCard.qml`, `StackView.qml`, `Banner.qml`; a escolha de quem cuida fica na aba Ajustes (`SettingsPage.qml`, spec 17).

## Fonte

- Com o consentimento do usuário ("Quem cuida das notificações" abaixo), a Island é o servidor de notificações da sessão: um `NotificationServer` (Quickshell) no `Service.qml` é dono de `org.freedesktop.Notifications`, com `omarchy.notifications` desligado (spec 14, S7). Os toasts do Omarchy não existem enquanto a Island cuida delas. Sem o consentimento ela é só barra: não cria o servidor.
- A lista vive no serviço (`keepLoaded`): sobrevive ao hot-reload da barra e ao lock. Não sobrevive ao reinício do shell (o servidor some junto).
- Cada notificação fica `tracked` (senão o objeto morre ao fim do handler). Atualização por `replaces_id` chega no mesmo objeto e atualiza o item. Quando o app fecha a notificação (`closed`), o item sai da lista.
- Hint `transient`: aparece (`notif`/banner) mas não entra na lista.
- O alvo IPC `notifications` tem o contrato do Omarchy (spec 14, S7): `toggleDnd`/`setDnd`/`isDnd`/`dndState`, `showHistory` (abre `stack`), `clear`/`dismissAll` (limpa a lista), `dismissOne` (a mais recente), `invokeLast` (ação padrão da mais recente), `dismiss <trecho do título>`, `ping`. Os atalhos `Super+vírgula` do Omarchy seguem funcionando.
- O alvo IPC `island` tem `openStack` e `closeStack`, para os gestos de três dedos do Hyprland:
  - `openStack` (três dedos para baixo) abre `stack` no monitor focado. Com `stack` já aberto, não faz nada: repetir o gesto não fecha a lista.
  - `closeStack` (três dedos para cima) volta a `compact` só se o modo for `stack`. Em outro modo, não faz nada.
  - Os dois gestos vêm em `hypr/island.lua`, que o `install.sh` instala (spec 03 "Atalho").

## Quem cuida das notificações

A Island substitui `omarchy.notifications` e `omarchy.osd`, mas só assume o que o usuário deixou: mudar a configuração do Omarchy sem consentimento é o que o marketplace proíbe, e dois donos do mesmo alvo dividem o controle (spec 14, S7). Código: `src/core/takeover.ts` (decisões e comandos), `NotificationTakeover.qml` (processos e estado).

- **Estado**: `omarchy plugin list --json` diz quais dos dois built-ins estão ligados (`enabledBuiltins`). `builtin` = algum ligado, o Omarchy cuida e a Island é só barra. `island` = os dois desligados, ela cuida. `unknown` = lista ainda não lida (o shell pode não ter o IPC pronto quando o serviço sobe): não assume nada e tenta de novo a cada 3 s. Depois de lida, a lista é conferida a cada minuto, para largar o alvo se alguém religar um built-in à mão.
- **Cada alvo é reivindicado separadamente**: `NotificationServer` e o IPC `notifications` só existem com `omarchy.notifications` desligado; o IPC `osd`, com `omarchy.osd` desligado. Um liga/desliga que falhou no meio deixa a Island com o que sobrou, nunca com um alvo sem dono.
- **Quem já desligou os built-ins** (`install.sh`, à mão) não é perguntado: a Island cuida desde o início.
- **Pergunta (uma vez)**: com `builtin` e `takeoverPromptShown` falso no `state.json`, 4 s depois de a lista chegar (a barra precisa ter carregado), uma notificação interna ("Island can show your notifications and volume. Click to review.", glifo `bell-fill`) é empurrada e o flag é gravado. O card fica aberto **5 s** (`holdMs` do aviso; os comuns ficam 2500 ms), tempo de ler e clicar, também quando ela vira banner. Clicar abre o editor na aba **Ajustes**; ligar nunca acontece só pelo clique, porque mexe na configuração do Omarchy. A pergunta não volta, mesmo apagada sem querer: o caminho de volta são os Ajustes.
- **Aba Ajustes** (spec 17): um interruptor "Island handles notifications and OSD". Ligar roda `omarchy plugin disable` para cada built-in ligado, um comando por plugin (o script lê só o primeiro id e sai com 0 ignorando o resto), e a Island passa a cuidar assim que o último termina, sem esperar outra leitura da lista. Desligar faz a Island largar os alvos primeiro e só depois roda `omarchy plugin enable` nos dois (equivale ao `./install.sh --uninstall`, sem remover a barra). Os comandos passam pelo `omarchy-shell`, que grava o `shell.json` sozinho: a Island nunca escreve nele. O código de saída não manda: cada `enable|disable` faz o shell reconstruir os painéis de todos os plugins e ele fica sem responder por vários segundos (medido: ~11 s por troca, com o `omaplug` e o `radio-atlas` instalados; são duas trocas), e o wrapper `omarchy-shell` desiste do IPC em 2 s com a troca já aplicada e sai com 1. Por isso os comandos rodam com `OMARCHY_SHELL_IPC_TIMEOUT=60s`, a fila vai até o fim mesmo com um código diferente de 0, e o resultado só vale se a lista lida depois confere com o esperado (`matchesExpected`): troca aplicada com `exit 1` é sucesso, `exit 0` sem aplicar é falha. Enquanto isso o interruptor fica travado e a aba avisa "Switching… the shell can freeze for a few seconds while Omarchy reloads its plugins." (o travamento é do shell, não da Island). Falha: o interruptor volta ao estado lido e aparece "Couldn't change the Omarchy plugins. Try again.".
- **Perda no meio da troca**: o nome D-Bus fica com o processo do shell, não com o servidor (spec 14, S7); uma notificação enviada quando nenhum servidor existe é descartada. A janela é o intervalo entre o `disable` do Omarchy e a Island criar o dela, e vale o mesmo na volta.
- **Só barra**: sem notificações próprias na lista (só as internas: pomodoro, dicas), e o "não perturbe", o histórico e o OSD do Omarchy seguem valendo, porque a Island não registra os alvos IPC.
- **Toasts que voltam ao desligar não são da Island**: o Omarchy grava um arquivo por popup na tela em `~/.local/state/omarchy/notifications/` e o restaura toda vez que o serviço nasce, e é o que acontece ao desligar o interruptor. Um `critical` sem expiração (`expireTimeout: 0`), como o "Process crashed: …" do `omarchy-crash-watch`, fica ali até ser dispensado. Foram 7 empilhados na sessão real, alguns de semanas antes; `omarchy-notification-dismiss "<título>"` os move para o histórico.
- **O que o interruptor não cobre**: só o servidor de notificações (D-Bus), os alvos IPC `notifications` e `osd`. A música (MPRIS, spec 05) e os demais widgets não dependem dele: um vídeo no YouTube aparece na ilha como música com o interruptor ligado ou desligado.
- **Ao devolver**, a Island fecha tudo o que o servidor dela rastreia (`releaseServerNotifications`, antes de largá-lo) e a lista fica só com as internas. O Quickshell entrega ao próximo servidor, como se fossem novas, as notificações que o anterior ainda rastreia: sem isso o servidor que assume reexibia todas como novas (reproduzido no harness com um `NotificationServer` de mentira; a Island não o viu na sessão real). O mesmo vale quando alguém religa o Omarchy por fora e a Island percebe na conferência de 1 min. No sentido inverso (a Island assumindo de um servidor do Omarchy) o servidor dela não recebeu reentrega no harness. As referências de um servidor destruído morrem (`dismiss` deixa de ser função), então os `dismiss` da lista são protegidos.

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
5. **App nativo**: nome do app; ícone simbólico do tema (`<ícone>-symbolic`, por `Quickshell.iconPath`) tingido de `accent-300`, ou `ph-fill ph-bell` se o tema não tiver o simbólico ou o ícone for um caminho (qualquer nome com `/`, ou `file:`): quem manda a notificação escolhe o nome (`themeIconName`, notificationSource.ts, com teste).
6. **Tamanho**: o texto mostrado ("título: corpo") para em 500 caracteres (`MAX_NOTIFICATION_CHARS`, contando emoji como um). A ilha mostra uma linha só, e o texto é de quem manda a notificação.

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

- 380px de largura, centralizado, `top` = altura atual da ilha + 8px (acompanha a ilha com a mesma mola). 58px de altura, raio 22, fundo `bg`, anel `neutral-800`, sem a sombra escura e o brilho do design (spec 03, "Animação"). Fundo, gradiente, grão, cantos e borda seguem a aparência da ilha (spec 19 "Banner").
- Mesmo conteúdo do `notif` (bloco 34×34, ícone 19px, × 24×24).
- Entra de `translateY(-16px)`, fica 2600ms. Clique abre `stack`; × dispensa só o banner.

## Tempo relativo

"agora" (<1 min), "há N min" (<60 min), "há N h". Atualiza a cada minuto enquanto visível.

## Critérios de aceite

- [x] Testes de `notificationSource.ts` cobrem cada linha da tabela, domínio desconhecido, `www.`, subdomínio mais específico e app nativo.
- [x] Testes do roteamento cobrem os quatro estados da tabela e o DND com e sem urgência crítica.
- [ ] Notificação de qualquer site no Brave aparece com o nome do site, sem a linha do domínio: site da tabela com o ícone dele, os outros com o globo (testado com o WhatsApp).
- [x] Com `wifi` aberto, uma notificação vira banner e o modo `wifi` continua intacto (captura no `make dev`).
- [ ] Nenhum toast do Omarchy aparece com a Island cuidando das notificações; `./install.sh --uninstall` os devolve.
- [x] Testes de `takeover.ts`: só `enabled: true` dos dois built-ins conta, formato inesperado vira `null`, a pergunta sai uma vez e só com o Omarchy cuidando, um comando por plugin e nunca outro id.
- [x] Ao devolver, o servidor que assume no lugar da Island não recebe de volta as notificações dela, nem as `critical` sem expiração (`make smoke`, com um `NotificationServer` de mentira no papel do Omarchy).
- [x] Com os built-ins ligados a Island não é dona de `org.freedesktop.Notifications`; ao ligar, recebe as notificações; ao devolver, larga os alvos; uma falha é reportada e uma nova tentativa funciona (`make smoke`, com o `omarchy` falso do harness).
- [x] Caminho padrão na sessão real (2026-11-05): `omarchy plugin add <repositório git local com o build> --enable --yes`, partindo da Island removida (`omarchy plugin remove`) e dos dois built-ins ligados, deixa os built-ins como estão, a Island só barra (sem erro nem handler sombreado no log do shell) e a pergunta aparece uma vez. Testado com um repositório git local, não com a URL do GitHub.
- [ ] Na sessão real, com os dois built-ins ligados: a pergunta aparece uma vez, clicar abre Ajustes, ligar e desligar o interruptor troca quem mostra as notificações e o volume, e o `Super+,` age em quem está cuidando.
- [ ] Lock/unlock e hot-reload da barra mantêm a lista de notificações.
- [x] Testes de `stackScroll.ts`: roda e touchpad, modos que não reagem, lista fora do topo, gesto horizontal, inversão de sentido, trava até a pausa.
- [ ] Com o mouse sobre a pílula esquerda, a central e a direita, rolar para baixo abre o `stack` e para cima o fecha; sobre o botão de volume a roda continua mudando o volume (conferir na sessão real: o harness não injeta ponteiro).
- [x] Notificação do Brave com `web.whatsapp.com` abre `notif` com "WhatsApp" e o ícone dele, e fecha em 2100ms (captura no `make dev`).
