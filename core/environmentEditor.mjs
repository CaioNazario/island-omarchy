// Ações do editor de ambientes (specs/17-editor-ambientes.md) sobre a lista de
// ambientes e o ambiente ativo; as regras de mover e inserir são as de
// `placeWidget` em environments.ts.
import { ENV_ICONS, findWidget, MAX_NAME_LENGTH, placeWidget, } from './environments.mjs';
function updateAt(envs, index, patch) {
    return envs.map((env, i) => (i === index ? Object.assign(Object.assign({}, env), patch) : env));
}
/** Grava enquanto digita; o vazio aparece como "Sem nome" na barra. */
export function renameEnvironment(envs, index, name) {
    return updateAt(envs, index, { name: name.slice(0, MAX_NAME_LENGTH) });
}
export function setEnvironmentIcon(envs, index, icon) {
    if (!ENV_ICONS.includes(icon))
        return [...envs];
    return updateAt(envs, index, { icon: icon });
}
/** ‹ e › da seleção: uma posição na mesma pílula; no limite, nada muda. */
export function stepWidget(env, id, delta) {
    const place = findWidget(env, id);
    if (!place)
        return env;
    const target = place.index + delta;
    if (target < 0 || target >= place.count)
        return env;
    // `placeWidget` conta `at` na lista de antes: para frente, depois do vizinho.
    return placeWidget(env, id, place.side, delta < 0 ? target : target + 1);
}
export function moveToOtherSide(env, id) {
    const place = findWidget(env, id);
    if (!place)
        return env;
    return placeWidget(env, id, place.side === 'left' ? 'right' : 'left', null);
}
export function selectionLabel(env, id) {
    const place = findWidget(env, id);
    if (!place)
        return '';
    const pill = place.side === 'left' ? 'Pílula esquerda' : 'Pílula direita';
    return `${pill} · ${place.index + 1} de ${place.count}`;
}
export function usedCount(env) {
    return env.left.length + env.right.length;
}
/**
 * Índice de destino de um soltar: o do widget sob o ponteiro; no espaço livre,
 * o fim (`null`). Pelo meio do mais próximo, o espaço livre da pílula
 * esquerda (antes dos widgets) mandaria para o começo, contra a spec.
 */
export function dropIndex(boxes, x) {
    const hit = boxes.findIndex((box) => x >= box.x && x < box.x + box.width);
    return hit === -1 ? null : hit;
}
