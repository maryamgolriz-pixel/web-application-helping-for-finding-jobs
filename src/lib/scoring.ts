import type { Analysis, Requirement } from "./schema";

// Fixed weights from the coaching rules. Total = 100.
const REQUIREMENT_CATEGORIES = [
  { key: "skills", label_fa: "مهارت‌ها و صلاحیت‌های لازم", max: 35 },
  { key: "experience", label_fa: "تجربه‌ی مرتبط", max: 25 },
  { key: "education", label_fa: "تحصیلات، مدارک و مجوزها", max: 10 },
] as const;

const KEYWORDS_MAX = 15;
const FORMAT_MAX = 15;
const POINTS_PER_FORMAT_ISSUE = 3;

const STATUS_VALUE: Record<Requirement["status"], number> = {
  met: 1,
  partial: 0.5,
  missing: 0,
};

export interface ScoreRow {
  key: string;
  label_fa: string;
  points: number;
  max: number;
  // Raw counts so the UI can explain where the points came from.
  earned?: number;
  possible?: number;
  count?: number;
  total?: number;
}

export interface Score {
  total: number;
  rows: ScoreRow[];
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function computeScore(analysis: Analysis): Score {
  const rows: ScoreRow[] = REQUIREMENT_CATEGORIES.map(({ key, label_fa, max }) => {
    const items = analysis.requirements.filter((r) => r.category === key);
    // Must-haves count double.
    const possible = items.reduce((sum, r) => sum + (r.priority === "must_have" ? 2 : 1), 0);
    const earned = items.reduce(
      (sum, r) => sum + (r.priority === "must_have" ? 2 : 1) * STATUS_VALUE[r.status],
      0,
    );
    // No requirements in this category -> full points.
    const points = possible === 0 ? max : (earned / possible) * max;
    return { key, label_fa, points, max, earned, possible };
  });

  const totalKeywords = analysis.keywords.length;
  const foundKeywords = analysis.keywords.filter((k) => k.status === "found").length;
  rows.push({
    key: "keywords",
    label_fa: "پوشش کلیدواژه‌ها برای ATS",
    points: totalKeywords === 0 ? KEYWORDS_MAX : (foundKeywords / totalKeywords) * KEYWORDS_MAX,
    max: KEYWORDS_MAX,
    count: foundKeywords,
    total: totalKeywords,
  });

  const issues = analysis.format_findings.filter((f) => f.kind === "issue").length;
  rows.push({
    key: "format",
    label_fa: "فرمت کانادایی و خوانایی برای ATS",
    points: Math.max(0, FORMAT_MAX - POINTS_PER_FORMAT_ISSUE * issues),
    max: FORMAT_MAX,
    count: issues,
  });

  const total = Math.round(rows.reduce((sum, r) => sum + r.points, 0));
  return { total, rows: rows.map((r) => ({ ...r, points: round1(r.points) })) };
}
