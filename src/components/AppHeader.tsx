"use client";

import clsx from "clsx";
import { Check, Languages, Moon, Settings2, Sun, Type, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAIStatus } from "@/hooks/useAIStatus";
import { LANGUAGES } from "@/lib/languages";
import { useApp, type Settings } from "@/store/app";
import { Logo } from "./Logo";

const NAV = [
  { href: "/courses", label: "Courses" },
  { href: "/teacher", label: "For teachers" },
  { href: "/join", label: "Join a class" },
];

export function AppHeader() {
  const pathname = usePathname();
  const status = useAIStatus();
  return (
    <header className="no-print sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-15 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="pressable -ml-1 rounded-lg px-1 py-1" aria-label="Rootwise home">
          <Logo />
        </Link>
        <nav className="ml-2 hidden items-center gap-1 sm:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={clsx(
                "pressable rounded-lg px-3 py-1.5 text-sm",
                pathname.startsWith(n.href) ? "bg-surface-2 text-ink" : "text-ink-2 hover:text-ink",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {status && (
            <span
              title={status.live ? `Live AI: ${status.provider} · ${status.model}` : "No AI key configured — built-in courses and offline tutor"}
              className={clsx(
                "hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium md:inline-flex",
                status.live ? "border-good/30 bg-good-soft text-good-ink" : "border-line-2 bg-surface-2 text-ink-2",
              )}
            >
              <span className={clsx("size-1.5 rounded-full", status.live ? "bg-good" : "bg-ink-3")} />
              {status.live ? "AI live" : "Demo mode"}
            </span>
          )}
          <SettingsMenu />
          <Link
            href="/courses"
            className="pressable inline-flex h-9 items-center rounded-xl bg-brand px-3.5 text-[13px] font-medium text-brand-ink sm:hidden"
          >
            Courses
          </Link>
        </div>
      </div>
    </header>
  );
}

function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const settings = useApp((s) => s.settings);
  const updateSettings = useApp((s) => s.updateSettings);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const set = (patch: Partial<Settings>) => updateSettings(patch);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="pressable inline-flex h-9 items-center gap-2 rounded-xl border border-line-2 bg-surface px-3 text-[13px] text-ink-2 hover:text-ink"
      >
        <Settings2 className="size-4" aria-hidden />
        <span className="hidden sm:inline">Learning settings</span>
        <span className="sr-only sm:hidden">Learning settings</span>
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Learning settings"
          className="enter absolute right-0 top-11 z-50 w-[min(92vw,340px)] origin-top-right rounded-2xl border border-line bg-surface p-4 shadow-lift"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Learning settings</p>
            <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 text-ink-3 hover:text-ink" aria-label="Close">
              <X className="size-4" />
            </button>
          </div>

          <label className="mb-1.5 flex items-center gap-2 text-[12.5px] font-medium text-ink-2">
            <Languages className="size-3.5" aria-hidden /> Tutor & feedback language
          </label>
          <div className="mb-4 grid grid-cols-4 gap-1.5">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => set({ language: l.code })}
                className={clsx(
                  "pressable rounded-lg border px-2 py-1.5 text-[13px]",
                  settings.language === l.code ? "border-accent bg-accent-soft text-accent-ink" : "border-line bg-surface-2 text-ink-2 hover:text-ink",
                )}
                aria-pressed={settings.language === l.code}
                lang={l.code}
              >
                {l.native}
              </button>
            ))}
          </div>

          <p className="mb-1.5 flex items-center gap-2 text-[12.5px] font-medium text-ink-2">
            <Type className="size-3.5" aria-hidden /> Reading
          </p>
          <div className="mb-2 grid grid-cols-3 gap-1.5">
            {([1, 1.125, 1.25] as const).map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => set({ textScale: s })}
                aria-pressed={settings.textScale === s}
                className={clsx(
                  "pressable rounded-lg border py-1.5",
                  settings.textScale === s ? "border-accent bg-accent-soft text-accent-ink" : "border-line bg-surface-2 text-ink-2",
                )}
                style={{ fontSize: 12 + i * 2 }}
              >
                A
              </button>
            ))}
          </div>
          <Toggle
            checked={settings.readable}
            onChange={(v) => set({ readable: v })}
            label="Readable font"
            hint="Atkinson Hyperlegible — designed for low vision & dyslexia"
          />
          <Toggle checked={settings.autoRead} onChange={(v) => set({ autoRead: v })} label="Read questions aloud" hint="Uses your device's voice" />

          <p className="mb-1.5 mt-3 text-[12.5px] font-medium text-ink-2">Theme</p>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                ["system", "Auto", null],
                ["light", "Light", Sun],
                ["dark", "Dark", Moon],
              ] as const
            ).map(([v, label, Icon]) => (
              <button
                key={v}
                type="button"
                onClick={() => set({ theme: v })}
                aria-pressed={settings.theme === v}
                className={clsx(
                  "pressable flex items-center justify-center gap-1.5 rounded-lg border py-1.5 text-[13px]",
                  settings.theme === v ? "border-accent bg-accent-soft text-accent-ink" : "border-line bg-surface-2 text-ink-2",
                )}
              >
                {Icon && <Icon className="size-3.5" aria-hidden />}
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="pressable flex w-full items-center gap-3 rounded-xl px-1 py-2 text-left hover:bg-surface-2"
    >
      <span
        className={clsx(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200",
          checked ? "bg-accent" : "bg-surface-3",
        )}
      >
        <span
          className={clsx(
            "absolute size-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out",
            checked ? "translate-x-4.5" : "translate-x-0.5",
          )}
        >
          {checked && <Check className="size-4 p-0.5 text-accent" aria-hidden />}
        </span>
      </span>
      <span>
        <span className="block text-[13px] font-medium text-ink">{label}</span>
        {hint && <span className="block text-[11.5px] text-ink-3">{hint}</span>}
      </span>
    </button>
  );
}
