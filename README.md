# Island

Plugin de barra do [Omarchy](https://omarchy.org/) que substitui a barra padrão por três pílulas flutuantes, com uma Dynamic Island no centro para notificações, música, volume, brilho, calendário, controles rápidos e uso de IA.

Este branch contém só o plugin já compilado. O código-fonte, os testes e as specs ficam no branch [`dev`](https://github.com/CaioNazario/island-omarchy/tree/dev).

## Instalação

```bash
omarchy plugin add https://github.com/CaioNazario/island-omarchy.git
omarchy plugin enable caionazario.island
```

A Island assume as notificações e o OSD. Desative os plugins do Omarchy que fazem o mesmo, para não haver dois servidores disputando os mesmos alvos IPC:

```bash
omarchy plugin disable omarchy.notifications
omarchy plugin disable omarchy.osd
```

## Atalhos e gestos

O plugin traz os atalhos e gestos da Island em `hypr/island.lua`. Para ligá-los, acrescente no fim do `~/.config/hypr/hyprland.lua`:

```lua
dofile(os.getenv("HOME") .. "/.config/omarchy/plugins/caionazario.island/hypr/island.lua")
```

- `Super+S`: controles rápidos (tira o scratchpad do Omarchy dessa tecla)
- `Super+Ctrl+Alt+←/→`: troca de ambiente
- Três dedos para baixo no touchpad: abre a lista de notificações; para cima, fecha

Como o arquivo fica dentro do plugin, o `omarchy plugin update` também atualiza os atalhos. Não repita esses binds no seu `bindings.lua`: o Hyprland rodaria os dois.

## Atualização

```bash
omarchy plugin update caionazario.island
```
