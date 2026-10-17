// Auto-ocultar de uma barra (specs/18-auto-ocultar.md; design/logic.js
// `hidden`, `reveal`/`unreveal`, `toggleAutoHide`). Um por monitor.

/** O que segura a barra visível naquele monitor, além da revelação. */
export interface BarActivity {
  /** A ilha deste monitor fora de `compact` ou com o cartão central aberto. */
  islandOpen: boolean;
  /** O editor de ambientes aberto neste monitor. */
  editing: boolean;
  overview: boolean;
}

export class AutoHide {
  private _enabled = false;
  private _revealed = false;

  get enabled(): boolean {
    return this._enabled;
  }

  /** Revelada pela borda e o ponteiro ainda não saiu: só aí vale vigiar o ponteiro. */
  get revealed(): boolean {
    return this._enabled && this._revealed;
  }

  /** Ligar deixa a barra visível até o ponteiro sair dela. */
  setEnabled(enabled: boolean): void {
    if (enabled === this._enabled) return;
    this._enabled = enabled;
    this._revealed = enabled;
  }

  /** Pressão na borda de cima do monitor. */
  reveal(): void {
    if (this._enabled) this._revealed = true;
  }

  pointerLeft(): void {
    this._revealed = false;
  }

  shown(activity: BarActivity): boolean {
    if (!this._enabled) return true;
    return this._revealed || activity.islandOpen || activity.editing || activity.overview;
  }
}
