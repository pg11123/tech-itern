// Horizontal meter (HP, Rage...). `label` is the accessible name; `text` is drawn on the bar.
export default function Bar({ value, max, color, label, text, height = '0.75em', glow = false }) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="relative w-full overflow-hidden rounded-full bg-black/70 ring-1 ring-black/70"
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${percent}%`, background: color, boxShadow: glow ? `0 0 0.6em ${color}` : undefined }}
      />
      {text && (
        <span className="absolute inset-0 flex items-center justify-center text-[0.7em] font-bold leading-none text-white [text-shadow:0_1px_2px_#000]">
          {text}
        </span>
      )}
    </div>
  );
}
