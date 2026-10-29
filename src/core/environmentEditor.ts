// Ações do editor de ambientes (specs/17-editor-ambientes.md) sobre a lista de
// ambientes e o ambiente ativo; as regras de mover e inserir são as de
// `placeWidget` em environments.ts.

import {
  ENV_ICONS,
  findWidget,
  MAX_NAME_LENGTH,
  placeWidget,
  type EnvIcon,
  type Environment,
  type PlacedWidgetId,
} from './environments.js';

function updateAt(
  envs: readonly Environment[],
  index: number,
  patch: Partial<Environment>,
): Environment[] {
  return envs.map((env, i) => (i === index ? { ...env, ...patch } : env));
}

/** Grava enquanto digita; o vazio aparece como "Sem nome" na barra. */
export function renameEnvironment(
  envs: readonly Environment[],
  index: number,
  name: string,
): Environment[] {
  return updateAt(envs, index, { name: name.slice(0, MAX_NAME_LENGTH) });
}

export function setEnvironmentIcon(
  envs: readonly Environment[],
  index: number,
  icon: string,
): Environment[] {
  if (!(ENV_ICONS as readonly string[]).includes(icon)) return [...envs];
  return updateAt(envs, index, { icon: icon as EnvIcon });
}

/** ‹ e › da seleção: uma posição na mesma pílula; no limite, nada muda. */
export function stepWidget(env: Environment, id: PlacedWidgetId, delta: -1 | 1): Environment {
  const place = findWidget(env, id);
  if (!place) return env;
  const target = place.index + delta;
  if (target < 0 || target >= place.count) return env;
  // `placeWidget` conta `at` na lista de antes: para frente, depois do vizinho.
  return placeWidget(env, id, place.side, delta < 0 ? target : target + 1);
}

export function moveToOtherSide(env: Environment, id: PlacedWidgetId): Environment {
  const place = findWidget(env, id);
  if (!place) return env;
  return placeWidget(env, id, place.side === 'left' ? 'right' : 'left', null);
}

export function selectionLabel(env: Environment, id: PlacedWidgetId): string {
  const place = findWidget(env, id);
  if (!place) return '';
  const pill = place.side === 'left' ? 'Pílula esquerda' : 'Pílula direita';
  return `${pill} · ${place.index + 1} de ${place.count}`;
}

export function usedCount(env: Environment): number {
  return env.left.length + env.right.length;
}

export interface SlotBox {
  x: number;
  width: number;
}

/**
 * Índice de destino de um soltar: o do widget sob o ponteiro; no espaço livre,
 * o fim (`null`). Pelo meio do mais próximo, o espaço livre da pílula
 * esquerda (antes dos widgets) mandaria para o começo, contra a spec.
 */
export function dropIndex(boxes: readonly SlotBox[], x: number): number | null {
  const hit = boxes.findIndex((box) => x >= box.x && x < box.x + box.width);
  return hit === -1 ? null : hit;
}
