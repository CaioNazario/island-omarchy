# 00 · Visão geral

## O produto

A Island é um plugin de barra do Omarchy (Quickshell sobre Hyprland) que substitui a barra padrão por três pílulas flutuantes. A do meio, a **ilha**, muda de tamanho conforme o contexto (estilo Dynamic Island) e concentra estados transitórios e controles. Usuário-alvo: dev em Omarchy que quer ver estado do sistema e uso de IA sem clicar, e alcançar volume, brilho, Wi‑Fi, Bluetooth e energia em um clique ou atalho.

Até a v1.1 a Island era uma extensão do GNOME Shell (último código no commit `5cb704a`). A v2 é o porte para o Omarchy: mesmo design e mesmas regras do `src/core`, UI reescrita em QML.

## Glossário

| Termo | Significado |
|---|---|
| **Barra** | Faixa no topo (2px de margem + 26px) com as três pílulas, uma por monitor |
| **Pílula esquerda** | Botão de ambiente + widgets do ambiente ativo (specs 15, 16) |
| **Pílula direita** | Widgets do ambiente ativo + notificações, Wi‑Fi, volume, bateria, seta (specs 04, 08, 11, 16) |
| **Ambiente** | Conjunto nomeado de widgets para as duas pílulas; um ativo por vez (spec 15) |
| **Widget** | Bloco de informação numa pílula lateral: IA, hardware, evento, pomodoro etc. (spec 16) |
| **Ilha** | Pílula central; tem um **modo** por vez |
| **Modo** | Estado da ilha: `compact`, `notif`, `stack`, `music`, `volume`, `brightness`, `env`, `calendar`, `quick`, `wifi`, `bt`, `ai`, `note`, `mixer`, `display`, `battery`, `osd` |
| **Modo transitório** | Fecha sozinho após um timer: `notif`, `music`, `volume`, `brightness`, `env` |
| **Modo fixo** | Fica até clique fora, Esc ou novo gatilho: `stack`, `calendar`, `quick`, `wifi`, `bt`, `ai`, `note`, `mixer`, `display`, `battery` e `music` fixado |
| **Cartão central** | Ilha expandida com música + calendário (spec 05; `hub` no design) |
| **Banner** | Notificação que desce abaixo da ilha quando ela está ocupada (spec 04) |
| **Linha de energia** | Fileira Suspender/Reiniciar/Desligar/Sair/Bloquear (spec 09) |

## Mapa de specs

| # | Spec | Cobre |
|---|---|---|
| 01 | [design-tokens](01-design-tokens.md) | Cores, tipografia, ícones, equivalentes St |
| 02 | [barra](02-barra.md) | Pílulas, monitores, tela cheia, overview, struts |
| 03 | [ilha](03-ilha.md) | Máquina de estados, tamanhos, animação, timers, hover, Esc/clique fora |
| 04 | [notificacoes](04-notificacoes.md) | Captura, identificação de serviço web, roteamento, DND, lista |
| 05 | [musica](05-musica.md) | MPRIS, modo música, cartão central |
| 06 | [calendario](06-calendario.md) | Semana/mês, eventos (EDS) |
| 07 | [clima](07-clima.md) | GWeather, cadeia de fallback |
| 08 | [controles-rapidos](08-controles-rapidos.md) | Controles rápidos, volume/brilho, Wi‑Fi (+ senha), Bluetooth |
| 09 | [sessao-energia](09-sessao-energia.md) | Configurações, linha de energia |
| 10 | [hardware](10-hardware.md) | CPU, RAM, GPU, TEMP, NET |
| 11 | [bateria](11-bateria.md) | Ícone, cores, carregando |
| 12 | [uso-ia](12-uso-ia.md) | Claude + Codex |
| 13 | [preferencias](13-preferencias.md) | GSettings + janela de preferências |
| 14 | [spikes](14-spikes.md) | Pontos em aberto a resolver antes da feature dependente |
| 15 | [ambientes](15-ambientes.md) | Modelo, persistência, troca, botão de ambiente, modo `env` |
| 16 | [widgets](16-widgets.md) | Catálogo, visual, dados e clique de cada widget, modo `note` |
| 17 | [editor-ambientes](17-editor-ambientes.md) | Editor de ambientes e widgets, arrastar e soltar |
| 18 | [auto-ocultar](18-auto-ocultar.md) | Barra que some e volta pela borda |

## Ordem de implementação

A v1.x (GNOME) seguiu as specs 01–18 nessa ordem. O porte v2 (Omarchy) refaz a UI e as fontes de dados na mesma ordem e reaproveita `src/core` sem mudança de regra:

1. Base: toolchain (core → `.mjs`), esqueleto do plugin (`manifest.json`, `Bar.qml`, `Service.qml`), harness `dev/`, `make smoke`
2. 01 → 02 → 03 (barra vazia + ilha com relógio, estados e animação)
3. 08 (controles rápidos, volume, brilho, Wi‑Fi, Bluetooth) → 09 → 11
4. 04 (notificações) → 05/06 (música, calendário, cartão central)
5. 10 (hardware) → 07 (clima) → 12 (IA)
6. 15 → 16 → 17 → 18 (ambientes, widgets, editor, auto-ocultar)
7. 13 (preferências) consolida as opções que cada spec já declarou

Cada spec é reescrita para o Omarchy no mesmo commit que porta a feature dela. Até lá, o texto descreve a v1.1 (GNOME): o comportamento continua valendo, os nomes de API não.

### Design v5

O design passou do protótipo v3 para o v5 (`design-source/`). As diferenças entraram nesta ordem, cada uma no commit que atualizou a spec dela:

1. Expansões de uma linha mais baixas (v4): `notif`, `music`, `volume`, `quick`, `wifi`, `bt`, `env` (specs 03, 04, 05, 08, 15)
2. Acabamento: brilho e gradiente das pílulas e da ilha, sombras `SOFT_IN`/`SOFT_OUT`, raio da ilha expandida (specs 01, 02, 03)
3. Ondas da música (`Waves`) no modo `music`, no cartão central e no widget de música (spec 05)
4. Gerenciador de volume (modo `mixer`) e rolagem no botão de volume (spec 08)
5. Controles rápidos com 660px e os tiles Tela, Manter tela acesa, Gravar tela e Ditado (spec 08)
6. Modo `display`: brilho, tamanho do texto e escala do monitor (spec 08)
7. Wi‑Fi: estatísticas, QR, teste de velocidade, DNS, redes conhecidas e outras (spec 08)
8. IA: uma aba por provedor, tokens por dia e por modelo, lidos dos registros do `omarchy-agent-usage-update` (spec 12)
9. Modo `battery`, aberto pelo botão da bateria; o desenho do botão na barra não muda (spec 11)

Ficam de fora do v5: o seletor de cor de realce e o tema Claro em azul (temas do design não existem na Island).

## Fora de escopo (v1.x)

- Botão Atividades, terminais/Ghostty, modo Download e modo `system` (existem ou existiram no design e foram cortados)
- Barra na base ou nas laterais (`barPosition` do design), ilha vertical (`SIZES.compactV`) e widgets verticais: a barra fica só no topo
- Atalhos numerados de ambiente (`Alt+1–N` do design)
- Extensão de navegador companion (a música de navegador mostra ícone genérico)
- Ubuntu/outras distros testadas (o código não assume Arch, mas só o Arch é validado)
- Outros ambientes além do Omarchy (Hyprland puro, outros compositores). O GNOME fica no commit `5cb704a`
- Publicação no repositório de plugins do Omarchy (instalação via `install.sh`)
- Tema claro, botões de ação em notificações, bandeja AppIndicator, troca de layout de teclado
- GPU NVIDIA no bloco de hardware (sem máquina para validar o `nvidia-smi`)
- Cor de realce escolhida pelo usuário (painel de matiz/saturação do design v3): o `accent` é fixo (spec 01)

## Critérios de aceite globais

- [ ] 20 hot-reloads seguidos do plugin (`make smoke`): nenhum aviso de QML, nenhuma barra duplicada, e notificações, não lidas e ambiente ativo continuam iguais.
- [ ] Trocar a barra de volta para `omarchy.bar` (ou o plugin falhar ao carregar) devolve a barra padrão do Omarchy funcionando.
- [ ] Nenhum `TypeError`/`ReferenceError` no log do shell em uso normal.
- [ ] Animações da ilha sem queda perceptível de quadros a 60Hz.
