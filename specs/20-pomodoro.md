# 20 · Pomodoro

Origem: o protótipo **Pomodoro Desktop v7** (`design-source/pomodoro/Pomodoro Desktop v7.dc.html`, com o `support.js` ao lado para abrir no navegador) e as 12 specs que o acompanham. O protótipo é um app com um card flutuante arrastável sobre um fundo escuro; aqui ele vira um recurso embutido da Island. O **visual** (medidas, cores, estados) segue o protótipo; o **comportamento** segue esta spec, que registra o que mudou ao trazê-lo para a barra.

Substitui o ciclo fixo 25/5 do widget `pomodoro` da spec 16. O widget continua na barra e agora abre o modo `pomodoro` da ilha.

## O que veio do protótipo e o que mudou

| Protótipo v7 | Na Island |
|---|---|
| Card flutuante arrastável, pílula minimizada, posição | Modo `pomodoro` da ilha (fixo, medidas abaixo). O widget da barra faz o papel da pílula; não há arrasto nem minimizar |
| Janela de tela cheia dentro do app | Uma janela `layer-shell` na camada `overlay` por monitor, só enquanto há pausa com bloqueio |
| Atividade da pausa (URL tocando só áudio) | **Fora de escopo por enquanto** (spike S11). Sem campos de nome/URL, sem chip "Tocando" |
| Imagem própria por `<input type=file>`, reduzida a 1920px e regravada em JPEG | `omarchy-file-select` (portal de arquivos do desktop); a Island guarda o **caminho** e a `Image` do QML decodifica com o maior lado em 1920px, sem ampliar. Nenhuma cópia nem reencode |
| Contagem a cada 100 ms | Horário de término (`endsAt`), um timeout até o fim da etapa |
| `completedToday` fixo em 4 (demonstração) | Contador do dia, zerado na virada (`localDay`) |
| "Testar pausa" avança o ciclo e conta o foco | Pré-visualização: mostra a pausa da sessão atual, cheia e parada, **sem** mexer em sessão, etapa nem contador |
| Foco e pausa em âmbar e teal | Mantidos (`Tokens.pomodoroFocus`/`pomodoroBreak`), independentes do realce da Island |
| Fonte Outfit | A fonte da Island (Inter); o relógio ainda desenha cada caractere num bloco de largura fixa |

Mantido como na v7, por decisão do usuário: **toda** pausa abre a tela de pausa (sem URL, também); **pular** um foco abre a pausa com bloqueio e conta o foco como concluído; **"Pular pausa"** sai com uma ação, sem confirmação; **"Urgência"** pede confirmação.

## Cores e movimento

| Token | Valor | Uso |
|---|---|---|
| `pomodoroFocus` | `oklch(0.79 0.135 62)` (âmbar) | botão primário, progresso e ponto da sessão atual no foco |
| `pomodoroBreak` | `oklch(0.80 0.09 178)` (teal) | o mesmo, na pausa e na tela de pausa |
| `pomodoroOnAccent` | `#100b05` | ícone e texto sobre o acento |
| `pomodoroBreakBase` | `#050506` | base da tela de pausa |

Os dois acentos saem de `POMODORO_ACCENTS` (`pomodoroWallpapers.ts`), convertidos por `oklch()` (`color.ts`, conferido contra as conversões do `Tokens.qml`). Neutros e superfície do modo vêm do tema da Island.

Não há opção de "movimento reduzido" na Island (o protótipo a pede no RNF-08 dele): a animação de entrada da pausa roda sempre.

## Configuração

`settings.json`, chave `pomodoro` (spec 13), saneada **campo a campo** por `sanitizePomodoroConfig` (`pomodoroConfig.ts`): um campo inválido cai no padrão e o resto fica. Gravada a cada toque, sem botão Salvar; o motor reage na hora.

| Campo | Tipo | Padrão | Limites |
|---|---|---|---|
| `cycleLen` | int | `4` | 1–24 |
| `durationMode` | `"global"` \| `"individual"` | `"global"` | |
| `focusMin` | int | `25` | 5–180, passo 5 |
| `breakMin` | int | `5` | 1–60, passo 1 |
| `plan` | `[{focusMin, breakMin}]` | pausas `5, 5, 10, 20` | sempre `cycleLen` linhas, mesmos limites |
| `autoStart` | bool | `true` | |
| `wallpaper` | `noite` \| `aurora` \| `brasa` \| `grafite` \| `custom` | `noite` | `custom` só com `wallpaperPath` |
| `wallpaperPath` | caminho | `""` | guardado ao trocar para um preset |

- Linha do plano ausente ou inválida usa `focusMin`/`breakMin` globais. O plano padrão 5/5/10/20 só vale quando nada foi guardado.
- A lista `plan` chega do `JsonAdapter` sem ser `Array`: lê-se com `asList`. `make smoke` semeia um plano no `settings.json` e falha se a barra não o enxergar depois de 5 hot-reloads.
- `minutesFor(config, fase, sessão)`: global → `focusMin`/`breakMin`; individual → a linha da sessão.
- **Sessões no ciclo**: o plano é truncado ou estendido no fim (novas linhas com as durações globais). O campo aceita só dígitos (2 no máximo) e aplica no `blur`/Enter: vazio ou inválido volta ao valor anterior, `30` vira `24`, `0` vira `1`.
- **Trocar de modo** preserva os dois conjuntos de valores.
- **Total do ciclo** (só no Individual): soma de `focusMin + breakMin` das linhas, `2h 20m`, `2h` ou `45m`.

## Motor

Estado em `src/core/pomodoro.ts` (puro, testado): `phase` (`focus`/`break`), `session` (1…`cycleLen`), `endsAt` (rodando) ou `remainingMs` (parado), `locked`, `completed` e `completedDay`.

| Ação | Efeito |
|---|---|
| iniciar/pausar (`toggle`) | alterna, guardando o que falta |
| reiniciar (`reset`) | tempo integral da etapa, **parado**, sem bloqueio; etapa e sessão ficam |
| pular (`skip`) | avança uma etapa pelo mesmo caminho do fim do tempo, com início agora; só o fim do tempo notifica |
| fim do tempo (`tick`) | avança uma etapa; atraso pequeno não desloca o ciclo, e uma suspensão que cobre a etapa seguinte inteira a faz recomeçar cheia, de agora |
| urgência (`release`) | `locked = false`; o tempo da pausa não muda |

Avançar (`advance`): `próxima = outra etapa`; a sessão sobe ao voltar ao foco (`(sessão % cycleLen) + 1`, circular); o tempo vem de `minutesFor`; **a pausa sempre começa correndo**, o foco só com `autoStart`; um foco que acaba soma 1 em `completed`; `locked = próxima é pausa`.

- Em 4 sessões, pular 8 vezes a partir de Foco 1/4 volta a Foco 1/4.
- Com `autoStart` desligado: fim do foco → pausa correndo; fim da pausa → foco parado, cheio, na sessão seguinte.
- `completed` é do dia local: na virada vale 0 (`localDay`, data local `AAAA-MM-DD`).

### Mudar a configuração (`reconcile`)

- A sessão atual passa a caber no ciclo novo (`min(sessão, cycleLen)`).
- **Mudar a duração da etapa em curso** (global, ou a linha da sessão e etapa atuais) a recomeça cheia, **também correndo** (`endsAt = agora + total`). Mudar a outra etapa, ou outra linha, não mexe no tempo.
- **Mudar a quantidade ou o modo de duração** só mexe no tempo com o timer **parado** (aí vira o total integral da etapa); correndo, o restante fica.

## Persistência do estado

`state.json`, `pomodoroState` (spec 13): `{phase, session, remainingMs, completed, completedDay}`, **sempre salvo parado**. `PomodoroSource.qml` restaura só depois de `store.ready` e `settings.ready` (a configuração define os limites).

- Foco guardado volta parado, com o restante guardado (limitado ao total atual).
- **Pausa guardada volta como o foco da mesma sessão, cheio e parado**, e sem bloqueio: a tela de pausa não reaparece ao reiniciar o shell.
- Valor vazio, inválido ou do formato antigo (só `phase` e `remainingMs`) cai no padrão ou é lido com o que tiver.

O motor vive no `Service.qml` (`PomodoroSource.qml`): continua no hot-reload da barra e no lock. Um `Timer` de disparo único espera o fim da etapa, esteja a ilha aberta ou não; o `Timer` do Qt é grosso (±5% do intervalo) e pode disparar antes da hora, então o disparo cedo reagenda em vez de ficar parado.

### Notificação

Ao **fim do tempo** (nunca ao pular), uma notificação interna (`ph-timer`, spec 04): fim do foco, "Hora da pausa" / "`{n}` min de pausa"; fim da pausa, "Hora de focar" / "`{n}` min de foco", com os minutos da etapa que começa.

## Widget da barra

`pomodoro` (spec 16): anel (fração decorrida), `mm:ss` e "Foco"/"Pausa"/"Pausado". **O clique abre/fecha o modo `pomodoro`** (antes alternava rodando/pausado); iniciar e pausar é o botão do card ou `Espaço`.

## Modo `pomodoro` da ilha

Modo **fixo** (spec 03): sem timer, toma o teclado, `Esc` e clique fora fecham, o mesmo gatilho fecha. Eventos automáticos não o tiram. O motor segue contando com a ilha fechada.

Medidas (`pomodoroPanel.ts`): **300 × 128**, raio 24. Com as configurações abertas, **340** de largura e `128 + 24 + lista`, onde a lista acompanha o conteúdo até `min(470, altura da tela − 230)` (mínimo 120), com a altura de tela do monitor-alvo já dividida pelo zoom da barra. A lista rola por dentro, sem barra visível; abre com a ilha crescendo na mola de sempre (spec 03) e o conteúdo some e aparece em 200 ms.

### Card

Margens 17 (14 no topo). De cima para baixo:

1. **Cabeçalho** (20): `{Foco|Pausa} · {sessão}/{total}`, 12.5px, e a engrenagem (20×20, gira 60° ao abrir, fundo `.08` / `.18` aberta).
2. **Relógio** `MM:SS`, 44px/200 branco, dígito `0.58em` e dois-pontos `0.3em` (`PomodoroClock.qml`), e à direita, gap 6:

   | Botão | Tamanho | Ação | Nome acessível |
   |---|---|---|---|
   | Reiniciar (`arrow-counter-clockwise`) | 32 | `reset` | "Reiniciar" |
   | Pular (`skip-forward-fill`) | 32 | `skip` | "Pular foco" / "Pular pausa" |
   | Iniciar/Pausar (`play-fill`/`pause-fill`) | 44, na cor da etapa | `toggle` | "Iniciar" / "Pausar" |

3. **Progresso**: trilho de 5px (`rgba(0,0,0,.35)`, raio 3) com a fração decorrida na cor da etapa (250 ms linear).

Atalhos (valem com o modo aberto): `Espaço` inicia/pausa, `R` reinicia, `S` pula, `M` abre/fecha as configurações, `Esc` fecha a ilha. Com o foco num campo de texto, as letras e o espaço são do campo.

### Configurações

Uma lista rolável, separada do card por um traço de 1px. Seções, em ordem:

1. **Sessões** (`PomodoroSessionsSettings.qml`): "Sessões no ciclo" (stepper de 24px com campo de 44×24), o segmentado Global/Individual (trilho rebaixado, opções de largura igual), as durações e "Iniciar automaticamente" (linha inteira clicável com o `ToggleSwitch` da Island).
   - **Global**: "Todas as sessões" (`N min`, passo 5) e "Todas as pausas" (`N min`, passo 1).
   - **Individual**: cabeçalho Sessão / Foco / Pausa; uma linha por sessão (steppers de 20px, `Nm`), a sessão atual com ponto âmbar e fundo `.055`; "Total do ciclo · Xh Ym".
2. traço
3. **Wallpaper da pausa** (`PomodoroWallpaperSettings.qml`): à direita, o link "Testar pausa". Grade de seis colunas (gap 6) com as miniaturas (raio 14, borda de 2px: clara na escolhida, `.06` nas outras; o protótipo usa 1.5px, e o `ClippingRectangle` só aceita inteiros), "Sua imagem" quando há um caminho guardado e, no fim, o "+" tracejado.

**Testar pausa** abre a pré-visualização (tela de pausa abaixo) e fecha a ilha. **"+"** roda `omarchy-file-select --extensions "png jpg jpeg webp bmp gif"` num `Process` do `Service.qml` e fecha a ilha antes: com o foco exclusivo da ilha o diálogo não receberia o teclado. Ao terminar (escolhendo ou não), a ilha reabre nas configurações se nada mais abriu. Só um caminho absoluto de uma linha vira `custom`; cancelar não muda nada. Imagem que não abre (arquivo apagado) cai no preset Noite.

## Tela de pausa

`PomodoroBreakScreen.qml`, uma janela por monitor (`PanelWindow`, camada `overlay`, `namespace: island-break`, âncoras nas quatro bordas, sem zona exclusiva), criada num `LazyLoader` da `ScreenBar` enquanto `breakActive` (`locked` ou pré-visualização). Abrir a pausa fecha a ilha e o editor e põe o monitor do foco como alvo. O **monitor do foco** toma o teclado (`WlrKeyboardFocus.Exclusive`), para o que se digita não chegar aos apps de baixo; os outros ficam sem teclado.

Camadas, de baixo para cima: base `#050506`; wallpaper (`PomodoroWallpaper.qml`); vinheta `radial-gradient(70% 65% at 50% 48%, rgba(0,0,0,.18), rgba(0,0,0,.55))`; conteúdo central; zona de Urgência; diálogo.

- **Instrução**: rótulo "Pausa curta · N min" (13px, `rgba(255,255,255,.66)`; "Pausa longa" acima de **10 min**) e a frase em `clamp(56px, 9vw, 132px)`/300, `#f7f6f2`, entrelinha .95, centralizada com quebra. Frases `Levanta.`, `Bebe água.`, `Olha pela janela.` (en: `Stand up.`, `Drink some water.`, `Look out the window.`), índice `(completed + sessão) % 3` (`breakInstruction`).
- **Tempo**: relógio 34px/300 `rgba(255,255,255,.88)` e barra 180×3 na cor da pausa.
- **Wallpaper**: os presets de `pomodoroWallpapers.ts` (a spec 07 do protótipo, cores já em hex). Um `Canvas` de **640×360** pinta as camadas uma vez e é esticado até o monitor (degradês suaves: custa quase nada em 4K). Elipses do CSS (`radial-gradient(rx ry at cx cy)`) viram um círculo unitário esticado; os brilhos da Aurora terminam na mesma cor com alfa 0, senão a interpolação passa pelo preto e escurece a borda. Imagem própria: `PreserveAspectCrop`, `sourceSize` 1920×1920 (reduz, não amplia).

### Animação de entrada

Estágios por tempo desde `breakSince` (`entranceStage` / `nextStageDelay`, `pomodoroBreak.ts`): 1 em 60 ms (wallpaper: opacidade 0→1 em 1.4 s, escala 1.06→1 em 2.4 s `cubic-bezier(.16,1,.3,1)`), 2 em 900 ms (bloco da instrução: opacidade, subida de 36px e desfoque de 8px, 1 s / 1.3 s / 1 s), 3 em 1700 ms (bloco do tempo: 28px e 6px), 4 em 2400 ms (sem atividade, sem efeito). `breakSince` mora no `PomodoroSource`: a barra recriada no hot-reload retoma do estágio certo, sem refazer a entrada, e todos os monitores ficam em fase.

### Urgência

Zona invisível de **320×74** no topo, centralizada (`PomodoroUrgencyZone.qml`). O mouse sobre ela revela **"Pular pausa"** e **"Urgência"** (opacidade 180 ms, subida de 10px em 200 ms); com os botões ocultos nada recebe clique. **Segurar `Esc` por 2 s** revela os mesmos botões pelo teclado (por 8 s; `Tab` anda entre eles, Enter ou Espaço ativam).

| Botão | Efeito |
|---|---|
| Pular pausa | `skip`: encerra a pausa e vai ao foco seguinte (uma ação, sem confirmação) |
| Urgência | abre o diálogo "Interromper a pausa?" |

**Diálogo** (`PomodoroUrgencyDialog.qml`): véu `rgba(3,3,4,.78)`; cartão de 364px, raio 28. Texto: "A tela de pausa fecha e o temporizador da pausa continua correndo." (sem a menção à atividade do protótipo). **Continuar na pausa** (foco inicial; `Esc` também) só fecha o diálogo. **Confirmar urgência** (cor da pausa) faz `release`: sai da tela, a pausa segue correndo, o tempo não muda. A próxima pausa volta a abrir a tela.

Na **pré-visualização**, "Pular pausa" e "Urgência" encerram a pré-visualização direto (sem diálogo, nada a interromper).

## Ciclo de vida

- O motor, o `breakSince` e a pré-visualização moram no `Service.qml`; a barra só desenha. Hot-reload com a tela de pausa aberta: a janela é recriada, o relógio continua e a entrada não se repete.
- A barra recém-criada leva até 250 ms para achar o serviço (`findService`); `closeForBreak` roda quando o serviço chega, para a ilha fechar mesmo assim.
- O lock do Omarchy (`WlSessionLock`) cobre a tela de pausa como cobre a barra.

## Fora de escopo

Atividades nas pausas (nome, URL, áudio, chip "Tocando"; spike S11), arrasto e minimizar do card, e o modo de movimento reduzido.

## Critérios de aceite

- [x] Testes puros (`pomodoroConfig`, `pomodoro`, `pomodoroBreak`, `pomodoroWallpapers`, `pomodoroPanel`, `oklch`): limites e passos, `30` → 24, plano truncado e estendido, lista tipo array do `JsonAdapter`, progressão do ciclo (8 pulos voltam a Foco 1/4), `autoStart` desligado, reiniciar na pausa, atraso e suspensão, `reconcile` de cada tipo de mudança, restauração (pausa volta ao foco), virada do dia, estágios da entrada.
- [x] `pomodoro` é modo fixo e tem as medidas da tabela, e o card cresce com a lista (capturas no `make dev`).
- [x] A tela de pausa abre com a sequência de entrada, mostra "Pausa curta"/"Pausa longa" e a frase certa, e sobrevive ao hot-reload sem refazer a entrada (`make smoke` confere a janela `island-break` e a captura).
- [x] "Testar pausa" não muda sessão, etapa nem contador e fecha a ilha; Urgência fecha a tela sem parar o tempo (`make smoke`). Reiniciar na pausa remove o bloqueio e deixa a pausa parada e cheia (teste do motor).
- [x] O plano do `settings.json` sobrevive ao hot-reload (`make smoke`).
- [ ] O diálogo de arquivos abre e devolve a imagem na sessão real (o harness não tem portal de arquivos).
- [ ] Segurar `Esc` por 2 s revela a zona de Urgência e a ilha não segura o teclado do diálogo de arquivos (precisa de teclado real; o aninhado não simula).
- [ ] Na sessão real, o teclado não chega aos apps de baixo durante a pausa e o lock do Omarchy cobre a tela de pausa.
