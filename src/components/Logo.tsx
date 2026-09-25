import clsx from "clsx";

/** A goal node whose roots branch down — one root lit up: the gap Rootwise finds. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={clsx("size-7", className)} aria-hidden>
      <rect width="32" height="32" rx="9" fill="var(--brand)" />
      <g stroke="var(--brand-ink)" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.9">
        <path d="M16 11.5v5" />
        <path d="M16 16.5c0 2.2-4.5 2.6-6.6 6.2" />
        <path d="M16 16.5v6.3" />
        <path d="M16 16.5c0 2.2 4.5 2.6 6.6 6.2" />
      </g>
      <circle cx="16" cy="9" r="3" fill="var(--brand-ink)" />
      <circle cx="9.2" cy="23.6" r="2.4" fill="#e5484d" />
      <circle cx="16" cy="24" r="2.1" fill="var(--brand-ink)" opacity="0.85" />
      <circle cx="22.8" cy="23.6" r="2.1" fill="var(--brand-ink)" opacity="0.85" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="font-serif text-[22px] leading-none tracking-tight">Rootwise</span>
    </span>
  );
}
