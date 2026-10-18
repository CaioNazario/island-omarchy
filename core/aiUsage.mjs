// Uso de IA (specs/12-uso-ia.md): faixas de cor e textos de "Reinicia" das
// janelas de sessão e semanal. Os limites vêm dos registros do Omarchy
// (agentUsage.ts).
import { formatClock } from './clock.mjs';
export function usageLevel(percent) {
    if (percent >= 90)
        return 'critical';
    if (percent >= 70)
        return 'high';
    return 'normal';
}
export function formatPercent(percent) {
    return `${Math.round(percent)}%`;
}
/** "em 2h 14min", "em 45min". Nunca "em 0min": o que falta arredonda para cima. */
export function formatSessionReset(resetsAt, now) {
    const minutes = Math.max(1, Math.ceil((resetsAt - now) / 60000));
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (hours === 0)
        return `em ${rest}min`;
    return rest === 0 ? `em ${hours}h` : `em ${hours}h ${rest}min`;
}
const WEEKDAYS_ABBR = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
/** "seg, 09:00", na hora local. */
export function formatWeeklyReset(resetsAt) {
    const date = new Date(resetsAt);
    return `${WEEKDAYS_ABBR[date.getDay()]}, ${formatClock(date)}`;
}
