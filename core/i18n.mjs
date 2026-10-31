// Idioma da interface (specs/13-preferencias.md "Idioma"). O Omarchy não usa
// gettext: o texto-fonte é o inglês, e `PT_BR` (i18nPtBr.ts) traduz cada
// texto inteiro, com `{nome}` no lugar dos valores. Quem guarda um texto
// numa tabela para traduzir depois o marca com `msg`, e o teste do catálogo
// acha as marcas.
import { PT_BR } from './i18nPtBr.mjs';
export const LANGUAGE_IDS = ['en', 'pt-BR'];
export function sanitizeLanguage(value) {
    var _a;
    return (_a = LANGUAGE_IDS.find((id) => id === value)) !== null && _a !== void 0 ? _a : 'en';
}
/** Marca um texto para o catálogo sem traduzir: a tradução vem depois, com `tr`. */
export function msg(text) {
    return text;
}
/** `{nome}` sem valor em `params` fica como está, para o erro aparecer na tela. */
export function tr(lang, text, params = {}) {
    var _a;
    const template = lang === 'pt-BR' ? ((_a = PT_BR[text]) !== null && _a !== void 0 ? _a : text) : text;
    return template.replace(/\{(\w+)\}/g, (whole, key) => key in params ? String(params[key]) : whole);
}
/** `one` com `n` igual a 1 e `other` no resto; `{n}` vira o número. */
export function trCount(lang, n, one, other, params = {}) {
    return tr(lang, n === 1 ? one : other, Object.assign({}, params, { n }));
}
const WEEKDAYS = {
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    'pt-BR': ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
};
const MONTHS = {
    en: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ],
    'pt-BR': [
        'Janeiro',
        'Fevereiro',
        'Março',
        'Abril',
        'Maio',
        'Junho',
        'Julho',
        'Agosto',
        'Setembro',
        'Outubro',
        'Novembro',
        'Dezembro',
    ],
};
/** `day` como `Date.getDay()`: 0 é domingo. */
export function weekdayShort(lang, day) {
    var _a;
    return (_a = WEEKDAYS[lang][day]) !== null && _a !== void 0 ? _a : '';
}
/** `month` como `Date.getMonth()`: 0 é janeiro. */
export function monthName(lang, month) {
    var _a;
    return (_a = MONTHS[lang][month]) !== null && _a !== void 0 ? _a : '';
}
