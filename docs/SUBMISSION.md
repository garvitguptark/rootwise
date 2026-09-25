# Rootwise — submission kit (Round 1: AI with Education)

Everything needed for the form, the demo video, and judge questions.

---

## 1. Project description (paste into the form)

**Name:** Rootwise

**One-liner (≤ 20 words):**
Students don't fail topics, they fail prerequisites. Rootwise finds the exact missing concept behind every wrong answer, then teaches it.

**Short description (≈ 60 words):**
Rootwise is an AI diagnostic tutor. It maps any syllabus into a prerequisite knowledge graph, runs a 10-minute adaptive test that traces every wrong answer to its *root gap*, names the specific misconception, and then repairs it with a Socratic AI tutor and a speak-it-back mastery check, in 7 Indian languages. Teachers see where the whole class breaks.

**Full description (≈ 250 words):**
When a student fails quadratics, we re-teach quadratics. But the real break is usually a few steps below: sign rules, expanding brackets, product–sum pairs, learnt years ago and never checked again. Tests tell us *what* went wrong, never *why*.

Rootwise models a subject as a prerequisite graph and uses **Knowledge Space Theory** (the maths behind ALEKS) with an exact Bayesian posterior over every consistent knowledge state. Each question is the one with the highest expected information gain, so the test behaves like a binary search over what the student knows. In simulations with 2,000 noisy students per course it finds the exact root gap **82% of the time in ~14 questions**. A 36-question fixed test manages 54–63%.

The diagnosis then drives the learning:
- a **Socratic AI tutor** grounded in the student's root gap, misconceptions and missed questions
- **teach-back** (Feynman technique), typed or spoken, graded on accuracy, completeness and clarity
- **Bayesian practice** that turns the map green
- a **teacher dashboard** that groups the class by root gap for tomorrow's lesson

It is built for Indian classrooms: tutor and feedback in English, Hindi, Tamil, Telugu, Bengali, Marathi and Kannada; read-aloud and voice answers; a hyperlegible reading mode; no sign-up; and it works offline with the built-in courses. Paste any syllabus and AI builds a validated diagnostic course in under a minute. It ships with CBSE Class 10 Quadratics and B.Tech DC Circuits.

**Tech:** Next.js 16, TypeScript, Knowledge Space Theory + Bayesian Knowledge Tracing engine (client-side), Gemini or any OpenAI-compatible LLM, Zod-validated AI pipeline, 37 unit tests plus 7 Playwright e2e tests, zero axe accessibility violations.

**Links:** GitHub: `https://github.com/garvitguptark/rootwise` · Live demo: `<your Vercel URL>` · Video: `<YouTube unlisted URL>`

---

## 2. Demo video script (2:30)

**Setup before recording**
- Deploy with `GEMINI_API_KEY` set, or run `npm run dev` locally with the key in `.env.local`. The header must show **“AI live”**.
- Use Chrome (needed for voice input) at 1440×900 with 100–110% zoom. Open a fresh incognito window so there's no saved progress.
- Hide the bookmarks bar, mute notifications and close other tabs.
- Rehearse once. The diagnostic is deterministic, so the same answers always give the same path.

**The exact answers for the diagnostic segment** (Class 10 Quadratics; the student has a hidden gap in *Product–sum pairs*):

| # | Concept being checked | Question | Press | Why |
|---|---|---|---|---|
| 1 | Quadratic formula | For x² − 3x − 4 = 0, what is b² − 4ac? | **3** (25) | correct |
| 2 | Splitting the middle term | The roots of x² − 7x + 10 = 0 are: | **1** (x = −2 and x = −5) | wrong on purpose: shows “flips the sign” misconception |
| 3 | Discriminant | If the discriminant is negative, the equation has: | **3** (no real roots) | correct |
| 4 | Product–sum pairs | Which two numbers multiply to 10 and add to −7? | **1** (2 and 5) | wrong on purpose |
| 5 | Zero-product rule | Solve 3x² = 12x. | **1** (x = 0 or x = 4) | correct |
| 6 | Product–sum pairs | Which two numbers multiply to 12 and add to 7? | **1** (2 and 5) | wrong on purpose: confirms the gap |
| 7 | Discriminant | For which k > 0 does x² + kx + 16 = 0 have two equal roots? | **4** (k = 8) | correct |
| 8 | Zero-product rule | Solve x(x − 6) = 0. | **2** (x = 0 or x = 6) | correct |

Result: **“Your root gap: Product–sum pairs”**, found in 8 questions with 94% confidence.

**Shot list and voice-over**

| Time | Screen | Say |
|---|---|---|
| 0:00–0:15 | Landing page; let the hero demo play. | “A student scores 42% in quadratics, so we re-teach quadratics. But the real gap is often three steps below. Students don't fail topics. They fail prerequisites.” |
| 0:15–0:25 | Click **Try the Class 10 diagnostic** to open the course map. | “Rootwise turns a syllabus into a map of what depends on what, with the foundations at the bottom.” |
| 0:25–1:05 | Start the diagnostic. Answer Q1–Q8 from the table, keeping each feedback screen up for about a second. | “Each question is the one that rules out the most explanations. Watch the map: a right answer clears everything under it. When I miss Splitting the middle term, it doesn't just mark me wrong. It names the misconception and goes looking underneath… Product–sum pairs. It double-checks… and the plausible explanations drop to just one.” |
| 1:05–1:20 | Diagnosis screen, then **See my full report**. | “Eight questions, 94% confident. The root gap is Product–sum pairs. The three concepts above it are marked blocked: they're symptoms, not separate problems. Here's the study path and the exact misconceptions.” |
| 1:20–1:50 | **Fix it now**, then the learn page. Open settings and switch the language to **हिन्दी**. Chat: type “mujhe samajh nahi aaya” or tap **Explain it simply**. | “Now the tutor works on that one gap, and it asks rather than tells. It knows which mistake I made, and it speaks Hindi, Tamil or five other Indian languages.” |
| 1:50–2:05 | **Teach it back** tab: tap **Explain out loud** and speak two sentences, or paste them, then **Get feedback**. | “To prove mastery, I explain it back in my own words. It grades accuracy, completeness and clarity, and turns my map green.” |
| 2:05–2:20 | **For teachers** dashboard: scroll through the bar chart, heatmap and groups. | “Teachers see where the whole class breaks. Fifteen students share the same root gap, so here's a ten-minute group lesson instead of re-teaching the chapter.” |
| 2:20–2:30 | **New course**: pick **Op-amp circuits** and click **Build course** so the graph animates in. End on the landing page. | “And it works for any syllabus in under a minute. It's built on Knowledge Space Theory and finds the right root gap 4 times in 5, with 60% fewer questions than a normal test. That's Rootwise.” |

Tip: if the builder takes a while, cut to it while it generates, or pre-generate a course and show the finished map.

---

## 3. Before you submit: checklist

- [ ] Create a **public GitHub repo** `rootwise`, push this code, and check that the CI badge goes green.
- [ ] Deploy on **Vercel**: import the repo and add `GEMINI_API_KEY` (free at aistudio.google.com/apikey).
- [ ] On the live URL, check that the header says **AI live**, a course builds, and the tutor replies.
- [ ] Put the live URL in the README “Try it” section and in the form.
- [ ] Record the video (2–3 minutes), upload it to YouTube as **unlisted**, and test the link in incognito.
- [ ] Submit the form: description, video, GitHub and live demo.
- [ ] **Confirm participation as soon as the shortlist is out.** Only the first 30 of the top 50 get into Round 2.

---

## 4. Judge Q&A: likely questions and crisp answers

**“Isn't this just a ChatGPT wrapper?”**
No. The diagnosis is done by a deterministic Bayesian engine (Knowledge Space Theory) that runs in the browser. The LLM writes content and holds conversations. Everything it generates goes through schema validation, reference repair, cycle-breaking and answer-key checks before the engine uses it. You can run the whole diagnostic with the internet off.

**“How do you know it works?”**
We benchmark the real engine on 2,000 simulated students per course, with slips and guesses. It gets the exact root gap 82% of the time in ~14 questions. Fixed tests get 54–63% with 36 questions. Anyone can reproduce it with `npm run benchmark`. These are simulated students; a classroom pilot is our next step.

**“What if the AI writes a wrong question?”**
Built-in courses are hand-authored and checked. For generated courses we validate structure, de-duplicate, range-check answer keys and shuffle options. The Bayesian model also has a slip parameter, so one bad question can't produce a wrong diagnosis on its own. The next step is a teacher review screen and flagging questions that students statistically disagree with.

**“Why Knowledge Space Theory?”**
It models *prerequisites* directly, which is exactly what root-cause diagnosis needs, and it gives exact, explainable inference over a small state space: 54–60 states here. IRT gives you a single ability score; it can't tell you *which* concept is missing.

**“Cost and scale?”**
The diagnostic costs nothing: it runs on the device. AI is used per course (generated once) and per tutoring turn on a free-tier Flash model. There's no database; the app is stateless and deploys on serverless.

**“Privacy for minors?”**
No accounts. Progress stays on the student's device. Only the text of a tutoring or teach-back request is sent to the LLM, with no identity attached.

**“Accessibility?”**
7 Indian languages, read-aloud with speakable maths, voice answers, a hyperlegible font mode, full keyboard control, reduced motion, and zero axe WCAG violations in both themes.

**“What's next (Round 2)?”**
Classroom codes so real diagnostics flow to teachers; calibrating question parameters from real responses; photo input for handwritten working; a pilot with a school.
