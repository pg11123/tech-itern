import { BATTLE_OUTCOME } from '../../config/constants';
import { getHero, getItem } from '../../data';
import { useName, useT } from '../../i18n/useT';
import { useBattleUiStore } from '../../store/useBattleUiStore';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const STAR_COUNT = 3;

function Stars({ stars, label }) {
  return (
    <p className="my-[0.4em] flex justify-center gap-[0.3em]" role="img" aria-label={label}>
      {Array.from({ length: STAR_COUNT }, (_, i) => (
        <span
          key={i}
          className={`animate-pop text-[2.6em] leading-none ${i < stars ? 'text-amber-300 [text-shadow:0_0_0.3em_#f59e0b]' : 'text-stone-700'}`}
          style={{ animationDelay: `${0.15 + i * 0.2}s` }}
        >
          ★
        </span>
      ))}
    </p>
  );
}

// Victory (stars, XP, coins, loot) or defeat overlay.
export default function Results({ onRestart, onQuit }) {
  const t = useT();
  const name = useName();
  const result = useBattleUiStore((state) => state.result);
  if (!result) return null;
  const won = result.outcome === BATTLE_OUTCOME.VICTORY;
  const title = won ? t('results.victory') : t('results.defeat');

  return (
    <Modal title={title}>
      <h2 className={`text-[2.2em] font-black uppercase tracking-widest ${won ? 'text-amber-300' : 'text-red-400'}`}>{title}</h2>
      {won ? (
        <>
          <Stars stars={result.stars} label={t('results.stars', { stars: result.stars })} />
          <p className="text-[0.8em] text-stone-400">{t('results.rounds', { rounds: result.rounds })}</p>
          <dl className="my-[0.8em] grid grid-cols-2 gap-[0.4em] text-left">
            <dt className="text-stone-400">{t('results.xp')}</dt>
            <dd className="text-right font-bold">{result.xp}</dd>
            {Object.entries(result.xpPerHero).map(([heroId, xp]) => (
              <div key={heroId} className="col-span-2 flex justify-between pl-[0.8em] text-[0.8em] text-stone-300">
                <dt>{getHero(heroId)?.name}</dt>
                <dd>{t('results.xpEach', { xp })}</dd>
              </div>
            ))}
            <dt className="text-stone-400">{t('results.coins')}</dt>
            <dd className="text-right font-bold text-amber-300">{result.coins}</dd>
            <dt className="text-stone-400">{t('results.loot')}</dt>
            <dd className="text-right text-[0.85em]">
              {result.loot.length === 0
                ? t('results.noLoot')
                : result.loot.map(({ item, qty }) => `${name('item', getItem(item) ?? { id: item, name: item })} ×${qty}`).join(', ')}
            </dd>
          </dl>
        </>
      ) : (
        <p className="my-[1em] text-stone-300">{t('results.defeatHint')}</p>
      )}
      <div className="flex flex-col gap-[0.5em]">
        <Button variant="primary" onClick={onRestart}>
          {won ? t('results.playAgain') : t('results.retry')}
        </Button>
        <Button onClick={onQuit}>{t('common.backToMenu')}</Button>
      </div>
    </Modal>
  );
}
