import { useCallback } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { localName } from './names';
import { translate } from './translate';

// Returns t(key, params) bound to the current UI language.
export function useT() {
  const language = useSettingsStore((state) => state.language);
  return useCallback((key, params) => translate(language, key, params), [language]);
}

// Returns name(kind, record) for data records (skills, statuses, items, enemies) in the UI language.
export function useName() {
  const language = useSettingsStore((state) => state.language);
  return useCallback((kind, record) => localName(language, kind, record), [language]);
}

// Non-React access (Pixi floating texts): translates with the language set right now.
export const translateNow = (key, params) => translate(useSettingsStore.getState().language, key, params);
export const nameNow = (kind, record) => localName(useSettingsStore.getState().language, kind, record);
