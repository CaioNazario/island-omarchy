// Cantos das pílulas e da ilha (specs/19-aparencia.md "Cantos"). As regras de
// "Arredondado" e "Tema" vêm do omadock (MIT, thepathless, `Dock.qml`
// `effectiveCardRadius` @ 16492e5); "Padrão" é o raio do design de cada
// superfície e modo.
const MIN_ROUNDED = 2;
// Um "Arredondado" fica alguns pixels abaixo de uma pílula, que é outra forma.
const BELOW_PILL = 4;
function rounded(box, cornerRadius) {
    const max = Math.max(MIN_ROUNDED, Math.floor(box.height / 2) - BELOW_PILL);
    return Math.max(MIN_ROUNDED, Math.min(max, cornerRadius));
}
/**
 * `hyprRounding` é o `decoration:rounding` do Hyprland, ou -1 sem o valor
 * (o Tema então fica no raio do design).
 */
export function shapedRadius(shape, box, cornerRadius, hyprRounding) {
    if (shape === 'square')
        return 0;
    if (shape === 'rounded')
        return rounded(box, cornerRadius);
    if (shape === 'theme' && hyprRounding >= 0)
        return Math.min(hyprRounding, box.height / 2);
    return box.design;
}
