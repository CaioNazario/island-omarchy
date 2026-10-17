
# Island
Uma extensão do **GNOME Shell** que substitui a top bar(barra superior) por três pílulas flutuantes.
A pílula central — a **Island** — funciona como uma Dynamic Island para o desktop: muda de tamanho conforme o contexto e concentra notificações, música, volume, brilho, calendário, controles rápidos e outras informações do sistema.
As pílulas laterais mostram widgets, organizados em **ambientes** que você troca com um gesto ou atalho.
***
## ✦ Recursos
### Island
Quando compacta, a Island mostra:
- Relógio
- Dia da semana
- Clima

Quando expandida, pode exibir:
- Notificações
- Música e controles de reprodução
- Volume e brilho
- Calendário
- Controles rápidos
- Wi-Fi
- Bluetooth
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
- `Super+Ctrl+→` / `Super+Ctrl+←`
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
Clique no botão de ambiente, no início da pílula esquerda, para abrir o editor. Nele dá para:
- Criar, renomear, trocar o ícone e excluir ambientes
- Adicionar widgets clicando ou arrastando do catálogo para uma pílula
- Reordenar arrastando na própria barra, ou selecionar um widget e movê-lo ou removê-lo
- Ligar o auto-ocultar

### Auto-ocultar
Desligado por padrão. Quando ligado, a barra não reserva espaço no topo e sobe para fora da tela.
Ela reaparece quando você empurra o ponteiro contra a borda de cima (só encostar não basta, para não atrapalhar as abas de um navegador maximizado), quando a Island abre qualquer modo e quando o overview ou o editor estão abertos.
### Notificações
As notificações aparecem diretamente na Island e também podem ser consultadas em uma lista.
No Chrome, Brave e outros navegadores Chromium, notificações web exibem o serviço de origem — por exemplo, WhatsApp, Discord ou YouTube.
Isso não funciona no Firefox porque o navegador não fornece essa informação ao GNOME Shell.
Também há suporte a **Não perturbe**.
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
- Eventos das contas configuradas no GNOME

O calendário pode ser aberto ao clicar na Island compacta, dependendo da preferência configurada.
### Clima
O clima pode ser obtido a partir de:
- Cidade definida nas preferências da extensão
- Localizações configuradas no GNOME
- Geoclue, quando nenhuma cidade estiver configurada

### Controles rápidos
Abra com `Super+S`.
Inclui:
- Volume
- Brilho
- Wi-Fi
- Bluetooth
- Modo noturno
- Não perturbe
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
A barra desenha a bateria com o nível dentro: verde a partir de 80%, vermelha até 20%, e um raio enquanto carrega.
### Uso de IA
A Island pode mostrar os limites de uso do **Claude** e do **Codex**, utilizando as credenciais já existentes dos respectivos CLIs.
> Veja [Uso de IA: leia antes](#uso-de-ia-leia-antes) antes de ativar esse recurso.

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
- **Clique no botão de ambiente:** abre o editor de ambientes.
- **`Super+S`:** abre os controles rápidos.
- **`Super+Ctrl+←/→`:** troca de ambiente.
- **`Esc`:** fecha o modo fixo atual.

***
## Arquitetura
O projeto separa estado, integração com o sistema e interface:
```
src/
├── core/       # Máquina de estados e regras de comportamento
├── system/     # Integrações com o sistema
└── ui/         # Renderização da interface
```
### `src/core/`
Contém a máquina de estados da Island.
É escrita em **TypeScript puro** e testada com **Vitest**.
### `src/system/`
Responsável pela comunicação com serviços e APIs do sistema, incluindo:
- MPRIS
- NetworkManager
- BlueZ
- UPower
- Evolution Data Server
- GWeather

### `src/ui/`
Responsável apenas pela apresentação do estado usando **St/Clutter** do GNOME Shell.
***
## Requisitos
- **GNOME Shell 50**
- **Wayland**
- Node.js 22
- npm
- `glib-compile-schemas`

A extensão é validada no **Arch Linux**, mas o código não depende de componentes específicos do Arch.
### Recursos opcionais
**Calendário**
Requer o Evolution Data Server com uma conta configurada no GNOME.
**Clima**
Requer `libgweather-4`.
Se nenhuma cidade estiver configurada, a extensão pode usar o Geoclue, desde que a localização esteja habilitada.
**Uso de IA**
Requer login em um ou ambos:
- Claude Code — `~/.claude/.credentials.json`
- Codex CLI — `~/.codex/auth.json`

**GitHub**
Requer o [`gh`](https://cli.github.com/) com login feito (`gh auth login`). A extensão só lê o token com `gh auth token` e o mantém em memória.

***
## Instalação
```
git clone https://github.com/CaioNazario/island-desktop.git
cd island-desktop

npm ci
./install.sh
```
O `install.sh` compila a extensão e a instala em:
```
~/.local/share/gnome-shell/extensions/island@caionazario.dev
```
No Wayland, o GNOME Shell não recarrega extensões em quente. Depois da instalação, faça **logout e login**.
Em seguida, ative a extensão:
```
gnome-extensions enable island@caionazario.dev
```
Para abrir as preferências:
```
gnome-extensions prefs island@caionazario.dev
```
Nas preferências é possível configurar, entre outras coisas:
- A ação do clique na Island
- Cidade do clima
- Provedores de IA
- Nome e data da contagem regressiva

Ambientes, auto-ocultar e a nota são editados direto na barra, não nas preferências.

***
## Atualização
```
git pull
npm ci
./install.sh
```
Depois, faça logout e login novamente.
***
## Desinstalação
```
gnome-extensions disable island@caionazario.dev
./install.sh --uninstall
```
Ao desativar a extensão, o painel padrão do GNOME Shell volta a funcionar normalmente.
***
## Uso de IA: leia antes
O widget de uso de IA **não utiliza APIs oficiais de uso**.
Quando ativados, os provedores funcionam da seguinte maneira:
1. A extensão lê o token OAuth existente em:
   - `~/.claude/.credentials.json`
   - `~/.codex/auth.json`
2. Utiliza esse token para consultar endpoints de uso **não documentados** da Anthropic e da OpenAI.
3. O endpoint do Claude exige o User-Agent do Claude CLI, então a extensão se identifica como o CLI.

A extensão:
- **Nunca modifica** os arquivos de credenciais.
- **Nunca renova** os tokens.
- Relê as credenciais quando o CLI atualiza o arquivo.

Esses endpoints não são APIs públicas e podem mudar ou deixar de existir a qualquer momento.
Se a resposta recebida estiver em um formato inesperado, o cartão de IA mostra um erro sem afetar o restante da extensão.
Se preferir não utilizar esse recurso, desative os provedores de IA nas preferências.
Sem uma credencial válida, o widget continua disponível, mas mostra apenas **"IA"**.
***
## Limitações
Atualmente:
- Apenas GNOME Shell 50.
- Apenas Wayland.
- Validado oficialmente apenas no Arch Linux.
- GPUs NVIDIA não aparecem no bloco de hardware.
- Notificações do Firefox não mostram o serviço web de origem.
- Não há tema claro.
- Notificações ainda não possuem botões de ação.
- Não há suporte a AppIndicator/System Tray.
- Não há troca de layout do teclado pela barra.
- O botão **Atividades** não faz parte da barra.
- A barra fica só no topo.
- Monitores com menos de 1280px lógicos de largura não são suportados.
- A extensão ainda não está disponível no extensions.gnome.org.
- A instalação é feita pelo `install.sh`.

***
## Desenvolvimento
Instale as dependências:
```
npm ci
```
### Testes
```
make test
```
Executa os testes do Vitest.
### Lint e tipos
```
make lint
```
Executa:
- ESLint
- Prettier
- TypeScript (`tsc`)

### Build
```
make build
```
Gera a versão compilada em:
```
dist/
```
### GNOME Shell aninhado
```
make dev
```
Abre um GNOME Shell aninhado usando o modo `--devkit`.
> O Shell aninhado carrega a versão **instalada** da extensão, e não diretamente o conteúdo de `dist/`.
> Depois de alterar o código, rode `./install.sh` antes de executar `make dev`.

***
## Especificações e design
O comportamento da extensão está documentado em `specs/`.
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
O log de debug é desativado por padrão.
Para ativá-lo:
```
touch ~/.cache/island-debug
```
É necessário fazer logout e login para que a alteração seja aplicada.
Depois, consulte os logs:
```
journalctl -b -o cat /usr/bin/gnome-shell | grep ISLANDDBG
```
Para desativar:
```
rm ~/.cache/island-debug
```
***
## Licença
GPL-3.0-or-later
