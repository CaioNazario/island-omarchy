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

## Critérios de aceite

- [ ] Com o `settings.json` sem a chave de aparência, a barra fica igual à de antes.
