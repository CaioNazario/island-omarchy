// Quando os widgets não cabem (specs/16-widgets.md "Quando não cabe"): o
// `hw` encolhe (perde NET → GPU → TEMP) antes de qualquer widget sumir;
// depois somem widgets inteiros, primeiro o mais longe da ilha. Nenhum
// widget é cortado.

export interface WidgetSize {
  natural: number;
  /** Só o `hw` encolhe: `min` é a largura com CPU e RAM. Nos outros, igual a `natural`. */
  min: number;
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

/** Largura de cada widget na ordem de `sizes`; `null` é widget que some. */
export function fitWidgets(
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
