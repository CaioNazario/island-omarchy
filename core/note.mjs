// Nota (specs/16-widgets.md `note` e "Modo `note`"): um texto só, sem quebra
// de linha, em `noteText` do `settings.json`.
import { tr } from './i18n.mjs';
export const MAX_NOTE_LENGTH = 80;
/** Quebra de linha colada vira espaço; corta em 80 caracteres. */
export function sanitizeNote(text) {
    return [...text.replace(/\r\n|[\r\n]/g, ' ')].slice(0, MAX_NOTE_LENGTH).join('');
}
/** `{n}/80 · Enter to save`, no cabeçalho do modo. */
export function noteCounter(text, lang) {
    return tr(lang, '{count}/{max} · Enter to save', {
        count: [...text].length,
        max: MAX_NOTE_LENGTH,
    });
}
