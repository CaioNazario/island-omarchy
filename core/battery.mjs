// Bateria desenhada da pílula direita (specs/11-bateria.md; design/logic.js
// `batColor`/`batText`/`batFillW`/`batNum`/`chgD`).
function tone(percent) {
    if (percent >= 90)
        return 'good';
    if (percent <= 20)
        return 'low';
    return 'normal';
}
/** As cores seguem o nível também carregando; carregar só acende o raio. */
export function batteryDisplay(percentage, charging) {
    const percent = Math.max(0, Math.min(100, Math.round(percentage)));
    return {
        tone: tone(percent),
        fill: percent / 100,
        number: String(percent),
        bolt: charging,
    };
}
