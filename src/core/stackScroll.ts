// Rolagem sobre a barra abre e fecha a lista de notificações (`stack`;
// specs/04-notificacoes.md "Rolagem"): para baixo mostra, para cima esconde.
// Mesma ideia do gesto de três dedos do Hyprland, para o mouse e o touchpad.

/** Quanto o dedo precisa andar na vertical antes de agir (px de touchpad). */
export const STACK_SCROLL_THRESHOLD = 40;

/** Sentido como o do Qt: `dy > 0` é para cima (roda afastando do usuário). */
export type StackScrollInput =
  { kind: 'smooth'; dx: number; dy: number; finished: boolean } | { kind: 'discrete'; dy: number };

export interface StackScrollContext {
  /** Modo da ilha no monitor sob o cursor. */
  mode: string;
  /** Só vale em `stack`: a lista de notificações está no topo. */
  atTop: boolean;
}

export type StackScrollAction = 'open' | 'close';

export interface StackScrollResult {
  /** `false`: o evento não é nosso e passa adiante (lista, volume, ambientes). */
  handled: boolean;
  action?: StackScrollAction;
}

const PASS: StackScrollResult = { handled: false };
const OPENS_FROM = new Set(['compact', 'notif']);

function wantedAction(dy: number, mode: string): StackScrollAction | null {
  if (dy < 0 && OPENS_FROM.has(mode)) return 'open';
  if (dy > 0 && mode === 'stack') return 'close';
  return null;
}

export class StackScroll {
  private accumulated = 0;
  private pending: StackScrollAction | null = null;
  private locked = false;

  /** Fim do gesto ou pausa na rolagem: o próximo giro age de novo. */
  reset(): void {
    this.accumulated = 0;
    this.pending = null;
    this.locked = false;
  }

  handle(input: StackScrollInput, context: StackScrollContext): StackScrollResult {
    if (input.kind === 'smooth' && input.finished) {
      this.reset();
      return PASS;
    }
    // Rolagem horizontal é a troca de ambiente (spec 15), não esta.
    if (input.dy === 0 || (input.kind === 'smooth' && Math.abs(input.dx) >= Math.abs(input.dy)))
      return PASS;

    const wanted = wantedAction(input.dy, context.mode);
    if (wanted !== this.pending) this.accumulated = 0;
    this.pending = wanted;
    if (wanted === null) return PASS;
    // A lista ainda rola para cima: esse giro é dela, mesmo que chegue ao topo.
    if (wanted === 'close' && !context.atTop) {
      this.locked = true;
      this.accumulated = 0;
      return PASS;
    }
    return this.accumulate(input, wanted);
  }

  private accumulate(input: StackScrollInput, wanted: StackScrollAction): StackScrollResult {
    if (this.locked) return { handled: true };
    this.accumulated += input.kind === 'smooth' ? Math.abs(input.dy) : STACK_SCROLL_THRESHOLD;
    if (this.accumulated < STACK_SCROLL_THRESHOLD) return { handled: true };
    this.accumulated = 0;
    this.locked = true;
    return { handled: true, action: wanted };
  }
}
