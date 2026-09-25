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
  await expect(page.getByRole("heading", { name: "Root gaps across the class" })).toBeVisible();
  await expect(page.getByText(/Group A/)).toBeVisible();
});
