// Gerenciador de volume (specs/08-controles-rapidos.md "Modo `mixer`"; design
// v4 `mixer`). Rótulos e o tipo da saída seguem o painel de áudio do Omarchy
// (/usr/share/omarchy/shell/plugins/panels/audio/Model.js), que já conhece os
// nomes que o ALSA e o BlueZ dão aos nós.
import { tr } from './i18n.mjs';
export const MIXER_MAX_HEIGHT = 560;
export const WHEEL_VOLUME_STEP = 5;
const WHEEL_NOTCH = 120;
function friendlyDeviceLabel(text) {
    return text
        .trim()
        .replace(/^sof-soundwire\s+/i, '')
        .replace(/^built-?in audio\s+/i, '')
        .replace(/\s+Output$/i, '')
        .replace(/\s+Input$/i, '');
}
const HEADPHONE_WORDS = ['headphone', 'headset', 'earbud', 'earphone', 'airpod', 'buds'];
export function outputDevice(node, lang) {
    var _a, _b;
    const label = friendlyDeviceLabel((_a = node.nickname) !== null && _a !== void 0 ? _a : '') ||
        friendlyDeviceLabel((_b = node.description) !== null && _b !== void 0 ? _b : '') ||
        node.name ||
        tr(lang, 'Output');
    const blob = [node.name, node.description, node.nickname].join(' ').toLowerCase();
    const bluetooth = blob.includes('bluez') || blob.includes('bluetooth');
    if (HEADPHONE_WORDS.some((word) => blob.includes(word))) {
        return {
            label,
            glyph: 'headphones-fill',
            sub: bluetooth ? 'Bluetooth' : tr(lang, 'Headphones'),
        };
    }
    if (bluetooth)
        return { label, glyph: 'bluetooth-fill', sub: 'Bluetooth' };
    if (blob.includes('hdmi') || blob.includes('displayport'))
        return { label, glyph: 'monitor', sub: 'HDMI' };
    return { label, glyph: 'laptop', sub: tr(lang, 'Built-in') };
}
const KNOWN_APPS = { spotify: 'Spotify' };
const APP_GLYPHS = [
    [['spotify'], 'spotify-logo-fill'],
    [['discord', 'vesktop', 'webcord'], 'discord-logo-fill'],
    [['firefox', 'chrom', 'brave', 'zen', 'vivaldi', 'edge', 'librewolf'], 'browser'],
    [['canberra', 'notification', 'event'], 'bell-simple-fill'],
];
function streamGlyph(blob) {
    const hit = APP_GLYPHS.find(([words]) => words.some((word) => blob.includes(word)));
    return hit ? hit[1] : 'speaker-high-fill';
}
export function streamApp(node, lang) {
    var _a, _b;
    const raw = (node.appName || node.description || node.mediaName || tr(lang, 'App')).trim();
    const label = (_a = KNOWN_APPS[raw.toLowerCase()]) !== null && _a !== void 0 ? _a : raw;
    const blob = [node.appName, node.binary, node.description].join(' ').toLowerCase();
    const media = ((_b = node.mediaName) !== null && _b !== void 0 ? _b : '').trim();
    const sub = media.toLowerCase() === label.toLowerCase() ? '' : media;
    return { label, glyph: streamGlyph(blob), sub };
}
// Medidas do design: padding 12/10, cabeçalho 26 + 8, volume geral 42,
// rótulo de seção 29 (12 + 13 + 4), linha de saída 36, de app/microfone 42.
const SECTION_LABEL = 29;
export function mixerHeight(counts) {
    let height = 12 + 26 + 8 + 42 + SECTION_LABEL + counts.outputs * 36;
    if (counts.apps > 0)
        height += SECTION_LABEL + counts.apps * 42;
    if (counts.hasMic)
        height += SECTION_LABEL + 42;
    return Math.min(MIXER_MAX_HEIGHT, height + 10);
}
/** `Util.wheelSteps` do Omarchy: um entalhe é um passo, o touchpad acumula. */
export function wheelVolumeSteps(accumulator, delta) {
    const clamped = Math.max(-WHEEL_NOTCH, Math.min(WHEEL_NOTCH, delta));
    const carried = accumulator * clamped < 0 ? 0 : accumulator;
    const total = carried + clamped;
    // `Math.ceil(-0.3)` é `-0`: normaliza para não vazar um zero negativo.
    const steps = (total < 0 ? Math.ceil(total / WHEEL_NOTCH) : Math.floor(total / WHEEL_NOTCH)) || 0;
    return { steps, remainder: total - steps * WHEEL_NOTCH };
}
