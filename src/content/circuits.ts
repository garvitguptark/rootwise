import type { Course } from "@/lib/schema";
import { mcq } from "./helpers";

/**
 * First-year B.Tech — Basic Electrical & Electronics: DC circuit analysis.
 */
export const circuits: Course = {
  id: "dc-circuits-btech",
  title: "DC Circuit Analysis",
  subject: "Electrical & Electronics Engineering",
  level: "college",
  audience: "B.Tech Year 1 (BEEE)",
  description:
    "From charge and Ohm's law to Thévenin and maximum power transfer — the backbone of every first-year ECE/EEE course.",
  language: "en",
  source: "builtin",
  createdAt: "2026-09-01T00:00:00.000Z",
  targetConceptIds: ["max-power", "superposition", "nodal"],
  concepts: [
    {
      id: "quantities",
      name: "Charge, current & voltage",
      summary: "What current and voltage actually are, and how they relate to charge and energy.",
      lesson:
        "Electric current is the rate at which charge flows: I = Q/t, measured in amperes (1 A = 1 C/s). Voltage (potential difference) is the energy given to or taken from each coulomb of charge, and it is measured across a component. Current flows through a component and is not used up — what enters must leave. The energy transferred is E = QV.",
      keyIdeas: [
        "Current is the rate of flow of charge: I = Q/t",
        "Voltage is energy per unit charge, measured across a component",
        "Current flows through components and is not used up",
        "Energy transferred is E = QV",
      ],
      example: {
        problem: "A 6 V source moves 12 C of charge in 4 s. Find the current and the energy transferred.",
        steps: ["I = Q/t = 12/4 = 3 A.", "E = QV = 12 × 6 = 72 J."],
      },
      socratic: [
        "If 10 C passes a point every 5 s, how many coulombs pass each second?",
        "If a bulb 'used up' current, where would the charge go?",
        "Would you connect a voltmeter through a component or across it? Why?",
      ],
      prerequisites: [],
    },
    {
      id: "units",
      name: "SI prefixes & units",
      summary: "Converting kΩ, mA, µA and friends before calculating.",
      lesson:
        "Engineering values use SI prefixes: k (kilo) = 10³, m (milli) = 10⁻³, µ (micro) = 10⁻⁶, n (nano) = 10⁻⁹. Convert everything to base units (V, A, Ω) before calculating. Going to a smaller unit makes the number bigger (0.45 A = 450 mA); going to a bigger unit makes it smaller (2200 Ω = 2.2 kΩ).",
      keyIdeas: [
        "k = 10³, m = 10⁻³, µ = 10⁻⁶",
        "Convert to base units before calculating",
        "Smaller unit means a bigger number; bigger unit means a smaller number",
      ],
      example: {
        problem: "Find V = IR for 250 µA through 4.7 kΩ.",
        steps: ["4.7 kΩ = 4700 Ω.", "250 µA = 250 × 10⁻⁶ A = 0.00025 A.", "V = 0.00025 × 4700 = 1.175 V."],
      },
      socratic: [
        "How many milliamps are in 1 A? How many microamps?",
        "Is 0.05 A bigger or smaller than 40 mA?",
        "Why is it safer to convert to base units before using V = IR?",
      ],
      prerequisites: [],
    },
    {
      id: "ohm",
      name: "Ohm's law",
      summary: "V = IR and what it means for current when voltage or resistance changes.",
      lesson:
        "Ohm's law: V = IR. For a fixed resistor, current is proportional to voltage — double V, double I. Rearranged: I = V/R and R = V/I. Increasing the resistance at the same voltage reduces the current. Use volts, amps and ohms (convert mA and kΩ first).",
      keyIdeas: [
        "V = I × R",
        "I = V/R and R = V/I",
        "For a fixed resistor, current is proportional to voltage",
        "More resistance at the same voltage means less current",
      ],
      example: {
        problem: "A 9 V battery is connected across a 1.5 kΩ resistor. Find the current.",
        steps: ["R = 1500 Ω.", "I = V/R = 9/1500 = 0.006 A = 6 mA."],
      },
      socratic: [
        "If you double the voltage across a resistor, what happens to the current?",
        "Starting from V = IR, how do you get an expression for R?",
        "Why do we convert 20 mA to 0.02 A before using Ohm's law?",
      ],
      prerequisites: ["quantities", "units"],
    },
    {
      id: "power",
      name: "Electrical power",
      summary: "P = VI, P = I²R and P = V²/R.",
      lesson:
        "Power is the rate of energy transfer: P = VI, in watts. Combining with Ohm's law gives P = I²R and P = V²/R — note the squares: doubling the current through a resistor quadruples its power. For devices rated at the same voltage, R = V²/P, so a lower-power bulb has a higher resistance.",
      keyIdeas: [
        "P = V × I",
        "P = I²R and P = V²/R",
        "Doubling the current through a resistor quadruples the power",
        "At a fixed voltage, a lower power rating means a higher resistance",
      ],
      example: {
        problem: "A 12 Ω heater is connected to 24 V. Find the current and power.",
        steps: ["I = 24/12 = 2 A.", "P = VI = 24 × 2 = 48 W. Check: V²/R = 576/12 = 48 W ✓"],
      },
      socratic: [
        "Through the same resistor, how does the power at 4 A compare with the power at 2 A?",
        "How can you get P = I²R from P = VI and V = IR?",
        "Two bulbs are rated for 230 V. Which has more resistance: 40 W or 100 W?",
      ],
      prerequisites: ["ohm"],
    },
    {
      id: "series-parallel",
      name: "Series & parallel",
      summary: "Combining resistors into one equivalent resistance.",
      lesson:
        "In series, resistances add: R = R₁ + R₂ + …, and the same current flows through each. In parallel, reciprocals add: 1/R = 1/R₁ + 1/R₂ + … — remember to flip the result at the end. For two resistors, R = R₁R₂/(R₁ + R₂). A parallel combination is always smaller than its smallest branch.",
      keyIdeas: [
        "Series: R = R₁ + R₂ + …",
        "Parallel: 1/R = 1/R₁ + 1/R₂ + … (flip the result)",
        "Two in parallel: R₁R₂/(R₁ + R₂)",
        "A parallel equivalent is smaller than the smallest branch",
      ],
      example: {
        problem: "Find the total resistance of 3 Ω in series with (6 Ω ∥ 3 Ω).",
        steps: ["6 ∥ 3 = (6 × 3)/(6 + 3) = 2 Ω.", "Total = 3 + 2 = 5 Ω."],
      },
      socratic: [
        "Adding another path for current — does that make it easier or harder for current to flow?",
        "Two 10 Ω resistors in parallel: is the result more or less than 10 Ω?",
        "After adding 1/R₁ + 1/R₂, what's the last step people often forget?",
      ],
      prerequisites: ["ohm"],
    },
    {
      id: "kcl",
      name: "Kirchhoff's current law",
      summary: "Current in = current out at every node.",
      lesson:
        "Kirchhoff's current law (KCL): the total current entering a node equals the total current leaving it, because charge is conserved — it can't pile up or vanish. Pick a direction for each unknown current; if the answer comes out negative, the current actually flows the other way.",
      keyIdeas: [
        "Current in equals current out at every node",
        "KCL follows from conservation of charge",
        "Choose directions for unknowns; a negative result means the opposite direction",
      ],
      example: {
        problem: "At a node, 3 A and 4 A enter and 5 A leaves through one wire. Find the current in the fourth wire.",
        steps: ["In: 3 + 4 = 7 A. Out so far: 5 A.", "Another 2 A must leave through the fourth wire."],
      },
      socratic: [
        "If water flows into a pipe junction at 5 L/s, how much must flow out?",
        "Why can't charge pile up at a node?",
        "Your unknown current came out as −2 A. What does the minus sign tell you?",
      ],
      prerequisites: ["quantities"],
    },
    {
      id: "kvl",
      name: "Kirchhoff's voltage law",
      summary: "Voltages around any closed loop sum to zero.",
      lesson:
        "Kirchhoff's voltage law (KVL): around any closed loop, the algebraic sum of voltages is zero — the energy gained from sources equals the energy dropped across components. Track signs: a source that opposes the others subtracts. In a series loop the source voltage is shared among the resistors; each one does not get the full voltage.",
      keyIdeas: [
        "The sum of voltages around a closed loop is zero",
        "Voltage rises from sources equal the drops across components",
        "Opposing sources subtract",
        "Series resistors share the source voltage",
      ],
      example: {
        problem: "A 12 V source drives current through 1 kΩ and 2 kΩ in series. Find each voltage drop.",
        steps: ["I = 12 / 3000 = 4 mA.", "V₁ = 4 mA × 1 kΩ = 4 V; V₂ = 4 mA × 2 kΩ = 8 V.", "Check with KVL: 4 + 8 = 12 V ✓"],
      },
      socratic: [
        "If you walk around a hill and return to your start, what is your total change in height? How is voltage around a loop similar?",
        "Two resistors in series across 9 V — can both have 9 V across them?",
        "Two batteries face opposite directions in a loop. Do their voltages add or subtract?",
      ],
      prerequisites: ["ohm"],
    },
    {
      id: "dividers",
      name: "Voltage & current dividers",
      summary: "Shortcuts for how voltage splits in series and current splits in parallel.",
      lesson:
        "In a voltage divider, the voltage across R₂ is Vin × R₂/(R₁ + R₂): the bigger resistor takes the bigger share of the voltage. In a current divider with two parallel branches, the current through R₁ is I × R₂/(R₁ + R₂): the smaller resistor takes the larger share of the current. Notice the 'other' resistor appears on top for current.",
      keyIdeas: [
        "Voltage divider: V₂ = Vin × R₂/(R₁ + R₂)",
        "The bigger series resistor gets more of the voltage",
        "Current divider: I₁ = I × R₂/(R₁ + R₂)",
        "The smaller parallel resistor gets more of the current",
      ],
      example: {
        problem: "9 V is applied across 1 kΩ (top) and 2 kΩ (bottom) in series. Find the voltage across the 2 kΩ.",
        steps: ["Vout = 9 × 2/(1 + 2) = 6 V."],
      },
      socratic: [
        "In a voltage divider, which resistor gets more voltage — the big one or the small one? Why?",
        "In parallel branches, which path does more current take?",
        "Why is it R₂ on top in the current-divider formula for I₁?",
      ],
      prerequisites: ["series-parallel", "kvl"],
    },
    {
      id: "nodal",
      name: "Nodal analysis",
      summary: "Solving circuits by writing KCL at each unknown node voltage.",
      lesson:
        "Nodal analysis: choose a reference (ground) node, label the unknown node voltages, and write KCL at each unknown node, expressing each branch current with Ohm's law as (V_node − V_other)/R leaving the node. Solve the resulting equations. Being consistent with directions matters more than which direction you choose.",
      keyIdeas: [
        "Choose a reference node at 0 V",
        "Write KCL at each unknown node",
        "The current leaving through R to another node is (V_node − V_other)/R",
        "Solve the simultaneous equations",
      ],
      example: {
        problem: "Node V connects to a 12 V source through 2 Ω and to ground through 4 Ω. Find V.",
        steps: ["KCL (currents leaving V): (V − 12)/2 + V/4 = 0.", "Multiply by 4: 2V − 24 + V = 0.", "V = 8 V."],
      },
      socratic: [
        "Why do we need a reference node before writing any equation?",
        "If V₁ is higher than V₂, which way does current flow through the resistor between them?",
        "At a node, what must all the 'leaving' currents add up to?",
      ],
      prerequisites: ["kcl", "ohm"],
    },
    {
      id: "superposition",
      name: "Superposition",
      summary: "Solving multi-source circuits one source at a time.",
      lesson:
        "In a linear circuit with several independent sources, any voltage or current equals the sum of the contributions from each source acting alone. To let one source act alone, turn the others off: a voltage source becomes a short circuit (0 V) and a current source becomes an open circuit (0 A). Add voltages and currents — never powers, because power isn't linear.",
      keyIdeas: [
        "The total response is the sum of responses to each source acting alone",
        "Turn off a voltage source by replacing it with a short circuit",
        "Turn off a current source by replacing it with an open circuit",
        "Add currents and voltages, not powers",
      ],
      example: {
        problem: "A resistor carries 2 A due to source A alone and 1 A in the opposite direction due to source B alone. Find the total current.",
        steps: ["Contributions add algebraically: 2 + (−1) = 1 A, in the direction of A's contribution."],
      },
      socratic: [
        "A voltage source set to 0 V behaves like what — a wire or a gap?",
        "A current source set to 0 A behaves like what?",
        "If each source alone gives 1 A and 2 A, why isn't the total power just the sum of the two powers?",
      ],
      prerequisites: ["dividers", "series-parallel"],
    },
    {
      id: "thevenin",
      name: "Thévenin's theorem",
      summary: "Replacing a circuit with one source and one resistor.",
      lesson:
        "Any linear circuit, seen from two terminals, can be replaced by a voltage source V_th in series with a resistance R_th. V_th is the open-circuit voltage at the terminals (often found with a voltage divider). R_th is the resistance seen from the terminals with every independent source turned off — voltage sources shorted, current sources opened.",
      keyIdeas: [
        "Any linear two-terminal circuit equals V_th in series with R_th",
        "V_th is the open-circuit voltage across the terminals",
        "For R_th, turn off independent sources and find the resistance between the terminals",
        "Turning off: voltage sources become shorts, current sources become opens",
      ],
      example: {
        problem: "A 12 V source in series with 6 Ω feeds terminals across a 3 Ω resistor to ground. Find V_th and R_th.",
        steps: ["V_th = 12 × 3/(6 + 3) = 4 V.", "Short the source: R_th = 6 ∥ 3 = 2 Ω.", "Equivalent: 4 V in series with 2 Ω."],
      },
      socratic: [
        "With nothing connected to the terminals, what voltage do you measure there?",
        "Why must the sources be switched off to find R_th?",
        "After shorting the source, are the two resistors in series or in parallel as seen from the terminals?",
      ],
      prerequisites: ["dividers", "series-parallel"],
    },
    {
      id: "max-power",
      name: "Maximum power transfer",
      summary: "Choosing the load that draws the most power: R_L = R_th.",
      lesson:
        "A source with Thévenin equivalent (V_th, R_th) delivers maximum power to a load when R_L = R_th. The load then sees V_th/2, so P_max = V_th²/(4R_th). At that point efficiency is only 50% — half the power is lost in R_th — which is why power grids don't run this way, while signal circuits (antennas, audio) do.",
      keyIdeas: [
        "Maximum power is delivered when R_L = R_th",
        "P_max = V_th²/(4R_th)",
        "At maximum power transfer the load sees half of V_th",
        "Efficiency at maximum power transfer is 50%",
      ],
      example: {
        problem: "V_th = 12 V and R_th = 4 Ω. Find the best load and the maximum power.",
        steps: ["R_L = R_th = 4 Ω.", "I = 12/(4 + 4) = 1.5 A.", "P = I²R_L = 1.5² × 4 = 9 W. Check: 144/16 = 9 W ✓"],
      },
      socratic: [
        "What happens to the load power if R_L = 0? What if R_L is enormous?",
        "When R_L = R_th, what voltage does the load see?",
        "Why don't power stations use maximum power transfer?",
      ],
      prerequisites: ["thevenin", "power"],
    },
  ],
  misconceptions: [
    { id: "q-currentused", conceptId: "quantities", label: "Thinks current gets used up in components", explanation: "Charge is conserved: the current into a bulb equals the current out. What a bulb converts is energy (voltage drops), not current." },
    { id: "q-voltagethrough", conceptId: "quantities", label: "Mixes up 'through' and 'across'", explanation: "Current flows through a component; voltage is a difference measured across it (between its two ends)." },
    { id: "q-chargecurrent", conceptId: "quantities", label: "Confuses charge with current", explanation: "Current is charge per second: I = Q/t, so Q = I·t. 30 C in 60 s is 0.5 A, not 30 A." },
    { id: "u-prefix", conceptId: "units", label: "Mixes up SI prefixes (milli, micro, kilo)", explanation: "k = 10³, m = 10⁻³, µ = 10⁻⁶. 250 µA = 0.00025 A, while 250 mA = 0.25 A." },
    { id: "u-direction", conceptId: "units", label: "Converts in the wrong direction", explanation: "Moving to a bigger unit gives a smaller number: 2200 Ω = 2.2 kΩ; 450 mA = 0.45 A." },
    { id: "o-inverse", conceptId: "ohm", label: "Rearranges V = IR incorrectly", explanation: "From V = IR: I = V/R and R = V/I. A quick check: more resistance must mean less current." },
    { id: "p-formula", conceptId: "power", label: "Uses a wrong power formula", explanation: "Power is P = VI (= I²R = V²/R). P = V/I is resistance, not power." },
    { id: "p-squared", conceptId: "power", label: "Forgets the square in P = I²R or V²/R", explanation: "3 A through 4 Ω gives P = 3² × 4 = 36 W, not 12 W. Current and voltage enter squared." },
    { id: "sp-parallelsum", conceptId: "series-parallel", label: "Mixes up the series and parallel rules", explanation: "Series resistances add directly. Parallel resistances add as reciprocals: 1/R = 1/R₁ + 1/R₂." },
    { id: "sp-reciprocal", conceptId: "series-parallel", label: "Forgets to flip 1/R at the end", explanation: "1/3 + 1/6 = 1/2 gives 1/R, so R = 2 Ω — not 0.5 Ω." },
    { id: "sp-parallelbigger", conceptId: "series-parallel", label: "Thinks a parallel combination can exceed the smallest branch", explanation: "Adding a parallel path always makes it easier for current to flow, so the equivalent is below the smallest branch." },
    { id: "kcl-sign", conceptId: "kcl", label: "Doesn't separate entering and leaving currents", explanation: "Sum of currents entering = sum leaving. Write every unknown with a direction and keep its sign." },
    { id: "kvl-sign", conceptId: "kvl", label: "Ignores directions of voltages around a loop", explanation: "Sources that oppose each other subtract. Go around the loop once, adding rises and subtracting drops." },
    { id: "kvl-samev", conceptId: "kvl", label: "Thinks each series resistor gets the full source voltage", explanation: "Series resistors share the source voltage in proportion to their resistances; the drops add up to the source voltage." },
    { id: "dv-wrongr", conceptId: "dividers", label: "Puts the wrong resistor on top of the divider fraction", explanation: "The voltage across R₂ is Vin × R₂/(R₁ + R₂) — the resistor you're measuring across goes on top." },
    { id: "dv-current", conceptId: "dividers", label: "Thinks the larger resistor takes more current", explanation: "Current prefers the easier path: in parallel, the smaller resistor carries more current." },
    { id: "nd-reference", conceptId: "nodal", label: "Doesn't fix a reference node", explanation: "Voltages are differences; choose one node as 0 V first, then every node voltage is measured from it." },
    { id: "nd-sign", conceptId: "nodal", label: "Writes branch currents with inconsistent signs", explanation: "Current leaving node 1 through R towards node 2 is (V₁ − V₂)/R. Use the same convention at every node." },
    { id: "sup-deactivate", conceptId: "superposition", label: "Turns off sources the wrong way", explanation: "A voltage source at 0 V is a short (wire). A current source at 0 A is an open (gap). Swapping them changes the circuit." },
    { id: "sup-power", conceptId: "superposition", label: "Adds powers from each source", explanation: "Power depends on current squared, so it isn't linear: add the currents first (1 A + 2 A = 3 A), then compute power (3² × 10 = 90 W)." },
    { id: "th-rth", conceptId: "thevenin", label: "Finds R_th without turning off the sources", explanation: "R_th is found with independent sources deactivated (voltage → short, current → open), looking into the terminals." },
    { id: "th-vth", conceptId: "thevenin", label: "Takes V_th as the source voltage", explanation: "V_th is the open-circuit voltage at the terminals — usually a fraction of the source voltage, found with a divider or nodal analysis." },
    { id: "mp-rl", conceptId: "max-power", label: "Thinks the extreme load gives maximum power", explanation: "A short (R_L = 0) has no voltage across it and an open (R_L → ∞) has no current, so both give zero power. The best load is R_L = R_th." },
    { id: "mp-formula", conceptId: "max-power", label: "Uses V_th²/R_th for maximum power", explanation: "At R_L = R_th the load sees V_th/2, so P_max = (V_th/2)²/R_th = V_th²/(4R_th)." },
  ],
  questions: [
    // ── Charge, current & voltage ─────────────────────────────────
    mcq("c-q-1", "quantities", 1, "Electric current is defined as:", [["the energy given to each coulomb of charge", "q-voltagethrough"], ["the rate of flow of charge, I = Q/t"], ["the total charge stored in a wire", "q-chargecurrent"], ["the opposition to the flow of charge"]], 1, "Current is charge per unit time: I = Q/t (1 A = 1 C/s). Energy per coulomb is voltage."),
    mcq("c-q-2", "quantities", 2, "A charge of 30 C passes a point in 1 minute. The current is:", [["30 A", "q-chargecurrent"], ["1800 A", "q-chargecurrent"], ["0.5 A"], ["2 A"]], 2, "I = Q/t = 30 C / 60 s = 0.5 A."),
    mcq("c-q-3", "quantities", 2, "A current of 2 A flows into a bulb. How much current flows out of it?", [["Less than 2 A, because the bulb uses some up", "q-currentused"], ["0 A", "q-currentused"], ["More than 2 A"], ["Exactly 2 A"]], 3, "Charge is conserved, so the same 2 A flows out. The bulb converts electrical energy, not current."),
    mcq("c-q-4", "quantities", 3, "A 12 V battery delivers 3 A for 10 s. How much charge flows, and how much energy is delivered?", [["0.3 C and 3.6 J", "q-chargecurrent"], ["30 C and 360 J"], ["30 C and 36 J", "q-chargecurrent"], ["4 C and 48 J"]], 1, "Q = It = 3 × 10 = 30 C. E = QV = 30 × 12 = 360 J."),
    // ── SI prefixes ───────────────────────────────────────────────
    mcq("c-u-1", "units", 1, "2.2 kΩ is equal to:", [["2200 Ω"], ["220 Ω", "u-prefix"], ["0.0022 Ω", "u-direction"], ["22 000 Ω", "u-prefix"]], 0, "k = 10³, so 2.2 kΩ = 2.2 × 1000 = 2200 Ω."),
    mcq("c-u-2", "units", 2, "450 mA expressed in amperes is:", [["450 000 A", "u-direction"], ["4.5 A", "u-prefix"], ["0.45 A"], ["0.000 45 A", "u-prefix"]], 2, "m = 10⁻³, so 450 mA = 450 × 10⁻³ A = 0.45 A."),
    mcq("c-u-3", "units", 2, "Which current is the largest?", [["40 mA"], ["45 000 µA", "u-prefix"], ["4.8 × 10⁻³ A"], ["0.05 A"]], 3, "In mA: 40, 45, 4.8 and 50. So 0.05 A (50 mA) is the largest."),
    mcq("c-u-4", "units", 3, "A 5 V supply drives 250 µA through a resistor. The resistance is:", [["20 Ω", "u-prefix"], ["1.25 mΩ", "o-inverse"], ["20 kΩ"], ["0.02 Ω", "u-prefix"]], 2, "R = V/I = 5 / (250 × 10⁻⁶) = 20 000 Ω = 20 kΩ."),
    // ── Ohm's law ─────────────────────────────────────────────────
    mcq("c-o-1", "ohm", 1, "A 6 V battery is connected across a 3 Ω resistor. The current is:", [["0.5 A", "o-inverse"], ["18 A", "o-inverse"], ["2 A"], ["3 A"]], 2, "I = V/R = 6/3 = 2 A."),
    mcq("c-o-2", "ohm", 2, "A resistor carries 20 mA when 5 V is across it. Its resistance is:", [["0.25 Ω", "u-prefix"], ["100 Ω", "o-inverse"], ["250 Ω"], ["4 Ω", "o-inverse"]], 2, "R = V/I = 5 / 0.02 = 250 Ω."),
    mcq("c-o-3", "ohm", 2, "If the voltage across a fixed resistor doubles, the current:", [["doubles"], ["halves", "o-inverse"], ["stays the same"], ["quadruples", "p-squared"]], 0, "I = V/R with R fixed, so I is proportional to V: double V, double I."),
    mcq("c-o-4", "ohm", 3, "A 12 V source drives 4 mA through a resistor. If the resistor is replaced by one three times larger, the new current is:", [["12 mA", "o-inverse"], ["4 mA"], ["0.44 mA"], ["1.33 mA"]], 3, "R = 12/0.004 = 3 kΩ. New R = 9 kΩ, so I = 12/9000 ≈ 1.33 mA (one third of 4 mA)."),
    // ── Power ─────────────────────────────────────────────────────
    mcq("c-p-1", "power", 1, "A device draws 2 A from a 12 V supply. Its power is:", [["24 W"], ["6 W", "p-formula"], ["48 W", "p-squared"], ["14 W"]], 0, "P = VI = 12 × 2 = 24 W."),
    mcq("c-p-2", "power", 2, "A current of 3 A flows through a 4 Ω resistor. The power dissipated is:", [["12 W", "p-squared"], ["36 W"], ["48 W"], ["0.75 W", "p-formula"]], 1, "P = I²R = 3² × 4 = 36 W."),
    mcq("c-p-3", "power", 2, "A 100 Ω resistor has 10 V across it. The power is:", [["1000 W", "p-formula"], ["0.1 W", "p-squared"], ["1 W"], ["10 W"]], 2, "P = V²/R = 100/100 = 1 W."),
    mcq("c-p-4", "power", 3, "A 60 W bulb and a 100 W bulb are both rated for 230 V. Which has the higher resistance?", [["The 100 W bulb — more power means more resistance", "p-formula"], ["They're equal — same voltage"], ["Can't tell without the current"], ["The 60 W bulb"]], 3, "R = V²/P. With the same V, a smaller P gives a larger R: 230²/60 ≈ 882 Ω vs 230²/100 = 529 Ω."),
    // ── Series & parallel ─────────────────────────────────────────
    mcq("c-sp-1", "series-parallel", 1, "Resistors of 4 Ω and 6 Ω are connected in series. The total resistance is:", [["10 Ω"], ["2.4 Ω", "sp-parallelsum"], ["24 Ω"], ["5 Ω"]], 0, "In series, resistances add: 4 + 6 = 10 Ω."),
    mcq("c-sp-2", "series-parallel", 2, "Two 10 Ω resistors are connected in parallel. The equivalent resistance is:", [["20 Ω", "sp-parallelsum"], ["0.2 Ω", "sp-reciprocal"], ["5 Ω"], ["100 Ω"]], 2, "1/R = 1/10 + 1/10 = 1/5, so R = 5 Ω."),
    mcq("c-sp-3", "series-parallel", 2, "A 3 Ω and a 6 Ω resistor are in parallel. The equivalent resistance is:", [["9 Ω", "sp-parallelsum"], ["0.5 Ω", "sp-reciprocal"], ["4.5 Ω", "sp-parallelbigger"], ["2 Ω"]], 3, "R = (3 × 6)/(3 + 6) = 18/9 = 2 Ω — smaller than the smallest branch."),
    mcq("c-sp-4", "series-parallel", 3, "A 2 Ω resistor is in series with a parallel pair of 6 Ω and 12 Ω. The total resistance is:", [["20 Ω", "sp-parallelsum"], ["6 Ω"], ["2.25 Ω", "sp-reciprocal"], ["11 Ω", "sp-parallelbigger"]], 1, "6 ∥ 12 = 72/18 = 4 Ω; total = 2 + 4 = 6 Ω."),
    // ── KCL ───────────────────────────────────────────────────────
    mcq("c-kcl-1", "kcl", 1, "At a node, 5 A and 3 A flow in. A single wire carries current out. How much?", [["8 A"], ["2 A", "kcl-sign"], ["15 A"], ["0 A", "q-currentused"]], 0, "Current in = current out: 5 + 3 = 8 A."),
    mcq("c-kcl-2", "kcl", 2, "At a node, 7 A enters through one wire and 2 A leaves through another. A third wire carries current I, taken as leaving. Find I.", [["9 A", "kcl-sign"], ["−5 A", "kcl-sign"], ["5 A"], ["3.5 A"]], 2, "7 = 2 + I, so I = 5 A (leaving, as assumed)."),
    mcq("c-kcl-3", "kcl", 2, "Kirchhoff's current law is a consequence of:", [["conservation of energy"], ["Ohm's law"], ["current being used up at each node", "q-currentused"], ["conservation of charge"]], 3, "Charge can't be created or destroyed at a node, so what flows in must flow out. (KVL comes from conservation of energy.)"),
    mcq("c-kcl-4", "kcl", 3, "At a node: I₁ = 4 A enters, I₂ = 6 A leaves, I₃ = 1 A enters. What is the fourth current I₄?", [["11 A leaving", "kcl-sign"], ["1 A leaving", "kcl-sign"], ["1 A entering"], ["3 A entering"]], 2, "In: 4 + 1 = 5 A; out: 6 A. So 1 A more must enter through I₄."),
    // ── KVL ───────────────────────────────────────────────────────
    mcq("c-kvl-1", "kvl", 1, "A 9 V battery drives current through three resistors in series. Two of the voltage drops are 2 V and 3 V. The third drop is:", [["4 V"], ["9 V", "kvl-samev"], ["14 V", "kvl-sign"], ["5 V"]], 0, "The drops must add up to 9 V: 9 − 2 − 3 = 4 V."),
    mcq("c-kvl-2", "kvl", 2, "Kirchhoff's voltage law states that around any closed loop:", [["the sum of all currents is zero"], ["every element has the same voltage", "kvl-samev"], ["the algebraic sum of voltages is zero"], ["the first resistor uses up the voltage"]], 2, "Going once around a loop, the voltage rises and drops cancel: ΣV = 0."),
    mcq("c-kvl-3", "kvl", 2, "A 12 V source is in series with a 2 kΩ and a 4 kΩ resistor. The voltage across the 4 kΩ resistor is:", [["12 V", "kvl-samev"], ["4 V", "dv-wrongr"], ["6 V"], ["8 V"]], 3, "I = 12/6000 = 2 mA; V = 2 mA × 4 kΩ = 8 V (and 4 V across the 2 kΩ: 4 + 8 = 12 ✓)."),
    mcq("c-kvl-4", "kvl", 3, "A loop contains a 10 V source, a 4 V source connected to oppose it, and a 3 Ω resistor. The current is:", [["4.67 A", "kvl-sign"], ["2 A"], ["3.33 A", "kvl-sign"], ["1.33 A"]], 1, "Opposing sources subtract: net 10 − 4 = 6 V, so I = 6/3 = 2 A."),
    // ── Dividers ──────────────────────────────────────────────────
    mcq("c-dv-1", "dividers", 1, "In a voltage divider, Vin is across R₁ and R₂ in series. The voltage across R₂ is:", [["Vin × R₁/(R₁ + R₂)", "dv-wrongr"], ["Vin × (R₁ + R₂)/R₂"], ["Vin × R₂/(R₁ + R₂)"], ["Vin × R₂/R₁", "dv-wrongr"]], 2, "The resistor you measure across goes on top: V₂ = Vin × R₂/(R₁ + R₂)."),
    mcq("c-dv-2", "dividers", 2, "10 V is applied across 1 kΩ (top) and 4 kΩ (bottom) in series. The voltage across the 4 kΩ is:", [["2 V", "dv-wrongr"], ["8 V"], ["2.5 V"], ["10 V", "kvl-samev"]], 1, "V = 10 × 4/(1 + 4) = 8 V."),
    mcq("c-dv-3", "dividers", 2, "A 6 mA current splits between 1 kΩ and 2 kΩ in parallel. The current through the 1 kΩ is:", [["4 mA"], ["2 mA", "dv-current"], ["3 mA"], ["6 mA"]], 0, "I₁ = 6 × 2/(1 + 2) = 4 mA — the smaller resistor carries more current."),
    mcq("c-dv-4", "dividers", 3, "A 12 V source feeds R₁ = 2 kΩ in series with a parallel pair of 6 kΩ and 3 kΩ. The voltage across the parallel pair is:", [["9.8 V", "sp-parallelsum"], ["12 V", "kvl-samev"], ["6 V"], ["8 V"]], 2, "6 ∥ 3 = 2 kΩ, so V = 12 × 2/(2 + 2) = 6 V."),
    // ── Nodal analysis ────────────────────────────────────────────
    mcq("c-nd-1", "nodal", 1, "The first step in nodal analysis is to:", [["assume every node is at the source voltage", "nd-reference"], ["choose a reference (ground) node and label the other node voltages"], ["combine every resistor into one equivalent"], ["remove all the sources"]], 1, "Voltages are measured relative to a reference, so pick ground first and label the unknown node voltages."),
    mcq("c-nd-2", "nodal", 2, "In nodal analysis, the current leaving node 1 through resistor R towards node 2 is:", [["(V₂ − V₁)/R", "nd-sign"], ["(V₁ + V₂)/R", "nd-sign"], ["(V₁ − V₂)/R"], ["(V₁ − V₂) × R", "o-inverse"]], 2, "Current flows from higher to lower potential: (V₁ − V₂)/R leaves node 1."),
    mcq("c-nd-3", "nodal", 2, "Node V connects to a 10 V source through 2 Ω and to ground through another 2 Ω. Find V.", [["10 V", "kvl-samev"], ["5 V"], ["−5 V", "nd-sign"], ["2.5 V"]], 1, "KCL: (V − 10)/2 + V/2 = 0 → 2V = 10 → V = 5 V."),
    mcq("c-nd-4", "nodal", 3, "Node A connects to a 12 V source through 4 Ω, and to ground through both 12 Ω and 6 Ω. Find V_A.", [["12 V", "kvl-samev"], ["9 V"], ["3 V"], ["6 V"]], 3, "(V − 12)/4 + V/12 + V/6 = 0. Multiply by 12: 3V − 36 + V + 2V = 0 → V = 6 V."),
    // ── Superposition ─────────────────────────────────────────────
    mcq("c-sup-1", "superposition", 1, "When applying superposition, an independent voltage source that is turned off is replaced by:", [["an open circuit", "sup-deactivate"], ["a short circuit"], ["a 1 Ω resistor"], ["a current source of the same value"]], 1, "A 0 V source keeps both terminals at the same potential — exactly what a wire (short) does."),
    mcq("c-sup-2", "superposition", 2, "An independent current source that is turned off during superposition is replaced by:", [["a short circuit", "sup-deactivate"], ["a wire", "sup-deactivate"], ["an open circuit"], ["nothing — it stays in the circuit"]], 2, "A 0 A source lets no current through — exactly what a gap (open circuit) does."),
    mcq("c-sup-3", "superposition", 2, "A 10 Ω resistor carries 1 A due to source A alone and 2 A (same direction) due to source B alone. With both sources on, its power is:", [["50 W", "sup-power"], ["30 W", "p-squared"], ["10 W"], ["90 W"]], 3, "Add currents first: 1 + 2 = 3 A. Then P = 3² × 10 = 90 W. Adding powers (10 + 40) is wrong."),
    mcq("c-sup-4", "superposition", 3, "A 10 V source with 5 Ω in series feeds node X; X connects to ground through 5 Ω; a 2 A current source also injects into X. Find V_X.", [["5 V", "sup-deactivate"], ["15 V", "sup-deactivate"], ["10 V"], ["20 V"]], 2, "Voltage source alone (current source open): 10 × 5/10 = 5 V. Current source alone (voltage source shorted): 2 A × (5 ∥ 5) = 5 V. Total 10 V."),
    // ── Thévenin ──────────────────────────────────────────────────
    mcq("c-th-1", "thevenin", 1, "Thévenin's theorem replaces a linear circuit (seen from two terminals) with:", [["a current source in series with a resistor"], ["a single equivalent resistor"], ["a voltage source in series with a resistor"], ["a voltage source in parallel with a resistor"]], 2, "Thévenin equivalent = V_th in series with R_th. (Norton uses a current source in parallel.)"),
    mcq("c-th-2", "thevenin", 2, "To find R_th you should:", [["turn off independent sources (short voltage sources, open current sources) and find the resistance between the terminals"], ["find the resistance with all sources left in place", "th-rth"], ["open the voltage sources and short the current sources", "sup-deactivate"], ["divide the source voltage by the load current"]], 0, "R_th is the resistance 'looking into' the terminals with independent sources deactivated."),
    mcq("c-th-3", "thevenin", 2, "A 12 V source with 4 Ω in series feeds terminals across a 12 Ω resistor to ground. V_th is:", [["12 V", "th-vth"], ["9 V"], ["3 V", "dv-wrongr"], ["4 V"]], 1, "Open-circuit voltage = divider: 12 × 12/(4 + 12) = 9 V."),
    mcq("c-th-4", "thevenin", 3, "For the same circuit (12 V, 4 Ω in series, 12 Ω across the terminals), R_th is:", [["16 Ω", "sp-parallelsum"], ["12 Ω", "sup-deactivate"], ["4 Ω"], ["3 Ω"]], 3, "Short the 12 V source: 4 Ω and 12 Ω are then in parallel from the terminals: 48/16 = 3 Ω."),
    // ── Maximum power transfer ────────────────────────────────────
    mcq("c-mp-1", "max-power", 1, "Maximum power is delivered to a load R_L when:", [["R_L = 0 (a short circuit)", "mp-rl"], ["R_L = R_th"], ["R_L is as large as possible", "mp-rl"], ["R_L = 2R_th"]], 1, "Power peaks when the load matches the source resistance: R_L = R_th."),
    mcq("c-mp-2", "max-power", 2, "A source has V_th = 10 V and R_th = 5 Ω. The maximum power it can deliver to a load is:", [["20 W", "mp-formula"], ["10 W", "mp-formula"], ["5 W"], ["50 W", "p-formula"]], 2, "P_max = V_th²/(4R_th) = 100/20 = 5 W."),
    mcq("c-mp-3", "max-power", 2, "Under maximum power transfer, the efficiency (share of the source's power reaching the load) is:", [["100%", "mp-rl"], ["50%"], ["25%", "mp-formula"], ["75%"]], 1, "R_L = R_th, and the same current flows through both, so they dissipate equal power: 50%."),
    mcq("c-mp-4", "max-power", 3, "A circuit has V_th = 9 V and R_th = 3 Ω. Which load gives maximum power, and how much power is that?", [["0 Ω, 27 W", "mp-rl"], ["3 Ω, 27 W", "mp-formula"], ["6 Ω, 9 W"], ["3 Ω, 6.75 W"]], 3, "R_L = 3 Ω; P = 9²/(4 × 3) = 81/12 = 6.75 W."),
  ],
};
