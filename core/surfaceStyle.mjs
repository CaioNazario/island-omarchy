// Estilo de uma superfície (pílula ou ilha) a partir das opções de aparência
// (specs/19-aparencia.md "Superfície"). O QML só pinta o resultado. A borda
// automática, a cor "Nenhuma" e o fundo atrás dos textos seguem o omadock (MIT,
// thepathless, `Dock.qml` `rimAlpha`/`iconBackdropColor` @ 16492e5); o resto
// reproduz o design quando as opções estão no padrão.
import { contrastRatio, mix, parseHex, toHex } from './color.mjs';
// `bg` 82% das pílulas no design, pensado para ficar sobre o blur.
const TRANSLUCENT_THEME = 0.82;
const NONE_ALPHA = 0.25;
// O anel do design (`rgba(255,255,255,.05)`) e o do omadock para fundo fraco.
const DESIGN_RIM = 0.05;
const STRONG_RIM = 0.48;
const WEAK_FILL = 0.25;
// `--isl-drop` (0.6) sobre o `SOFT_OUT` (0.5) do design.
const EXPANDED_SHADOW = 1.2;
// O omadock estima a cor atrás dos ícones com 75% da força do gradiente.
const BACKDROP_SHARE = 0.75;
function round2(value) {
    return Math.round(value * 100) / 100;
}
function withAlphaOf(color, a) {
    return { r: color.r, g: color.g, b: color.b, a };
}
function blurOn(input) {
    return input.look.blur && input.blurAvailable && input.look.background;
}
function fillOpacity(look, blur) {
    if (!look.opacityFromTheme)
        return look.opacity;
    return blur ? TRANSLUCENT_THEME : 1;
}
/** Cor do fundo com a opacidade; "Nenhuma" é preto 25% fixo. */
function fillColor(look, base, opacity) {
    if (look.color === 'none')
        return { r: 0, g: 0, b: 0, a: NONE_ALPHA };
    const rgb = parseHex(look.color === 'theme' ? base : look.color);
    return withAlphaOf(rgb, look.background ? opacity : 0);
}
function rimAlpha(look, opacity) {
    if (!look.borderOpacityAuto)
        return look.borderOpacity;
    const faint = !look.background || look.color === 'none' || opacity < WEAK_FILL;
    return faint ? STRONG_RIM : DESIGN_RIM;
}
function averageColor(colors) {
    const parsed = colors.map((color) => parseHex(color));
    const sum = (channel) => parsed.reduce((total, c) => total + c[channel], 0);
    return {
        r: sum('r') / parsed.length,
        g: sum('g') / parsed.length,
        b: sum('b') / parsed.length,
        a: 1,
    };
}
/**
 * A maior força, até a pedida, em que cada tinta ainda tem o contraste mínimo
 * sobre o fundo médio (o tema misturado à média das cores, como o omadock
 * estima). Passo de 0.01.
 */
export function cappedStrength(strength, colors, base, inks) {
    const backdropBase = withAlphaOf(parseHex(base), 1);
    const average = averageColor(colors);
    const readable = (t) => {
        const backdrop = mix(backdropBase, average, Math.min(1, t * BACKDROP_SHARE));
        return inks.every((ink) => contrastRatio(parseHex(ink.color), backdrop) >= ink.min);
    };
    let t = strength;
    while (t > 0 && !readable(t))
        t = round2(t - 0.01);
    return Math.max(0, t);
}
function gradientOf(input, fill) {
    const look = input.look;
    if (look.fill !== 'gradient' || !look.background)
        return null;
    const strength = cappedStrength(look.gradientStrength, input.gradientColors, input.base, input.inks);
    return { base: toHex(fill), colors: input.gradientColors, strength };
}
function shadowOf(look) {
    return look.shadow && look.background ? look.shadowStrength : 0;
}
export function surfaceStyle(input) {
    const look = input.look;
    const blur = blurOn(input);
    const opacity = fillOpacity(look, blur);
    const fill = fillColor(look, input.base, opacity);
    const gradient = gradientOf(input, fill);
    const shadow = shadowOf(look);
    return {
        visible: look.background,
        fill: toHex(gradient ? withAlphaOf(fill, 0) : fill),
        finish: look.background && look.color !== 'none',
        gradient,
        borderWidth: look.border ? look.borderWidth : 0,
        borderColor: toHex({ r: 1, g: 1, b: 1, a: rimAlpha(look, opacity) }),
        shadow,
        shadowExpanded: round2(Math.min(1, shadow * EXPANDED_SHADOW)),
        blur,
        grain: look.background ? look.grain : 0,
    };
}
