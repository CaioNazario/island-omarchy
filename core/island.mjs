// Máquina de estados da ilha. specs/03-ilha.md é a fonte de verdade; a
// semântica de transição replica design/logic.js (setMode/arm/closeAll/
// openFromBar/islandClick, linhas 94-104, 230-250, 384-392).
const TRANSIENT_MS = {
    notif: 2500,
    music: 2500,
    volume: 1500,
    brightness: 1500,
    env: 1500,
    osd: 1500,
};
/** `notif` de notificação de navegador (specs/04-notificacoes.md). */
const BROWSER_NOTIF_MS = 2100;
/** Modos com a linha de controles, onde fica o botão Energia (specs/09-sessao-energia.md). */
const POWER_MODES = new Set(['quick', 'wifi', 'bt']);
function isTransient(mode) {
    return mode in TRANSIENT_MS;
}
/** Modos fixos (`stack`, `calendar`, `quick`, `wifi`, `bt`, `ai`, `note`) tomam o foco de teclado (specs/03-ilha.md). */
export function isFixedMode(mode) {
    return mode !== 'compact' && !isTransient(mode);
}
/** Largura do maior modo; a barra mede o espaço das laterais com ela. */
export const MAX_ISLAND_WIDTH = 520;
export function getSize(mode, ctx = {}) {
    var _a, _b;
    switch (mode) {
        case 'compact':
            return { width: 240, height: 30, radius: 15 };
        case 'notif':
            return { width: 400, height: 62, radius: 22 };
        case 'stack': {
            const n = (_a = ctx.stackItemCount) !== null && _a !== void 0 ? _a : 0;
            const height = n === 0 ? 56 + 72 : 56 + Math.min(6, n) * 52;
            return { width: 400, height, radius: 24 };
        }
        case 'music':
            return { width: 500, height: 82, radius: 26 };
        case 'volume':
            return { width: 320, height: 50, radius: 25 };
        case 'brightness':
        case 'osd':
            return { width: 320, height: 50, radius: 25 };
        case 'calendar':
            return { width: 480, height: ctx.calendarView === 'month' ? 214 : 150, radius: 24 };
        case 'quick':
            return { width: 520, height: ctx.quickEnergyOpen ? 106 : 58, radius: 29 };
        case 'wifi': {
            let height = 292;
            if (ctx.wifiEnergyOpen)
                height += 48;
            if (ctx.wifiPasswordField === 'normal')
                height += 58;
            else if (ctx.wifiPasswordField === 'error')
                height += 76;
            return { width: 520, height, radius: 26 };
        }
        case 'bt': {
            let height = ctx.btOn === false ? 300 : 348;
            if (ctx.btEnergyOpen)
                height += 48;
            return { width: 520, height, radius: 26 };
        }
        case 'env':
            return { width: 260, height: 40, radius: 20 };
        case 'note':
            return { width: 420, height: 132, radius: 24 };
        case 'ai': {
            const providerCount = (_b = ctx.providerCount) !== null && _b !== void 0 ? _b : 0;
            return { width: 480, height: 24 + 32 + providerCount * 108 - 6, radius: 24 };
        }
    }
}
export class IslandState {
    constructor(scheduler, options = {}) {
        var _a, _b, _c;
        this._mode = 'compact';
        this._cardOpen = false;
        this._powerOpen = false;
        this._musicPinned = false;
        this.hovering = false;
        this.notifSticky = false;
        this.notifFromBrowser = false;
        this.osdMs = null;
        this.timerId = null;
        this.scheduler = scheduler;
        this.islandClickOpens = (_a = options.islandClickOpens) !== null && _a !== void 0 ? _a : (() => 'card');
        this.onChange = (_b = options.onChange) !== null && _b !== void 0 ? _b : (() => { });
        this.log = (_c = options.log) !== null && _c !== void 0 ? _c : (() => { });
    }
    get mode() {
        return this._mode;
    }
    get cardOpen() {
        return this._cardOpen;
    }
    /** `music` fixado (specs/05-musica.md): sem timer, conta como modo fixo. */
    get musicPinned() {
        return this._mode === 'music' && this._musicPinned;
    }
    /** Modo que toma o foco de teclado: os fixos e o `music` fixado. */
    get fixed() {
        return isFixedMode(this._mode) || this.musicPinned;
    }
    /** Clique no widget Música (specs/16-widgets.md): abre `music` fixado; com ele aberto, fecha. */
    toggleMusicPinned() {
        if (this.musicPinned) {
            this.closeAll();
            return;
        }
        this.setMode('music', true);
    }
    /** Linha de energia aberta abaixo da linha de controles (specs/09-sessao-energia.md). */
    get powerOpen() {
        return this._powerOpen;
    }
    /** Botão Energia: só existe na linha de controles de `quick`/`wifi`/`bt`. */
    togglePower() {
        if (!POWER_MODES.has(this._mode))
            return;
        this._powerOpen = !this._powerOpen;
        this.onChange();
    }
    /** Gatilho do usuário (clique na barra, `Super+S`): regras 1 e 2. */
    openFromTrigger(mode) {
        if (this._mode === mode) {
            this.closeAll();
            return;
        }
        this.setMode(mode);
    }
    /** Evento automático (notificação, troca de faixa): regra 3. */
    openAutomatic(mode) {
        if (this._cardOpen)
            return false;
        if (this.fixed || (this._mode !== 'compact' && !isTransient(this._mode))) {
            this.log(`openAutomatic ${mode} refused mode=${this._mode}`);
            return false;
        }
        this.setMode(mode);
        return true;
    }
    /**
     * Notificação roteada para `notif` (specs/04-notificacoes.md): abre ou
     * troca o conteúdo e rearma o timer. Crítica não fecha sozinha; a de
     * navegador fecha em 2100ms.
     */
    openNotification(critical, fromBrowser = false) {
        this.notifSticky = critical;
        this.notifFromBrowser = fromBrowser;
        this.setMode('notif');
    }
    /** Tecla de volume/brilho: regra 4. */
    volumeKey() {
        this.openAutomatic('volume');
    }
    brightnessKey() {
        this.openAutomatic('brightness');
    }
    /**
     * Pedido de OSD do Omarchy que não é volume nem brilho (specs/08: microfone,
     * toggles, desligar…): mesma regra 4, com a duração do pedido quando vem.
     */
    osdRequest(durationMs) {
        // Recusado só com modo fixo ou cartão aberto: aí `osdMs` não é lido.
        this.osdMs = durationMs !== undefined && durationMs > 0 ? durationMs : null;
        return this.openAutomatic('osd');
    }
    /**
     * Troca de ambiente (specs/15-ambientes.md "Modo `env`"): só aparece com a
     * ilha compacta ou já em `env` (rearma o timer). Com outro modo ou o
     * cartão aberto, a troca acontece sem mexer na ilha.
     */
    environmentSwitched() {
        if (this._cardOpen || (this._mode !== 'compact' && this._mode !== 'env'))
            return false;
        this.setMode('env');
        return true;
    }
    /** Clique na ilha: regra 5. */
    islandClick() {
        if (this._mode === 'compact') {
            if (this.islandClickOpens() === 'calendar') {
                this.setMode('calendar');
                return 'opened-calendar';
            }
            this._cardOpen = !this._cardOpen;
            this.onChange();
            return 'toggled-card';
        }
        if (this._mode === 'notif') {
            this.setMode('stack');
            return 'opened-stack';
        }
        return 'noop';
    }
    /** Regra 7: hover cancela o timer; sair do hover rearma. `env` não recebe hover. */
    hoverStart() {
        this.log(`hoverStart mode=${this._mode}`);
        this.hovering = true;
        if (this._mode !== 'env')
            this.clearTimer();
    }
    hoverEnd() {
        this.log(`hoverEnd mode=${this._mode}`);
        this.hovering = false;
        if (this._mode !== 'env')
            this.arm(this._mode);
    }
    /** Regra 8: interação com slider cancela o timer durante o arraste. */
    dragStart() {
        this.log(`dragStart mode=${this._mode}`, true);
        this.clearTimer();
    }
    dragEnd() {
        this.log(`dragEnd mode=${this._mode}`);
        this.arm(this._mode);
    }
    /** Qualquer interação de conteúdo que deva rearmar o timer do modo atual (ex.: trocar de faixa em `music`). */
    keepAlive() {
        this.arm(this._mode);
    }
    /** Regra 9. */
    escape(passwordFieldFocused) {
        if (passwordFieldFocused)
            return 'closed-password';
        if (this._mode === 'compact' && !this._cardOpen)
            return 'noop';
        this.closeAll();
        return 'closed';
    }
    closeAll() {
        this.log(`closeAll mode=${this._mode}`, true);
        this.clearTimer();
        this._mode = 'compact';
        this._musicPinned = false;
        this._cardOpen = false;
        this._powerOpen = false;
        this.onChange();
    }
    setMode(mode, musicPinned = false) {
        this.log(`setMode ${this._mode} -> ${mode}${musicPinned ? ' pinned' : ''}`);
        this.clearTimer();
        this._mode = mode;
        this._musicPinned = musicPinned;
        this._cardOpen = false;
        this._powerOpen = false;
        this.arm(mode);
        this.onChange();
    }
    arm(mode) {
        this.clearTimer();
        const ms = this.transientMs(mode);
        this.log(`arm ${mode} ms=${ms} hovering=${this.hovering} sticky=${this.notifSticky}`);
        if (ms === undefined || (this.hovering && mode !== 'env'))
            return;
        if (this.musicPinned)
            return;
        if (mode === 'notif' && this.notifSticky)
            return;
        this.timerId = this.scheduler.setTimeout(() => {
            this.timerId = null;
            this.log(`fired ${mode} now=${this._mode}`);
            if (this._mode === mode) {
                this._mode = 'compact';
                this.onChange();
            }
        }, ms);
    }
    transientMs(mode) {
        if (mode === 'notif' && this.notifFromBrowser)
            return BROWSER_NOTIF_MS;
        if (mode === 'osd' && this.osdMs !== null)
            return this.osdMs;
        return TRANSIENT_MS[mode];
    }
    clearTimer() {
        if (this.timerId !== null) {
            this.log(`clearTimer mode=${this._mode}`, true);
            this.scheduler.clearTimeout(this.timerId);
            this.timerId = null;
        }
    }
}
