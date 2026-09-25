import { ArrowRight, BookOpenCheck, Brain, GraduationCap, Languages, MessagesSquare, Mic, Network, School, Sparkles, Target, WifiOff } from "lucide-react";
import Link from "next/link";
import { HeroDemo } from "@/components/HeroDemo";
import { LogoMark } from "@/components/Logo";
import { ButtonLink, Eyebrow } from "@/components/ui";

const STEPS = [
  {
    icon: Network,
    title: "Map",
    body: "Any topic or pasted syllabus becomes a prerequisite graph — including the earlier-grade skills that silently break it.",
  },
  {
    icon: Target,
    title: "Diagnose",
    body: "A 10-minute adaptive test. Every question is the one that rules out the most explanations. Wrong answers are traced down to their root.",
  },
  {
    icon: MessagesSquare,
    title: "Repair",
    body: "A Socratic AI tutor works on the root gap and the exact misconception it found — it asks, it doesn't lecture.",
  },
  {
    icon: BookOpenCheck,
    title: "Prove it",
    body: "Explain it back in your own words (or out loud, in your language). Mastery turns the graph green and unlocks what's next.",
  },
];

const BENCH = [
  { label: "Rootwise adaptive diagnostic", sub: "~14 questions", value: 82, highlight: true },
  { label: "Fixed test, 3 questions per concept", sub: "36 questions", value: 58 },
  { label: "Fixed test, 1 question per concept", sub: "12 questions", value: 28 },
];

const FEATURES = [
  { icon: Brain, title: "Knowledge Space Theory, not vibes", body: "Exact Bayesian inference over every prerequisite-consistent knowledge state — the maths behind ALEKS, open and explainable." },
  { icon: Target, title: "Misconceptions, named", body: "Wrong answers map to the specific wrong belief they reveal — “Thinks (a + b)² = a² + b²” — not just “incorrect”." },
  { icon: Sparkles, title: "Any syllabus in 30 seconds", body: "Paste a syllabus or type a topic. AI builds the graph, misconceptions and diagnostic questions; the engine does the rest." },
  { icon: Languages, title: "7 Indian languages", body: "Tutor and feedback in English, हिन्दी, தமிழ், తెలుగు, বাংলা, मराठी and ಕನ್ನಡ — students can mix languages like they speak." },
  { icon: Mic, title: "Voice in, voice out", body: "Questions read aloud; students explain concepts by speaking. A hyperlegible reading mode for low vision and dyslexia." },
  { icon: WifiOff, title: "Works without an account — or internet AI", body: "No sign-up; progress stays on the device. The diagnostic runs entirely in the browser, with an offline tutor fallback." },
];

export default function Home() {
  return (
    <div className="overflow-x-clip">
      {/* Hero */}
      <section className="relative">
        <div className="grain pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1fr_1.08fr] lg:gap-14 lg:pb-24 lg:pt-16">
          <div className="stagger min-w-0">
            <Eyebrow className="flex items-start gap-2">
              <span className="mt-[5px] inline-block size-1.5 shrink-0 rounded-full bg-bad" /> AI diagnostic tutor · built for Indian classrooms
            </Eyebrow>
            <h1 className="mt-5 font-serif text-[44px] leading-[1.02] tracking-[-0.02em] sm:text-[60px] lg:text-[68px]">
              Students don&rsquo;t fail topics.
              <br />
              They fail <em className="text-bad-ink">prerequisites</em>.
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-2">
              Rootwise maps any syllabus into a knowledge graph, runs a 10-minute adaptive diagnostic, and traces every wrong answer to the
              concept that&rsquo;s <strong className="font-semibold text-ink">really</strong> missing — then a Socratic AI tutor fixes that, not the symptom.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink href="/courses/quadratics-cbse10" size="lg">
                Try the Class 10 diagnostic <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink href="/courses/new" size="lg" variant="secondary">
                Build from your syllabus
              </ButtonLink>
            </div>
            <p className="mt-5 text-[13px] text-ink-3">No sign-up · runs in your browser · also try the B.Tech DC Circuits course</p>
          </div>
          <div className="enter min-w-0" style={{ animationDelay: "120ms" }}>
            <HeroDemo />
          </div>
        </div>
      </section>

      {/* The problem */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
          <div>
            <Eyebrow>The problem</Eyebrow>
            <h2 className="mt-3 font-serif text-[36px] leading-[1.08] tracking-tight sm:text-[44px]">A score tells you what went wrong. Never why.</h2>
            <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-ink-2">
              When a student can&rsquo;t solve quadratics, the usual fix is to re-teach quadratics. But the break is often three steps below —
              sign rules, expanding brackets, product–sum pairs — learnt years earlier and never checked again. Re-teaching the topic fixes
              nothing, and the gap compounds.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-bg p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3">Typical test report</p>
              <p className="mt-4 font-serif text-[40px] leading-none text-ink-2">42%</p>
              <p className="mt-2 text-[14px] text-ink-2">Quadratic Equations — Needs improvement.</p>
              <p className="mt-6 text-[12.5px] text-ink-3">Next step: “revise Chapter 4”.</p>
            </div>
            <div className="rounded-2xl border border-bad/30 bg-bad-soft/60 p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-bad-ink">Rootwise report</p>
              <p className="mt-4 text-[15px] leading-snug">
                Root gap: <strong className="font-semibold">Product–sum pairs</strong>, three steps below your goal.
              </p>
              <p className="mt-2 text-[13.5px] text-ink-2">Misconception: “Gets the signs of the pair wrong”.</p>
              <p className="mt-2 text-[13.5px] text-ink-2">Fixing it unlocks 3 concepts. Estimated repair: 15 min.</p>
              <p className="mt-4 text-[12.5px] text-ink-3">Found in 8 questions, 94% confident.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <Eyebrow>How it works</Eyebrow>
        <h2 className="mt-3 max-w-2xl font-serif text-[36px] leading-[1.08] tracking-tight sm:text-[44px]">From “I don&rsquo;t get it” to the exact thing to fix.</h2>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-surface-2">
                  <s.icon className="size-5" aria-hidden />
                </span>
                <span className="font-mono text-[11px] text-ink-3">0{i + 1}</span>
              </div>
              <h3 className="mt-5 text-[17px] font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Evidence */}
      <section className="border-y border-line bg-brand text-brand-ink">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] opacity-75">Measured, not claimed</p>
            <h2 className="mt-3 font-serif text-[36px] leading-[1.08] tracking-tight sm:text-[44px]">
              Finds the true root gap <em>4 times in 5</em> — with 60% fewer questions.
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed opacity-85">
              We ran the real engine against 2,000 simulated students per course, each with hidden knowledge holes, who slip on things they
              know and guess on things they don&rsquo;t. Fixed tests that ask about every concept do worse even with 2.5× more questions — they
              can&rsquo;t tell a guess from knowledge, or a symptom from a cause. Reproduce it with <code className="font-mono text-[13px]">npm run benchmark</code>.
            </p>
          </div>
          <figure>
            <figcaption className="mb-4 text-[13px] opacity-80">Exact root-gap diagnosis rate (average of both built-in courses)</figcaption>
            <ul className="space-y-5">
              {BENCH.map((b) => (
                <li key={b.label}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-4 text-[14px]">
                    <span className={b.highlight ? "font-semibold" : "opacity-90"}>
                      {b.label} <span className="font-mono text-[12px] opacity-80">· {b.sub}</span>
                    </span>
                    <span className="font-mono text-[15px] font-semibold">{b.value}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full" style={{ width: `${b.value}%`, background: b.highlight ? "#6fd3a2" : "rgb(255 255 255 / .35)" }} />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[12px] opacity-75">Simulated students: 10% with no gaps, 60% one, 30% two; 10% slip rate; 1-in-4 guessing.</p>
          </figure>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <Eyebrow>What&rsquo;s inside</Eyebrow>
        <h2 className="mt-3 max-w-2xl font-serif text-[36px] leading-[1.08] tracking-tight sm:text-[44px]">Personal, accessible, and honest about what it knows.</h2>
        <div className="mt-10 grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title}>
              <f.icon className="size-5 text-ink-2" aria-hidden />
              <h3 className="mt-3 text-[16px] font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Audiences */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <Link href="/courses" className="group pressable rounded-3xl border border-line bg-surface p-7 shadow-soft hover:shadow-card">
            <GraduationCap className="size-6" aria-hidden />
            <h3 className="mt-5 font-serif text-[30px] leading-tight">For students</h3>
            <p className="mt-2 max-w-md text-[15px] text-ink-2">Find out exactly what&rsquo;s holding you back, fix it with a tutor that never makes you feel slow, and watch your graph turn green.</p>
            <span className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium">
              Start a diagnostic <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
          </Link>
          <Link href="/teacher" className="group pressable rounded-3xl border border-line bg-surface p-7 shadow-soft hover:shadow-card">
            <School className="size-6" aria-hidden />
            <h3 className="mt-5 font-serif text-[30px] leading-tight">For teachers</h3>
            <p className="mt-2 max-w-md text-[15px] text-ink-2">See where your whole class breaks, which misconceptions are spreading, and get small groups by root gap for tomorrow&rsquo;s lesson.</p>
            <span className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium">
              Open the class dashboard <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-3 px-4 py-8 text-[13px] text-ink-3 sm:flex-row sm:items-center sm:px-6">
          <span className="flex items-center gap-2">
            <LogoMark className="size-5" /> Rootwise — AI with Education
          </span>
          <span className="sm:ml-auto">Knowledge Space Theory · Bayesian adaptive testing · Socratic AI tutoring</span>
        </div>
      </footer>
    </div>
  );
}
