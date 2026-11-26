import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BATTLE_SPEEDS, DEFAULT_LANGUAGE, LANGUAGE, STORAGE_KEYS, TIMING_MODE } from '../config/constants';

const LANGUAGES = Object.values(LANGUAGE);
const TIMING_MODES = Object.values(TIMING_MODE);

// UI settings, persisted in localStorage. More settings (volume) come in later phases.
export const useSettingsStore = create(
  persist(
    (set) => ({
      language: DEFAULT_LANGUAGE,
      timingMode: TIMING_MODE.MANUAL,
      battleSpeed: BATTLE_SPEEDS[0],
      setLanguage: (language) => {
        if (LANGUAGES.includes(language)) set({ language });
      },
      setTimingMode: (timingMode) => {
        if (TIMING_MODES.includes(timingMode)) set({ timingMode });
      },
      setBattleSpeed: (battleSpeed) => {
        if (BATTLE_SPEEDS.includes(battleSpeed)) set({ battleSpeed });
      },
    }),
    { name: STORAGE_KEYS.SETTINGS, version: 1 },
  ),
);
