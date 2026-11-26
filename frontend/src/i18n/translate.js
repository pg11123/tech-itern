import { DEFAULT_LANGUAGE } from '../config/constants';
import en from './en';
import pl from './pl';

export const DICTIONARIES = { en, pl };

// Looks up `key` in the language, falls back to the default language, then to the key itself.
// `{name}` placeholders are replaced from `params`.
export function translate(language, key, params) {
  const text = DICTIONARIES[language]?.[key] ?? DICTIONARIES[DEFAULT_LANGUAGE][key] ?? key;
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
}
