import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AppHeader } from "@/components/AppHeader";
import { SettingsSync } from "@/components/SettingsSync";
import "./globals.css";

// Self-hosted (SIL Open Font License) so builds and offline use never depend on a font CDN.
const geist = localFont({ src: "./fonts/geist-latin-wght-normal.woff2", variable: "--font-geist", weight: "100 900", display: "swap" });
const geistMono = localFont({ src: "./fonts/geist-mono-latin-wght-normal.woff2", variable: "--font-geist-mono", weight: "100 900", display: "swap" });
const instrument = localFont({
  src: [
    { path: "./fonts/instrument-serif-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/instrument-serif-latin-400-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-instrument",
  display: "swap",
});
const atkinson = localFont({
  src: [
    { path: "./fonts/atkinson-hyperlegible-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/atkinson-hyperlegible-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-atkinson",
  display: "swap",
  preload: false,
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Rootwise — find the real reason a student is stuck", template: "%s · Rootwise" },
  description:
    "Rootwise maps any syllabus into a prerequisite knowledge graph, runs a 10-minute adaptive diagnostic, and traces every wrong answer to the concept that's really missing — then teaches it with a Socratic AI tutor.",
  applicationName: "Rootwise",
  keywords: ["adaptive learning", "knowledge space theory", "AI tutor", "diagnostic assessment", "education India"],
  openGraph: {
    title: "Rootwise — Students don't fail topics. They fail prerequisites.",
    description: "An AI diagnostic tutor that finds the root gap behind every wrong answer.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1210" },
  ],
};

/** Applies persisted display settings before first paint (no flash). */
const settingsScript = `try{var s=JSON.parse(localStorage.getItem("rootwise:v1")||"{}").state;s=s&&s.settings;if(s){var d=document.documentElement;if(s.theme&&s.theme!=="system")d.dataset.theme=s.theme;if(s.readable)d.dataset.readable="true";if(s.textScale)d.style.setProperty("--text-scale",s.textScale);}}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable} ${instrument.variable} ${atkinson.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: settingsScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:shadow-card"
        >
          Skip to content
        </a>
        <SettingsSync />
        <AppHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
