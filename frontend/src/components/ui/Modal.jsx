// Dialog over the battle frame. Sizes are in em (they follow the HUD font size).
export default function Modal({ title, children }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/65 p-[1em]"
    >
      <div className="max-h-full w-[26em] max-w-full overflow-y-auto rounded-[0.8em] border border-white/15 bg-[#101015]/95 p-[1.4em] text-center text-stone-100 shadow-2xl">
        {children}
      </div>
    </div>
  );
}
