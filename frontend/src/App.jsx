
import { lazy, Suspense, useEffect } from "react";
import { Routes, Route } from "react-router";
import MainMenu from "./components/MainMenu";
import NotFound from "./components/NotFound";
import { ROUTES } from "./config/constants";
import { useT } from "./i18n/useT";
import { useSettingsStore } from "./store/useSettingsStore";

// Pixi is large, so the battle screen is loaded only when a battle route opens.
const BattleScreen = lazy(() => import("./components/battle/BattleScreen"));

export default function App() {
  const t = useT();
  const language = useSettingsStore((state) => state.language);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const battleFallback = (
    <main className="flex h-dvh items-center justify-center bg-black text-sm text-stone-300">
      {t("battle.loading")}
    </main>
  );

  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<MainMenu />} />
      <Route
        path={ROUTES.BATTLE}
        element={<Suspense fallback={battleFallback}><BattleScreen /></Suspense>}
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
