import type { Course } from "@/lib/schema";
import { mcq } from "./helpers";

/**
 * CBSE Class 10 — Chapter 4, Quadratic Equations, plus the prerequisite
 * skills students most often lack when they struggle with it.
 */
export const quadratics: Course = {
  id: "quadratics-cbse10",
  title: "Quadratic Equations",
  subject: "Mathematics",
  level: "school",
  audience: "CBSE Class 10",
  description:
    "Everything behind Chapter 4 — from integer sign rules and expanding brackets to the discriminant and word problems.",
  language: "en",
  source: "builtin",
  createdAt: "2026-09-01T00:00:00.000Z",
  targetConceptIds: ["word-problems", "discriminant"],
  concepts: [
    {
      id: "integers",
      name: "Integer signs",
      summary: "Adding, subtracting and multiplying positive and negative numbers.",
      lesson:
        "Integers include negative numbers. Subtracting a negative is the same as adding: 5 − (−3) = 5 + 3 = 8. When multiplying or dividing, like signs give a positive and unlike signs give a negative: (−4)(−2) = 8 but (−4)(2) = −8. Most 'silly mistakes' in algebra are really sign mistakes made here.",
      keyIdeas: [
        "Subtracting a negative number is the same as adding its positive",
        "Multiplying two numbers with the same sign gives a positive result",
        "Multiplying numbers with different signs gives a negative result",
        "When adding numbers with different signs, subtract their sizes and keep the sign of the larger",
      ],
      example: {
        problem: "Evaluate (−3)(−5) − (−2).",
        steps: [
          "(−3)(−5) = +15, because like signs give a positive.",
          "15 − (−2) = 15 + 2, because subtracting a negative means adding.",
          "= 17",
        ],
      },
      socratic: [
        "Look at the pattern 3×(−2) = −6, 2×(−2) = −4, 1×(−2) = −2, 0×(−2) = 0. What should (−1)×(−2) be to continue it?",
        "If someone takes away a debt of ₹3 from you, are you richer or poorer? How is that like 5 − (−3)?",
        "Before calculating (−6)(−4), can you predict the sign of the answer?",
      ],
      prerequisites: [],
    },
    {
      id: "squares",
      name: "Squares & square roots",
      summary: "Squaring numbers (including negatives) and taking square roots.",
      lesson:
        "Squaring means multiplying a number by itself: 5² = 25 and (−5)² = (−5)(−5) = 25, so a square is never negative. Taking a square root undoes squaring, but x² = 25 has two answers, x = 5 and x = −5, written x = ±5. Also, √(a + b) is not √a + √b: √(9 + 16) = √25 = 5, not 3 + 4.",
      keyIdeas: [
        "Squaring multiplies a number by itself (not by 2)",
        "The square of a negative number is positive",
        "x² = k (with k > 0) has two solutions: x = ±√k",
        "The square root of a sum is not the sum of the square roots",
      ],
      example: {
        problem: "Solve (x + 1)² = 16.",
        steps: [
          "Take square roots of both sides — keep both signs: x + 1 = ±4.",
          "Case 1: x + 1 = 4 → x = 3.",
          "Case 2: x + 1 = −4 → x = −5.",
          "So x = 3 or x = −5.",
        ],
      },
      socratic: [
        "What number times itself gives 49? Is there more than one?",
        "Is (−3)² the same as 2 × (−3)? What's the difference between squaring and doubling?",
        "Try it: is √(9 + 16) equal to √9 + √16?",
      ],
      prerequisites: [],
    },
    {
      id: "expand",
      name: "Expanding brackets",
      summary: "Multiplying out brackets with the distributive law.",
      lesson:
        "The distributive law says a(b + c) = ab + ac: the term outside multiplies every term inside. A minus sign in front of a bracket flips every sign inside: −(x − 3) = −x + 3. For two brackets, multiply each term in the first by each term in the second: (x + 2)(x + 5) = x² + 5x + 2x + 10 = x² + 7x + 10. In particular (a + b)² = a² + 2ab + b², not a² + b².",
      keyIdeas: [
        "The term outside a bracket multiplies every term inside",
        "A minus sign before a bracket changes the sign of every term inside",
        "With two brackets, each term in one multiplies each term in the other",
        "(a + b)² = a² + 2ab + b², not a² + b²",
      ],
      example: {
        problem: "Expand and simplify (x − 4)(x + 3).",
        steps: ["x × x = x²", "x × 3 = 3x and −4 × x = −4x", "−4 × 3 = −12", "Combine: x² + 3x − 4x − 12 = x² − x − 12"],
      },
      socratic: [
        "If you buy a pen and an eraser for each of 3 friends, how many pens and erasers do you buy? How does that match 3(p + e)?",
        "In −2(x − 5), what happens to the −5 when the −2 multiplies it?",
        "Can you draw (a + b)² as a square with side a + b? How many pieces does it split into?",
      ],
      prerequisites: ["integers"],
    },
    {
      id: "linear",
      name: "Linear equations",
      summary: "Solving equations like 3x − 4 = x + 10 by keeping both sides balanced.",
      lesson:
        "An equation is a balance: whatever you do to one side, you must do to the other. 'Moving' a term to the other side changes its sign because you are really subtracting (or adding) it on both sides. To undo multiplication, divide every term on that side, not just one. Always check by substituting your answer back.",
      keyIdeas: [
        "Whatever you do to one side, do to the other",
        "Moving a term across the equals sign changes its sign",
        "Divide every term on a side, not just one of them",
        "Check the answer by substituting it back",
      ],
      example: {
        problem: "Solve 5x + 3 = 2x − 9.",
        steps: [
          "Subtract 2x from both sides: 3x + 3 = −9.",
          "Subtract 3 from both sides: 3x = −12.",
          "Divide both sides by 3: x = −4.",
          "Check: 5(−4) + 3 = −17 and 2(−4) − 9 = −17 ✓",
        ],
      },
      socratic: [
        "If you remove 3 kg from one pan of a balanced scale, what must you do to the other pan?",
        "Why does +7 become −7 when it 'moves' to the other side?",
        "In 2x + 6 = 10, if you divide by 2, what happens to the 6?",
      ],
      prerequisites: ["integers"],
    },
    {
      id: "factor-pairs",
      name: "Product–sum pairs",
      summary: "Finding two numbers with a given product and a given sum.",
      lesson:
        "Factorising a quadratic needs two numbers that multiply to one value and add to another. List the factor pairs of the product, then check their sums. Signs matter: if the product is positive, both numbers share the sign of the sum; if the product is negative, the numbers have opposite signs and the larger one takes the sign of the sum.",
      keyIdeas: [
        "List factor pairs of the product, then test their sums",
        "Positive product: both numbers have the same sign as the sum",
        "Negative product: the two numbers have opposite signs",
        "With a negative product, the larger number takes the sign of the sum",
      ],
      example: {
        problem: "Find two numbers with product −24 and sum −5.",
        steps: [
          "The product is negative, so one number is positive and one is negative.",
          "Factor pairs of 24: 1·24, 2·12, 3·8, 4·6.",
          "We need a difference of 5: that's 3 and 8.",
          "The sum is −5, so the larger gets the minus sign: 3 and −8. Check: 3 × (−8) = −24 and 3 + (−8) = −5 ✓",
        ],
      },
      socratic: [
        "If two numbers multiply to a positive number, what can you say about their signs?",
        "What are all the factor pairs of 12? Which pair adds to 7?",
        "The product is −18. Why must exactly one of the numbers be negative?",
      ],
      prerequisites: ["integers"],
    },
    {
      id: "standard-form",
      name: "Standard form",
      summary: "Writing a quadratic as ax² + bx + c = 0 and reading off a, b and c.",
      lesson:
        "Any quadratic equation can be rearranged into standard form ax² + bx + c = 0, where a ≠ 0. First expand any brackets and move every term to one side so the other side is 0. Only then read the coefficients — and keep their signs: in 2x² − 5x + 3 = 0, b is −5, not 5. An equation is quadratic only if an x² term survives after simplifying.",
      keyIdeas: [
        "Standard form is ax² + bx + c = 0 with a ≠ 0",
        "Expand brackets and move all terms to one side before reading a, b, c",
        "The coefficients include their signs",
        "It is quadratic only if the x² term survives simplification",
      ],
      example: {
        problem: "Write 3x² = 7 − 2x in standard form and find a, b and c.",
        steps: ["Move all terms to the left: 3x² + 2x − 7 = 0.", "a = 3, b = 2, c = −7."],
      },
      socratic: [
        "Why must the right-hand side be 0 before reading a, b and c?",
        "In x² − 5x + 6 = 0, is b equal to 5 or −5? Why does it matter?",
        "Does x(x + 2) = x² + 5 still contain an x² after simplifying?",
      ],
      prerequisites: ["expand", "linear"],
    },
    {
      id: "zero-product",
      name: "Zero-product rule",
      summary: "If a product equals zero, at least one factor is zero.",
      lesson:
        "If p × q = 0, then p = 0 or q = 0 — zero is the only number with this property. So (x − 4)(x + 1) = 0 gives x = 4 or x = −1. This only works when the product is 0: (x − 2)(x − 3) = 6 does not mean either bracket equals 6. Never divide both sides by x — you would lose the solution x = 0; factor x out instead.",
      keyIdeas: [
        "If a product is zero, at least one factor must be zero",
        "The rule only works when one side is exactly 0",
        "Set each factor equal to zero and solve",
        "Don't divide by x — factor it out to keep the root x = 0",
      ],
      example: {
        problem: "Solve 2x² = 8x.",
        steps: ["Move everything to one side: 2x² − 8x = 0.", "Factor: 2x(x − 4) = 0.", "So 2x = 0 or x − 4 = 0.", "x = 0 or x = 4."],
      },
      socratic: [
        "If a × b = 0, what can you say about a or b? Does the same work if a × b = 6?",
        "What goes wrong if you divide both sides of x² = 3x by x?",
        "For (x − 5)(x + 2) = 0, which value of x makes each bracket zero?",
      ],
      prerequisites: ["linear"],
    },
    {
      id: "factorise",
      name: "Splitting the middle term",
      summary: "Factorising ax² + bx + c by splitting the middle term.",
      lesson:
        "To factorise ax² + bx + c, find two numbers that multiply to a·c and add to b, then split the middle term and group. For x² − 7x + 10, the numbers multiplying to 10 and adding to −7 are −2 and −5, giving (x − 2)(x − 5). The roots are the values that make each factor zero, so (x − 2) gives x = +2 — the sign flips.",
      keyIdeas: [
        "Find two numbers that multiply to a·c and add to b",
        "Split the middle term using those numbers, then group",
        "Expand your factors to check them",
        "Roots come from setting each factor to zero, so (x − 2) gives x = 2",
      ],
      example: {
        problem: "Factorise 2x² + 7x + 3.",
        steps: [
          "a·c = 6. Numbers multiplying to 6 and adding to 7: 6 and 1.",
          "Split: 2x² + 6x + x + 3.",
          "Group: 2x(x + 3) + 1(x + 3).",
          "Factor: (2x + 1)(x + 3).",
        ],
      },
      socratic: [
        "For x² + 5x + 6, which two numbers multiply to 6 and add to 5?",
        "If a factor is (x + 3), what value of x makes it zero?",
        "Why do we use a·c, not just c, when a isn't 1?",
      ],
      prerequisites: ["factor-pairs", "expand", "standard-form"],
    },
    {
      id: "formula",
      name: "Quadratic formula",
      summary: "Solving any quadratic with x = (−b ± √(b² − 4ac)) / 2a.",
      lesson:
        "The quadratic formula solves any ax² + bx + c = 0: x = (−b ± √(b² − 4ac)) / 2a. Substitute with brackets, especially when b or c is negative: if b = −3, then −b = 3 and b² = 9. The whole numerator, −b ± √(b² − 4ac), is divided by 2a — not just the square root.",
      keyIdeas: [
        "x = (−b ± √(b² − 4ac)) / 2a",
        "Substitute with brackets so negative values keep their signs",
        "If b is negative, −b is positive and b² is positive",
        "The whole numerator is divided by 2a",
      ],
      example: {
        problem: "Solve x² − 3x − 4 = 0 with the formula.",
        steps: ["a = 1, b = −3, c = −4.", "b² − 4ac = (−3)² − 4(1)(−4) = 9 + 16 = 25.", "x = (3 ± 5) / 2.", "x = 4 or x = −1."],
      },
      socratic: [
        "If b = −6, what is −b? What is b²?",
        "In the formula, what exactly is divided by 2a?",
        "Which part of the formula produces two answers?",
      ],
      prerequisites: ["standard-form", "squares"],
    },
    {
      id: "discriminant",
      name: "Discriminant & nature of roots",
      summary: "Using D = b² − 4ac to tell how many real roots there are.",
      lesson:
        "The discriminant D = b² − 4ac is the part under the square root in the formula. If D > 0 there are two distinct real roots; if D = 0 there are two equal real roots (one repeated value); if D < 0 there are no real roots, because a negative number has no real square root. D tells you how many real roots exist, not whether they are positive or negative.",
      keyIdeas: [
        "D = b² − 4ac",
        "D > 0 means two distinct real roots",
        "D = 0 means two equal (repeated) real roots",
        "D < 0 means no real roots — it's about existence, not the sign of the roots",
      ],
      example: {
        problem: "Find k (k > 0) so that x² + kx + 9 = 0 has equal roots.",
        steps: ["Equal roots means D = 0.", "k² − 4(1)(9) = 0, so k² = 36.", "k = 6, taking k > 0."],
      },
      socratic: [
        "Where does b² − 4ac appear in the quadratic formula?",
        "What happens to √D when D is negative?",
        "If D = 0, what does ±√D add or subtract?",
      ],
      prerequisites: ["formula"],
    },
    {
      id: "roots",
      name: "Solving quadratics",
      summary: "Choosing a method and finding both solutions of a quadratic.",
      lesson:
        "To solve a quadratic: rearrange into standard form, then factorise if the numbers are friendly or use the formula otherwise. A quadratic has two roots (which may be equal), so find both — and check each by substituting it back. A perfect square like (2x − 3)² = 0 gives two equal roots.",
      keyIdeas: [
        "Rearrange into standard form first",
        "Factorise when you can; otherwise use the formula",
        "A quadratic has two roots (which may be equal) — find both",
        "Check each root by substituting it back",
      ],
      example: {
        problem: "Solve x² + x − 6 = 0.",
        steps: ["Numbers multiplying to −6 and adding to 1: 3 and −2.", "(x + 3)(x − 2) = 0.", "x = −3 or x = 2.", "Check x = 2: 4 + 2 − 6 = 0 ✓"],
      },
      socratic: [
        "How many solutions do you expect a quadratic to have?",
        "How would you decide between factorising and using the formula?",
        "How can you check a root without solving again?",
      ],
      prerequisites: ["factorise", "zero-product", "formula"],
    },
    {
      id: "word-problems",
      name: "Word problems",
      summary: "Turning real situations into quadratics and interpreting the roots.",
      lesson:
        "Name the unknown, write the relationship in words, then translate it into an equation (for example, area = length × width). Rearrange into standard form and solve. Finally, interpret: a length, speed, age or count can't be negative, and a time of 0 may just be the starting moment — keep only the roots that make sense in context.",
      keyIdeas: [
        "Define the unknown clearly",
        "Translate the relationship into an equation (e.g. area = length × width)",
        "Solve the resulting quadratic",
        "Reject roots that don't make sense in context",
      ],
      example: {
        problem: "A rectangle's length is 2 m more than its width and its area is 48 m². Find the width.",
        steps: [
          "Let the width be w, so the length is w + 2.",
          "w(w + 2) = 48 → w² + 2w − 48 = 0.",
          "(w + 8)(w − 6) = 0 → w = −8 or w = 6.",
          "A width can't be negative, so w = 6 m.",
        ],
      },
      socratic: [
        "What quantity should your variable stand for here?",
        "Which formula connects length, width and area?",
        "Your equation gives two roots. Do both make sense for a real rectangle?",
      ],
      prerequisites: ["roots"],
    },
  ],
  misconceptions: [
    { id: "int-negneg", conceptId: "integers", label: "Thinks a negative times a negative is negative", explanation: "Like signs multiply to a positive: (−6)(−4) = +24. Continue the pattern 2×(−4) = −8, 1×(−4) = −4, 0×(−4) = 0 — each step adds 4, so (−1)×(−4) = +4." },
    { id: "int-subneg", conceptId: "integers", label: "Treats subtracting a negative as subtracting", explanation: "Subtracting a negative adds: 5 − (−8) = 5 + 8 = 13. Removing a debt makes you richer." },
    { id: "int-addsign", conceptId: "integers", label: "Adds the sizes of numbers with different signs", explanation: "For −7 + 3 the signs differ, so subtract the sizes (7 − 3 = 4) and keep the sign of the larger: −4, not −10." },
    { id: "sq-negsquare", conceptId: "squares", label: "Thinks the square of a negative number is negative", explanation: "(−5)² = (−5)(−5) = +25. A square is never negative. (Careful: −5² means −(5²) = −25, which is different.)" },
    { id: "sq-plusminus", conceptId: "squares", label: "Forgets the ± when taking a square root", explanation: "x² = 49 has two solutions, because both 7² and (−7)² equal 49. Write x = ±7." },
    { id: "sq-double", conceptId: "squares", label: "Confuses squaring with doubling", explanation: "x² means x × x, not 2 × x. For example 5² = 25, while 2 × 5 = 10." },
    { id: "sq-rootsum", conceptId: "squares", label: "Thinks √(a + b) = √a + √b", explanation: "Square roots don't split over addition: √(36 + 64) = √100 = 10, but √36 + √64 = 14." },
    { id: "ex-firstonly", conceptId: "expand", label: "Multiplies only part of the bracket", explanation: "The outside term multiplies every term inside: 3(x + 4) = 3x + 12, not 3x + 4. With two brackets, every term meets every term." },
    { id: "ex-minussign", conceptId: "expand", label: "Doesn't carry a minus sign into every term", explanation: "−2(x − 3) = −2x + 6: the minus multiplies the −3 as well, and (−2)(−3) = +6." },
    { id: "ex-squarebinomial", conceptId: "expand", label: "Thinks (a + b)² = a² + b²", explanation: "(a + b)² = (a + b)(a + b) = a² + 2ab + b². The middle term 2ab is the part that's usually forgotten." },
    { id: "lin-transpose", conceptId: "linear", label: "Moves a term across '=' without changing its sign", explanation: "Moving +7 to the other side means subtracting 7 from both sides, so it becomes −7: x + 7 = 12 → x = 12 − 7 = 5." },
    { id: "lin-divide", conceptId: "linear", label: "Divides only one term on a side", explanation: "Dividing 2x + 6 = 10 by 2 gives x + 3 = 5 — every term is divided, not just 2x." },
    { id: "fp-sumproduct", conceptId: "factor-pairs", label: "Mixes up which number is the sum and which the product", explanation: "Both conditions must hold at once: the pair must multiply to the product AND add to the sum. Check each candidate against both." },
    { id: "fp-signs", conceptId: "factor-pairs", label: "Gets the signs of the pair wrong", explanation: "Positive product → same signs (both negative if the sum is negative). Negative product → opposite signs, and the larger number takes the sign of the sum." },
    { id: "sf-notzero", conceptId: "standard-form", label: "Reads a, b, c before making one side zero", explanation: "First rearrange so one side is 0. x² = 4x − 7 becomes x² − 4x + 7 = 0, so b = −4 (not 4)." },
    { id: "sf-sign", conceptId: "standard-form", label: "Drops the sign when reading a coefficient", explanation: "Coefficients carry their signs: in 2x² − 5x + 3 = 0, b = −5." },
    { id: "sf-degree", conceptId: "standard-form", label: "Calls an equation quadratic just because x² appears", explanation: "Simplify first: x(x + 2) = x² + 5 becomes 2x = 5 after the x² terms cancel — that's linear, not quadratic." },
    { id: "zp-nonzero", conceptId: "zero-product", label: "Uses the zero-product rule when the product isn't zero", explanation: "Only 0 has the property 'if pq = 0 then p = 0 or q = 0'. For (x − 2)(x − 3) = 6, expand, move the 6 across, and solve x² − 5x = 0." },
    { id: "zp-divide", conceptId: "zero-product", label: "Divides by x and loses the root x = 0", explanation: "Dividing by x assumes x ≠ 0. Instead factor: 3x² − 12x = 3x(x − 4) = 0 gives x = 0 or x = 4." },
    { id: "fa-rootsign", conceptId: "factorise", label: "Flips the sign when reading roots from factors", explanation: "A root makes its factor zero: (x − 3) = 0 gives x = +3, and (x + 4) = 0 gives x = −4." },
    { id: "fa-split", conceptId: "factorise", label: "Splits the middle term using c instead of a·c", explanation: "When a ≠ 1, the pair must multiply to a·c. For 2x² + 7x + 3, a·c = 6, so use 6 and 1." },
    { id: "fo-minusb", conceptId: "formula", label: "Uses b instead of −b in the formula", explanation: "The formula starts with −b. If b = 2, the numerator starts with −2; if b = −3, it starts with +3." },
    { id: "fo-denominator", conceptId: "formula", label: "Divides only the square root by 2a", explanation: "Everything on top is divided by 2a: x = (−b ± √D) / 2a, not −b ± (√D / 2a)." },
    { id: "di-formula", conceptId: "discriminant", label: "Uses the wrong expression for the discriminant", explanation: "D = b² − 4ac: b is squared, and 4ac is subtracted." },
    { id: "di-negroots", conceptId: "discriminant", label: "Thinks D < 0 means the roots are negative", explanation: "D < 0 means there are no real roots at all, because √D isn't a real number. The sign of D says how many roots exist, not their sign." },
    { id: "di-zero", conceptId: "discriminant", label: "Thinks D = 0 means there are no roots", explanation: "D = 0 means the ± part vanishes, so both roots are equal: x = −b/2a (a repeated root)." },
    { id: "ro-oneroot", conceptId: "roots", label: "Stops after finding one root", explanation: "A quadratic has two roots (possibly equal). Solve for each factor, or use both signs of ±." },
    { id: "wp-setup", conceptId: "word-problems", label: "Builds the equation from the wrong relationship", explanation: "Write the relationship in words first (e.g. 'area = length × width'), then substitute. Perimeter, sum and product are different relationships." },
    { id: "wp-context", conceptId: "word-problems", label: "Doesn't check which root makes sense in context", explanation: "Lengths, speeds and counts can't be negative, and t = 0 is just the starting moment. Keep only the roots that fit the situation." },
  ],
  questions: [
    // ── Integer signs ──────────────────────────────────────────────
    mcq("q-int-1", "integers", 1, "Evaluate (−6) × (−4).", [["−24", "int-negneg"], ["24"], ["−10", "int-addsign"], ["2"]], 1, "Like signs multiply to a positive: (−6)(−4) = +24."),
    mcq("q-int-2", "integers", 2, "Evaluate 5 − (−8).", [["−3", "int-subneg"], ["−13"], ["3"], ["13"]], 3, "Subtracting a negative is adding: 5 − (−8) = 5 + 8 = 13."),
    mcq("q-int-3", "integers", 2, "Evaluate −7 + 3.", [["−10", "int-addsign"], ["4"], ["−4"], ["10"]], 2, "Different signs: subtract the sizes (7 − 3 = 4) and keep the sign of the larger number: −4."),
    mcq("q-int-4", "integers", 3, "Evaluate (−2)(−3) − (−4)(5).", [["26"], ["−14", "int-subneg"], ["14", "int-negneg"], ["−26", "int-negneg"]], 0, "(−2)(−3) = 6 and (−4)(5) = −20, so 6 − (−20) = 6 + 20 = 26."),
    // ── Squares & roots ───────────────────────────────────────────
    mcq("q-sq-1", "squares", 1, "What is (−5)²?", [["−25", "sq-negsquare"], ["10", "sq-double"], ["25"], ["−10"]], 2, "(−5)² = (−5)(−5) = 25. A square is never negative."),
    mcq("q-sq-2", "squares", 2, "Solve x² = 49.", [["x = 7", "sq-plusminus"], ["x = ±7"], ["x = 24.5", "sq-double"], ["x = −7 only"]], 1, "Both 7² and (−7)² equal 49, so x = ±7."),
    mcq("q-sq-3", "squares", 2, "Which value equals √(36 + 64)?", [["10"], ["14", "sq-rootsum"], ["50", "sq-double"], ["100"]], 0, "Add first: √(36 + 64) = √100 = 10. Square roots don't split over addition."),
    mcq("q-sq-4", "squares", 3, "If (x − 2)² = 9, what are the values of x?", [["x = 5 only", "sq-plusminus"], ["x = 11 or x = −7"], ["x = 5 or x = −1"], ["x = 1 or x = −5", "lin-transpose"]], 2, "x − 2 = ±3, so x = 2 + 3 = 5 or x = 2 − 3 = −1."),
    // ── Expanding brackets ────────────────────────────────────────
    mcq("q-ex-1", "expand", 1, "Expand 3(x + 4).", [["3x + 4", "ex-firstonly"], ["3x + 7"], ["x + 12"], ["3x + 12"]], 3, "3 multiplies both terms: 3·x + 3·4 = 3x + 12."),
    mcq("q-ex-2", "expand", 2, "Simplify 5 − 2(x − 3).", [["−1 − 2x", "ex-minussign"], ["3x − 9"], ["11 − 2x"], ["5 − 2x − 3", "ex-firstonly"]], 2, "−2(x − 3) = −2x + 6, so 5 − 2x + 6 = 11 − 2x."),
    mcq("q-ex-3", "expand", 2, "Expand (x + 5)².", [["x² + 25", "ex-squarebinomial"], ["x² + 10x + 25"], ["2x + 10", "sq-double"], ["x² + 5x + 25"]], 1, "(x + 5)(x + 5) = x² + 5x + 5x + 25 = x² + 10x + 25."),
    mcq("q-ex-4", "expand", 3, "Expand and simplify (2x − 3)(x + 4).", [["2x² + 5x − 12"], ["2x² − 12", "ex-firstonly"], ["2x² + 11x − 12", "ex-minussign"], ["2x² + 5x + 12", "int-negneg"]], 0, "2x·x = 2x², 2x·4 = 8x, −3·x = −3x, −3·4 = −12. Total: 2x² + 5x − 12."),
    // ── Linear equations ──────────────────────────────────────────
    mcq("q-lin-1", "linear", 1, "Solve x + 7 = 12.", [["x = 5"], ["x = 19", "lin-transpose"], ["x = −5"], ["x = 12/7"]], 0, "Subtract 7 from both sides: x = 12 − 7 = 5."),
    mcq("q-lin-2", "linear", 2, "Solve 2x + 6 = 10.", [["x = 8", "lin-transpose"], ["x = −1", "lin-divide"], ["x = 2"], ["x = 4"]], 2, "2x = 10 − 6 = 4, so x = 2."),
    mcq("q-lin-3", "linear", 2, "Solve 3x − 4 = x + 10.", [["x = 3", "lin-transpose"], ["x = 7"], ["x = 3.5", "lin-transpose"], ["x = 14"]], 1, "3x − x = 10 + 4, so 2x = 14 and x = 7."),
    mcq("q-lin-4", "linear", 3, "Solve (x + 2)/3 = (x − 4)/2.", [["x = 6", "ex-firstonly"], ["x = 8", "lin-transpose"], ["x = −16"], ["x = 16"]], 3, "Cross-multiply: 2(x + 2) = 3(x − 4) → 2x + 4 = 3x − 12 → x = 16."),
    // ── Product–sum pairs ─────────────────────────────────────────
    mcq("q-fp-1", "factor-pairs", 1, "Which two numbers multiply to 12 and add to 7?", [["2 and 5", "fp-sumproduct"], ["3 and 4"], ["2 and 6"], ["1 and 12"]], 1, "3 × 4 = 12 and 3 + 4 = 7. (2 and 5 add to 7 but multiply to 10.)"),
    mcq("q-fp-2", "factor-pairs", 2, "Which two numbers multiply to 10 and add to −7?", [["2 and 5", "fp-signs"], ["2 and −5", "fp-signs"], ["−2 and −5"], ["−3 and −4", "fp-sumproduct"]], 2, "Positive product with a negative sum → both negative: (−2)(−5) = 10 and −2 + (−5) = −7."),
    mcq("q-fp-3", "factor-pairs", 2, "Which two numbers multiply to −18 and add to 3?", [["−6 and 3", "fp-signs"], ["6 and −3"], ["9 and −6", "fp-sumproduct"], ["18 and −1"]], 1, "Negative product → opposite signs; the larger takes the sign of the sum (+): 6 × (−3) = −18 and 6 + (−3) = 3."),
    mcq("q-fp-4", "factor-pairs", 3, "To factorise 6x² + 7x − 20 you need two numbers whose product is a·c and whose sum is b. Which pair works?", [["10 and −2", "fa-split"], ["−15 and 8", "fp-signs"], ["20 and −6"], ["15 and −8"]], 3, "a·c = 6 × (−20) = −120 and b = 7: 15 × (−8) = −120 and 15 + (−8) = 7."),
    // ── Standard form ─────────────────────────────────────────────
    mcq("q-sf-1", "standard-form", 1, "In 2x² − 5x + 3 = 0, what are a, b and c?", [["a = 2, b = 5, c = 3", "sf-sign"], ["a = 2, b = −5, c = 3"], ["a = 2x², b = −5x, c = 3"], ["a = 3, b = −5, c = 2"]], 1, "Compare with ax² + bx + c = 0, keeping signs: a = 2, b = −5, c = 3."),
    mcq("q-sf-2", "standard-form", 2, "Write x² = 4x − 7 in standard form. What is b?", [["b = 4", "sf-notzero"], ["b = −7"], ["b = −4"], ["b = 1"]], 2, "Move everything left: x² − 4x + 7 = 0, so b = −4."),
    mcq("q-sf-3", "standard-form", 2, "Which of these is a quadratic equation?", [["x(x + 2) = x² + 5", "sf-degree"], ["x² + 3x = 2x² − 1"], ["3x + 2 = 0"], ["x³ − x = 0"]], 1, "x² + 3x = 2x² − 1 simplifies to x² − 3x − 1 = 0, still with an x² term. The first option simplifies to 2x = 5 (linear)."),
    mcq("q-sf-4", "standard-form", 3, "Rewrite (x + 3)(x − 2) = 2x + 1 in standard form.", [["x² + x − 6 = 0", "sf-notzero"], ["x² + 3x − 5 = 0", "lin-transpose"], ["x² − x − 7 = 0"], ["x² − x + 5 = 0"]], 2, "Expand: x² + x − 6 = 2x + 1. Move terms left: x² + x − 2x − 6 − 1 = 0 → x² − x − 7 = 0."),
    // ── Zero-product rule ─────────────────────────────────────────
    mcq("q-zp-1", "zero-product", 1, "If (x − 4)(x + 1) = 0, then:", [["x = −4 or x = 1", "fa-rootsign"], ["x = 4 only", "ro-oneroot"], ["x = 4 or x = −1"], ["x = 0"]], 2, "Each factor can be zero: x − 4 = 0 gives x = 4; x + 1 = 0 gives x = −1."),
    mcq("q-zp-2", "zero-product", 2, "Solve x(x − 6) = 0.", [["x = 6 only", "zp-divide"], ["x = 0 or x = 6"], ["x = 0 or x = −6", "fa-rootsign"], ["x = 3"]], 1, "Either x = 0 or x − 6 = 0, so x = 0 or x = 6."),
    mcq("q-zp-3", "zero-product", 2, "Riya writes: “(x − 2)(x − 3) = 6, so x − 2 = 6 or x − 3 = 6.” Is she right?", [["Yes — so x = 8 or x = 9", "zp-nonzero"], ["Yes — any product can be split this way", "zp-nonzero"], ["No — she should divide both sides by (x − 2)", "zp-divide"], ["No — the rule only works when the product is 0"]], 3, "Only zero forces a factor to be zero. Expand instead: x² − 5x + 6 = 6 → x² − 5x = 0 → x = 0 or x = 5."),
    mcq("q-zp-4", "zero-product", 3, "Solve 3x² = 12x.", [["x = 0 or x = 4"], ["x = 4 only", "zp-divide"], ["x = ±2"], ["x = 0 or x = −4", "fa-rootsign"]], 0, "3x² − 12x = 0 → 3x(x − 4) = 0 → x = 0 or x = 4. Dividing by x would lose x = 0."),
    // ── Splitting the middle term ─────────────────────────────────
    mcq("q-fa-1", "factorise", 1, "Factorise x² + 5x + 6.", [["(x + 1)(x + 6)", "fp-sumproduct"], ["(x + 2)(x + 3)"], ["(x − 2)(x − 3)", "fp-signs"], ["x(x + 5) + 6"]], 1, "2 × 3 = 6 and 2 + 3 = 5, so x² + 5x + 6 = (x + 2)(x + 3)."),
    mcq("q-fa-2", "factorise", 2, "The roots of x² − 7x + 10 = 0 are:", [["x = −2 and x = −5", "fa-rootsign"], ["x = 1 and x = 10", "fp-sumproduct"], ["x = 2 and x = 5"], ["x = −2 and x = 5"]], 2, "x² − 7x + 10 = (x − 2)(x − 5), and each factor is zero at x = 2 and x = 5."),
    mcq("q-fa-3", "factorise", 2, "Factorise x² − x − 12.", [["(x + 4)(x − 3)", "fp-signs"], ["(x − 6)(x + 2)"], ["(x − 12)(x + 1)"], ["(x − 4)(x + 3)"]], 3, "Need product −12 and sum −1: −4 and 3. So (x − 4)(x + 3)."),
    mcq("q-fa-4", "factorise", 3, "Factorise 2x² + 7x + 3.", [["(2x + 3)(x + 1)", "fa-split"], ["(x + 1)(x + 6)", "fa-split"], ["(2x + 1)(x + 3)"], ["(2x − 1)(x − 3)", "fp-signs"]], 2, "a·c = 6 → 6 and 1. 2x² + 6x + x + 3 = 2x(x + 3) + 1(x + 3) = (2x + 1)(x + 3)."),
    // ── Quadratic formula ─────────────────────────────────────────
    mcq("q-fo-1", "formula", 1, "The quadratic formula for ax² + bx + c = 0 is:", [["x = (b ± √(b² − 4ac)) / 2a", "fo-minusb"], ["x = −b ± √(b² − 4ac) / 2a", "fo-denominator"], ["x = (−b ± √(b² + 4ac)) / 2a", "di-formula"], ["x = (−b ± √(b² − 4ac)) / 2a"]], 3, "x = (−b ± √(b² − 4ac)) / 2a — the entire numerator is divided by 2a."),
    mcq("q-fo-2", "formula", 2, "For x² − 3x − 4 = 0, what is b² − 4ac?", [["−7", "int-subneg"], ["7", "sq-negsquare"], ["25"], ["−25", "sq-negsquare"]], 2, "a = 1, b = −3, c = −4: (−3)² − 4(1)(−4) = 9 + 16 = 25."),
    mcq("q-fo-3", "formula", 2, "Using the formula on x² + 2x − 8 = 0 gives:", [["x = −2 or x = 4", "fo-minusb"], ["x = 2 or x = −4"], ["x = 1 or x = −5", "fo-denominator"], ["x = 4 or x = −8"]], 1, "D = 4 + 32 = 36, so x = (−2 ± 6)/2 = 2 or −4."),
    mcq("q-fo-4", "formula", 3, "Solve 2x² − 4x − 1 = 0 using the formula.", [["x = (−2 ± √6) / 2", "fo-minusb"], ["x = 4 ± (√24)/4", "fo-denominator"], ["x = (2 ± √2) / 2", "int-subneg"], ["x = (2 ± √6) / 2"]], 3, "D = 16 + 8 = 24 and √24 = 2√6. x = (4 ± 2√6)/4 = (2 ± √6)/2."),
    // ── Discriminant ──────────────────────────────────────────────
    mcq("q-di-1", "discriminant", 1, "The discriminant of ax² + bx + c = 0 is:", [["√(b² − 4ac)"], ["b² − 4ac"], ["b² + 4ac", "di-formula"], ["b − 4ac", "di-formula"]], 1, "D = b² − 4ac, the expression under the square root."),
    mcq("q-di-2", "discriminant", 2, "If the discriminant is negative, the equation has:", [["two negative roots", "di-negroots"], ["exactly one real root", "di-zero"], ["no real roots"], ["infinitely many roots"]], 2, "√D isn't a real number when D < 0, so there are no real roots."),
    mcq("q-di-3", "discriminant", 2, "x² − 6x + 9 = 0 has discriminant 0. So it has:", [["no roots", "di-zero"], ["two equal real roots (x = 3, 3)"], ["two distinct real roots"], ["only negative roots", "di-negroots"]], 1, "D = 0 → two equal roots: x = −b/2a = 6/2 = 3. Indeed (x − 3)² = 0."),
    mcq("q-di-4", "discriminant", 3, "For which k > 0 does x² + kx + 16 = 0 have two equal roots?", [["k = 4", "di-formula"], ["k = 32", "sq-double"], ["k = 64"], ["k = 8"]], 3, "Equal roots: k² − 4(1)(16) = 0 → k² = 64 → k = 8."),
    // ── Solving quadratics ────────────────────────────────────────
    mcq("q-ro-1", "roots", 1, "Solve x² − 9 = 0.", [["x = ±3"], ["x = 3 only", "sq-plusminus"], ["x = 4.5", "sq-double"], ["x = 9 or x = −9"]], 0, "x² = 9, so x = ±3."),
    mcq("q-ro-2", "roots", 2, "Solve x² + x − 6 = 0.", [["x = 3 or x = −2", "fa-rootsign"], ["x = 2 only", "ro-oneroot"], ["x = −3 or x = 2"], ["x = 6 or x = −1"]], 2, "(x + 3)(x − 2) = 0, so x = −3 or x = 2."),
    mcq("q-ro-3", "roots", 2, "Solve 2x² − 5x + 2 = 0.", [["x = 2 only", "ro-oneroot"], ["x = 1/2 or x = 2"], ["x = −1/2 or x = −2", "fa-rootsign"], ["x = 1 or x = 2", "lin-divide"]], 1, "a·c = 4 → −4 and −1: 2x² − 4x − x + 2 = (2x − 1)(x − 2) = 0, so x = 1/2 or x = 2."),
    mcq("q-ro-4", "roots", 3, "Solve 4x² − 12x + 9 = 0.", [["x = −3/2", "fa-rootsign"], ["No real solution", "di-zero"], ["x = 3"], ["x = 3/2 (both roots equal)"]], 3, "4x² − 12x + 9 = (2x − 3)² = 0, so x = 3/2 twice (D = 144 − 144 = 0)."),
    // ── Word problems ─────────────────────────────────────────────
    mcq("q-wp-1", "word-problems", 1, "The product of two consecutive positive integers is 56. If the smaller one is n, which equation fits?", [["2n + 1 = 56", "wp-setup"], ["n² + n − 56 = 0"], ["n² + 1 = 56", "ex-firstonly"], ["n² = 56"]], 1, "n(n + 1) = 56 → n² + n − 56 = 0 (so n = 7)."),
    mcq("q-wp-2", "word-problems", 2, "A rectangle's length is 3 m more than its width, and its area is 40 m². Its width is:", [["5 m or −8 m", "wp-context"], ["8.5 m", "wp-setup"], ["5 m"], ["8 m", "fa-rootsign"]], 2, "w(w + 3) = 40 → w² + 3w − 40 = 0 → (w + 8)(w − 5) = 0. A width can't be negative, so w = 5 m."),
    mcq("q-wp-3", "word-problems", 2, "A ball's height is h = 20t − 5t² metres after t seconds. When does it land again (h = 0, t > 0)?", [["t = 2 s"], ["t = 0 s", "wp-context"], ["t = −4 s", "fa-rootsign"], ["t = 4 s"]], 3, "5t(4 − t) = 0 → t = 0 (the throw) or t = 4 s (landing)."),
    mcq("q-wp-4", "word-problems", 3, "A train covers 360 km at a uniform speed. If the speed were 5 km/h more, it would take 1 hour less. Its speed is:", [["45 km/h", "fa-rootsign"], ["40 km/h"], ["40 km/h or −45 km/h", "wp-context"], ["72 km/h", "wp-setup"]], 1, "360/v − 360/(v + 5) = 1 → v² + 5v − 1800 = 0 → (v + 45)(v − 40) = 0. Speed is positive: 40 km/h."),
  ],
};
