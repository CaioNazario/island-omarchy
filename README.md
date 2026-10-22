# Island
Um plugin de barra do **[Omarchy](https://omarchy.org/)** (Hyprland + Quickshell) que substitui a barra padrão por três pílulas flutuantes.
A pílula central — a **Island** — funciona como uma Dynamic Island para o desktop: muda de tamanho conforme o contexto e concentra notificações, música, volume, brilho, calendário, controles rápidos e outras informações do sistema.
As pílulas laterais mostram widgets, organizados em **ambientes** que você troca com um gesto ou atalho.

> Até a v1.1 a Island era uma extensão do GNOME Shell. O último código GNOME está no commit `5cb704a`.
***
## ✦ Recursos
### Island
Quando compacta, a Island mostra:
- Relógio
- Dia da semana
- Clima

Quando expandida, pode exibir:
- Notificações
- Música e controles de reprodução, com ondas que pulsam enquanto toca
- Volume e brilho
- Gerenciador de volume: saídas, volume por app e microfone
- Calendário
- Controles rápidos
- Wi-Fi: estatísticas da conexão, QR para compartilhar, teste de velocidade e DNS
- Bluetooth
- Tela: brilho, tamanho do texto e escala do monitor
- Bateria: detalhes e perfil de energia
- Uso de IA

A Island possui diferentes modos de exibição e só mantém um modo ativo por vez.
### Ambientes
Um ambiente é um conjunto nomeado de widgets para as duas pílulas laterais. Só um fica ativo por vez, igual em todos os monitores.
Vêm quatro prontos:

| Ambiente | Esquerda | Direita |
|---|---|---|
| Padrão | IA | Hardware |
| Trabalho | Próximo evento, Pomodoro, IA | Hardware, GitHub |
| Estudos | Progresso do dia, Pomodoro | Nota |
| Fim de semana | Música | Contagem regressiva |

É possível ter até 6. O Padrão pode ser editado, mas não excluído.
Para trocar de ambiente:
- Rolagem horizontal sobre a barra (dois dedos no touchpad ou roda inclinada)
- `Super+Ctrl+Alt+→` / `Super+Ctrl+Alt+←` (binds do Hyprland que o `install.sh` mostra)
- Clique num dos pontos do botão de ambiente

### Widgets
| Widget | Mostra | Clique |
|---|---|---|
| Uso de IA | Sessão e limite semanal | Abre o cartão de IA |
| Hardware | CPU, RAM, GPU, temperatura e rede | Abre os controles rápidos |
| Próximo evento | O próximo compromisso do dia | Abre o calendário |
| Pomodoro | Ciclos de 25 min de foco e 5 min de pausa | Inicia/pausa |
| Música | O que está tocando agora | Abre a música |
| GitHub | Seus PRs abertos e quantos esperam sua revisão | — |
| Progresso do dia | Quanto do dia já passou | — |
| Contagem regressiva | Dias até uma data | Sem data: abre as preferências |
| Nota | Um recado fixo na barra | Edita o recado |

Quando falta espaço, o Hardware perde blocos (rede, GPU, temperatura) e depois somem widgets inteiros, a começar pelo mais longe da Island.
### Editor de ambientes
> Ainda não portado para o Omarchy (spec 17). Por enquanto, os ambientes se editam em `~/.config/island/settings.json`.

Clique no botão de ambiente, no início da pílula esquerda, para abrir o editor. Nele dá para:
- Criar, renomear, trocar o ícone e excluir ambientes
- Adicionar widgets clicando ou arrastando do catálogo para uma pílula
- Reordenar arrastando na própria barra, ou selecionar um widget e movê-lo ou removê-lo
- Ligar o auto-ocultar

### Auto-ocultar
> Ainda não portado para o Omarchy (spec 18).

Desligado por padrão. Quando ligado, a barra não reserva espaço no topo e sobe para fora da tela, e reaparece quando a Island abre qualquer modo.
### Notificações
A Island é o servidor de notificações da sessão (no lugar dos toasts do Omarchy). As notificações aparecem na Island e ficam numa lista.
No Chrome, Brave e outros navegadores Chromium, notificações web exibem o serviço de origem — por exemplo, WhatsApp, Discord ou YouTube.
Isso não funciona no Firefox, que não manda a origem na notificação.
Também há **Não perturbe**, e os atalhos e scripts de notificação do Omarchy (`Super+vírgula`, `omarchy toggle notification-silencing`…) continuam funcionando.
### Música
Compatível com qualquer player que implemente **MPRIS**, incluindo Spotify e players executados no navegador.
Exibe:
- Capa do álbum
- Título
- Artista
- Controles de reprodução

### Cartão central
O cartão central combina:
- Música em reprodução
- Calendário da semana ou do mês
- Eventos de hoje, do feed ICS do seu calendário (veja Calendário)

O calendário pode ser aberto ao clicar na Island compacta, dependendo da preferência configurada.
### Calendário
Os eventos vêm de um feed ICS privado, por exemplo o do Google Calendar (somente leitura). No Google: **Configurações → (sua agenda) → Integrar agenda → Endereço secreto no formato iCal**. Guarde a URL no chaveiro, sem passar pela linha de comando:
```bash
secret-tool store --label="Island: calendário (ICS)" service island kind calendar-ics
```
O comando pede o valor no terminal: cole a URL. A Island lê a URL do chaveiro a cada atualização do feed (15 min) e a mantém só em memória. Para parar de usar: `secret-tool clear service island kind calendar-ics`.

Suporta eventos únicos, dia inteiro, recorrentes (`RRULE`, `EXDATE`) e ocorrências editadas ou canceladas. Quem tem a URL lê a agenda toda: não a cole em issue, log ou arquivo de configuração, e gere outra no Google se ela vazar. O Google demora a refletir mudanças no feed (de minutos a algumas horas).
### Clima
Dados do Open-Meteo, sem chave de API. A cidade vem de:
- `weatherLocation` em `~/.config/island/settings.json`
- A cidade do Omarchy (`omarchy weather location`)

Sem cidade, o clima some da Island (sem geolocalização por IP).

### Controles rápidos
Abra pela seta da pílula direita ou com `Super+S` (bind do Hyprland que o `install.sh` instala).
Inclui:
- Volume (o ícone abre o gerenciador de volume)
- Brilho
- Wi-Fi
- Bluetooth
- Modo noturno (hyprsunset do Omarchy)
- Não perturbe
- Tela (brilho, `omarchy-display-text-size` e escala do monitor)
- Manter tela acesa (o mesmo de `omarchy toggle idle`)
- Gravar tela (menu de captura do Omarchy)
- Ditado (Voxtype, se instalado)
- Energia: suspender, reiniciar, desligar, sair e bloquear, pelos comandos do Omarchy

As teclas de volume e brilho do Omarchy abrem a Island no lugar do OSD dele. Outros avisos de OSD (microfone, desligando…) aparecem num modo próprio da Island.
- Configurações
- Linha de energia:
  - Suspender
  - Reiniciar
  - Desligar
  - Sair
  - Bloquear

### Hardware
Informações sobre:
- CPU
- RAM
- GPU Intel/AMD
- Temperatura
- Rede

### Bateria
A barra desenha a bateria com o nível dentro: verde a partir de 80%, vermelha até 20%, e um raio enquanto carrega. O clique abre um painel com capacidade, tempo, ciclos e potência (`omarchy-battery-status`) e o perfil de energia (`omarchy-powerprofiles-set`).
### Uso de IA
A Island mostra os limites de uso e os tokens por dia e por modelo do **Claude** e do **Codex** a partir dos registros do `omarchy-agent-usage-update`, que ela roda como o widget de agentes do Omarchy.
> Veja [Uso de IA: leia antes](#uso-de-ia-leia-antes).

***
## Como funciona
A Island possui dois tipos de modos.
### Transitórios
São ativados automaticamente por eventos e desaparecem após alguns segundos.
- `notif`
- `music`
- `volume`
- `brightness`
- `env` (nome do ambiente ao trocar)

Passar o mouse sobre a Island mantém o modo aberto.
### Fixos
São abertos por clique ou atalho e permanecem visíveis até que o usuário:
- Clique fora
- Pressione `Esc`
- Acione outro gatilho

Modos fixos:
- `stack`
- `calendar`
- `quick`
- `wifi`
- `bt`
- `ai`
- `note`

### Eventos não interrompem o que você abriu
Eventos automáticos respeitam o modo fixo atualmente aberto.
Por exemplo:
- Uma notificação não substitui um calendário aberto. Ela aparece como um banner abaixo da Island.
- Trocar de música não abre automaticamente o modo de música enquanto outro modo fixo estiver aberto.

Isso evita que a interface fique pulando de um estado para outro enquanto você está usando algum controle.
### Interações
- **Clique na Island compacta:** abre o cartão central ou o calendário, conforme configurado.
- **Clique em uma notificação:** abre a lista de notificações.
- **Rolar para baixo sobre a barra** (qualquer uma das três pílulas, mouse ou touchpad): abre a lista de notificações; **para cima**, fecha. Dentro da lista, para cima rola a lista e só fecha quando ela está no topo.
- **Três dedos para baixo no touchpad:** abre a lista de notificações; **para cima**, fecha. Os gestos são do Hyprland (`openStack` e `closeStack` do alvo IPC `island`; spec 04).
- **Clique no botão de ambiente:** abre o editor de ambientes.
- **`Super+S`:** abre os controles rápidos.
- **`Super+Ctrl+Alt+←/→`:** troca de ambiente.
- **`Esc`:** fecha o modo fixo atual.

***
## Arquitetura
```
src/core/   # Regras em TypeScript puro (estados da ilha, roteamento, limiares, formatação), testadas com Vitest
plugin/     # O plugin: manifest.json, Bar.qml, Service.qml
  system/   # Fontes de dados (Pipewire, Mpris, UPower, NetworkManager, BlueZ, /proc, HTTP de IA)
  ui/       # Componentes QML: pílulas, ilha, modos, cartão central, widgets
dev/        # Harness que hospeda o plugin num Hyprland aninhado
```
O `src/core` é compilado para módulos ES (`.mjs`) que o QML importa direto.
***
## Requisitos
- **Omarchy 4** (Quickshell 0.3, Hyprland 0.56)
- Node.js 22 e npm, para o build

### Recursos opcionais
**Clima**: uma cidade (veja Clima acima).
**Uso de IA**: login em um ou ambos:
- Claude Code — `~/.claude/.credentials.json`
- Codex CLI — `~/.codex/auth.json`

**Calendário**: o `secret-tool` (libsecret) e a URL do feed ICS (veja Calendário acima).

**GitHub**: o [`gh`](https://cli.github.com/) com login feito (`gh auth login`). A Island só lê o token com `gh auth token` e o mantém em memória.
***
## Instalação
```
git clone https://github.com/CaioNazario/island-desktop.git
cd island-desktop

npm ci
./install.sh
```
O `install.sh` compila o plugin, copia para `~/.config/omarchy/plugins/caionazario.island/`, desliga as notificações e o OSD do Omarchy (a Island assume os dois) e troca a barra. O shell recarrega sozinho, sem logout.

Ele também instala os atalhos e gestos da Island (`Super+S`, `Super+Ctrl+Alt+←/→` e três dedos para baixo/cima): copia `hypr/island.lua` para `~/.config/hypr/island.lua` e acrescenta `require("hypr.island")` no fim do `~/.config/hypr/hyprland.lua`, com backup. Não repita esses binds no seu `bindings.lua`: o Hyprland rodaria os dois. O `--uninstall` tira a linha e o arquivo.

As preferências ficam em `~/.config/island/settings.json` (a janela de preferências ainda não foi portada). Mudanças no arquivo valem na hora.
***
## Atualização
```
git pull
npm ci
./install.sh
```
***
## Desinstalação
```
./install.sh --uninstall
```
Volta para a barra do Omarchy e religa as notificações e o OSD dele.
***
## Uso de IA: leia antes
A Island não lê credenciais nem consulta APIs de uso por conta própria. Ela roda o `omarchy-agent-usage-update` (o mesmo coletor do widget de agentes do Omarchy) a cada 15 minutos, com o widget de IA no ambiente ativo, e lê os registros em `~/.local/state/omarchy/agents/usage/`.
Os limites dependem do coletor do Omarchy: o do Claude consulta o endpoint de uso com a credencial do Claude Code, que não é uma API pública e pode mudar.
Sem login no CLI, o widget continua disponível, mas mostra apenas **"IA"**. Para não usar esse recurso, desative os provedores nas preferências.
***
## Limitações
Atualmente:
- Apenas Omarchy (o GNOME ficou no commit `5cb704a`).
- Ainda não portados: editor de ambientes, auto-ocultar e a janela de preferências.
- O calendário só lê (feed ICS): não cria nem edita eventos. Não suporta `RDATE` nem `RRULE` com `BYSETPOS`, `BYWEEKNO` ou frequência abaixo de dia.
- GPUs NVIDIA não aparecem no bloco de hardware.
- Notificações do Firefox não mostram o serviço web de origem.
- Não há tema claro nem botões de ação nas notificações.
- A barra fica só no topo, e monitores com menos de 1280px lógicos não são suportados.
***
## Desenvolvimento
```
npm ci
make test    # Vitest em src/core
make lint    # ESLint, Prettier, tsc, módulos do core no motor QML e qmllint
make build   # dist/caionazario.island/
make dev     # Hyprland aninhado numa janela, rodando o plugin pelo harness dev/
make smoke   # o mesmo sem interação: 5 hot-reloads e falha com erro no log
```
O harness roda num D-Bus próprio e com `XDG_CONFIG_HOME`/`XDG_STATE_HOME` em `dist/xdg`: não disputa as notificações da sua sessão nem grava nas suas preferências. Para dirigir a Island de fora: `scripts/nested.sh serve`, `scripts/nested.sh ipc dev open quick`, `scripts/nested.sh notify "Título" "Corpo"`, `scripts/nested.sh shot` e `scripts/nested.sh stop`.
***
## Especificações e design
O comportamento da Island está documentado em `specs/`.
Comece por:
```
specs/00-visao-geral.md
```
As referências visuais estão em:
```
design/
```
As convenções de desenvolvimento estão em:
```
AGENTS.md
```
***
## Debug
Logs do shell do Omarchy, onde o plugin roda:
```
qs log -p /usr/share/omarchy/shell
```
Logs do harness: `dist/dev.log`.
***
## Licença
GPL-3.0-or-later
