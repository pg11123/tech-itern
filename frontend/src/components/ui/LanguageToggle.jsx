import { LANGUAGE } from '../../config/constants';
import { useT } from '../../i18n/useT';
import { useSettingsStore } from '../../store/useSettingsStore';

export default function LanguageToggle() {
  const t = useT();
  const language = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);

  return (
    <div role="group" aria-label={t('common.language')} className="flex justify-center gap-2">
      {Object.values(LANGUAGE).map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={language === code}
          onClick={() => setLanguage(code)}
          className={`rounded-md border px-3 py-1 text-xs uppercase tracking-widest transition ${
            language === code
              ? 'border-amber-500 text-amber-400'
              : 'border-stone-700 text-stone-500 hover:border-stone-500 hover:text-stone-300'
          }`}
        >
          {t(`language.${code}`)}
        </button>
      ))}
    </div>
  );
}
