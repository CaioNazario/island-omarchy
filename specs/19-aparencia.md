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

## Opções

`src/core/appearance.ts`. Ficam em `settings.json` `appearance` (spec 13). `sanitizeAppearance` devolve a chave ausente, de tipo errado ou fora da lista ao padrão, limita os números à faixa e arredonda ao passo do controle.

| Chave | Tipo e faixa | Padrão |
|---|---|---|
| `background` | bool | `true` |
| `fill` | `solid` \| `gradient` | `solid` |
| `color` | `theme` \| `none` \| `#rrggbb` | `theme` |
| `gradient` | `theme` ou id de paleta (abaixo) | `theme` |
| `gradientStrength` | 0–1, passo 0.01 | 0.6 |
| `opacityFromTheme` | bool | `true` |
| `opacity` | 0–1, passo 0.01 | 1 |
| `border` | bool | `true` |
| `borderWidth` | 1–6 px, passo 0.5 | 1 |
| `borderOpacityAuto` | bool | `true` |
| `borderOpacity` | 0–1, passo 0.01 | 0.05 |
| `shadow` | bool | `true` |
| `shadowStrength` | 0–1, passo 0.01 | 0.5 |
| `shape` | `default` \| `rounded` \| `square` \| `theme` | `default` |
| `cornerRadius` | 2–24 px, passo 1 | 12 |
| `grain` | 0–1, passo 0.01 | 0 |
| `blur` | bool | `false` |

- O padrão reproduz o design: o anel de 1px a 5% (`borderWidth` 1, `borderOpacity` 0.05), a sombra de 0.5 das pílulas (a ilha aberta usa 1.2×, os 0.6 do design) e os raios de `SIZES` (`shape` `default`).
- `color` com alfa (`#AARRGGBB`) volta a `theme`: a opacidade é uma opção à parte.
- Cores sólidas oferecidas, as do omadock, todas escuras: `#000000` `#181825` `#1e1e2e` `#0f172a` `#111827` `#062e24` `#1c1917` `#2c0b16` `#1e102d` `#334155`.

### Presets

| Preset | O que muda do padrão |
|---|---|
| Padrão | nada |
| Vidro | o Glass do omadock: gradiente Aurora a 0.55 e grão 0.18 |

`matchingPreset` diz qual preset a aparência atual é, ou vazio quando alguma opção foi ajustada à mão.

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

## Superfície

`src/core/surfaceStyle.ts` calcula o estilo de cada superfície (pílula ou ilha) a partir das opções, do fundo do tema (`lane` ou `island`), da paleta e do blur do sistema. O QML só pinta.

- **Blur** ativo só com `blur`, `decoration:blur:enabled` do Hyprland e fundo ligado.
- **Opacidade**: a do tema é 1 sem blur e 0.82 com blur (o `bg` 82% do design). Desligando "do tema", vale `opacity`.
- **Fundo**: cor do tema ou a escolhida, com a opacidade. "Nenhuma" é preto 25% fixo. Fundo desligado: transparente, sem acabamento nem sombra.
- **Acabamento** (brilho e halo do design): só com fundo ligado e cor diferente de "Nenhuma".
- **Borda**: branca, de `borderWidth`. Automática: 0.05 (o anel do design), ou 0.48 quando o fundo quase some (desligado, "Nenhuma" ou opacidade abaixo de 0.25). Manual: `borderOpacity`.
- **Sombra**: `shadowStrength`; na ilha aberta, 1.2× (até 1). Desligada ou sem fundo, 0.
- **Gradiente**: o retângulo de fundo fica transparente e o shader pinta a base (a cor do fundo com a opacidade) e as cores por cima. A força é limitada para os textos continuarem legíveis (`cappedStrength`): a maior força, até a pedida, em que cada tinta atinge o contraste mínimo sobre o fundo médio (o tema misturado à média das 3 cores com 75% da força, como o omadock estima).
  - Pílulas e ilha compacta: `text` a 4.5:1. A Aurora vai até 0.63.
  - Ilha aberta: também os rótulos `neutral-500` (`#9397ab`) a 3:1. Fica entre 0.39 (Aurora) e 0.65 (Brasa).

### Render

O `Tokens.qml` calcula `pillStyle`, `islandStyle` e `islandOpenStyle` com `surfaceStyle`. A `SoftSurface` escolhe o seu (a ilha troca ao abrir) e pinta o fundo com `fill`, e o brilho e o halo só com `finish`. O 1px de brilho no topo (`inset 0 1px 0`) só aparece sobre fundo opaco: atrás de um fundo translúcido, o branco clarearia a superfície inteira.

## Persistência

O `Service.qml` lê `settings.json` `appearance` com `sanitizeAppearance` a cada mudança do arquivo e entrega o resultado à barra, que o liga ao `Tokens.appearance`. Uma troca pela UI (`setAppearanceOption`, `withAppearanceOption` no core) grava o objeto inteiro já saneado; um valor inválido não muda nada. Aplicar um preset (`applyAppearancePreset`) grava o preset inteiro. O `make smoke` semeia uma aparência com uma opção inválida e confere o que a barra recebe.

## Aba Aparência

### Peças

- **Seção** (`SettingsSection`): cartão `neutral-900`, raio 12, padding 12, rótulo de painel (11px maiúsculo `neutral-500`) e linhas com gap 10px.
- **Linha** (`SettingRow`): rótulo 12.5px/500 e, embaixo, dica opcional 11px `neutral-500`; controle à direita. Variantes:
  - `SwitchRow`: `ToggleSwitch`.
  - `SliderRow`: `IslandSlider` de 150px + valor 12px `neutral-300` (porcentagem ou `px`). O slider vai de 0 a 100, e a linha converte para a faixa da opção.
  - `ChoiceRow`: `ChoiceButton` de 88px.
- **Cor** (`ColorSwatch`): círculo de 24px, anel `neutral-700` (hover `neutral-400`); escolhida, anel de 2px `accent`.
- **Paleta** (`GradientTile`): faixa 64×30, raio 8, com as 3 cores em 0/50/100%, e o nome 11px embaixo. Escolhida: anel de 2px e nome `accent`.

## Critérios de aceite


- [ ] Com o `settings.json` sem a chave de aparência, a barra fica igual à de antes.
- [x] Editar `appearance` no arquivo vale na hora, e um valor inválido volta ao padrão.
