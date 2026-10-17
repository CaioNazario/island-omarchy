// Bateria desenhada da pílula direita (specs/11-bateria.md; design/logic.js
// `batColor`/`batText`/`batFillW`/`batNum`/`chgD`).

/** `good` ≥90 (verde), `low` ≤20 (vermelho), `normal` entre (cinza). */
export type BatteryTone = 'good' | 'normal' | 'low';

export interface BatteryDisplay {
  tone: BatteryTone;
  /** Fração 0–1 da largura interna do corpo. */
  fill: number;
  /** Nível sem `%`, escrito dentro do corpo. */
  number: string;
  /** Raio de carga depois do polo. */
  bolt: boolean;
}

function tone(percent: number): BatteryTone {
  if (percent >= 90) return 'good';
  if (percent <= 20) return 'low';
  return 'normal';
}

/** As cores seguem o nível também carregando; carregar só acende o raio. */
export function batteryDisplay(percentage: number, charging: boolean): BatteryDisplay {
  const percent = Math.max(0, Math.min(100, Math.round(percentage)));
  return {
    tone: tone(percent),
    fill: percent / 100,
    number: String(percent),
    bolt: charging,
  };
}
