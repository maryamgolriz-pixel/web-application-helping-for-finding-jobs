"use client";

import type { AnalysisResult } from "@/lib/events";
import type { Analysis, Requirement } from "@/lib/schema";
import type { ScoreRow } from "@/lib/scoring";
import { CheckIcon, CopyButton, CrossIcon, HalfIcon, InlineLtr, Ltr, Section, WithPlaceholders, faNum } from "./ui";

const STATUS = {
  met: { label: "دارد", Icon: CheckIcon, chip: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  partial: { label: "تا حدی", Icon: HalfIcon, chip: "bg-amber-50 text-amber-800 ring-amber-200" },
  missing: { label: "ندارد", Icon: CrossIcon, chip: "bg-rose-50 text-rose-800 ring-rose-200" },
} as const;

const CATEGORY_TITLES: Record<Requirement["category"], string> = {
  skills: "مهارت‌ها و صلاحیت‌ها",
  experience: "تجربه",
  education: "تحصیلات، مدارک و مجوزها",
};

function band(total: number) {
  if (total >= 85) return { label: "تطابق عالی", color: "text-emerald-600", stroke: "stroke-emerald-500" };
  if (total >= 70) return { label: "تطابق خوب", color: "text-teal-700", stroke: "stroke-teal-600" };
  if (total >= 50) return { label: "تطابق متوسط", color: "text-amber-600", stroke: "stroke-amber-500" };
  return { label: "نیاز به کار بیشتر", color: "text-rose-600", stroke: "stroke-rose-500" };
}

function ScoreRing({ total }: { total: number }) {
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const b = band(total);
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-40 w-40">
        <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="64" cy="64" r={r} fill="none" strokeWidth="11" className="stroke-stone-100" />
          <circle
            cx="64"
            cy="64"
            r={r}
            fill="none"
            strokeWidth="11"
            strokeLinecap="round"
            className={b.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - total / 100)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold tabular-nums ${b.color}`}>{faNum(total)}</span>
          <span className="text-sm text-stone-400">از ۱۰۰</span>
        </div>
      </div>
      <span className={`mt-2 font-bold ${b.color}`}>{b.label}</span>
    </div>
  );
}

function rowDetail(row: ScoreRow, analysis: Analysis): string {
  if (row.key === "keywords") {
    return row.total
      ? `${faNum(row.count ?? 0)} از ${faNum(row.total)} کلیدواژه‌ی مهم در رزومه هست`
      : "کلیدواژه‌ی مهمی پیدا نشد (امتیاز کامل)";
  }
  if (row.key === "format") {
    return row.count ? `${faNum(row.count)} مورد ایراد، هر مورد ۳ امتیاز کم می‌کند` : "ایرادی پیدا نشد";
  }
  const items = analysis.requirements.filter((r) => r.category === row.key);
  if (items.length === 0) return "این آگهی الزامی در این بخش نداشت (امتیاز کامل)";
  const count = (s: Requirement["status"]) => items.filter((r) => r.status === s).length;
  return `${faNum(count("met"))} دارد · ${faNum(count("partial"))} تا حدی · ${faNum(count("missing"))} ندارد`;
}

function ScoreSection({ result }: { result: AnalysisResult }) {
  const { score, analysis } = result;
  return (
    <Section title="۱. امتیاز تطابق">
      <div className="grid items-center gap-8 md:grid-cols-[auto_1fr]">
        <ScoreRing total={score.total} />
        <div className="space-y-4">
          {score.rows.map((row) => (
            <div key={row.key}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium text-stone-800">{row.label_fa}</span>
                <span className="shrink-0 tabular-nums text-stone-600">
                  <b className="text-stone-900">{faNum(row.points)}</b> از {faNum(row.max)}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-stone-100">
                <div className="h-full rounded-full bg-teal-600" style={{ width: `${(row.points / row.max) * 100}%` }} />
              </div>
              <p className="mt-1 text-xs text-stone-500">{rowDetail(row, analysis)}</p>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-6 rounded-xl bg-teal-50 p-4 leading-8 text-teal-950">{analysis.summary_fa}</p>
      <p className="mt-3 text-xs leading-6 text-stone-500">
        امتیاز با یک فرمول ثابت حساب می‌شود: الزام کامل ۱، نسبی ۰٫۵ و ناموجود ۰؛ الزام‌های ضروری دو برابر حساب می‌شوند.
        {result.cached && " این رزومه و آگهی قبلاً بررسی شده بود و همان نتیجه نمایش داده شده است."}
      </p>
    </Section>
  );
}

function RequirementsSection({ analysis }: { analysis: Analysis }) {
  const groups = (Object.keys(CATEGORY_TITLES) as Requirement["category"][])
    .map((category) => ({ category, items: analysis.requirements.filter((r) => r.category === category) }))
    .filter((g) => g.items.length > 0);

  return (
    <Section title="۲. الزامات آگهی">
      <p className="mb-6 rounded-xl bg-stone-50 p-4 text-sm leading-7 text-stone-700 ring-1 ring-stone-200">
        <b className="text-stone-900">سطح شغل: </b>
        {analysis.seniority_fa}
      </p>
      <div className="space-y-7">
        {groups.map(({ category, items }) => (
          <div key={category}>
            <h3 className="mb-3 text-sm font-bold text-stone-500">{CATEGORY_TITLES[category]}</h3>
            <ul className="divide-y divide-stone-100 rounded-xl ring-1 ring-stone-200">
              {items.map((req, i) => {
                const s = STATUS[req.status];
                return (
                  <li key={i} className="flex gap-4 p-4">
                    <div className="flex w-[5.25rem] shrink-0 flex-col items-start gap-1.5">
                      <span className={`flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-bold ring-1 ${s.chip}`}>
                        <s.Icon className="h-3.5 w-3.5" />
                        {s.label}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                          req.priority === "must_have" ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {req.priority === "must_have" ? "ضروری" : "امتیاز مثبت"}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-7 text-stone-900">
                        <InlineLtr>{req.requirement}</InlineLtr>
                      </p>
                      {req.evidence ? (
                        <p className="mt-2 border-r-2 border-stone-200 pr-3 text-sm leading-6 text-stone-500">
                          <InlineLtr>“{req.evidence}”</InlineLtr>
                        </p>
                      ) : (
                        <p className="mt-2 text-sm text-stone-400">شاهدی در رزومه پیدا نشد.</p>
                      )}
                      <p className="mt-2 text-sm leading-7 text-stone-700">{req.note_fa}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}

function KeywordChip({ children, tone }: { children: React.ReactNode; tone: "found" | "missing" }) {
  return (
    <span
      dir="ltr"
      className={`inline-block rounded-lg px-2.5 py-1 font-latin text-sm ring-1 ${
        tone === "found" ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-stone-50 text-stone-800 ring-stone-300"
      }`}
    >
      {children}
    </span>
  );
}

function KeywordsSection({ analysis }: { analysis: Analysis }) {
  const found = analysis.keywords.filter((k) => k.status === "found");
  const reworded = analysis.keywords.filter((k) => k.status === "reworded");
  const absent = analysis.keywords.filter((k) => k.status === "absent");

  return (
    <Section title="۳. کلیدواژه‌های جاافتاده">
      <p className="text-sm leading-7 text-stone-600">
        نرم‌افزارهای ATS رزومه را با کلمات آگهی مقایسه می‌کنند. {faNum(found.length)} از {faNum(analysis.keywords.length)}{" "}
        کلیدواژه‌ی مهم آگهی در رزومه‌ی شما هست.
      </p>
      {found.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {found.map((k, i) => (
            <KeywordChip key={i} tone="found">
              {k.keyword}
            </KeywordChip>
          ))}
        </div>
      )}

      {reworded.length > 0 && (
        <div className="mt-7">
          <h3 className="font-bold text-stone-900">الف) احتمالاً دارید، ولی با کلمات دیگری نوشته‌اید</h3>
          <p className="mt-1 text-sm text-stone-500">اگر درست است، عبارت پیشنهادی را در رزومه به کار ببرید.</p>
          <ul className="mt-3 space-y-3">
            {reworded.map((k, i) => (
              <li key={i} className="rounded-xl p-4 ring-1 ring-stone-200">
                <KeywordChip tone="missing">{k.keyword}</KeywordChip>
                {k.resume_wording && (
                  <p className="mt-3 text-sm leading-6 text-stone-500">
                    در رزومه‌ی شما:{" "}
                    <span className="text-stone-700">
                      <InlineLtr>“{k.resume_wording}”</InlineLtr>
                    </span>
                  </p>
                )}
                {k.suggested_wording && (
                  <div className="mt-3 rounded-lg bg-teal-50 p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-teal-800">عبارت پیشنهادی</span>
                      <CopyButton text={k.suggested_wording} />
                    </div>
                    <Ltr className="mt-2 font-medium leading-6 text-teal-950">
                      <WithPlaceholders text={k.suggested_wording} />
                    </Ltr>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {absent.length > 0 && (
        <div className="mt-7">
          <h3 className="font-bold text-stone-900">ب) در رزومه پیدا نشد</h3>
          <p className="mt-1 text-sm text-stone-500">فقط اگر واقعاً این تجربه را دارید، آن را به رزومه اضافه کنید.</p>
          <ul className="mt-3 space-y-3">
            {absent.map((k, i) => (
              <li key={i} className="flex flex-col gap-2 rounded-xl p-4 ring-1 ring-stone-200 sm:flex-row sm:items-center">
                <div className="shrink-0">
                  <KeywordChip tone="missing">{k.keyword}</KeywordChip>
                </div>
                <p className="text-sm leading-7 text-stone-700">{k.question_fa}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {reworded.length === 0 && absent.length === 0 && (
        <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">همه‌ی کلیدواژه‌های مهم آگهی در رزومه‌ی شما هست.</p>
      )}
    </Section>
  );
}

function FormatSection({ analysis }: { analysis: Analysis }) {
  const issues = analysis.format_findings.filter((f) => f.kind === "issue");
  const tips = analysis.format_findings.filter((f) => f.kind === "tip");
  const list = (items: typeof issues, kind: "issue" | "tip") => (
    <ul className="space-y-3">
      {items.map((f, i) => (
        <li key={i} className="rounded-xl p-4 ring-1 ring-stone-200">
          <div className="flex items-start justify-between gap-3">
            <h4 className="font-bold text-stone-900">{f.title_fa}</h4>
            <span
              className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${
                kind === "issue" ? "bg-rose-50 text-rose-700" : "bg-sky-50 text-sky-700"
              }`}
            >
              {kind === "issue" ? "۳− امتیاز" : "پیشنهاد"}
            </span>
          </div>
          <p className="mt-2 text-sm leading-7 text-stone-700">{f.detail_fa}</p>
          {f.example && (
            <div className="mt-3 flex items-start justify-between gap-3 rounded-lg bg-stone-50 p-3 text-sm">
              <Ltr className="min-w-0 whitespace-pre-wrap text-stone-800">
                <WithPlaceholders text={f.example} />
              </Ltr>
              <CopyButton text={f.example} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <Section title="۴. نکات فرمت کانادایی">
      {issues.length > 0 ? (
        <>
          <h3 className="mb-3 text-sm font-bold text-stone-500">ایرادها</h3>
          {list(issues, "issue")}
        </>
      ) : (
        <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">فرمت رزومه با عرف کانادا هم‌خوانی دارد.</p>
      )}
      {tips.length > 0 && (
        <>
          <h3 className="mb-3 mt-7 text-sm font-bold text-stone-500">پیشنهادها</h3>
          {list(tips, "tip")}
        </>
      )}
    </Section>
  );
}

function PlaceholderNote() {
  return (
    <p className="mb-5 rounded-xl bg-amber-50 p-4 text-sm leading-7 text-amber-900 ring-1 ring-amber-200">
      جاهایی که <mark className="placeholder">[این‌طور]</mark> مشخص شده‌اند را فقط با اطلاعات واقعی پر کنید. اگر عدد یا
      اطلاعات درستی ندارید، آن بخش را حذف کنید.
    </p>
  );
}

function BulletsSection({ analysis }: { analysis: Analysis }) {
  return (
    <Section title="۵. بازنویسی جمله‌ها">
      <PlaceholderNote />
      <ol className="space-y-4">
        {analysis.bullet_rewrites.map((b, i) => (
          <li key={i} className="overflow-hidden rounded-xl ring-1 ring-stone-200">
            <div className="bg-stone-50 p-4">
              <span className="text-xs font-bold text-stone-500">جمله‌ی فعلی</span>
              <Ltr className="mt-1.5 text-sm leading-6 text-stone-600">{b.original}</Ltr>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-teal-700">بازنویسی‌شده</span>
                <CopyButton text={b.rewritten} />
              </div>
              <Ltr className="mt-1.5 font-medium leading-7 text-stone-900">
                <WithPlaceholders text={b.rewritten} />
              </Ltr>
              <p className="mt-3 text-sm leading-7 text-stone-600">
                <b className="text-stone-800">چرا بهتر است؟ </b>
                {b.why_fa}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function CoverLetterSection({ analysis }: { analysis: Analysis }) {
  return (
    <Section title="۶. کاور لتر" aside={<CopyButton text={analysis.cover_letter} label="کپی کاور لتر" />}>
      <PlaceholderNote />
      <Ltr className="whitespace-pre-wrap rounded-xl bg-white p-6 text-[15px] leading-7 text-stone-800 ring-1 ring-stone-200 sm:p-8 print:ring-0">
        <WithPlaceholders text={analysis.cover_letter} />
      </Ltr>
    </Section>
  );
}

function QuestionsSection({ analysis, onEdit }: { analysis: Analysis; onEdit: () => void }) {
  return (
    <Section title="۷. سؤال‌هایی از شما">
      <p className="mb-4 text-sm leading-7 text-stone-600">
        جواب این سؤال‌ها می‌تواند امتیاز شما را بالا ببرد. اگر جواب هر کدام «بله» است، آن را به رزومه اضافه کنید و دوباره
        بررسی کنید.
      </p>
      <ol className="space-y-3">
        {analysis.questions_fa.map((q, i) => (
          <li key={i} className="flex gap-3 rounded-xl p-4 ring-1 ring-stone-200">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-800">
              {faNum(i + 1)}
            </span>
            <p className="leading-7 text-stone-800">{q}</p>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={onEdit}
        className="mt-6 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800 print:hidden"
      >
        ویرایش رزومه و بررسی دوباره
      </button>
    </Section>
  );
}

export default function Results({
  result,
  onEdit,
  onReset,
}: {
  result: AnalysisResult;
  onEdit: () => void;
  onReset: () => void;
}) {
  const { analysis } = result;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 print:shadow-none">
        <div className="min-w-0">
          <p className="text-sm text-stone-500">نتیجه‌ی بررسی برای</p>
          <Ltr className="truncate text-lg font-bold text-stone-900">
            {analysis.role_title}
            {analysis.company_name && <span className="font-normal text-stone-500"> · {analysis.company_name}</span>}
          </Ltr>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg border border-stone-200 px-3.5 py-2 text-sm font-medium text-stone-700 transition hover:border-teal-300 hover:text-teal-800"
          >
            ویرایش ورودی‌ها
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg border border-stone-200 px-3.5 py-2 text-sm font-medium text-stone-700 transition hover:border-teal-300 hover:text-teal-800"
          >
            چاپ / ذخیره PDF
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg bg-teal-700 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-teal-800"
          >
            بررسی جدید
          </button>
        </div>
      </div>

      <ScoreSection result={result} />
      <RequirementsSection analysis={analysis} />
      <KeywordsSection analysis={analysis} />
      <FormatSection analysis={analysis} />
      <BulletsSection analysis={analysis} />
      <CoverLetterSection analysis={analysis} />
      <QuestionsSection analysis={analysis} onEdit={onEdit} />
    </div>
  );
}
