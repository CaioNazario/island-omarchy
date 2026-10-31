// Tamanho da barra (specs/02-barra.md "Tamanho"): um zoom de toda a UI da
// Island por monitor (barra, ilha aberta e editor). O layout do design pede
// 1280×720 lógicos; num monitor menor, ou com um tamanho grande demais para
// ele, o zoom cai até caber.

export const BAR_SIZE_IDS = ['auto', 'small', 'medium', 'large'] as const;
export type BarSize = (typeof BAR_SIZE_IDS)[number];
type FixedBarSize = Exclude<BarSize, 'auto'>;

const ZOOMS: Record<FixedBarSize, number> = { small: 0.85, medium: 1, large: 1.2 };

/** Menor área lógica em que o layout do design cabe (spec 02 "Largura mínima"). */
export const LAYOUT_WIDTH = 1280;
export const LAYOUT_HEIGHT = 720;
const ZOOM_STEP = 20;

/** Tamanho lógico do monitor, já dividido pela escala do Hyprland. */
export interface ScreenBox {
  width: number;
  height: number;
}

export function sanitizeBarSize(value: unknown): BarSize {
  return BAR_SIZE_IDS.find((id) => id === value) ?? 'auto';
}

/** Notebook e escala fracionária: pequena; QHD e 4K em escala 1: grande. */
export function autoBarSize(screen: ScreenBox): FixedBarSize {
  if (screen.width < 1600 || screen.height < 900) return 'small';
  if (screen.width >= 2560 && screen.height >= 1400) return 'large';
  return 'medium';
}

export function barZoom(size: BarSize, screen: ScreenBox): number {
  if (screen.width <= 0 || screen.height <= 0) return ZOOMS[size === 'auto' ? 'medium' : size];
  const chosen = ZOOMS[size === 'auto' ? autoBarSize(screen) : size];
  const fit = Math.min(screen.width / LAYOUT_WIDTH, screen.height / LAYOUT_HEIGHT);
  if (chosen <= fit) return chosen;
  return Math.floor(fit * ZOOM_STEP) / ZOOM_STEP;
}
