"use client";

import { useEffect } from "react";
import { useApp } from "@/store/app";

/** Mirrors display settings onto <html> so CSS can react to them. */
export function SettingsSync() {
  const settings = useApp((s) => s.settings);
  useEffect(() => {
    const d = document.documentElement;
    if (settings.theme === "system") delete d.dataset.theme;
    else d.dataset.theme = settings.theme;
    if (settings.readable) d.dataset.readable = "true";
    else delete d.dataset.readable;
    d.style.setProperty("--text-scale", String(settings.textScale));
    d.lang = settings.language === "en" ? "en" : settings.language;
  }, [settings]);
  return null;
}
