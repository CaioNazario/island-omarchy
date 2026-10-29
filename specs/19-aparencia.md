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

Leitura (`OmarchyThemeColors.qml`): `~/.local/state/omarchy/current/theme/colors.toml`, no caminho fixo que o `omarchy-theme-set` usa. Na troca de tema, o `omarchy-theme-set` apaga o diretório do tema e põe o novo no lugar (`rm -rf` + `mv`), o que mataria um watch no `colors.toml`. Por isso a Island vigia o `current/theme.name`, regravado no mesmo arquivo depois do `mv`, e relê as cores quando ele muda.

## Superfície

`src/core/surfaceStyle.ts` calcula o estilo de cada superfície (pílula ou ilha) a partir das opções, do fundo do tema (`lane` ou `island`), da paleta e do blur do sistema. O QML só pinta.

- **Blur** ativo só com `blur`, `decoration:blur:enabled` do Hyprland e fundo ligado.
- **Opacidade**: a do tema é 1 sem blur e 0.82 com blur (o `bg` 82% do design). Desligando "do tema", vale `opacity`.
- **Fundo**: cor do tema ou a escolhida, com a opacidade. "Nenhuma" é preto 25% fixo. Fundo desligado: transparente, sem acabamento nem sombra.
- **Acabamento** (brilho e halo do design): só com fundo ligado e cor diferente de "Nenhuma".
- **Borda**: branca, de `borderWidth`. Automática: 0.05 (o anel do design), ou 0.48 quando o fundo quase some (desligado, "Nenhuma" ou opacidade abaixo de 0.25). Manual: `borderOpacity`.
- **Grão**: `grain`; sem fundo, nenhum.
- **Sombra**: `shadowStrength`; na ilha aberta, 1.2× (até 1). Desligada ou sem fundo, 0.
- **Gradiente**: o retângulo de fundo fica transparente e o shader pinta a base (a cor do fundo com a opacidade) e as cores por cima. A força é limitada para os textos continuarem legíveis (`cappedStrength`): a maior força, até a pedida, em que cada tinta atinge o contraste mínimo sobre o fundo médio (o tema misturado à média das 3 cores com 75% da força, como o omadock estima).
  - Em todas as superfícies: `text` a 4.5:1 e os rótulos `neutral-500` (`#9397ab`, widget de hardware e rótulos dos painéis) a 3:1. Fica entre 0.39 (Aurora) e 0.65 (Brasa). Só com o texto, as pílulas aceitariam a Aurora até 0.63, mas os rótulos do hardware sumiam sobre o verde.

### Render

O gradiente é o `SurfaceGradient` (o shader), carregado por um `Loader` só quando a superfície tem gradiente, sobre o retângulo de fundo (que fica transparente) e sob o brilho e o halo. A força anima em 300ms.

O grão é o `SurfaceGrain` (`grain.frag`), também num `Loader`, ativo só com grão acima de 0, sobre o fundo e o gradiente e sob o brilho e o halo: pontos cinza estáticos, um por pixel lógico, cada um com alfa aleatório até 0.27 × `grain`, interpolados entre vizinhos e recortados pelo raio.

O `Tokens.qml` calcula `pillStyle` e `islandStyle` com `surfaceStyle`. A `SoftSurface` escolhe o seu e pinta o fundo com `fill`, e o brilho e o halo só com `finish`. O 1px de brilho no topo (`inset 0 1px 0`) só aparece sobre fundo opaco: atrás de um fundo translúcido, o branco clarearia a superfície inteira.

## Banner

O banner de notificação (spec 04) usa o `islandStyle`: cor e opacidade do fundo, gradiente, grão e a forma dos cantos sobre o raio 22 do design. Não tem o brilho, o halo nem a sombra, como no design. O anel é o `neutral-800` do design enquanto a opacidade da borda está em automático; com ela manual, a cor das outras superfícies. A largura é a da borda, e com a borda desligada não há anel. A região de blur dele usa o mesmo raio.

## Blur

Do compositor, pelo protocolo `ext-background-effect-v1` (specs/14-spikes.md, S9):

- Com o blur ativo (`surfaceStyle.blur`), a camada `island` de cada monitor ganha `BackgroundEffect.blurRegion` com um `Region` por superfície: as duas pílulas (raio 13), a ilha (o raio animado da `SoftSurface`, `Island.surfaceRadius`) e o banner quando visível (raio 22). Desligado, a região é `null`.
- A força é a do `decoration:blur:size` do Hyprland. A Island não muda esse valor, que vale para todas as janelas.
- `HyprOptionsSource` lê `decoration:blur:enabled` (`hyprctl getoption … -j`, `parseBoolOption` em `hyprOptions.ts`) ao subir e a cada `configreloaded`. Com ele desligado, o blur não fica ativo e a opacidade do tema volta a 1: um fundo de 82% sem blur deixaria a tela legível por trás.

## Cantos

`src/core/shapes.ts` (`shapedRadius`), por superfície: o raio do design daquela superfície e modo (`pillRadius` 13; na ilha, `displayRadius` de `SIZES`) e a altura dela.

| `shape` | Raio |
|---|---|
| `default` (Padrão) | o do design |
| `rounded` (Arredondado) | `cornerRadius`, entre 2 e meia altura − 4 (numa pílula de 26px, até 9) |
| `square` (Quadrado) | 0 |
| `theme` (Tema) | o `decoration:rounding` do Hyprland, até meia altura; sem o valor, o do design |

`Tokens.radiusFor(design, altura)` aplica a forma escolhida: nas pílulas (`Pill.surfaceRadius`, que também vai para o anel e o brilho do editor) e na ilha, compacta e aberta, sobre o `displayRadius` de cada modo. A animação de raio da ilha continua a mesma (460ms). As regiões de blur usam os mesmos raios.

O `HyprOptionsSource` lê o `decoration:rounding` (`parseIntOption`: inteiro não negativo, ou -1) junto com o blur, ao subir e a cada `configreloaded`, e o `Bar.qml` liga o valor a `Tokens.hyprRounding`.

## Shaders

`plugin/shaders/gradient.frag` e `grain.frag`, do omadock (MIT; specs/14-spikes.md, S10), com os `.qsb` commitados ao lado. O `make lint` roda `scripts/shaders-in-sync.sh`, que recompila cada `.frag` com o `qsb` (`--glsl "100 es,120,150" --hlsl 50 --msl 12`) e falha se o binário commitado for diferente. Na CI o `qt6-shadertools` é instalado e `REQUIRE_QSB=1` faz a falta do `qsb` falhar em vez de pular. Depois de editar um `.frag`: `scripts/shaders-in-sync.sh --write`.

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

### Seções

Aba Aparência do editor (`AppearancePage`), em duas colunas com gap 14px. Uma linha só aparece quando faz sentido, sem ficar desabilitada.

Coluna da esquerda: Tema, Fundo e Sombra. Da direita: Estilo, Forma, Borda e Efeitos.

**Estilo**

| Linha | Controle | Visível se |
|---|---|---|
| Estilo — "Padrão desfaz todos os ajustes. Vidro: Aurora com grão." | Padrão · Vidro (os presets); fica marcado o igual à aparência atual (`matchingPreset`), e nenhum depois de um ajuste | sempre |

Escolher um preset grava o preset inteiro (`applyAppearancePreset`).

**Tema**

As linhas Tema (Nocturne · Alto contraste) e Realce (Roxo · Branco) da spec 17, que saíram da aba Ambientes. Valem para a barra inteira e gravam `theme` e `accent` (spec 13), fora de `appearance`.

**Fundo**

| Linha | Controle | Visível se |
|---|---|---|
| Fundo — "Desligado, sobram só os ícones e o texto." | switch | sempre |
| Preenchimento — "Uma cor, ou cores que se misturam, como nos temas do Zen e do Arc." | Sólido · Gradiente | fundo ligado |
| Cor — "A do tema, nenhuma ou uma cor fixa." | Tema · Nenhuma, e as 10 cores sólidas embaixo | fundo ligado, sólido |
| Paleta — "A Tema vem do acento e das cores do tema do Omarchy." | as 10 paletas (`GradientTile`), Tema primeiro, com as cores que ela tem agora | fundo ligado, gradiente |
| Força — "Quanto as cores cobrem o fundo. Cede o necessário para os textos continuarem legíveis." | slider 0–100% | fundo ligado, gradiente |
| Opacidade do tema — "Opaca, ou 82% com o blur ligado, como no design." | switch | fundo ligado e cor diferente de Nenhuma |
| Opacidade | slider 0–100% | idem, com "Opacidade do tema" desligada |

**Forma**

| Linha | Controle | Visível se |
|---|---|---|
| Cantos — "Padrão são os do design; Tema segue o arredondamento das janelas do Hyprland." | Padrão · Arredondado · Quadrado · Tema, numa linha própria embaixo do rótulo | sempre |
| Raio — "Nas pílulas, até 9px: mais que isso já é uma pílula." | slider 2–24 px | Arredondado |

**Sombra**

| Linha | Controle | Visível se |
|---|---|---|
| Sombra — "Embaixo das pílulas e da ilha. Sem fundo, não há sombra." | switch | sempre |
| Força — "Na ilha aberta, 1.2× esta força." | slider 0–100% | sombra ligada |

A `SurfaceShadow` usa o alfa de `shadow` no `SOFT_OUT` e o de `shadowExpanded` no `--isl-drop`; com alfa 0, a sombra não é desenhada.

**Borda**

| Linha | Controle | Visível se |
|---|---|---|
| Borda — "Contorno fino em volta das pílulas e da ilha." | switch | sempre |
| Largura | slider 1–6 px | borda ligada |
| Opacidade automática — "Discreta como no design, e mais forte quando o fundo quase some." | switch | borda ligada |
| Opacidade da borda | slider 0–100% | borda ligada, automática desligada |

A borda fica por dentro da superfície (um `Rectangle` com `border` sobre o fundo), então não muda o tamanho de nada.

**Efeitos**

| Linha | Controle | Visível se |
|---|---|---|
| Blur — "Vidro fosco atrás da barra. A força é a do blur do Hyprland." (sem o blur do sistema: "O blur do Hyprland está desligado (decoration:blur:enabled): não tem efeito.") | switch | fundo ligado |
| Grão — "Granulado de filme sobre o fundo, sólido, translúcido ou com blur." | slider 0–100% | fundo ligado |

## Critérios de aceite


- [ ] Com o `settings.json` sem a chave de aparência, a barra fica igual à de antes.
- [x] Editar `appearance` no arquivo vale na hora, e um valor inválido volta ao padrão.
- [x] Com o blur ligado, o que está atrás das pílulas e da ilha fica borrado, e a sombra não.
- [x] Desligar o blur na config do Hyprland e recarregar deixa o fundo opaco de novo.
