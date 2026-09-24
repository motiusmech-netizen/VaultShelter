import { RU } from './ru';
import { EN } from './en';

export type Lang = 'ru' | 'en';
export interface Loc {
  ru: string;
  en: string;
}

export type StrKey = keyof typeof RU;

let lang: Lang = 'ru';
const DICTS: Record<Lang, Record<string, string>> = { ru: RU, en: EN };

export function setLang(l: Lang) {
  lang = l;
  document.documentElement.lang = l;
}
export function getLang(): Lang {
  return lang;
}

/** Translate a UI key with {param} substitution. */
export function t(key: StrKey, params?: Record<string, string | number>): string {
  let s = DICTS[lang][key] ?? RU[key] ?? String(key);
  if (params) {
    for (const k in params) s = s.split('{' + k + '}').join(String(params[k]));
  }
  return s;
}

/** Pick a localized string from data. */
export function L(o: Loc | undefined | null, params?: Record<string, string | number>): string {
  if (!o) return '';
  let s = o[lang] ?? o.ru;
  if (params) {
    for (const k in params) s = s.split('{' + k + '}').join(String(params[k]));
  }
  return s;
}

/** Plural helper for both languages. forms: ru [one, few, many], en [one, many] */
export function plural(n: number, ru: [string, string, string], en: [string, string]): string {
  if (lang === 'en') return Math.abs(n) === 1 ? en[0] : en[1];
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return ru[2];
  if (b > 1 && b < 5) return ru[1];
  if (b === 1) return ru[0];
  return ru[2];
}
