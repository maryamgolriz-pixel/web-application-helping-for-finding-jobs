import { z } from "zod";

// The shape Claude must return. Claude only classifies and writes; the score
// itself is computed in code (see scoring.ts) so the arithmetic is always exact.
export const AnalysisSchema = z.object({
  role_title: z.string().describe("Job title exactly as written in the job ad."),
  company_name: z
    .string()
    .describe("Company name from the job ad, or an empty string if the ad does not name it."),
  seniority_fa: z
    .string()
    .describe(
      "Persian. 1-2 sentences: the role's seniority level and how the candidate's level compares.",
    ),
  summary_fa: z
    .string()
    .describe(
      "Persian. 2-3 encouraging sentences: overall fit, the candidate's biggest strength for this role, and the most important gap to work on.",
    ),
  requirements: z
    .array(
      z.object({
        requirement: z.string().describe("The requirement in English, short, as stated in the ad."),
        category: z
          .enum(["skills", "experience", "education"])
          .describe(
            "skills = required skills and qualifications; experience = duties, level, years; education = degrees, certifications, licensing.",
          ),
        priority: z.enum(["must_have", "nice_to_have"]),
        status: z.enum(["met", "partial", "missing"]),
        evidence: z
          .string()
          .describe(
            "A short quote from the resume that supports the status. Required for met and partial. Empty string for missing.",
          ),
        note_fa: z.string().describe("Persian. One short sentence explaining the judgement."),
      }),
    )
    .describe("Step 1 and Step 2: every requirement in the job ad, classified."),
  keywords: z
    .array(
      z.object({
        keyword: z.string().describe("The keyword or short phrase exactly as written in the job ad."),
        status: z
          .enum(["found", "reworded", "absent"])
          .describe(
            "found = the term (or a trivial variant such as a plural or spelled-out abbreviation) appears in the resume; reworded = the experience is probably in the resume but described with different words; absent = not found at all.",
          ),
        resume_wording: z
          .string()
          .describe("For reworded: the resume's current phrase. Otherwise an empty string."),
        suggested_wording: z
          .string()
          .describe(
            "For reworded: the exact English wording to use in the resume. Otherwise an empty string.",
          ),
        question_fa: z
          .string()
          .describe(
            "For absent: a Persian question asking whether the user has this experience. Otherwise an empty string.",
          ),
      }),
    )
    .describe("Step 3: the important ATS keywords from the job ad, each checked against the resume."),
  format_findings: z
    .array(
      z.object({
        kind: z
          .enum(["issue", "tip"])
          .describe(
            "issue = one numbered check from the format checklist that applies, at most one per check (costs points); tip = any other improvement or strength to highlight (costs nothing).",
          ),
        title_fa: z.string().describe("Persian. Short title of the finding."),
        detail_fa: z.string().describe("Persian. What to change and why, 1-3 sentences."),
        example: z
          .string()
          .describe(
            "An English example of the fixed text (e.g. a contact line or a job title), or an empty string.",
          ),
      }),
    )
    .describe("Step 4: Canadian format check."),
  bullet_rewrites: z
    .array(
      z.object({
        original: z.string().describe("The original bullet or sentence from the resume, verbatim."),
        rewritten: z
          .string()
          .describe("English. Action verb + what was done + result. Placeholders like [X%] for unknown numbers."),
        why_fa: z.string().describe("Persian. One short sentence on why this is stronger."),
      }),
    )
    .describe("Step 5: 5-8 bullets that matter most for this job."),
  cover_letter: z
    .string()
    .describe(
      "Step 6: the full cover letter in English, paragraphs separated by blank lines, with [placeholders] for unknown details.",
    ),
  questions_fa: z
    .array(z.string())
    .describe("Step 7: up to 5 Persian questions whose answers would most improve the score."),
});

export type Analysis = z.infer<typeof AnalysisSchema>;
export type Requirement = Analysis["requirements"][number];
export type Keyword = Analysis["keywords"][number];
