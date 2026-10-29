# 19 · Aparência (em andamento)

Origem: as opções de aparência do omadock (MIT, thepathless, @ `16492e5`): página _Appearance_, seção _Blur & Grain_ de _Motion & Effects_, `DockStyleLogic.qml`, `DockSurface.qml` e os shaders `gradient.frag`/`grain.frag`. Nada disto existe no design: o padrão de cada opção é o visual do design (spec 01 "Superfícies"), então quem não mexe não vê diferença.

Decisões (2026-10-28):

- O fundo "Tema" é o do tema da Island (spec 01 "Temas"). A paleta "Tema" do gradiente vem do `colors.toml` do tema do Omarchy (`~/.local/state/omarchy/current/theme/colors.toml`); sem ele, dos tons do realce da Island.
- Os cantos valem para as pílulas e para a ilha, compacta e aberta.
- Os controles ficam no editor de ambientes, na aba Aparência (spec 17).
- Ficam de fora as opções que só fazem sentido numa dock: divisores entre seções, seções separadas, indicadores e itens da dock.

## Cor

`src/core/color.ts`. O core não tem `Qt.color`: lê e escreve hex (`#RGB`, `#RRGGBB` e o `#AARRGGBB` do Qt), com canais de 0 a 1.

- **Contraste**: luminância relativa e razão de contraste da WCAG 2.
- **Claro ou escuro** (`isLight`): luma linear `0.2126 r + 0.7152 g + 0.0722 b` acima de 0.5, a regra do omadock.
- **Tinta sobre um fundo** (`blackOrWhiteOn`): `#141414` ou `#f2f2f2`, o que contrastar mais.
- **Matiz** (`hslOf`): em voltas de 0 a 1, e -1 para cinza, como o `hslHue` do Qt.

## Gradiente

`src/core/gradients.ts`. Paletas de 3 cores:

| id | Nome | Cores |
|---|---|---|
| `theme` | Tema | do tema do Omarchy (abaixo) |
| `aurora` | Aurora | `#5dffb0` `#7fc4ff` `#c99cff` |
| `sunset` | Pôr do sol | `#ff7a59` `#ff4f8b` `#ffc15e` |
| `ocean` | Oceano | `#1e90ff` `#00c2c7` `#6a5cff` |
| `forest` | Floresta | `#2e8b57` `#a3c95a` `#1f6f5c` |
| `rose` | Rosa | `#ff9ac1` `#c86bfa` `#ffd1dc` |
| `lavender` | Lavanda | `#b8a1ff` `#7aa2ff` `#f0b3ff` |
| `ember` | Brasa | `#ff5e3a` `#ff9f1c` `#8b1e3f` |
| `citrus` | Cítrico | `#ffd43b` `#94d82d` `#ff922b` |
| `mono` | Mono | `#9aa0a6` `#5f6368` `#d0d4d8` |

Paleta **Tema**:

1. Lê as linhas `nome = "#rrggbb"` do `colors.toml` do Omarchy. Um arquivo com mais de 256 KiB é ignorado inteiro.
2. Começa pelo `accent` do tema.
3. Percorre `magenta`, `blue`, `cyan`, `red`, `green`, `orange` e `yellow`, nessa ordem, e junta cada cor cujo matiz fique a pelo menos 0.07 de volta (~25°) de todas as já escolhidas, até ter 3.
4. Se faltar, completa com o acento.
5. Sem o arquivo, ou sem `accent` nele: `accent-300`, `accent-500` e `accent-700` da Island.

Um id desconhecido no `settings.json` usa a paleta Tema.

## Critérios de aceite

- [ ] Com o `settings.json` sem a chave de aparência, a barra fica igual à de antes.
