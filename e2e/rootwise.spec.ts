import { expect, test, type Page } from "@playwright/test";
import { quadratics } from "../src/content/quadratics";

/** Answers the adaptive diagnostic as a student who lacks `unknown` concepts. */
async function answerAs(page: Page, unknown: Set<string>) {
  const byStem = new Map(quadratics.questions.map((q) => [q.stem, q]));
  for (let i = 0; i < 30; i++) {
    if (await page.getByText("Diagnosis complete", { exact: true }).isVisible()) return;
    const stem = (await page.locator("h2[id^=q-]").first().textContent())!.trim();
    const q = byStem.get(stem)!;
    expect(q, `question with stem "${stem}"`).toBeTruthy();
    const correct = q.options.findIndex((o) => o.id === q.correctOptionId);
    const pick = unknown.has(q.conceptId) ? (correct + 1) % q.options.length : correct;
    await page.keyboard.press(String(pick + 1));
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status")).toBeVisible();
    await page.keyboard.press("Enter");
  }
  throw new Error("Diagnostic did not finish");
}

test("landing page explains the idea and runs the live demo @mobile", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("prerequisites");
  await expect(page.getByRole("img", { name: "Live demo knowledge graph" })).toBeVisible();
  // No horizontal page overflow on any viewport.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("diagnostic traces a student's mistakes to the true root gap", async ({ page }) => {
  await page.goto("/courses/quadratics-cbse10");
  await page.getByRole("link", { name: /Start diagnostic/ }).click();
  await answerAs(page, new Set(["factor-pairs", "factorise", "roots", "word-problems"]));
  await expect(page.getByRole("heading", { name: /Your root gap: Product–sum pairs/ })).toBeVisible();

  await page.getByRole("button", { name: /See my full report/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Product–sum pairs");
  await expect(page.getByRole("link", { name: /Product–sum pairs.*Root gap/ })).toBeVisible();

  // Pace setter: one hour puts the root gap first and triages the rest.
  await page.getByRole("link", { name: /Plan my hours/ }).click();
  await page.getByRole("button", { name: "1h", exact: true }).click();
  await page.getByRole("button", { name: /Plan my hours/ }).click();
  await expect(page.getByText("Honest triage")).toBeVisible();
  await expect(page.getByText(/Up next/)).toBeVisible();
  await expect(page.getByText("Learn · Product–sum pairs").first()).toBeVisible();

  // The game starts from the student's exact mistake and counts as evidence.
  await page.goto("/courses/quadratics-cbse10/learn/factor-pairs");
  const tiles = page.getByRole("group", { name: /Number tiles/ });
  await tiles.getByRole("button", { name: "2", exact: true }).click();
  await tiles.getByRole("button", { name: "5", exact: true }).click();
  await expect(page.getByText(/wrong signs/)).toBeVisible();
  await tiles.getByRole("button", { name: "−2", exact: true }).click();
  await tiles.getByRole("button", { name: "−5", exact: true }).click();
  await expect(page.getByRole("button", { name: "Next round" })).toBeVisible();
});

test("a student with no gaps is told so, quickly", async ({ page }) => {
  await page.goto("/courses/quadratics-cbse10/diagnose");
  await answerAs(page, new Set());
  await expect(page.getByRole("heading", { name: /No root gaps/ })).toBeVisible();
});

test("AI builds a course from a topic and the diagnostic runs on it", async ({ page }) => {
  await page.goto("/courses/new");
  await page.getByRole("button", { name: "Photosynthesis" }).click();
  await page.getByRole("button", { name: "Build course" }).click();
  await expect(page.getByText("Photosynthesis is ready.")).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: /Start diagnostic/ }).click();
  await expect(page.getByText(/Checking:/)).toBeVisible();
});

test("the Socratic tutor streams a reply and teach-back is graded", async ({ page }) => {
  await page.goto("/courses/quadratics-cbse10/learn/squares");
  await page.getByLabel(/Message the tutor/).fill("Is (−3)² negative?");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Where does the energy come from")).toBeVisible({ timeout: 15_000 });

  await page.getByRole("tab", { name: /Teach it back/ }).click();
  await page
    .getByLabel("Your explanation")
    .fill("Squaring multiplies a number by itself, so a negative squared is positive, and x² = 49 has two answers, plus or minus 7.");
  await page.getByRole("button", { name: "Get feedback" }).click();
  await expect(page.getByText("Accuracy")).toBeVisible();
});

test("teacher dashboard groups the class by root gap", async ({ page }) => {
  await page.goto("/teacher");
  await page.getByRole("button", { name: /Demo class/ }).click();
  await expect(page.getByRole("heading", { name: "Root gaps across the class" })).toBeVisible();
  await expect(page.getByText(/Group A/)).toBeVisible();
});

test("a real class: teacher creates it, a student joins and appears on the dashboard", async ({ page, browser }) => {
  await page.goto("/teacher");
  await page.getByLabel("Class name").fill("10-B Maths");
  await page.getByRole("button", { name: "Create class" }).click();
  const code = (await page.getByLabel(/Class code/).textContent())!.trim();
  expect(code).toMatch(/^[A-Z0-9]{6}$/);
  await expect(page.getByText("Waiting for students")).toBeVisible();

  const student = await browser.newPage();
  await student.goto(`/join/${code}`);
  await student.getByLabel(/Your name/).fill("Asha");
  await student.getByRole("button", { name: /Join and start/ }).click();
  await answerAs(student, new Set(["factor-pairs", "factorise", "roots", "word-problems"]));
  await expect(student.getByText(/Result shared with 10-B Maths/)).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Root gaps across the class" })).toBeVisible();
  await expect(page.getByText("Asha").first()).toBeVisible();
});
