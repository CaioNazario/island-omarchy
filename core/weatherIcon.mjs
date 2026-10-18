// Condição do Open-Meteo → glifo Phosphor `ph-fill` (specs/07-clima.md
// "Condição → ícone"). A entrada é o código WMO de `current.weather_code` e o
// `is_day`; a tabela de códigos é a da documentação do Open-Meteo.
const CONDITIONS = [
    [[0], ['sun-fill', 'moon-fill']],
    [
        [1, 2],
        ['cloud-sun-fill', 'cloud-moon-fill'],
    ],
    [[3], ['cloud-fill', 'cloud-fill']],
    [
        [45, 48],
        ['cloud-fog-fill', 'cloud-fog-fill'],
    ],
    // Garoa (51–57), chuva (61–67) e pancadas (80–82).
    [
        [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82],
        ['cloud-rain-fill', 'cloud-rain-fill'],
    ],
    // Neve (71–77) e pancadas de neve (85–86); granizo só vem com trovoada.
    [
        [71, 73, 75, 77, 85, 86],
        ['snowflake-fill', 'snowflake-fill'],
    ],
    [
        [95, 96, 99],
        ['cloud-lightning-fill', 'cloud-lightning-fill'],
    ],
];
/** Código desconhecido → `null` (o clima some da ilha). */
export function weatherGlyph(code, isDay) {
    const match = CONDITIONS.find(([codes]) => codes.includes(code));
    if (!match)
        return null;
    return isDay ? match[1][0] : match[1][1];
}
