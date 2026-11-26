import { Link } from 'react-router';
import { ROUTES } from '../config/constants';
import { useT } from '../i18n/useT';

export default function NotFound() {
  const t = useT();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#090a0e] px-4 text-stone-200">
      <h1 className="font-serif text-3xl text-amber-500">{t('notFound.title')}</h1>
      <Link
        to={ROUTES.HOME}
        className="rounded-md border border-stone-700 px-5 py-3 text-sm font-semibold uppercase tracking-widest transition hover:border-amber-500 hover:text-amber-400"
      >
        {t('common.backToMenu')}
      </Link>
    </main>
  );
}
