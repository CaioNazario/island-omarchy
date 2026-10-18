// Pedidos de OSD do Omarchy (specs/08-controles-rapidos.md "OSD do Omarchy").
// A Island responde pelo alvo IPC `osd` (specs/14-spikes.md, S7); o payload
// é o que `bin/omarchy-osd` monta, e as regras de progresso espelham
// `plugins/osd/OsdModel.js` `stateForShow` (Omarchy 4.0.4).
// Nomes de `OsdModel.iconFor` → glifo Phosphor (specs/01-design-tokens.md).
const GLYPHS = [
    [['volume-muted', 'volume-mute', 'muted', 'mute'], 'speaker-x-fill'],
    [['volume-low'], 'speaker-low-fill'],
    [['volume-medium', 'volume-high', 'volume'], 'speaker-high-fill'],
    [['microphone-muted', 'microphone-off', 'mic-muted', 'mic-off'], 'microphone-slash'],
    [['microphone', 'mic'], 'microphone'],
    [['keyboard'], 'keyboard-fill'],
    [['brightness'], 'sun'],
    [['display'], 'monitor'],
    [['reboot', 'restart'], 'arrow-clockwise'],
    [['shutdown', 'power', 'poweroff'], 'power-bold'],
    [['logout', 'sign-out', 'leave'], 'sign-out'],
    [['media-play', 'player-play'], 'play-fill'],
    [['media-pause', 'player-pause'], 'pause-fill'],
    [['media-next', 'player-next'], 'skip-forward-fill'],
    [['media-previous', 'player-previous'], 'skip-back-fill'],
    [['media', 'player', 'media-source', 'player-source'], 'music-note-fill'],
    // Glifo Nerd Font que o download do Omarchy manda como ícone.
    [['󰇚'], 'download-simple'],
];
export function osdGlyph(icon) {
    const name = icon.toLowerCase();
    const match = GLYPHS.find(([names]) => names.includes(name));
    return match ? match[1] : 'info';
}
/** Ícone de volume (specs/08 "Volume"): mudo ou 0, abaixo de 40, ou alto. */
export function volumeGlyph(percent, muted) {
    if (muted || percent === 0)
        return 'speaker-x-fill';
    if (percent < 40)
        return 'speaker-low-fill';
    return 'speaker-high-fill';
}
function readFields(json) {
    let parsed;
    try {
        parsed = JSON.parse(json);
    }
    catch (_a) {
        return null;
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
        return null;
    const record = parsed;
    const field = (key) => (typeof record[key] === 'string' ? record[key] : '');
    return {
        icon: field('icon'),
        message: field('message'),
        value: field('value'),
        max: field('max'),
        duration: field('duration'),
    };
}
/** Porcentagem do progresso, ou null quando o pedido é só mensagem. */
function progressPercent(fields) {
    const value = parseInt(fields.value, 10);
    if (fields.value === '' || Number.isNaN(value) || fields.message !== '')
        return null;
    const max = Math.max(1, parseInt(fields.max || '100', 10) || 100);
    const clamped = Math.max(0, Math.min(max, value));
    return Math.round((clamped * 100) / max);
}
function durationMs(text) {
    const ms = parseInt(text, 10);
    return Number.isNaN(ms) || ms <= 0 ? null : ms;
}
function progressKind(icon) {
    const name = icon.toLowerCase();
    if (name.startsWith('volume') || name === 'mute' || name === 'muted')
        return 'volume';
    if (name === 'brightness')
        return 'brightness';
    return null;
}
export function parseOsdPayload(json) {
    const fields = readFields(json);
    if (!fields)
        return null;
    const percent = progressPercent(fields);
    const glyph = osdGlyph(fields.icon);
    if (percent === null) {
        if (fields.message === '')
            return null;
        return {
            kind: 'message',
            glyph,
            text: fields.message,
            durationMs: durationMs(fields.duration),
        };
    }
    const kind = progressKind(fields.icon);
    if (kind)
        return { kind, percent };
    return { kind: 'progress', glyph, percent, durationMs: durationMs(fields.duration) };
}
