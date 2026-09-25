/**
 * Measures how well the root-cause diagnostic recovers the true knowledge
 * gaps of simulated students, and how many questions it needs, compared
 * with conventional fixed-length tests.
 *
 *   npm run benchmark            (2000 students per course)
 *   npm run benchmark -- 5000    (custom sample size)
 */
import { builtinCourses } from "../src/content";
import { benchmark, benchmarkFixedTest, type BenchmarkResult } from "../src/lib/engine/simulate";

const runs = Number(process.argv[2] ?? 2000);
const pct = (x: number) => `${(x * 100).toFixed(1)}%`.padStart(7);
const row = (label: string, r: BenchmarkResult) =>
  `  ${label.padEnd(34)}${pct(r.exactMatch)}${pct(r.rootRecall)}${pct(r.rootPrecision)}   ${r.avgQuestions.toFixed(1).padStart(5)}`;

console.log(`\nRootwise diagnostic benchmark — ${runs} simulated students per course`);
console.log("Students have 0 (10%), 1 (60%) or 2 (30%) independent knowledge holes (plus");
console.log("everything built on them); they slip 10% of the time on concepts they know");
console.log("and guess (1 in 4) on concepts they don't.\n");

for (const course of builtinCourses) {
  console.log(`▸ ${course.title} (${course.concepts.length} concepts)`);
  console.log(`  ${"method".padEnd(34)}  exact recall  prec.   questions`);
  console.log(row("Rootwise (adaptive, KST + Bayes)", benchmark(course, runs, 7)));
  console.log(row("Fixed test, 1 question/concept", benchmarkFixedTest(course, 1, runs, 7)));
  console.log(row("Fixed test, 2 questions/concept", benchmarkFixedTest(course, 2, runs, 7)));
  console.log(row("Fixed test, 3 questions/concept", benchmarkFixedTest(course, 3, runs, 7)));
  console.log("");
}
