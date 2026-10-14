"use client";

import { useEffect, useState } from "react";
import MatchoraLogo from "./MatchoraLogo";
import { CheckIcon, faNum } from "./ui";

const STEPS = [
  { label: "خواندن رزومه و آگهی", from: 0 },
  { label: "استخراج الزامات آگهی", from: 8 },
  { label: "مقایسه‌ی رزومه با الزامات", from: 25 },
  { label: "بررسی کلیدواژه‌ها و فرمت کانادایی", from: 50 },
  { label: "بازنویسی جمله‌ها و نوشتن کاور لتر", from: Infinity },
];

// Rough size of a full answer, only used to move the progress bar while writing.
const EXPECTED_CHARS = 14_000;

export default function LoadingPanel({
  phase,
  chars,
  startedAt,
  onCancel,
}: {
  phase: "thinking" | "writing";
  chars: number;
  startedAt: number;
  onCancel: () => void;
}) {
  const [now, setNow] = useState(startedAt);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const seconds = Math.max(0, Math.floor((now - startedAt) / 1000));

  // While Claude is thinking, steps advance with time; once it starts writing
  // the answer we are on the last step.
  const active =
    phase === "writing" ? STEPS.length - 1 : STEPS.findLastIndex((s) => seconds >= s.from);
  const percent =
    phase === "writing"
      ? 60 + Math.min(38, (chars / EXPECTED_CHARS) * 38)
      : Math.min(58, 4 + seconds * 0.6);

  return (
    <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200 sm:p-8" aria-live="polite">
      <MatchoraLogo variant="icon" loop className="mx-auto mb-6 h-16 w-auto" />
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-stone-900">در حال بررسی رزومه‌ی شما…</h2>
        <span dir="ltr" className="text-sm tabular-nums text-stone-500">
          {faNum(Math.floor(seconds / 60))}:{faNum(seconds % 60).padStart(2, "۰")}
        </span>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-stone-100">
        <div className="h-full rounded-full bg-teal-600 transition-[width] duration-1000 ease-out" style={{ width: `${percent}%` }} />
      </div>

      <ol className="mt-6 space-y-3.5">
        {STEPS.map((step, i) => (
          <li key={step.label} className="flex items-center gap-3 text-sm">
            {i < active ? (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-teal-800">
                <CheckIcon className="h-3.5 w-3.5" />
              </span>
            ) : i === active ? (
              <span className="flex h-6 w-6 items-center justify-center">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
              </span>
            ) : (
              <span className="flex h-6 w-6 items-center justify-center">
                <span className="h-2 w-2 rounded-full bg-stone-300" />
              </span>
            )}
            <span className={i === active ? "font-medium text-stone-900" : i < active ? "text-stone-600" : "text-stone-400"}>
              {step.label}
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-6 text-sm leading-7 text-stone-500">
        معمولاً ۱ تا ۳ دقیقه طول می‌کشد. لطفاً این صفحه را نبندید.
      </p>
      <button type="button" onClick={onCancel} className="mt-3 text-sm font-medium text-stone-500 hover:text-rose-700">
        لغو
      </button>
    </div>
  );
}
