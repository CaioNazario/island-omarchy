// Quando os widgets não cabem (specs/16-widgets.md "Quando não cabe"): o
// `hw` encolhe (perde NET → GPU → TEMP); depois os widgets com ícone colapsam
// para só o ícone, primeiro o mais longe da ilha; só se nem assim couberem,
// somem widgets inteiros, também do mais longe. Nenhum widget é cortado.
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
// Colapsa `count` widgets colapsáveis, a partir da ponta mais longe da ilha.
function collapse(sizes, count, dropFrom) {
    const order = sizes.map((_size, i) => i);
    if (dropFrom === 'end')
        order.reverse();
    const targets = new Set(order.filter((i) => { var _a; return ((_a = sizes[i].icon) !== null && _a !== void 0 ? _a : 0) > 0; }).slice(0, count));
    return sizes.map((size, i) => (targets.has(i) ? { natural: size.icon, min: size.icon } : size));
}
function dropToFit(sizes, budget, gap, dropFrom) {
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
/**
 * Largura de cada widget na ordem de `sizes`; `null` é widget que some. Um
 * widget colapsado recebe a largura do ícone (`icon`), menor que a natural.
 */
export function fitWidgets(sizes, budget, gap, dropFrom) {
    const collapsible = sizes.filter((size) => { var _a; return ((_a = size.icon) !== null && _a !== void 0 ? _a : 0) > 0; }).length;
    // Colapsar mais só estreita: a menor contagem que cabe sai por busca
    // binária (a lista vem do settings.json e pode ter centenas de ids).
    let low = 0;
    let high = collapsible;
    let best = null;
    while (low <= high) {
        const mid = (low + high) >> 1;
        const widths = shrinkToFit(collapse(sizes, mid, dropFrom), budget, gap);
        if (widths) {
            best = widths;
            high = mid - 1;
        }
        else
            low = mid + 1;
    }
    if (best)
        return best;
    return dropToFit(collapse(sizes, collapsible, dropFrom), budget, gap, dropFrom);
}
