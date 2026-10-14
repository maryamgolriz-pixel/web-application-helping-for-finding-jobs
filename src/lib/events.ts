import type { Analysis } from "./schema";
import type { Score } from "./scoring";

export interface AnalysisResult {
  analysis: Analysis;
  score: Score;
  // True when this exact resume + job ad was analyzed before and the saved
  // result was returned (same input always gives the same score).
  cached: boolean;
}

// /api/analyze streams newline-delimited JSON, one event per line.
export type AnalyzeEvent =
  | { type: "progress"; phase: "thinking" | "writing"; chars: number }
  | { type: "result"; result: AnalysisResult }
  | { type: "error"; message: string };
