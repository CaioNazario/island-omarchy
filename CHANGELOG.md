# Changelog

Versões da Island, plugin de barra do Omarchy. Formato de [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), numeração [SemVer](https://semver.org/lang/pt-BR/): na série 0.x, uma versão minor pode quebrar compatibilidade.

## [Não lançada]

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

[Não lançada]: https://github.com/CaioNazario/island-omarchy/compare/v0.3.0...dev
[0.3.0]: https://github.com/CaioNazario/island-omarchy/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/CaioNazario/island-omarchy/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/CaioNazario/island-omarchy/releases/tag/v0.1.0
