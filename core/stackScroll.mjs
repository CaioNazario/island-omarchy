// Rolagem sobre a barra abre e fecha a lista de notificações (`stack`;
// specs/04-notificacoes.md "Rolagem"): para baixo mostra, para cima esconde.
// Mesma ideia do gesto de três dedos do Hyprland, para o mouse e o touchpad.
/** Quanto o dedo precisa andar na vertical antes de agir (px de touchpad). */
export const STACK_SCROLL_THRESHOLD = 40;
const PASS = { handled: false };
const OPENS_FROM = new Set(['compact', 'notif']);
function wantedAction(dy, mode) {
    if (dy < 0 && OPENS_FROM.has(mode))
        return 'open';
    if (dy > 0 && mode === 'stack')
        return 'close';
    return null;
}
export class StackScroll {
    constructor() {
        this.accumulated = 0;
        this.pending = null;
        this.locked = false;
    }
    /** Fim do gesto ou pausa na rolagem: o próximo giro age de novo. */
    reset() {
        this.accumulated = 0;
        this.pending = null;
        this.locked = false;
    }
    handle(input, context) {
        if (input.kind === 'smooth' && input.finished) {
            this.reset();
            return PASS;
        }
        // Rolagem horizontal é a troca de ambiente (spec 15), não esta.
        if (input.dy === 0 || (input.kind === 'smooth' && Math.abs(input.dx) >= Math.abs(input.dy)))
            return PASS;
        const wanted = wantedAction(input.dy, context.mode);
        if (wanted !== this.pending)
            this.accumulated = 0;
        this.pending = wanted;
        if (wanted === null)
            return PASS;
        // A lista ainda rola para cima: esse giro é dela, mesmo que chegue ao topo.
        if (wanted === 'close' && !context.atTop) {
            this.locked = true;
            this.accumulated = 0;
            return PASS;
        }
        return this.accumulate(input, wanted);
    }
    accumulate(input, wanted) {
        if (this.locked)
            return { handled: true };
        this.accumulated += input.kind === 'smooth' ? Math.abs(input.dy) : STACK_SCROLL_THRESHOLD;
        if (this.accumulated < STACK_SCROLL_THRESHOLD)
            return { handled: true };
        this.accumulated = 0;
        this.locked = true;
        return { handled: true, action: wanted };
    }
}
