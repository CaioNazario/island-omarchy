// Quando os widgets não cabem (specs/16-widgets.md "Quando não cabe"): o
// `hw` encolhe (perde NET → GPU → TEMP) antes de qualquer widget sumir;
// depois somem widgets inteiros, primeiro o mais longe da ilha. Nenhum
// widget é cortado.
const rowWidth = (widths, gap) => widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, widths.length - 1);
// Encolhe os que podem, na ordem, até caber; `null` se nem no mínimo cabe.
function shrinkToFit(sizes, budget, gap) {
    const mins = sizes.map((size) => size.min);
    if (rowWidth(mins, gap) > budget)
        return null;
    const naturals = sizes.map((size) => size.natural);
    let excess = rowWidth(naturals, gap) - budget;
    return sizes.map((size) => {
        const cut = Math.max(0, Math.min(excess, size.natural - size.min));
        excess -= cut;
        return size.natural - cut;
    });
}
/** Largura de cada widget na ordem de `sizes`; `null` é widget que some. */
export function fitWidgets(sizes, budget, gap, dropFrom) {
    let first = 0;
    let last = sizes.length;
    while (first < last) {
        const widths = shrinkToFit(sizes.slice(first, last), budget, gap);
        if (widths)
            return sizes.map((_size, i) => (i >= first && i < last ? widths[i - first] : null));
        if (dropFrom === 'start')
            first++;
        else
            last--;
    }
    return sizes.map(() => null);
}
