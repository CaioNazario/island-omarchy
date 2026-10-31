// Matemática de cor das opções de aparência (specs/19-aparencia.md): leitura
// de hex, mistura, HSL e contraste. As fórmulas de `isLight` e
// `blackOrWhiteOn` vêm do omadock (MIT, thepathless,
// components/logic/DockStyleLogic.qml @ 16492e5). O core não tem `Qt.color`,
// então os canais vão de 0 a 1 como os do `color` do QML.
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
function expand(digits) {
    if (digits.length !== 3)
        return digits;
    return digits
        .split('')
        .map((digit) => digit + digit)
        .join('');
}
function byteAt(digits, index) {
    return parseInt(digits.slice(index, index + 2), 16) / 255;
}
/** `#RGB`, `#RRGGBB` ou `#AARRGGBB` (o formato com alfa do Qt). */
export function parseHex(value) {
    const match = HEX.exec(value.trim());
    if (!match)
        throw new Error(`color: got "${value}", expected #RGB, #RRGGBB or #AARRGGBB`);
    const digits = expand(match[1]);
    const rgb = digits.slice(-6);
    const a = digits.length === 8 ? byteAt(digits, 0) : 1;
    return { r: byteAt(rgb, 0), g: byteAt(rgb, 2), b: byteAt(rgb, 4), a };
}
function hexByte(channel) {
    const clamped = Math.min(1, Math.max(0, channel));
    return Math.round(clamped * 255)
        .toString(16)
        .padStart(2, '0');
}
/** Opaco sai `#RRGGBB`; com alfa, `#AARRGGBB`. */
export function toHex(color) {
    const rgb = hexByte(color.r) + hexByte(color.g) + hexByte(color.b);
    return color.a < 1 ? `#${hexByte(color.a)}${rgb}` : `#${rgb}`;
}
export function mix(from, to, t) {
    const lerp = (a, b) => a + (b - a) * t;
    return {
        r: lerp(from.r, to.r),
        g: lerp(from.g, to.g),
        b: lerp(from.b, to.b),
        a: lerp(from.a, to.a),
    };
}
function hueOf(color, max, delta) {
    if (max === color.r)
        return (((color.g - color.b) / delta + 6) % 6) / 6;
    if (max === color.g)
        return ((color.b - color.r) / delta + 2) / 6;
    return ((color.r - color.g) / delta + 4) / 6;
}
export function hslOf(color) {
    const max = Math.max(color.r, color.g, color.b);
    const min = Math.min(color.r, color.g, color.b);
    const l = (max + min) / 2;
    if (max === min)
        return { h: -1, s: 0, l };
    const delta = max - min;
    const s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    return { h: hueOf(color, max, delta), s, l };
}
function linear(channel) {
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}
/** Luminância relativa da WCAG 2. */
export function luminance(color) {
    return 0.2126 * linear(color.r) + 0.7152 * linear(color.g) + 0.0722 * linear(color.b);
}
/** Razão de contraste da WCAG 2, de 1 a 21, nos dois sentidos. */
export function contrastRatio(a, b) {
    const la = luminance(a);
    const lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
/** Luma linear acima de 0.5: a regra que o omadock usa para inverter o texto. */
export function isLight(color) {
    return 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b > 0.5;
}
const NEAR_BLACK = parseHex('#141414');
const NEAR_WHITE = parseHex('#f2f2f2');
/** Quase preto ou quase branco, o que contrastar mais com o fundo. */
export function blackOrWhiteOn(backdrop) {
    const dark = contrastRatio(NEAR_BLACK, backdrop);
    return dark >= contrastRatio(NEAR_WHITE, backdrop) ? NEAR_BLACK : NEAR_WHITE;
}
