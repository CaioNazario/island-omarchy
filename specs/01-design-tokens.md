# 01 · Design tokens

Origem: `design/tokens.css` (bloco `:root`, classes `.btn*`) e cores literais em `design/logic.js`.

## Cores

Uma tabela única em `plugin/ui/Tokens.qml` (singleton QML) é a fonte de toda cor, medida e curva da UI.

| Token | Hex |
|---|---|
| `bg` | `#161826` |
| `surface` | `#232532` |
| `text` | `#e9e9ed` |
| `neutral-100…900` | `#f3f5fe #e4e7f5 #cfd3e5 #b2b6ca #9397ab #75798c #595d6c #3f424d #292b31` |

### Realce

`accent` e `accent-100…900` são fixos: a escala que o design calcula ao carregar com matiz 289 e saturação 100%, e `accent` = `accent-500`. Os valores são `#f4f3ff #e6e4ff #d2cdff #b5acfa #9387dd #766ab9 #5a508f #3f3865 #28253e`. Os valores fixos do `tokens.css` (`#9184d9`, `#968ae0`…) não são usados: o design também troca pela escala calculada ao carregar. O design deixa escolher a matiz e a saturação; a Island não (fora de escopo, spec 00).

### Cores pré-calculadas

O QML não entende `oklch()` nem `color-mix()`. Valores convertidos (alfa via `Qt.alpha()`):

| Uso no design | Original | QML |
|---|---|---|
| Vermelho de alerta (IA ≥90%, TEMP ≥70°) | `oklch(0.68 0.19 25)` | `#f75d59` |
| Texto vermelho (IA ≥90%, erro de senha) | `oklch(0.72 0.17 25)` | `#fd736d` |
| Fundo do botão Energia aberto | `oklch(0.45 0.14 25)` | `#932b2a` |
| Texto "Desligar" | `oklch(0.78 0.13 25)` | `#ff958d` |
| Borda do campo de senha com erro | `oklch(0.55 0.16 25)` | `#bd413f` |
| Brilho da ilha expandida (v5) | `accent` 38% e 26% | `accent` com alfa 0.38 / 0.26 |
| Brilho das pílulas e da ilha compacta (`SOFT_OUT`, v5) | `accent` 34% e 22% | `accent` com alfa 0.34 / 0.22 |
| Halo do acento embaixo (v5) | `accent` 9% (pílula), 8% (ilha) | `accent` com alfa 0.09 / 0.08 |
| Brilho do cartão central | `accent` 10% | `accent` com alfa 0.10 |
| Brilho do thumb do slider de volume | `accent` 60% | `accent` com alfa 0.60 |
| `.btn-primary:hover` / `:active` | `accent` 12% / 22% | `accent` com alfa 0.12 / 0.22 |
| `.btn-ghost:hover` / `:active` | `accent` 10% / 18% | `accent` com alfa 0.10 / 0.18 |
| Brilho da pílula-alvo no editor (spec 17) | `accent` 22% | `accent` com alfa 0.22 |
| Fundo do editor (spec 17) | `bg` 94% / fundo escurecido `bg` 50% | `rgba(22,24,38,0.94)` / `0.50` |
| Divisor | `text` 16% | `rgba(233,233,237,0.16)` |
| Ponta dos divisores em degradê | `neutral-800` 0% | `rgba(63,66,77,0)` |

## Tipografia

- **Inter** peso 500 para rótulos e 400 para corpo, conforme o design. Sem Inter instalada, o Qt cai no fallback do fontconfig.
- Tamanhos usados: 8.5 (rótulo hardware, `letter-spacing .08em`), 8 (número dentro da bateria, peso 600), 10, 10.5, 11, 11.5, 12, 12.5, 13, 14px.
- Números sempre com dígitos tabulares (`font.features: { "tnum": 1 }`, em `IslandText.qml`).

## Ícones

- **Phosphor** nas variantes regular (`ph`), fill (`ph-fill`) e bold (`ph-bold`), exatamente as usadas no design.
- Empacotados como SVG simbólicos em `icons/` dentro do plugin; só os ícones usados, não a fonte inteira.
- Ícones de marca sem equivalente no Phosphor caem em `ph-music-note` (música) ou `ph-globe` (notificação de site).

## Superfícies

Pílulas e ilha usam o acabamento do design v5 (`plugin/ui/SoftSurface.qml`), sobre o fundo `bg` opaco:

- **Brilho vertical**: pílula `rgba(255,255,255,.045)` → `.01` em 46% → `rgba(0,0,0,.05)`; ilha `.04` → `.01` em 22% → transparente em 55% → `rgba(0,0,0,.05)`.
- **Halo do acento**: elipse radial embaixo, pílula `80% 150% at 50% 135%` (`accent` 9% → transparente em 65%), ilha `70% 120% at 50% 125%` (8% → 60%).
- **`SOFT_IN`** (por dentro): 1px de brilho `rgba(255,255,255,.07)` no topo, sombra `rgba(0,0,0,.14)` nos 8px de baixo e anel 1px `rgba(255,255,255,.05)`. O brilho interno de 4% do `accent` fica de fora (não aparece sobre o `bg`).
- **`SOFT_OUT`** (por fora, pílulas e ilha compacta): só `0 16px 36px -14px rgba(0,0,0,.5)`. Os dois brilhos `accent` do design (34% e 22%) saíram a pedido do usuário: em volta da barra viravam um vazamento roxo.
- **Ilha expandida**: no lugar do `SOFT_OUT`, `0 18px 44px rgba(0,0,0,.6)`, com fade de 300ms; sem os brilhos `accent` do design, pelo mesmo motivo.

## Temas

Os cinco temas do design (`THEMES` em design/logic.js), escolhidos no editor de ambientes (spec 17) e guardados em `settings.json` `theme` (spec 13). `src/core/themes.ts` dá as cores de cada um e o `Tokens.qml` as lê, então a UI inteira troca junto.

| Tema | Base | Superfícies |
|---|---|---|
| Nocturne (padrão) | os tokens acima | pílulas e ilha em `bg` opaco |
| Vidro fosco | Nocturne; `neutral-900`/`800` = `neutral-100` a 10%/18% | pílulas `bg` 38%, ilha `bg` 52%, editor `bg` 60% (sem o blur do design) |
| Sólido | Nocturne; `neutral-900` `#30334a`, `neutral-800` `#41455c` | `surface` |
| Claro | `bg` `#f5f6fb`, `text` `#1b1d28`, neutros invertidos do design; escala do acento invertida, `accent` = passo 5 dela | `#f8f9fc` a 80% (pílulas), 94% (ilha), 96% (editor) |
| Alto contraste | `bg` `#0b0c12`, `text` `#f7f8fc`, neutros do design; passos 5–7 do acento puxados para cima, `accent` = `accent-400` | `#0b0c12` |

- O Alto contraste do design também aumenta a saturação do acento em 25%; a Island usa a escala normal.
- O azul do Claro no v4 (matiz 232) depende do seletor de realce, que não existe: o Claro usa o roxo invertido.
- Cores fixas de estado (vermelhos, verde da bateria, Energia) não mudam com o tema.

## Efeitos (equivalentes QML)

| Design | QML |
|---|---|
| `backdrop-filter: blur(16px)` nas pílulas, `blur(20px)` no cartão | Ainda sem blur. Candidato: `BackgroundEffect.blurRegion` do Quickshell, que aceita `Region` com `radius` (a v1.1 ficou sem blur porque o do GNOME era retangular) |
| Mola da ilha `cubic-bezier(.3,1.2,.4,1)` .46s | `NumberAnimation` de 460ms com `Easing.BezierSpline` e `bezierCurve: [.3, 1.2, .4, 1, 1, 1]` (`Tokens.springCurve`) |
| Cartões `cubic-bezier(.3,1.15,.4,1)` .4s | Mesma técnica, `Tokens.cardCurve`, 400ms |
| Crossfade de conteúdo `.22s ease` com atraso `.08s` | `SequentialAnimation` com `PauseAnimation` de 80ms + `opacity` em 220ms |
| `box-shadow: 0 0 0 1px` (anel) | `border.width: 1` do `Rectangle` |
| `box-shadow` externo com desfoque | `RectangularShadow` (QtQuick.Effects, Qt 6.9+); espalhamento negativo vira margem |
| `radial-gradient` elíptico | `Shape` com `RadialGradient` e `Scale` vertical, recortado por `ClippingRectangle` |
| `:hover` / `:active` | `HoverHandler`/`MouseArea.containsMouse` e `pressed` |
| `:focus-visible` anel 2px `accent` | `activeFocus` com borda de 2px `accent` |

## Critérios de aceite

- [x] Cada cor usada na UI vem da tabela de tokens (nenhum hex solto fora dela).
- [x] Captura de tela da ilha em cada modo, lado a lado com o design, bate em medidas (±1px), cores e ícones.
- [x] Todo elemento interativo tem estados hover, pressed e foco visíveis.
