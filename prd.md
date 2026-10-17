# PRD — Island: topbar com Dynamic Island para GNOME

**Status:** design validado em protótipo · **Plataforma:** GNOME Shell 50+ (Linux, Wayland) · **Data:** set/2026

Referência visual e de comportamento: `Desktop Island.html` (extraído em `design/`). Detalhe de implementação: `specs/`. Em conflito, vale design > specs > este PRD.

---

## 1. Problema

A topbar padrão do GNOME é estática e subutilizada: o relógio central só abre um calendário; notificações, mídia e controles do sistema ficam espalhados em menus separados; e informações que um desenvolvedor consulta o dia todo (uso de hardware, limites de IA) exigem abrir apps ou janelas.

## 2. Objetivo

Transformar a topbar num ponto único de consulta e controle, com uma "ilha" central que se expande conforme o contexto, no estilo Dynamic Island, sem roubar espaço da área de trabalho nem exigir troca de janela.

**Metas**
- Ver o estado do sistema (hardware, bateria, uso de IA) sem nenhum clique.
- Acessar controles frequentes (volume, brilho, Wi‑Fi, Bluetooth, toggles, energia) em 1 clique ou `Super+S`.
- Receber notificações no ponto onde o olhar já está (centro superior), inclusive enquanto a ilha está em uso.

**Fora de escopo (v1)**
- Botão Atividades, terminais/Ghostty, modo Download.
- Extensão de navegador companion (identificar o site que toca música).
- Distros além do Arch (o código não assume Arch, mas só ele é validado).
- Publicação no extensions.gnome.org (instalação via `install.sh`).
- Tema claro, botões de ação em notificações, bandeja AppIndicator.

## 3. Público

Usuário avançado de Linux/GNOME, desenvolvedor, com assinaturas de IA (Claude, Codex) e muitos serviços web abertos no navegador (YouTube, YouTube Music, Spotify, WhatsApp).

## 4. Princípios de design

1. **Tudo passa pela ilha.** Estados transitórios e controles aparecem no centro; o único painel fora dela é o cartão central de calendário e música.
2. **Condensar antes de esconder.** Informação permanente fica na barra em forma mínima (ícone, mini barra, número); o detalhe vai para tooltip ou expansão.
3. **Nunca interromper.** Nenhum evento automático substitui o que o usuário abriu.
4. **Visual Nocturne.** Escuro, acento blurple usado como linha/brilho, Inter 500, Phosphor icons, divisores que somem nas pontas.

## 5. Anatomia da topbar

Três pílulas flutuantes de **30px** de altura, a 12px das bordas laterais e encostadas no topo: **esquerda | ilha | direita**. As laterais têm largura igual, fundo translúcido com blur e raio total. Com auto-ocultar desligado, a barra reserva 30px e janelas maximizadas encostam logo abaixo. Uma barra por monitor.

### 5.1 Pílula esquerda
| Elemento | Comportamento |
|---|---|
| **Uso de IA** | Por provedor visível (Claude, Codex): ícone + mini barra + % da sessão. Tooltip com sessão e semanal. Clique abre a ilha no modo IA. |

### 5.2 Ilha (compacta)
Conteúdo: **clima · hora · dia** (ex.: `☀ 22° · 09:41 · Sex, 25`); sem clima disponível, só hora e dia. Clique abre o cartão central de calendário e música (ou o calendário compacto, conforme preferência).

### 5.3 Pílula direita
| Elemento | Comportamento |
|---|---|
| **Hardware** | Blocos de 2 linhas (rótulo 8.5px, valor embaixo): CPU, RAM, GPU, TEMP, NET. Largura fixa (não "pula"). CPU em `accent-300` ≥60%, TEMP vermelha ≥70°. Tooltip com detalhe. Em telas estreitas somem NET → GPU → TEMP. |
| **Sino** | Abre a lista de notificações. Ponto de não lido. |
| **Wi‑Fi** | Abre a ilha com controles rápidos + lista de redes. |
| **Volume** | Abre a ilha com slider de volume. |
| **Bateria** | Ícone + %: ícone verde ≥80%, vermelho ≤20% (texto também), neutro entre; ícone de carregando na tomada. Clique abre controles rápidos. |
| **Seta** | Abre controles rápidos. |

## 6. Modos da ilha

A ilha anima largura, altura e raio com efeito de mola; o conteúdo faz crossfade. Uma linha de acento no topo indica estado expandido.

| Modo | Tamanho | Gatilho | Fecha |
|---|---|---|---|
| **Notificação** | 400×62 | Chegada automática | Sozinho (4,2s); hover pausa |
| **Lista de notificações** | 400×até 6 itens (rola) | Sino, clique na notificação ou no banner | Clique fora / Esc |
| **Música** | 500×82 | Troca de faixa | Sozinho (4,5s) |
| **Volume** | 320×50 | Ícone de volume / tecla de volume | Sozinho (2,6s) |
| **Brilho** | 320×50 | Tecla de brilho | Sozinho (2,6s) |
| **Calendário compacto** | 480×150 (semana) / 480×214 (mês) | Clique na ilha, se configurado | Clique fora / Esc |
| **Controles rápidos** | 520×58 (106 com energia) | Bateria, seta, `Super+S` | Clique fora / Esc / atalho |
| **Wi‑Fi** | 520×292 (+ energia, + senha) | Ícone de Wi‑Fi, tile de Wi‑Fi | Clique fora / Esc |
| **Bluetooth** | 520×348 (300 desligado, + energia) | Tile de Bluetooth | Clique fora / Esc |
| **IA** | 480×variável | Botão de uso de IA | Clique fora / Esc |

**Detalhes por modo**
- **Lista:** cabeçalho com contador, "Limpar tudo", × por item, estado vazio "Nenhuma notificação". Clique no item abre o app/site.
- **Música:** capa, artista, faixa, progresso, anterior/play-pause/próxima, ícone da fonte.
- **Calendário:** abre na semana atual; "Mês" expande, "Semana" recolhe. Navegação entre meses. Eventos do dia sempre visíveis.
- **Controles rápidos:** sliders de brilho e volume + tiles Wi‑Fi, Bluetooth, Modo noturno, Não perturbe + Configurações + Energia (Suspender, Reiniciar, Desligar, Sair, Bloquear).
- **Wi‑Fi:** controles rápidos + switch + lista de redes (sinal, cadeado, conectada destacada). Rede protegida nova abre um campo de senha inline; rede conhecida conecta direto; Wi‑Fi desligado mostra estado vazio.
- **Bluetooth:** controles rápidos + switch + "Meus dispositivos" (com bateria) e "Disponíveis" (busca ativa, parear).
- **IA:** um cartão por provedor com plano, uso da **sessão (5h)** e **semanal**, e quando cada um reinicia. Cores: acento, acento claro ≥70%, vermelho ≥90%.

### Cartão central (fora da ilha)
Abre abaixo da ilha ao clicar nela compacta: música + calendário (semana/mês) + eventos do dia. Sem música tocando, só o calendário.

## 7. Notificações — regras

1. Chegam automaticamente e **caem dentro da ilha** quando ela está compacta.
2. Se a **lista** estiver aberta, a nova entra no topo com destaque por 2,5s.
3. Se **qualquer outro modo ou o cartão** estiver aberto, um banner no estilo da ilha desce **logo abaixo** dela (4s; clique abre a lista; × dispensa). O conteúdo aberto nunca é substituído.
4. Abrir a lista marca tudo como lido.
5. Notificações de navegador mostram o serviço ("YouTube", "WhatsApp"), nunca o nome do navegador nem o domínio cru.
6. Com Não perturbe, vão direto para a lista; só as críticas aparecem.

## 8. Interação e acessibilidade

- **Esc** fecha qualquer modo ou cartão (com o campo de senha focado, fecha só o campo); clique fora também.
- **`Super+S`** abre/fecha controles rápidos (sem repetição ao segurar).
- Hover sobre a ilha pausa o auto-fechamento de modos transitórios.
- Todo elemento interativo tem hover e pressed do ramp de acento e anel de foco de 2px no acento.
- Tooltips em todo elemento condensado (hardware, IA).
- Números com dígitos tabulares.
- Interface em pt-BR, traduzível (gettext).

## 9. Preferências

| Opção | Valores | Padrão |
|---|---|---|
| Clique na ilha abre | Calendário e música (cartão) · Calendário compacto (ilha) | Calendário e música |
| Ocultar automaticamente | A barra some e reaparece ao encostar o mouse no topo | Desligado |
| Cidade do clima | Busca de cidade; vazio usa o GNOME ou a localização automática | Vazio |
| Provedores de IA | Claude, Codex (liga/desliga cada um) | Ambos |
| Atalho dos controles rápidos | Qualquer combinação | `Super+S` |

## 10. Decisões tomadas (histórico)

| Decisão | Motivo |
|---|---|
| Painel único de 3 colunas descartado | Juntar notificações, calendário e sistema ficou confuso. |
| Volume e brilho no centro | Aprovado desde a primeira versão. |
| Notificações migradas para a ilha | Remover o cartão lateral e manter o foco no centro. |
| Controles rápidos só na ilha | Acesso por clique ou atalho, sem menu separado. |
| Hardware em blocos de 2 linhas | Condensar sem perder nenhum indicador quando a ilha expande. |
| Calendário compacto mantido em 480×150 | Preferência explícita, aceitando eventos apertados. |
| Três pílulas flutuantes | Visual integrado à tela, com a ilha independente das laterais. |
| Terminais, Atividades e Download removidos | Terminais: o Ghostty não expõe IPC para listar/focar abas. Download: sem API de sistema, só via extensão de navegador. |
| Codex no lugar de ChatGPT | O limite de sessão/semana acessível é o do Codex. |
| Uso de IA só lê credenciais | Renovar token por conta própria arrisca deslogar os CLIs. |
| Senha de Wi‑Fi inline | Nada de diálogo fora do visual Nocturne no fluxo comum. |
| Energia pelo diálogo nativo | Preserva o aviso de trabalho não salvo e o cancelamento. |

## 11. Métricas de sucesso (propostas)

- ≥70% dos ajustes de volume, Wi‑Fi e toggles feitos pela ilha.
- Tempo até ajustar volume/brilho ≤1,5s a partir do clique.
- Zero casos de notificação substituindo conteúdo aberto manualmente.
- Topbar sem corte de texto em 1280px de largura com a ilha no maior modo.
- Zero vazamentos após 20 ciclos de lock/unlock.

## 12. Requisitos técnicos

- Extensão GNOME Shell 50+ em TypeScript (tipos `@girs`), compilada com `tsc`, UI em St/Clutter, substituindo o painel padrão.
- Fontes de dados: `MessageTray` do Shell (notificações), MPRIS (mídia), `Gvc` (volume), NetworkManager (Wi‑Fi), GnomeBluetooth (Bluetooth), UPower (bateria), `/proc` + `/sys` (hardware), GWeather (clima), Evolution Data Server via `CalendarServer` (eventos), endpoints de uso do Claude e do Codex (IA).
- Toda fonte é opcional: sem a dependência, o bloco some.
- Animações a 60fps; nenhum I/O síncrono no main loop do Shell.
- Estado persistente em GSettings.
- Instalação via `install.sh`.

## 13. Questões abertas

Rastreadas como spikes em `specs/14-spikes.md`: formato da notificação web por navegador, senha errada de Wi‑Fi sem diálogo nativo, pareamento Bluetooth sem agente de UI e publicação no extensions.gnome.org.
