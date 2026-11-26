const VARIANTS = {
  primary: 'border-green-500/60 bg-green-600 text-white hover:bg-emerald-500',
  secondary: 'border-white/20 bg-black/55 text-stone-100 hover:border-amber-400 hover:text-amber-300',
  danger: 'border-red-500/60 bg-red-700/80 text-white hover:bg-red-600',
};

// Battle HUD button. Sizes are in em, so it scales with the HUD font size.
export default function Button({ variant = 'secondary', className = '', ...props }) {
  return (
    <button
      type="button"
      className={`rounded-[0.5em] border px-[1em] py-[0.55em] font-semibold uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
