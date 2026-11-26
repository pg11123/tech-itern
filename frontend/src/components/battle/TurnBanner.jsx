import { useT } from '../../i18n/useT';
import { useBattleUiStore } from '../../store/useBattleUiStore';

// "Your turn!" / "Enemy turn" / "Wave 2/3" banner; a new banner id restarts the animation.
export default function TurnBanner() {
  const t = useT();
  const banner = useBattleUiStore((state) => state.banner);
  if (!banner) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[28%] flex justify-center" aria-live="polite">
      <p
        key={banner.id}
        className="animate-banner rounded-[0.4em] bg-black/55 px-[1.2em] py-[0.3em] text-[2.6em] font-black uppercase tracking-wider text-amber-300 [text-shadow:0_0.08em_0_#7c2d12]"
      >
        {t(banner.key, banner.params)}
      </p>
    </div>
  );
}
