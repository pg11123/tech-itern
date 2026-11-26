import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { ROUTES, SANDBOX_STAGE_ID } from '../../config/constants';
import { getStage } from '../../data';
import { createBattleController } from '../../game/battleController';
import { createStageBattle } from '../../game/engine/battle';
import { createBattleScene } from '../../game/render/BattleScene';
import { parseSeed, resolveParty } from '../../game/sandbox';
import { nameNow, translateNow } from '../../i18n/useT';
import { INITIAL_BATTLE_UI, useBattleUiStore } from '../../store/useBattleUiStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import NotFound from '../NotFound';
import BattleHud from './BattleHud';
import PixiCanvas from './PixiCanvas';

const randomSeed = () => crypto.getRandomValues(new Uint32Array(1))[0];

// `/battle/:stageId`. The sandbox (`/battle/test`) also takes ?party=red,chuck,blues and
// ?seed=123 (replay the same battle).
export default function BattleScreen() {
  const navigate = useNavigate();
  const { stageId } = useParams();
  const [searchParams] = useSearchParams();
  const [run, setRun] = useState(0);
  const stage = getStage(stageId);
  const isSandbox = stageId === SANDBOX_STAGE_ID;
  const partyParam = isSandbox ? searchParams.get('party') : null;
  const seed = parseSeed(searchParams.get('seed'));

  const party = useMemo(() => (stage ? resolveParty(stage, partyParam) : []), [stage, partyParam]);

  // Builds engine battle + Pixi scene + controller together.
  const createScene = useCallback(
    ({ app, world }) => {
      const battle = createStageBattle(stage.id, seed ?? randomSeed(), { party });
      const scene = createBattleScene({ app, world, battle, t: translateNow, name: nameNow });
      const controller = createBattleController({
        battle,
        scene,
        store: useBattleUiStore,
        settings: () => useSettingsStore.getState(),
        onDesync: (problems) => console.error('Battle view out of sync with the engine:', problems),
      });
      useBattleUiStore.setState({ ...INITIAL_BATTLE_UI, controller });
      controller.start();
      return {
        destroy() {
          controller.destroy();
          scene.destroy();
          useBattleUiStore.setState({ ...INITIAL_BATTLE_UI });
        },
      };
    },
    [stage, party, seed],
  );

  if (!stage) return <NotFound />;

  return (
    <main className="h-dvh w-full bg-black">
      {/* A new key on restart remounts the canvas: fresh battle, scene and controller. */}
      <PixiCanvas key={run} createScene={createScene}>
        <BattleHud isSandbox={isSandbox} onRestart={() => setRun((value) => value + 1)} onQuit={() => navigate(ROUTES.HOME)} />
      </PixiCanvas>
    </main>
  );
}
