
import { useNavigate } from "react-router";
import { battlePath, ROUTES, SANDBOX_STAGE_ID } from "../config/constants";
import { GAME_TITLE_MAIN, GAME_TITLE_SUB } from "../config/gameInfo";
import { useT } from "../i18n/useT";
import LanguageToggle from "./ui/LanguageToggle";

export default function MainMenu() {

  const navigate = useNavigate();
  const t = useT();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090a0e] px-4 text-stone-200">
      <div className="w-full max-w-md border border-white/10 rounded-md bg-[#101015] p-8 shadow-2xl">
        <header className="mb-10 text-center">
          <p className="mb-4 text-xs tracking-[0.4em] text-amber-500">
            {t("menu.tagline")}
          </p>

          <h1 className="font-serif text-4xl text-red-700 font-bold uppercase tracking-widest">
            {GAME_TITLE_MAIN}
            <span className="mt-3 block text-2xl text-amber-500">
              {GAME_TITLE_SUB}
            </span>
          </h1>

          <p className="mt-5 text-sm text-stone-500">
            {t("menu.subtitle")}
          </p>
        </header>

        <div className="space-y-4">
          <button
            onClick={() => navigate(ROUTES.REGISTER)}
            className="w-full border border-green-500/60 bg-green-600 rounded-md px-5 py-4 text-sm font-semibold uppercase tracking-widest transition hover:bg-emerald-500"
          >
            {t("menu.register")}
          </button>

          <button
            onClick={() => navigate(ROUTES.LOGIN)}
            className="w-full border border-stone-700 rounded-md px-5 py-4 text-sm font-semibold uppercase tracking-widest transition hover:border-amber-500 hover:text-amber-400"
          >
            {t("menu.login")}
          </button>

          <button
            onClick={() => navigate(battlePath(SANDBOX_STAGE_ID))}
            className="w-full border border-dashed border-amber-500/50 rounded-md px-5 py-3 text-xs font-semibold uppercase tracking-widest text-amber-400/90 transition hover:border-amber-400 hover:text-amber-300"
          >
            {t("menu.sandbox")}
          </button>
        </div>

        <p className="mt-8 text-center text-xs leading-6 text-stone-600">
          {t("menu.hint")}
        </p>

        <div className="mt-6">
          <LanguageToggle />
        </div>
      </div>
    </main>
  );
}
