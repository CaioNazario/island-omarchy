# Changelog

Versões da Island, plugin de barra do Omarchy. Formato de [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), numeração [SemVer](https://semver.org/lang/pt-BR/): na série 0.x, uma versão minor pode quebrar compatibilidade.

## [Não lançada]

### Adicionado

- Interface em inglês, com um switch "Language" no rodapé da aba Ambientes do editor para voltar ao português. A troca vale na hora, chave `language` do `settings.json`.
- Tamanho da barra na aba Aparência (seção Tamanho): Automático, Pequena, Média ou Grande. É um zoom de toda a UI (barra, ilha aberta, painéis e editor), chave `barSize` do `settings.json`.
- No Automático, cada monitor ganha o tamanho que combina com ele: pequena em notebooks e escala fracionária, grande em QHD e 4K em escala 1.

### Mudado

- O inglês passa a ser o idioma padrão. Quem prefere português escolhe "Português" no editor de ambientes; ambientes já editados guardam o nome como estão.
- O teste de velocidade do Wi‑Fi termina em "Complete" ("Concluído") e o widget de contagem aparece no catálogo como "Date countdown" ("Contagem regressiva").
- A barra se adapta a monitores com menos de 1280×720 lógicos: o zoom cai até o layout caber, em vez de cortar a ilha e o editor.

## [0.7.0] - 2026-10-31

### Adicionado

- Fundo das pílulas e da ilha configurável na chave `appearance` do `settings.json`: cor do tema, nenhuma ou uma das cores sólidas, e opacidade.
- Aba Aparência no editor de ambientes, com a seção Fundo. O "Concluir" vai para o cabeçalho, ao lado das abas.
- Blur atrás das pílulas e da ilha (seção Efeitos), pelo compositor. Com ele, o fundo do tema fica em 82%, como no design.
- Fundo em gradiente, com 9 paletas e a paleta Tema, tirada das cores do tema do Omarchy. A força cede para os textos continuarem legíveis.
- Grão de filme sobre o fundo (seção Efeitos).
- Borda configurável: ligada ou não, largura e opacidade (seção Borda).
- Sombra configurável: ligada ou não, e força (seção Sombra).
- Cantos das pílulas e da ilha, compacta e aberta: os do design, arredondados com raio escolhido, quadrados ou os das janelas do Hyprland (seção Forma).
- O banner de notificação segue a aparência da ilha.
- Estilos prontos na aba Aparência: Padrão (o design, que desfaz os ajustes) e Vidro.
- Widgets de barra de outros plugins do Omarchy (como o omaplug) nas pílulas, adicionados pela seção "Plugins do Omarchy" do editor de ambientes. O widget abre o painel dele logo abaixo da barra.

### Mudado

- Tema e Realce saem da aba Ambientes do editor e vão para a aba Aparência.
- A CI roda nos pushes da `dev`.
- A tag de uma versão publica o build na `main` e cria a release no GitHub.

## [0.6.0] - 2026-10-27

### Adicionado

- Bateria amarela com a economia de energia ligada.

### Removido

- O que restava da época GNOME: a busca de cidade das antigas preferências e o campo de notificação já reconhecida.

## [0.5.0] - 2026-10-21

### Adicionado

- Atalhos e gestos no projeto (`hypr/island.lua`): `Super+S` abre os controles rápidos (no lugar do scratchpad do Omarchy); três dedos para baixo abrem a lista de notificações, e para cima fecham.
- Realce Roxo ou Branco no editor.

### Mudado

- Ficam só os temas Nocturne e Alto contraste. Um tema removido salvo nas preferências volta ao Nocturne.
- Botões dos controles rápidos mais fortes fora do Nocturne com realce Roxo.

## [0.4.0] - 2026-10-18

### Adicionado

- Eventos do calendário lidos de um feed ICS privado (o "endereço secreto no formato iCal" do Google Agenda), com a URL guardada no chaveiro.
- Rolar sobre a barra abre (para baixo) e fecha (para cima) a lista de notificações.

### Corrigido

- Os widgets salvos dos ambientes se perdiam ao reiniciar, e a próxima edição apagava o arquivo de preferências.

## [0.3.0] - 2026-10-17

### Adicionado

- Editor de ambientes: criar, renomear, trocar o ícone e apagar ambientes; adicionar widgets de um catálogo, movê-los entre as pílulas e arrastá-los.
- Temas do design (Nocturne, Vidro fosco, Sólido, Claro e Alto contraste), escolhidos no editor.

### Corrigido

- O clima acha a localização como o widget de clima do Omarchy.
- O clima piscava num ciclo de atualizações.
- Deslizar dois dedos troca de ambiente.
- Brilho roxo em volta da barra.

## [0.2.0] - 2026-10-17

Design v5.

### Adicionado

- Gerenciador de volume: volume geral, saídas, cada app tocando e microfone. Rolar no botão de volume muda 5%.
- Painel de tela: brilho, tamanho do texto e escala do monitor.
- Painel de bateria, aberto pelo botão da bateria: nível, carga, ciclos, potência e perfis de energia.
- Wi‑Fi: estatísticas, compartilhamento por QR, teste de velocidade, DNS e redes conhecidas separadas das outras.
- IA: uma aba por provedor e tokens por dia e por modelo.
- Controles rápidos com 660px e os botões Manter tela acesa, Gravar tela e Ditado.
- Ondas na música enquanto ela toca.

### Mudado

- Barra com 26px.
- Expansões de uma linha mais finas.
- Acabamento v5 nas pílulas e na ilha: brilho, halo e sombras suaves.
- Limites de IA lidos dos registros do `omarchy-agent-usage-update`: a Island não lê mais as credenciais dos CLIs.
- Atalhos sugeridos que o Omarchy deixa livres: `Super+I` para os controles rápidos e `Super+Ctrl+Alt+←/→` para trocar de ambiente.

### Corrigido

- Reinstalar reinicia o shell, para a versão nova valer.

## [0.1.0] - 2026-10-17

Primeira versão: a Island como plugin de barra do Omarchy.

### Adicionado

- Barra de três pílulas no lugar da barra do Omarchy, com a ilha no centro.
- Controles rápidos: volume, brilho, Wi‑Fi (com senha na ilha), Bluetooth e energia.
- OSD de volume e brilho na ilha.
- Servidor de notificações próprio: banner, lista e site no lugar do navegador em alertas web.
- Música via MPRIS, calendário e cartão central.
- Clima pelo Open-Meteo.
- Ambientes e widgets nas pílulas laterais, com hardware e uso de IA do Claude e do Codex.

[Não lançada]: https://github.com/CaioNazario/island-omarchy/compare/v0.7.0...dev
[0.7.0]: https://github.com/CaioNazario/island-omarchy/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/CaioNazario/island-omarchy/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/CaioNazario/island-omarchy/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/CaioNazario/island-omarchy/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/CaioNazario/island-omarchy/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/CaioNazario/island-omarchy/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/CaioNazario/island-omarchy/releases/tag/v0.1.0
