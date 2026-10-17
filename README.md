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

## Atualização

```bash
omarchy plugin update caionazario.island
```
