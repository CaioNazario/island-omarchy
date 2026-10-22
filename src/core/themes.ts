// Temas do design (specs/01-design-tokens.md "Temas"; design/logic.js
// `THEMES`): cada um troca as cores base, os neutros, a escala do acento e as
// superfícies das pílulas (`--isl-lane`), da ilha (`--isl-surface`) e dos
// painéis (`--isl-panel`). Cores com alfa saem como `#AARRGGBB` (formato do Qt).
// A cor de realce (spec 01 "Realce") escolhe a escala do acento que o tema usa.

export const THEME_IDS = ['Nocturne', 'Alto contraste'] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export const ACCENT_IDS = ['Roxo', 'Branco'] as const;
export type AccentId = (typeof ACCENT_IDS)[number];

export interface ThemeColors {
  bg: string;
  surface: string;
  text: string;
  /** neutral-100 … neutral-900 */
  neutrals: string[];
  /** accent-100 … accent-900 */
  accents: string[];
  accent: string;
  /** Fundo das pílulas laterais. */
  lane: string;
  /** Fundo da ilha. */
  island: string;
  /** Fundo do editor de ambientes. */
  panel: string;
  /** Botão redondo da linha de controles ligado (`Tile`): fundo e ícone. */
  tileOn: string;
  tileOnIcon: string;
  /** Desligado, e Configurações/Energia em repouso (`RoundButton`). */
  tileOff: string;
  tileOffIcon: string;
}

const NOCTURNE_NEUTRALS = [
  '#f3f5fe',
  '#e4e7f5',
  '#cfd3e5',
  '#b2b6ca',
  '#9397ab',
  '#75798c',
  '#595d6c',
  '#3f424d',
  '#292b31',
];
// `acRamp(289, 1)`.
const PURPLE = [
  '#f4f3ff',
  '#e6e4ff',
  '#d2cdff',
  '#b5acfa',
  '#9387dd',
  '#766ab9',
  '#5a508f',
  '#3f3865',
  '#28253e',
];
// `acRamp(h, 0)`: a mesma luminosidade sem saturação.
const WHITE = [
  '#f5f5f5',
  '#e8e8e8',
  '#d4d4d4',
  '#b7b7b7',
  '#959595',
  '#777777',
  '#5b5b5b',
  '#404040',
  '#292929',
];

const ACCENT_RAMPS: Record<AccentId, readonly string[]> = { Roxo: PURPLE, Branco: WHITE };

/** `color-mix(in srgb, cor P%, transparent)` → `#AARRGGBB`. */
export function withAlpha(hex: string, percent: number): string {
  const alpha = Math.round((percent / 100) * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${alpha}${hex.replace(/^#/, '').slice(-6)}`;
}

function nocturne(ramp: readonly string[]): ThemeColors {
  return {
    bg: '#161826',
    surface: '#232532',
    text: '#e9e9ed',
    neutrals: [...NOCTURNE_NEUTRALS],
    accents: [...ramp],
    accent: ramp[4]!,
    // O design pinta as pílulas com `bg` 82%, mas sem o blur dele o fundo da
    // tela vazaria: a Island usa o `bg` opaco no Nocturne (spec 01).
    lane: '#161826',
    island: '#161826',
    panel: withAlpha('#161826', 94),
    // `accent-600`/`neutral-100` e `neutral-800`/`neutral-300` do design.
    tileOn: ramp[5]!,
    tileOnIcon: NOCTURNE_NEUTRALS[0]!,
    tileOff: NOCTURNE_NEUTRALS[7]!,
    tileOffIcon: NOCTURNE_NEUTRALS[2]!,
  };
}

function contrast(ramp: readonly string[]): ThemeColors {
  // Passos claros do acento puxados para cima (design `th.contrast`); o
  // design também aumenta a saturação 25%, que fica de fora.
  const accents = ramp.map((color, i) => (i >= 4 && i < 7 ? ramp[Math.max(2, i - 2)]! : color));
  // O `accent-600` aqui é um passo claro e o `neutral-800` um cinza médio: com
  // as cores do design os botões ficavam lavados (ícone claro sobre fundo
  // claro). Ligado é o acento cheio com ícone escuro; desligado, fundo escuro
  // com ícone claro.
  return {
    bg: '#0b0c12',
    surface: '#14161f',
    text: '#f7f8fc',
    neutrals: [
      '#f7f8fc',
      '#eef0f7',
      '#e3e6f0',
      '#d3d7e5',
      '#bcc1d4',
      '#9aa0b8',
      '#7c829c',
      '#6a7089',
      '#262938',
    ],
    accents,
    accent: accents[3]!,
    lane: '#0b0c12',
    island: '#0b0c12',
    panel: '#0b0c12',
    tileOn: accents[3]!,
    tileOnIcon: '#0b0c12',
    tileOff: '#262938',
    tileOffIcon: '#f7f8fc',
  };
}

const BUILDERS: Record<ThemeId, (ramp: readonly string[]) => ThemeColors> = {
  Nocturne: nocturne,
  'Alto contraste': contrast,
};

/**
 * Tema ou realce desconhecido (arquivo editado à mão, tema removido) cai no
 * Nocturne e no Roxo. No Branco o `accent` é o passo 2 da escala: o passo 5,
 * que o Roxo usa, sairia cinza. Pelo mesmo motivo o botão ligado é o branco
 * cheio com ícone escuro, não o `accent-600` cinza.
 */
export function themeColors(id: string, accentId = 'Roxo'): ThemeColors {
  const builder = BUILDERS[id as ThemeId] ?? nocturne;
  const theme = builder(ACCENT_RAMPS[accentId as AccentId] ?? PURPLE);
  if (accentId !== 'Branco') return theme;
  const accent = theme.accents[1]!;
  return { ...theme, accent, tileOn: accent, tileOnIcon: theme.bg };
}
