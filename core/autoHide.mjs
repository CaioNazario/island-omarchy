// Auto-ocultar de uma barra (specs/18-auto-ocultar.md; design/logic.js
// `hidden`, `reveal`/`unreveal`, `toggleAutoHide`). Um por monitor.
export class AutoHide {
    constructor() {
        this._enabled = false;
        this._revealed = false;
    }
    get enabled() {
        return this._enabled;
    }
    /** Revelada pela borda e o ponteiro ainda não saiu: só aí vale vigiar o ponteiro. */
    get revealed() {
        return this._enabled && this._revealed;
    }
    /** Ligar deixa a barra visível até o ponteiro sair dela. */
    setEnabled(enabled) {
        if (enabled === this._enabled)
            return;
        this._enabled = enabled;
        this._revealed = enabled;
    }
    /** Pressão na borda de cima do monitor. */
    reveal() {
        if (this._enabled)
            this._revealed = true;
    }
    pointerLeft() {
        this._revealed = false;
    }
    shown(activity) {
        if (!this._enabled)
            return true;
        return this._revealed || activity.islandOpen || activity.editing || activity.overview;
    }
}
