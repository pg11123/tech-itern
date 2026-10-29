import { getStatus } from '../../data';
import { cssColor, statusLook } from '../../game/render/palette';
import { useName } from '../../i18n/useT';

// Small status badges (same colours and shapes as the ones above units in the scene).
export default function StatusChips({ statuses }) {
  const name = useName();
  if (statuses.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-[0.25em]">
      {statuses.map(({ id, turns }) => {
        const look = statusLook(id);
        const label = name('status', getStatus(id));
        return (
          <li
            key={id}
            title={turns ? `${label} (${turns})` : label}
            aria-label={label}
            className="flex h-[1.3em] min-w-[1.3em] items-center justify-center rounded-full px-[0.3em] text-[0.75em] font-bold text-white ring-1 ring-black/70"
            style={{ background: cssColor(look.color) }}
          >
            {look.glyph}
          </li>
        );
      })}
    </ul>
  );
}
