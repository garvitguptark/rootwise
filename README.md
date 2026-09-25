<div align="center">

# Rootwise

### Students don't fail topics. They fail *prerequisites*.

**An AI diagnostic tutor that traces every wrong answer to the concept that's really missing — then teaches exactly that.**

[![CI](https://github.com/garvitguptark/rootwise/actions/workflows/ci.yml/badge.svg)](https://github.com/garvitguptark/rootwise/actions/workflows/ci.yml)
![Next.js 16](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)
![Tests](https://img.shields.io/badge/tests-41%20unit%20·%208%20e2e-2f9e6b)
![a11y](https://img.shields.io/badge/axe-0%20violations-2f9e6b)

[Live demo](#-try-it) · [Features](#-whats-inside) · [How it works](#-how-it-works) · [The science](#-the-science) · [Benchmark](#-benchmark) · [Architecture](#-architecture) · [Run locally](#-run-locally)

<img src="docs/screenshots/01-landing.png" alt="Rootwise landing page with a live diagnostic running on a knowledge graph" width="100%" />

</div>

---

## 🎯 The problem

A Class 10 student scores 42% in *Quadratic Equations*. The usual response is to re-teach quadratics. But the real break is often three steps below — sign rules, expanding brackets, **finding two numbers with a given product and sum** — learnt years earlier and never checked again. Re-teaching the topic fixes nothing, and the gap compounds into every chapter that follows.

Tests tell you **what** a student got wrong. They never tell you **why**.

## 💡 The idea

Rootwise models a subject as a **prerequisite graph** and runs a **10-minute adaptive diagnostic** that walks down that graph wherever the student struggles. It finds the **root gap** — the lowest concept that's missing — separates it from the concepts that only *look* weak because they're built on it, names the **specific misconception** behind each wrong answer, and then hands the student to a **Socratic AI tutor** that works on that gap and nothing else.

> “Your root gap is **Product–sum pairs**, three steps below your goal. Misconception: *gets the signs of the pair wrong*. Fixing it unlocks 3 concepts. Found in 8 questions, 94% confident.”

## ✨ What's inside

| | Feature | What it does |
|---|---|---|
| 🗺️ | **AI course builder** | Paste any topic or syllabus, at any level → a validated prerequisite graph, misconceptions and a question bank in under a minute. |
| 🎯 | **Adaptive root-gap diagnostic** | Knowledge Space Theory + Bayesian inference; every question maximises information gain; finds the exact root gap 4 times in 5 with ~60% fewer questions than a fixed test. |
| ⏱️ | **Pace setter** | “I have 1 hour” → a personal plan: skips what you know, root gap first, focus blocks and breaks, a timer, calendar export, and honest triage of what to leave out. Re-plans from your real speed. |
| 🎮 | **Learn by playing** | The lesson for your root gap opens with *your own* wrong answer and turns it into a game that names exactly which condition failed. Every round updates mastery. |
| 💬 | **Socratic AI tutor** | Grounded in the diagnosis; asks instead of tells; 7 Indian languages; read-aloud and voice input. |
| 🗣️ | **Teach-back** | Explain it in your own words (typed or spoken) → graded on accuracy, completeness and clarity. |
| 👩‍🏫 | **Real classes** | Teachers create a class code; students join and take the diagnostic; a live dashboard groups the class by root gap and writes tomorrow's small-group lesson plans. |

## ▶️ Try it

- **Live demo:** _add your Vercel URL here_
- **Demo video (2:50):** _add your YouTube link here_
- No sign-up. **Build a course** from any syllabus, **browse** the ready-made courses, or **join a class** with a code.
- Teachers: open **For teachers**, create a class, share the code — results appear live.
- Runs fully with a free Gemini key; without one it degrades to an offline tutor and the ready-made courses.

Two ready-made example courses (everything else is generated on demand):

| Course | Audience | Concepts | Questions |
|---|---|---|---|
| Quadratic Equations | CBSE Class 10 | 12 | 48 · 29 named misconceptions · 68% of wrong options tagged |
| DC Circuit Analysis | B.Tech Year 1 (BEEE) | 12 | 48 · 24 named misconceptions · 64% of wrong options tagged |

## 🧭 How it works

| | | |
|---|---|---|
| **1. Map** | Any topic or pasted syllabus → a prerequisite graph, including the earlier-grade skills that silently break it, plus the common misconceptions for each concept. | AI + validation |
| **2. Diagnose** | Adaptive test. Every question is the one with the **highest expected information gain**. The live map lights up as evidence arrives: a right answer clears everything *under* it; a wrong one marks everything *above* it as shaky and sends the search down to find the cause. | Knowledge Space Theory + Bayes |
| **3. Repair** | A Socratic tutor grounded in the diagnosis — the root gap, the misconceptions shown, the exact questions missed. It asks; it doesn't lecture. | LLM, streamed |
| **3½. Play** | Lessons start from the student's exact wrong answer and teach it through a game — e.g. the product–sum game replays the missed question, shows product and sum live, and names the failing condition (“right numbers, wrong signs”). Every round counts as mastery evidence. | Interactive widget + BKT |
| **Pace setter** | “I have 1 hour” → a plan: skips what's known, root gap first, exam weightage or foundations first, focus blocks with breaks, a timer, calendar export, and honest triage of what to leave out. Re-plans from the student's real speed. | Precedence-constrained knapsack |
| **Classes** | A teacher creates a class and gets a 6-character code. Students join at `/join/CODE`, take the diagnostic, and their results stream into the teacher dashboard (refreshes every 8 s), grouped by root gap with ready-made reteach groups. Results are readable only with the teacher's private key. | Next.js API + Redis |
| **4. Prove it** | Teach-back (Feynman technique): explain it in your own words — typed or spoken, in your language — and get graded on accuracy, completeness and clarity. Practice updates mastery with Bayesian Knowledge Tracing. | LLM rubric + BKT |

<table>
<tr>
<td width="50%"><img src="docs/screenshots/02-diagnostic-live.png" alt="Adaptive diagnostic with the live knowledge map" /><br/><sub><b>Diagnose</b> — the live map, confidence and “plausible explanations left”, with the reasoning log.</sub></td>
<td width="50%"><img src="docs/screenshots/03-root-gap-found.png" alt="Root gap found" /><br/><sub><b>Root gap found</b> in 8 questions: blocked concepts are shown as symptoms, not causes.</sub></td>
</tr>
<tr>
<td><img src="docs/screenshots/05-socratic-tutor.png" alt="Socratic tutor" /><br/><sub><b>Repair</b> — lesson, worked example with step-by-step reveal, the student's own misconceptions, and a Socratic tutor.</sub></td>
<td><img src="docs/screenshots/06-teach-back.png" alt="Teach-back grading" /><br/><sub><b>Prove it</b> — teach-back graded on accuracy, completeness and clarity.</sub></td>
</tr>
<tr>
<td><img src="docs/screenshots/08-pace-setter.jpg" alt="Pace setter plan" /><br/><sub><b>Pace setter</b> — one hour, exam mode: root gap first, 75% of the weightage covered, and an honest list of what to skip.</sub></td>
<td><img src="docs/screenshots/09-product-sum-game.jpg" alt="Product–sum game" /><br/><sub><b>Learn by playing</b> — the game replays the student's own wrong answer and explains exactly which condition fails.</sub></td>
</tr>
<tr>
<td><img src="docs/screenshots/04-report.png" alt="Diagnostic report" /><br/><sub><b>Report</b> — root gap, misconceptions, ordered study path, every answer reviewable; save as PDF or copy for a teacher.</sub></td>
<td><img src="docs/screenshots/07-teacher-dashboard.png" alt="Teacher dashboard" /><br/><sub><b>For teachers</b> — root gaps across a class, spreading misconceptions, a student × concept heatmap, and small groups for tomorrow's lesson.</sub></td>
</tr>
</table>

## 🔬 The science

Rootwise is not a prompt wrapper. The diagnosis is done by a deterministic, explainable engine; the LLM is used for what LLMs are good at (writing content, conversation, grading free text) and everything it produces is validated before the engine touches it.

**Knowledge Space Theory** (Doignon & Falmagne — the model behind ALEKS). A student's knowledge state is a set of concepts *closed under prerequisites*: you can't know Factorising without Integer signs. Rootwise enumerates every feasible state (54 for the quadratics graph, 60 for circuits; capped at 60,000) and keeps an **exact Bayesian posterior** over them.

- **Likelihood.** P(correct | knows) = 1 − slip, P(correct | doesn't) = guess. Hard questions are less guessable; an honest *“I'm guessing”* tap raises the guess rate so a lucky answer counts for less.
- **Prior (Occam's razor).** P(state) ∝ 0.3^|root gaps| — explanations with fewer root causes are preferred.
- **Question selection.** The next question maximises the mutual information between the answer and the knowledge state: `I = H(p·(1−s) + (1−p)·g) − [p·H(s) + (1−p)·H(g)]` — effectively a noisy binary search over the graph.
- **Stopping.** When the most likely diagnosis reaches 90% posterior probability (or the budget of 1.5 × concepts is used).
- **Root gaps** are the *outer fringe* of the most likely state: unknown concepts whose prerequisites are all known. Unknown concepts above them are reported as **blocked**, not as separate problems.

**Misconception-tagged distractors.** Two-thirds of the wrong options in the built-in courses (190 of 288) are tagged with the specific wrong belief they reveal (“Thinks (a + b)² = a² + b²”, “Uses P = V/I”). Cross-concept tags let a mistake on the quadratic formula surface a *squares* misconception — root cause again.

**Bayesian Knowledge Tracing** (Corbett & Anderson) updates mastery during practice, with a learning-transition term; a strong teach-back counts as evidence too.

A depth-first BKT engine is kept as a fallback for unusually wide AI-generated graphs.

## 📊 Benchmark

Does the adaptive engine actually find the right root gap? We ran the real engine against **2,000 simulated students per course**. Each has 0 (10%), 1 (60%) or 2 (30%) hidden knowledge holes — plus everything built on them — slips 10% of the time on concepts they know, and guesses (1 in 4) on ones they don't.

| Method | Exact diagnosis | Root-gap recall | Precision | Questions |
|---|---:|---:|---:|---:|
| **Rootwise** (adaptive, KST + Bayes) | **82.2% / 82.6%** | 86.1% / 86.0% | 83.8% / 83.7% | **13.8** |
| Fixed test, 3 questions per concept | 53.5% / 62.9% | 81.5% / 81.4% | 56.5% / 60.2% | 36 |
| Fixed test, 2 questions per concept | 35.4% / 40.3% | 55.0% / 54.9% | 39.2% / 41.3% | 24 |
| Fixed test, 1 question per concept | 25.3% / 31.4% | 66.5% / 66.3% | 36.0% / 38.2% | 12 |

<sub>Quadratics / Circuits. “Exact” = the reported root gaps are exactly the true ones. Fixed tests call a concept known when at least half its answers are right, and a root gap when it's unknown with all prerequisites known.</sub>

Reproduce it: `npm run benchmark`. **Caveat:** these are simulated students under a stated noise model, not a classroom study — the benchmark shows the inference is sound and efficient; real-world validation is the next step.

## 🌏 Built for Indian classrooms

- **7 languages** for the tutor, lessons and feedback: English, हिन्दी, தமிழ், తెలుగు, বাংলা, मराठी, ಕನ್ನಡ. Students can mix languages (Hinglish) and the tutor mirrors them.
- **Voice in, voice out** (Web Speech API): questions and lessons read aloud with maths made speakable (“x squared”, “plus or minus”); explain concepts out loud for teach-back.
- **Readable mode** with Atkinson Hyperlegible (designed for low vision), adjustable text size, dark mode, reduced-motion support, full keyboard control (1–4 to answer, Enter, G for guessing).
- **Relatable examples** (₹, cricket, trains) in the tutor's instructions.
- **No account, low data:** progress lives on the device; the diagnostic runs entirely in the browser; an offline tutor keeps working without AI.

## 🏗️ Architecture

```mermaid
flowchart LR
  subgraph Browser["Browser (Next.js client)"]
    UI["Pages & components<br/>landing · courses · diagnose · report · learn · teacher"]
    ENG["Diagnostic engine<br/>KST posterior · info-gain selection<br/>BKT practice · study path"]
    STORE[("Zustand store<br/>localStorage")]
    SPEECH["Web Speech<br/>read-aloud · dictation"]
    UI <--> ENG
    UI <--> STORE
    UI <--> SPEECH
  end
  subgraph Server["Next.js route handlers (server-only)"]
    API["/api/generate/{graph,questions,lesson}<br/>/api/tutor (streaming) · /api/teachback · /api/status"]
    CLS["/api/classes · /api/classes/:code<br/>/api/classes/:code/students"]
    KV[("Upstash Redis<br/>classes + submissions")]
    CLS --> VAL
    CLS --> KV
    VAL["Zod validation · size caps · rate limit<br/>prompt fencing · output normalisation"]
    PROV["Provider layer<br/>Gemini (model fallback chain) · OpenAI-compatible · Groq"]
    OFF["Offline fallbacks<br/>scripted Socratic tutor · keyword rubric"]
    API --> VAL --> PROV
    API --> OFF
  end
  UI -- "fetch / stream" --> API
  UI -- "class codes" --> CLS
  PROV -- "HTTPS" --> LLM(("LLM"))
```

**Key decisions**

- **The engine runs client-side.** Diagnosis is instant (no network round-trip per answer), works offline, costs nothing per student, and the maths is inspectable.
- **AI output is untrusted input.** Generated graphs are slug-normalised, dangling references resolved by id *or* name, cycles broken, goals re-derived from sinks; questions are de-duplicated, answer keys range-checked, options shuffled deterministically (LLMs love option A), unknown misconception tags dropped. Then the whole course goes through the same validator as the hand-written ones.
- **Two-stage generation** (graph first, then question batches in parallel, lessons lazily on first visit) keeps each request short, gives a live progress UI, and stays within serverless time limits.
- **Graceful degradation everywhere.** Tutor and teach-back fall back to offline modes if the provider fails; Gemini falls back across models (404/429/5xx) and retries without `thinkingConfig` if a model rejects it; a rejected key produces an actionable error.
- **Provider-agnostic over plain `fetch`** — no SDK lock-in; any OpenAI-compatible endpoint works.
- **Minimal server state.** Only class data lives on the server (Redis via Upstash's REST API — no SDK, 120-day expiry); a student's own progress, plans and chats stay on their device. Without Redis configured it falls back to in-memory storage for local development, and `/api/status` says which mode is active.
- **The pace setter is a precedence-constrained knapsack.** Each unknown concept costs minutes and is worth exam weightage (or foundational impact in mastery mode); the planner greedily picks bundles of concept + missing prerequisites by value per minute, then orders them prerequisites-first with the root gap leading.

### Project structure

```
src/
  app/                      Next.js App Router pages + API route handlers
    api/generate/…          graph · questions · lesson (JSON mode)
    api/tutor               streaming Socratic tutor
    api/teachback           Feynman-style grading
    api/classes/…           create class · class info/results · student submissions
    courses/[courseId]/…    overview · diagnose · report · plan · learn/[conceptId]
    join/                   students join a class with a code
    teacher/                live class dashboard (+ clearly labelled demo class)
  components/               KnowledgeGraph (custom SVG layout), QuestionCard, TraceLog, learn/*
  content/                  hand-authored courses (quadratics, circuits)
  lib/
    engine/                 kst.ts · dfs.ts · bkt.ts · graph.ts · analysis.ts · plan.ts · simulate.ts
    server/                 store.ts (Redis/in-memory) · classes.ts
    ai/                     provider.ts · prompts.ts · normalize.ts
    schema.ts               Zod domain model + API contracts
    course-validation.ts    semantic course checks (ids, references, acyclicity, coverage)
    offline.ts              no-AI tutor and teach-back fallbacks
  store/app.ts              persisted client state
scripts/                    benchmark · content validation · mock OpenAI/Gemini server
tests/                      Vitest unit tests (engine, AI normalisation, prompts, offline)
e2e/                        Playwright end-to-end tests (run against the mock LLM)
```

## 🚀 Run locally

```bash
git clone https://github.com/garvitguptark/rootwise.git
cd rootwise
npm install
cp .env.example .env.local      # optional: add GEMINI_API_KEY for AI features
npm run dev                     # http://localhost:3000
```

Requires Node 20.9+.

### Deploy to Vercel

1. Push the repo to GitHub and import it at [vercel.com/new](https://vercel.com/new) (framework auto-detected).
2. Add the environment variable `GEMINI_API_KEY` (free at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)).
3. For classes: in the Vercel project open **Storage → Create → Upstash Redis** (free tier) and connect it; this adds `KV_REST_API_URL` and `KV_REST_API_TOKEN`. Redeploy. (`/api/status` reports `"storage": "redis"` when it's active.)
4. Deploy. Students' own progress stays on their device; only class submissions are stored on the server.

### Backend API

| Route | Purpose |
|---|---|
| `GET /api/status` | AI provider + storage mode (never exposes keys) |
| `POST /api/generate/graph` · `/questions` · `/lesson` | AI course builder (Zod-validated, normalised, rate-limited) |
| `POST /api/tutor` | Streaming Socratic tutor with offline fallback |
| `POST /api/teachback` | Rubric grading of explanations |
| `POST /api/classes` | Create a class → `{ code, teacherKey }` |
| `GET /api/classes/:code` | Public class info for joining; with `?key=` the full results for the teacher |
| `POST /api/classes/:code/students` | A student submits a finished diagnostic (schema-validated against the course) |

### AI providers

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Google Gemini (recommended, free tier). Tries `gemini-3.5-flash` → `gemini-flash-latest` → `gemini-3.1-flash-lite`. |
| `GEMINI_MODEL`, `GEMINI_THINKING` | Pin a model; reasoning depth for Gemini 3.x (`low` by default, `off` to omit). |
| `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL` | OpenAI or any OpenAI-compatible API (OpenRouter, Together, vLLM…). |
| `GROQ_API_KEY`, `GROQ_MODEL` | Groq. |
| `AI_PROVIDER` | Force `gemini`, `openai`, `groq` or `demo`. |

## ✅ Quality

```bash
npm run check        # eslint + tsc --noEmit + 41 unit tests + content validation
npm run benchmark    # diagnostic accuracy on simulated students
npm run test:e2e     # 8 Playwright tests incl. mobile and a two-browser class flow, against a mock LLM
npm run build
```

- **Unit tests** cover the pace-setter planner (budget, prerequisite order, triage, calendar export), the graph algorithms, BKT maths, knowledge-space enumeration (every state is prerequisite-closed), end-to-end diagnoses of scripted students, persistence round-trips, the benchmark gate (adaptive must beat a 36-question fixed test with under half the questions), AI-output normalisation, prompt-injection fencing, and the offline fallbacks.
- **End-to-end tests** run the real app against `scripts/mock-llm.mjs` — an OpenAI- *and* Gemini-compatible mock that also simulates model-not-found and rejected-parameter errors to exercise the fallbacks.
- **Accessibility:** axe-core reports **0 violations** (WCAG 2 A/AA + best practices) on every main page in light and dark themes. Status colours were validated for colour-vision deficiency and always ship with a label or icon.
- **CI** (GitHub Actions) runs everything above on every push.

## 🔐 Security & privacy

- API keys are server-only (`server-only` imports); the client only learns *whether* AI is live.
- All request bodies are schema-validated with size caps; per-IP rate limiting on AI routes.
- Learner-supplied text (syllabi, explanations) is fenced and labelled as data in prompts to resist prompt injection.
- No accounts. A student's progress stays in their browser; only what they submit to a class (the name they type + their diagnostic) is stored, readable only with the teacher's private key, and expires after 120 days.
- Class submissions are validated against the class's course (schema + concept ids) and capped at 200 students per class.
- Security headers (HSTS, nosniff, frame and permissions policies; microphone only for voice answers).

## 🗺️ Roadmap

- Calibrating slip/guess per question from real response data (IRT), and a classroom validation study.
- Photo-of-handwritten-working input to catch the exact wrong step.
- Full UI localisation (the tutor and content are already multilingual).
- **Class 10 → PhD:** level scale up to research, Bloom's-taxonomy question mix (apply → analyse → evaluate) at higher levels, and a *Paste a paper* mode that builds the prerequisite map for a research paper and tells the reader what they're missing.
- A widget library (simulations, step-ordering, myth-or-fact) that the AI fills with parameters for any concept.

## License

MIT. Fonts: Geist, Geist Mono, Instrument Serif and Atkinson Hyperlegible under the SIL Open Font License.
