// Opções de aparência das pílulas e da ilha (specs/19-aparencia.md), guardadas
// em `settings.json` `appearance` (spec 13). Vêm das opções do omadock (MIT,
// thepathless, `DockConfigLogic.applyLook` e `DockPresets.js` @ 16492e5), sem
// as que só servem a uma dock. O padrão é o visual do design: quem não mexe
// não vê diferença.

import { parseHex, toHex } from './color.js';
import { GRADIENT_IDS } from './gradients.js';

export const FILL_IDS = ['solid', 'gradient'] as const;
export type FillId = (typeof FILL_IDS)[number];

/** `default` são os raios do design; `theme`, o `decoration:rounding` do Hyprland. */
export const SHAPE_IDS = ['default', 'rounded', 'square', 'theme'] as const;
export type ShapeId = (typeof SHAPE_IDS)[number];

export interface Appearance {
  background: boolean;
  fill: FillId;
  /** `theme`, `none` ou `#rrggbb`. */
  color: string;
  /** Um de `GRADIENT_IDS`. */
  gradient: string;
  gradientStrength: number;
  opacityFromTheme: boolean;
  opacity: number;
  border: boolean;
  borderWidth: number;
  borderOpacityAuto: boolean;
  borderOpacity: number;
  shadow: boolean;
  shadowStrength: number;
  shape: ShapeId;
  cornerRadius: number;
  grain: number;
  blur: boolean;
}

export const DEFAULT_APPEARANCE: Appearance = {
  background: true,
  fill: 'solid',
  color: 'theme',
  gradient: 'theme',
  gradientStrength: 0.6,
  opacityFromTheme: true,
  opacity: 1,
  border: true,
  // O anel `inset 0 0 0 1px rgba(255,255,255,.05)` do design.
  borderWidth: 1,
  borderOpacityAuto: true,
  borderOpacity: 0.05,
  // `SOFT_OUT` das pílulas; a ilha aberta usa 1.2× (spec 01 "Superfícies").
  shadowStrength: 0.5,
  shadow: true,
  shape: 'default',
  cornerRadius: 12,
  grain: 0,
  blur: false,
};

/** As cores sólidas do omadock: todas escuras, como os temas da Island. */
export const SOLID_SWATCHES: readonly string[] = [
  '#000000',
  '#181825',
  '#1e1e2e',
  '#0f172a',
  '#111827',
  '#062e24',
  '#1c1917',
  '#2c0b16',
  '#1e102d',
  '#334155',
];

type BoolKey =
  'background' | 'opacityFromTheme' | 'border' | 'borderOpacityAuto' | 'shadow' | 'blur';
type NumberKey =
  | 'gradientStrength'
  | 'opacity'
  | 'borderWidth'
  | 'borderOpacity'
  | 'shadowStrength'
  | 'cornerRadius'
  | 'grain';

interface NumberRange {
  min: number;
  max: number;
  step: number;
}

const BOOL_KEYS: readonly BoolKey[] = [
  'background',
  'opacityFromTheme',
  'border',
  'borderOpacityAuto',
  'shadow',
  'blur',
];

const FRACTION: NumberRange = { min: 0, max: 1, step: 0.01 };
const NUMBER_RANGES: Record<NumberKey, NumberRange> = {
  gradientStrength: FRACTION,
  opacity: FRACTION,
  borderWidth: { min: 1, max: 6, step: 0.5 },
  borderOpacity: FRACTION,
  shadowStrength: FRACTION,
  cornerRadius: { min: 2, max: 24, step: 1 },
  grain: FRACTION,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readBool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/** Limita à faixa e arredonda ao passo (1/n) do controle. */
function readNumber(value: unknown, range: NumberRange, fallback: number): number {
  if (typeof value !== 'number' || !isFinite(value)) return fallback;
  const clamped = Math.min(range.max, Math.max(range.min, value));
  const perUnit = Math.round(1 / range.step);
  return Math.round(clamped * perUnit) / perUnit;
}

function readChoice<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  const known = typeof value === 'string' && (options as readonly string[]).indexOf(value) >= 0;
  return known ? (value as T) : fallback;
}

/** Hex com alfa fica de fora: a opacidade é uma opção à parte. */
function readColor(value: unknown, fallback: string): string {
  if (value === 'theme' || value === 'none') return value;
  if (typeof value !== 'string' || !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) return fallback;
  return toHex(parseHex(value));
}

/**
 * Chave ausente, de tipo errado ou fora da lista fica com o valor de `base`
 * (o padrão, ao ler o arquivo).
 */
export function sanitizeAppearance(
  raw: unknown,
  base: Appearance = DEFAULT_APPEARANCE,
): Appearance {
  const look: Appearance = { ...base };
  if (!isRecord(raw)) return look;
  for (const key of BOOL_KEYS) look[key] = readBool(raw[key], base[key]);
  for (const key of Object.keys(NUMBER_RANGES) as NumberKey[])
    look[key] = readNumber(raw[key], NUMBER_RANGES[key], base[key]);
  look.fill = readChoice(raw.fill, FILL_IDS, base.fill);
  look.shape = readChoice(raw.shape, SHAPE_IDS, base.shape);
  look.gradient = readChoice(raw.gradient, GRADIENT_IDS, base.gradient);
  look.color = readColor(raw.color, base.color);
  return look;
}

/** Uma opção trocada pela UI; valor inválido ou opção desconhecida não muda nada. */
export function withAppearanceOption(look: Appearance, key: string, value: unknown): Appearance {
  if (!(key in look)) return { ...look };
  return sanitizeAppearance({ ...look, [key]: value }, look);
}

export interface AppearancePreset {
  id: string;
  name: string;
  /** Só o que difere do padrão. */
  look: Partial<Appearance>;
}

export const APPEARANCE_PRESETS: readonly AppearancePreset[] = [
  { id: 'default', name: 'Padrão', look: {} },
  // O Glass do omadock (`DockPresets.js` `builtin_glass`), sem as chaves de dock.
  {
    id: 'glass',
    name: 'Vidro',
    look: { fill: 'gradient', gradient: 'aurora', gradientStrength: 0.55, grain: 0.18 },
  },
];

/** Preset desconhecido é o Padrão. */
export function appearancePreset(id: string): Appearance {
  const preset = APPEARANCE_PRESETS.find((candidate) => candidate.id === id);
  return { ...DEFAULT_APPEARANCE, ...(preset ? preset.look : {}) };
}

function sameAppearance(a: Appearance, b: Appearance): boolean {
  return (Object.keys(a) as (keyof Appearance)[]).every((key) => a[key] === b[key]);
}

/** O id do preset igual à aparência, ou vazio se ela foi ajustada à mão. */
export function matchingPreset(look: Appearance): string {
  const preset = APPEARANCE_PRESETS.find((candidate) =>
    sameAppearance(appearancePreset(candidate.id), look),
  );
  return preset ? preset.id : '';
}
