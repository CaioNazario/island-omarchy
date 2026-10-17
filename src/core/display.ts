// Modo `display` (specs/08-controles-rapidos.md "Modo `display`"; design v5
// `display`): os valores vêm dos comandos do Omarchy, `omarchy-display-text-size`
// e `omarchy-hyprland-monitor-scaling`.

/** Os segmentos do design. O Omarchy aceita de 9 a 20px. */
export const TEXT_SIZES = [10, 11, 12, 13, 14, 15, 16];
/** As escalas que `omarchy-hyprland-monitor-scaling` percorre. */
export const DISPLAY_SCALES = [1, 1.25, 1.6, 2, 3, 4];

/** `text size: 12 px` na primeira linha da saída sem argumentos. */
export function parseTextSize(output: string): number | null {
  const match = /text size:\s*(\d+)\s*px/i.exec(output);
  return match ? Number(match[1]) : null;
}

export interface TextSegment {
  size: number;
  filled: boolean;
  knob: boolean;
}

export function textSegments(current: number): TextSegment[] {
  return TEXT_SIZES.map((size) => ({ size, filled: size <= current, knob: size === current }));
}

/**
 * O script do Omarchy troca a escala pedida pelo divisor mais próximo da
 * resolução (1.6 em 1920×1080 vira 1.666667): vale a opção mais próxima.
 */
export function activeScale(monitorScale: number): number | null {
  let best: number | null = null;
  for (const option of DISPLAY_SCALES) {
    const distance = Math.abs(option - monitorScale);
    if (distance < 0.1 && (best === null || distance < Math.abs(best - monitorScale)))
      best = option;
  }
  return best;
}

/** O nome entra numa string Lua do `hyprctl dispatch`: só conector simples. */
export function isSafeMonitorName(name: string): boolean {
  return /^[A-Za-z0-9._-]+$/.test(name);
}

export interface MonitorInfo {
  description: string;
  width: number;
  height: number;
  refreshRate?: number;
}

export function monitorSubtitle(monitor: MonitorInfo): string {
  const parts = [monitor.description.trim(), `${monitor.width}×${monitor.height}`];
  if (monitor.refreshRate) parts.push(`${Math.round(monitor.refreshRate)} Hz`);
  return parts.filter((part) => part !== '').join(' · ');
}
