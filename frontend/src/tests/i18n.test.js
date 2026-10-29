import { describe, expect, it } from 'vitest';
import en from '../i18n/en';
import pl from '../i18n/pl';
import { translate } from '../i18n/translate';

const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

describe('i18n dictionaries', () => {
  it('pl has exactly the same keys as en', () => {
    expect(Object.keys(pl).sort()).toEqual(Object.keys(en).sort());
  });

  it('has no empty strings', () => {
    for (const text of [...Object.values(en), ...Object.values(pl)]) expect(text.trim()).not.toBe('');
  });

  it('uses the same {placeholders} in both languages', () => {
    for (const key of Object.keys(en)) expect(placeholders(pl[key])).toEqual(placeholders(en[key]));
  });
});

describe('translate', () => {
  it('interpolates params', () => {
    expect(translate('en', 'battle.wave', { current: 1, total: 3 })).toBe('Wave 1/3');
    expect(translate('pl', 'battle.wave', { current: 2, total: 3 })).toBe('Fala 2/3');
  });

  it('leaves unknown placeholders untouched', () => {
    expect(translate('en', 'battle.wave', { current: 1 })).toBe('Wave 1/{total}');
  });

  it('falls back to English, then to the key itself', () => {
    expect(translate('xx', 'menu.login')).toBe('Log in');
    expect(translate('pl', 'missing.key')).toBe('missing.key');
  });
});
