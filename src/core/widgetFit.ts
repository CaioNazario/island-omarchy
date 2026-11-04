// Quando os widgets não cabem (specs/16-widgets.md "Quando não cabe"): o
// `hw` encolhe (perde NET → GPU → TEMP); depois os widgets com ícone colapsam
// para só o ícone, primeiro o mais longe da ilha; só se nem assim couberem,
// somem widgets inteiros, também do mais longe. Nenhum widget é cortado.

export interface WidgetSize {
  natural: number;
  /** Só o `hw` encolhe: `min` é a largura com CPU e RAM. Nos outros, igual a `natural`. */
  min: number;
  /** Largura só com o ícone; ausente ou 0: o widget não colapsa. */
  icon?: number;
}

/** De que ponta da lista saem os widgets inteiros: a mais longe da ilha. */
export type DropFrom = 'start' | 'end';

const rowWidth = (widths: readonly number[], gap: number): number =>
  widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, widths.length - 1);

// Encolhe os que podem, na ordem, até caber; `null` se nem no mínimo cabe.
function shrinkToFit(sizes: readonly WidgetSize[], budget: number, gap: number): number[] | null {
  const mins = sizes.map((size) => size.min);
  if (rowWidth(mins, gap) > budget) return null;
  const naturals = sizes.map((size) => size.natural);
  let excess = rowWidth(naturals, gap) - budget;
  return sizes.map((size) => {
    const cut = Math.max(0, Math.min(excess, size.natural - size.min));
    excess -= cut;
    return size.natural - cut;
  });
}

// Colapsa `count` widgets colapsáveis, a partir da ponta mais longe da ilha.
function collapse(sizes: readonly WidgetSize[], count: number, dropFrom: DropFrom): WidgetSize[] {
  const order = sizes.map((_size, i) => i);
  if (dropFrom === 'end') order.reverse();
  const targets = new Set(order.filter((i) => (sizes[i]!.icon ?? 0) > 0).slice(0, count));
  return sizes.map((size, i) => (targets.has(i) ? { natural: size.icon!, min: size.icon! } : size));
}

function dropToFit(
  sizes: readonly WidgetSize[],
  budget: number,
  gap: number,
  dropFrom: DropFrom,
): (number | null)[] {
  let first = 0;
  let last = sizes.length;
  while (first < last) {
    const widths = shrinkToFit(sizes.slice(first, last), budget, gap);
    if (widths)
      return sizes.map((_size, i) => (i >= first && i < last ? widths[i - first]! : null));
    if (dropFrom === 'start') first++;
    else last--;
  }
  return sizes.map(() => null);
}

/**
 * Largura de cada widget na ordem de `sizes`; `null` é widget que some. Um
 * widget colapsado recebe a largura do ícone (`icon`), menor que a natural.
 */
export function fitWidgets(
  sizes: readonly WidgetSize[],
  budget: number,
  gap: number,
  dropFrom: DropFrom,
): (number | null)[] {
  const collapsible = sizes.filter((size) => (size.icon ?? 0) > 0).length;
  for (let count = 0; count <= collapsible; count++) {
    const widths = shrinkToFit(collapse(sizes, count, dropFrom), budget, gap);
    if (widths) return widths;
  }
  return dropToFit(collapse(sizes, collapsible, dropFrom), budget, gap, dropFrom);
}
