// Idioma da interface (specs/13-preferencias.md "Idioma"). O Omarchy não usa
// gettext: o texto-fonte é o inglês, e `PT_BR` (i18nPtBr.ts) traduz cada
// texto inteiro, com `{nome}` no lugar dos valores. Quem guarda um texto
// numa tabela para traduzir depois o marca com `msg`, e o teste do catálogo
// acha as marcas.

import { PT_BR } from './i18nPtBr.js';

export const LANGUAGE_IDS = ['en', 'pt-BR'] as const;
export type Language = (typeof LANGUAGE_IDS)[number];
export type TextParams = Readonly<Record<string, string | number>>;

export function sanitizeLanguage(value: unknown): Language {
  return LANGUAGE_IDS.find((id) => id === value) ?? 'en';
}

/** Marca um texto para o catálogo sem traduzir: a tradução vem depois, com `tr`. */
export function msg(text: string): string {
  return text;
}

/** `{nome}` sem valor em `params` fica como está, para o erro aparecer na tela. */
export function tr(lang: Language, text: string, params: TextParams = {}): string {
  const template = lang === 'pt-BR' ? (PT_BR[text] ?? text) : text;
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in params ? String(params[key]) : whole,
  );
}

/** `one` com `n` igual a 1 e `other` no resto; `{n}` vira o número. */
export function trCount(
  lang: Language,
  n: number,
  one: string,
  other: string,
  params: TextParams = {},
): string {
  return tr(lang, n === 1 ? one : other, Object.assign({}, params, { n }));
}

const WEEKDAYS: Record<Language, readonly string[]> = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  'pt-BR': ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
};

const MONTHS: Record<Language, readonly string[]> = {
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
export function weekdayShort(lang: Language, day: number): string {
  return WEEKDAYS[lang][day] ?? '';
}

/** `month` como `Date.getMonth()`: 0 é janeiro. */
export function monthName(lang: Language, month: number): string {
  return MONTHS[lang][month] ?? '';
}
