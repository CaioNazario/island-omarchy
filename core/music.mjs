// Player atual, troca de faixa e formatação da música (specs/05-musica.md;
// design/logic.js `track`/`posLabel`/`posPct`).
function trackKey(player) {
    return `${player.trackId}\n${player.title}`;
}
// Parado ou sem título não tem o que mostrar: o Brave fica no barramento em
// `Stopped` com metadados vazios quando o vídeo acaba.
function showable(player) {
    return player.status !== 'Stopped' && player.title !== '';
}
/**
 * Player atual: o último que entrou em `Playing`; pausado continua atual até
 * outro tocar ou ele sair do barramento. Na primeira leitura (o `enable()`
 * roda a cada desbloqueio), os que já tocam ficam na frente dos pausados, e
 * nada dispara.
 */
export class PlayerTracker {
    constructor() {
        // Do menos para o mais recente a entrar em `Playing`.
        this.order = [];
        this.previous = new Map();
        // Última faixa vista tocando, por player. O Spotify web troca de faixa
        // pausado e só depois volta a tocar: comparar com o estado anterior
        // confundiria isso com retomar a mesma faixa.
        this.playedKeys = new Map();
        this.started = false;
    }
    update(players) {
        var _a, _b;
        const firstRead = !this.started;
        this.started = true;
        if (firstRead) {
            const withStatus = (status) => [...players].filter(([, player]) => player.status === status).map(([name]) => name);
            this.order = [...withStatus('Paused'), ...withStatus('Playing')];
        }
        else {
            this.order = this.order.filter((name) => players.has(name));
            for (const [name, player] of players) {
                if (player.status === 'Playing' && ((_a = this.previous.get(name)) === null || _a === void 0 ? void 0 : _a.status) !== 'Playing') {
                    this.order = this.order.filter((other) => other !== name);
                    this.order.push(name);
                }
            }
        }
        const current = (_b = [...this.order].reverse().find((name) => showable(players.get(name)))) !== null && _b !== void 0 ? _b : null;
        const player = current === null ? undefined : players.get(current);
        const trackChanged = !firstRead &&
            (player === null || player === void 0 ? void 0 : player.status) === 'Playing' &&
            this.playedKeys.get(current) !== trackKey(player);
        const playedKeys = new Map();
        for (const [name, snapshot] of players) {
            // Na primeira leitura, a faixa pausada conta como vista: retomar depois
            // do desbloqueio não dispara.
            const seen = showable(snapshot) && (firstRead || snapshot.status === 'Playing');
            const key = seen ? trackKey(snapshot) : this.playedKeys.get(name);
            if (key !== undefined)
                playedKeys.set(name, key);
        }
        this.playedKeys = playedKeys;
        this.previous = new Map(players);
        return { current, trackChanged };
    }
}
/** Artistas juntos com ", "; vazio mostra o nome do player (`Identity`). */
export function artistLine(artists, identity) {
    const line = artists
        .map((artist) => artist.trim())
        .filter((artist) => artist !== '')
        .join(', ');
    return line === '' ? identity : line;
}
/** `m:ss`, a partir de microssegundos (unidade do MPRIS). */
export function formatTrackTime(microseconds) {
    const total = Math.max(0, Math.floor(microseconds / 1000000));
    const minutes = Math.floor(total / 60);
    const seconds = String(total % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
}
export function progressFraction(positionUs, lengthUs) {
    if (lengthUs <= 0)
        return 0;
    return Math.max(0, Math.min(1, positionUs / lengthUs));
}
// `Position` não gera sinal: avança localmente a partir da última leitura.
export function positionAt(anchor, nowMs, lengthUs) {
    const elapsedUs = anchor.playing ? Math.max(0, nowMs - anchor.atMs) * 1000 : 0;
    const position = anchor.positionUs + elapsedUs;
    return lengthUs > 0 ? Math.min(position, lengthUs) : position;
}
// Pelo `Identity`: o Chrome se chama "Chrome" no MPRIS (e "Google Chrome" nas
// notificações), e o Firefox "Mozilla firefox". O Phosphor não tem logo do
// Firefox, então ele fica com a nota, como o Brave.
const SOURCE_GLYPHS = {
    spotify: 'spotify-logo-fill',
    chrome: 'google-chrome-logo-fill',
    'google chrome': 'google-chrome-logo-fill',
    chromium: 'google-chrome-logo-fill',
};
export const MUSIC_NOTE_GLYPH = 'music-note-fill';
export function sourceGlyph(identity) {
    var _a;
    return (_a = SOURCE_GLYPHS[identity.trim().toLowerCase()]) !== null && _a !== void 0 ? _a : MUSIC_NOTE_GLYPH;
}
