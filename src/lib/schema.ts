import { z } from "zod";

/**
 * Domain model for Rootwise.
 *
 * A Course is a directed acyclic graph of Concepts (edges point from a
 * prerequisite to the concept that depends on it), plus a bank of
 * multiple-choice Questions whose wrong options are tagged with the
 * Misconception they reveal.
 */

export const LevelSchema = z.enum(["school", "college", "general"]);
export type Level = z.infer<typeof LevelSchema>;

export const ConceptSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(80),
  /** One-line summary shown on the graph tooltip. */
  summary: z.string().min(1).max(240),
  /**
   * Teaching material. Built-in courses ship it; for AI-generated courses it is
   * generated lazily the first time a student opens the concept.
   */
  lesson: z.string().min(1).max(1600).optional(),
  /** 2–5 ideas a good explanation must contain. Grounds the teach-back rubric. */
  keyIdeas: z.array(z.string().min(1).max(240)).min(1).max(6).optional(),
  /** A worked example: the problem and a step-by-step solution. */
  example: z
    .object({
      problem: z.string().min(1).max(600),
      steps: z.array(z.string().min(1).max(400)).min(1).max(8),
    })
    .optional(),
  /** Guiding questions the Socratic tutor can fall back on. */
  socratic: z.array(z.string().min(1).max(300)).min(1).max(5).optional(),
  /** Ids of the concepts that must be understood first. */
  prerequisites: z.array(z.string()).max(8),
});
export type Concept = z.infer<typeof ConceptSchema>;

export const LessonSchema = z.object({
  lesson: z.string().min(1).max(1600),
  keyIdeas: z.array(z.string().min(1).max(240)).min(1).max(6),
  example: z.object({
    problem: z.string().min(1).max(600),
    steps: z.array(z.string().min(1).max(400)).min(1).max(8),
  }),
  socratic: z.array(z.string().min(1).max(300)).min(1).max(5),
});
export type Lesson = z.infer<typeof LessonSchema>;
export type ConceptWithLesson = Concept & Lesson;

export const MisconceptionSchema = z.object({
  id: z.string().min(1).max(64),
  conceptId: z.string().min(1),
  /** Short label, e.g. "Forgets the ± when taking square roots". */
  label: z.string().min(1).max(140),
  /** Why the idea is wrong and what the correct idea is. */
  explanation: z.string().min(1).max(700),
});
export type Misconception = z.infer<typeof MisconceptionSchema>;

export const OptionSchema = z.object({
  id: z.string().min(1).max(8),
  text: z.string().min(1).max(300),
  /** Misconception a student reveals by picking this (wrong) option. */
  misconceptionId: z.string().optional(),
});
export type Option = z.infer<typeof OptionSchema>;

export const DifficultySchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const QuestionSchema = z.object({
  id: z.string().min(1).max(80),
  conceptId: z.string().min(1),
  difficulty: DifficultySchema,
  stem: z.string().min(1).max(900),
  options: z.array(OptionSchema).min(2).max(5),
  correctOptionId: z.string().min(1),
  explanation: z.string().min(1).max(900),
});
export type Question = z.infer<typeof QuestionSchema>;

export const CourseSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(120),
  subject: z.string().min(1).max(80),
  level: LevelSchema,
  /** e.g. "CBSE Class 10" or "B.Tech Year 1". */
  audience: z.string().max(80).default(""),
  description: z.string().max(600),
  language: z.string().default("en"),
  concepts: z.array(ConceptSchema).min(2).max(30),
  misconceptions: z.array(MisconceptionSchema),
  questions: z.array(QuestionSchema),
  /** The concepts the course is ultimately about (usually graph sinks). */
  targetConceptIds: z.array(z.string()).min(1),
  source: z.enum(["builtin", "generated"]),
  createdAt: z.string(),
});
export type Course = z.infer<typeof CourseSchema>;

// ---------------------------------------------------------------------------
// API request payloads (validated on the server)
// ---------------------------------------------------------------------------

export const LanguageCodeSchema = z.enum(["en", "hi", "ta", "te", "bn", "mr", "kn"]);
export type LanguageCode = z.infer<typeof LanguageCodeSchema>;

export const GraphRequestSchema = z.object({
  topic: z.string().trim().min(2).max(160),
  level: LevelSchema,
  audience: z.string().trim().max(80).optional(),
  syllabus: z.string().max(12000).optional(),
  language: LanguageCodeSchema.default("en"),
});
export type GraphRequest = z.infer<typeof GraphRequestSchema>;

export const QuestionsRequestSchema = z.object({
  courseTitle: z.string().max(160),
  level: LevelSchema,
  audience: z.string().max(80).optional(),
  language: LanguageCodeSchema.default("en"),
  concepts: z
    .array(
      z.object({
        id: z.string().max(64),
        name: z.string().max(80),
        summary: z.string().max(240),
        prerequisites: z.array(z.string().max(80)).max(8),
      }),
    )
    .min(1)
    .max(6),
  misconceptions: z
    .array(
      z.object({
        id: z.string().max(64),
        conceptId: z.string().max(64),
        label: z.string().max(140),
      }),
    )
    .max(40),
  perConcept: z.number().int().min(1).max(5).default(3),
  /** Stems to avoid repeating (used when generating fresh practice). */
  avoid: z.array(z.string().max(900)).max(20).default([]),
});
export type QuestionsRequest = z.infer<typeof QuestionsRequestSchema>;

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(4000),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const TutorRequestSchema = z.object({
  courseTitle: z.string().max(160),
  level: LevelSchema,
  language: LanguageCodeSchema.default("en"),
  concept: z.object({
    id: z.string().max(64),
    name: z.string().max(80),
    lesson: z.string().max(1600),
    keyIdeas: z.array(z.string().max(240)).max(6),
    example: z.object({ problem: z.string().max(600), steps: z.array(z.string().max(400)).max(8) }),
    socratic: z.array(z.string().max(300)).max(5),
  }),
  prerequisites: z.array(z.string().max(80)).max(8),
  misconceptions: z.array(z.object({ label: z.string().max(140), explanation: z.string().max(700) })).max(6),
  recentMistakes: z
    .array(z.object({ stem: z.string().max(900), chosen: z.string().max(300), correct: z.string().max(300) }))
    .max(4),
  messages: z.array(ChatMessageSchema).min(1).max(30),
});
export type TutorRequest = z.infer<typeof TutorRequestSchema>;

export const TeachBackRequestSchema = z.object({
  language: LanguageCodeSchema.default("en"),
  level: LevelSchema,
  concept: z.object({
    name: z.string().max(80),
    lesson: z.string().max(1600),
    keyIdeas: z.array(z.string().max(240)).min(1).max(6),
  }),
  misconceptions: z.array(z.object({ id: z.string().max(64), label: z.string().max(140) })).max(12),
  explanation: z.string().trim().min(1).max(4000),
});
export type TeachBackRequest = z.infer<typeof TeachBackRequestSchema>;

export const TeachBackResultSchema = z.object({
  score: z.number().min(0).max(100),
  accuracy: z.number().min(0).max(100),
  completeness: z.number().min(0).max(100),
  clarity: z.number().min(0).max(100),
  coveredIdeas: z.array(z.string()).max(6),
  missingIdeas: z.array(z.string()).max(6),
  misconceptions: z.array(z.string()).max(6),
  strength: z.string().max(400),
  followUp: z.string().max(400),
  verdict: z.enum(["mastered", "almost", "needs-work"]),
});
export type TeachBackResult = z.infer<typeof TeachBackResultSchema>;

export const LessonRequestSchema = z.object({
  courseTitle: z.string().max(160),
  level: LevelSchema,
  audience: z.string().max(80).optional(),
  language: LanguageCodeSchema.default("en"),
  concept: z.object({ id: z.string().max(64), name: z.string().max(80), summary: z.string().max(240) }),
  prerequisites: z.array(z.string().max(80)).max(8),
  misconceptions: z.array(z.string().max(140)).max(6),
});
export type LessonRequest = z.infer<typeof LessonRequestSchema>;
