"use client";

import { useRef } from "react";
import { SAMPLE_JOB_AD, SAMPLE_RESUME } from "@/lib/sample";
import { FileIcon, UploadIcon, faNum } from "./ui";

export interface FormValues {
  resumeMode: "text" | "file";
  resumeText: string;
  resumeFile: File | null;
  jobAd: string;
  workStatus: string;
}

export const EMPTY_FORM: FormValues = {
  resumeMode: "text",
  resumeText: "",
  resumeFile: null,
  jobAd: "",
  workStatus: "",
};

const MIN_CHARS = 80;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

export function canSubmit(v: FormValues): boolean {
  const hasResume =
    v.resumeMode === "file" ? v.resumeFile !== null : v.resumeText.trim().length >= MIN_CHARS;
  return hasResume && v.jobAd.trim().length >= MIN_CHARS;
}

const textareaClass =
  "block min-h-72 w-full resize-y rounded-xl border border-stone-200 bg-stone-50/60 p-3.5 text-sm leading-7 text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10";

function Card({ step, title, hint, children }: { step: number; title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
          {faNum(step)}
        </span>
        <div>
          <h2 className="font-bold text-stone-900">{title}</h2>
          <p className="mt-0.5 text-sm text-stone-500">{hint}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export default function InputForm({
  values,
  onChange,
  onSubmit,
  error,
}: {
  values: FormValues;
  onChange: (next: FormValues) => void;
  onSubmit: () => void;
  error: string | null;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<FormValues>) => onChange({ ...values, ...patch });
  const fileTooBig = values.resumeFile !== null && values.resumeFile.size > MAX_FILE_BYTES;
  const ready = canSubmit(values) && !fileTooBig;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) onSubmit();
      }}
      className="space-y-5"
    >
      <div className="rounded-2xl bg-gradient-to-l from-teal-800 to-teal-700 p-6 text-white shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold leading-snug sm:text-3xl">رزومه‌تان را برای این شغل آماده کنید</h1>
        <p className="mt-3 max-w-2xl leading-8 text-teal-50">
          رزومه و آگهی شغلی را وارد کنید تا امتیاز تطابق، کلیدواژه‌های جاافتاده، نکات فرمت کانادایی، جمله‌های
          بازنویسی‌شده و یک کاور لتر اختصاصی بگیرید. هیچ تجربه‌ای از خودمان اضافه نمی‌کنیم؛ فقط آنچه واقعاً دارید را
          بهتر نشان می‌دهیم.
        </p>
        <button
          type="button"
          onClick={() =>
            onChange({ ...values, resumeMode: "text", resumeText: SAMPLE_RESUME, resumeFile: null, jobAd: SAMPLE_JOB_AD })
          }
          className="mt-5 rounded-lg bg-white/10 px-3.5 py-2 text-sm font-medium text-white ring-1 ring-white/30 transition hover:bg-white/20"
        >
          امتحان با یک نمونه
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card step={1} title="رزومه‌ی شما" hint="نسخه‌ی انگلیسی‌ای که می‌خواهید برای کارفرما بفرستید.">
          <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1 text-sm font-medium" role="tablist">
            {(
              [
                ["text", "چسباندن متن"],
                ["file", "بارگذاری فایل"],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={values.resumeMode === mode}
                onClick={() => set({ resumeMode: mode })}
                className={`rounded-lg py-2 transition ${
                  values.resumeMode === mode ? "bg-white text-teal-800 shadow-sm" : "text-stone-500 hover:text-stone-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {values.resumeMode === "text" ? (
            <textarea
              dir={values.resumeText ? "auto" : "rtl"}
              value={values.resumeText}
              onChange={(e) => set({ resumeText: e.target.value })}
              placeholder="متن کامل رزومه را اینجا جای‌گذاری کنید…"
              aria-label="متن رزومه"
              className={textareaClass}
            />
          ) : (
            <div className="flex min-h-72 flex-1 flex-col">
              <input
                ref={fileInput}
                type="file"
                accept=".pdf,.docx,.txt"
                className="sr-only"
                onChange={(e) => set({ resumeFile: e.target.files?.[0] ?? null })}
              />
              {values.resumeFile ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-stone-200 bg-stone-50/60 p-6 text-center">
                  <FileIcon className="h-10 w-10 text-teal-700" />
                  <div dir="ltr" className="max-w-full truncate font-latin text-sm font-medium text-stone-800">
                    {values.resumeFile.name}
                  </div>
                  <div className="text-xs text-stone-500">{faNum(Math.round(values.resumeFile.size / 1024))} کیلوبایت</div>
                  {fileTooBig && <p className="text-sm text-rose-700">حجم فایل بیشتر از ۵ مگابایت است.</p>}
                  <button
                    type="button"
                    onClick={() => {
                      set({ resumeFile: null });
                      if (fileInput.current) fileInput.current.value = "";
                    }}
                    className="text-sm font-medium text-rose-700 hover:underline"
                  >
                    حذف فایل
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50/60 p-6 text-stone-500 transition hover:border-teal-400 hover:text-teal-800"
                >
                  <UploadIcon className="h-9 w-9" />
                  <span className="font-medium">انتخاب فایل رزومه</span>
                  <span className="text-xs">PDF، Word ‏(‎.docx‎) یا متنی (‎.txt‎) — حداکثر ۵ مگابایت</span>
                  <span className="mt-1 max-w-xs text-xs leading-6 text-stone-400">
                    با فایل PDF، فرمت ظاهری رزومه (عکس، جدول، ستون‌ها) هم بررسی می‌شود.
                  </span>
                </button>
              )}
            </div>
          )}
        </Card>

        <Card step={2} title="آگهی شغلی" hint="متن کامل آگهی، همراه با بخش «درباره‌ی شرکت».">
          <textarea
            dir={values.jobAd ? "auto" : "rtl"}
            value={values.jobAd}
            onChange={(e) => set({ jobAd: e.target.value })}
            placeholder="عنوان شغل، نام شرکت، شرح وظایف و الزامات را اینجا جای‌گذاری کنید…"
            aria-label="متن آگهی شغلی"
            className={`${textareaClass} flex-1 lg:min-h-[21.5rem]`}
          />
        </Card>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
        <label htmlFor="workStatus" className="font-bold text-stone-900">
          وضعیت اجازه‌ی کار در کانادا <span className="text-sm font-normal text-stone-500">(اختیاری)</span>
        </label>
        <p className="mt-1 text-sm leading-7 text-stone-500">
          اگر بنویسید، در کاور لتر به آن اشاره می‌شود. اگر خالی بماند، چیزی درباره‌اش نوشته نمی‌شود.
        </p>
        <input
          id="workStatus"
          dir={values.workStatus ? "auto" : "rtl"}
          value={values.workStatus}
          onChange={(e) => set({ workStatus: e.target.value })}
          placeholder="مثلاً: Permanent Resident یا Open Work Permit"
          maxLength={200}
          className="mt-3 w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-stone-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
        />
      </div>

      {error && (
        <div role="alert" className="rounded-xl bg-rose-50 p-4 text-sm leading-7 text-rose-800 ring-1 ring-rose-200">
          {error}
        </div>
      )}

      <div className="flex flex-col items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={!ready}
          className="w-full rounded-xl bg-teal-700 px-8 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-teal-800 focus-visible:ring-4 focus-visible:ring-teal-500/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-stone-300 sm:w-auto"
        >
          بررسی رزومه
        </button>
        <p className="text-center text-xs leading-6 text-stone-500">
          {ready
            ? "تحلیل معمولاً ۱ تا ۳ دقیقه طول می‌کشد."
            : "برای شروع، رزومه و آگهی شغلی را وارد کنید."}{" "}
          متن شما فقط برای همین تحلیل به هوش مصنوعی Claude فرستاده می‌شود و در هیچ پایگاه داده‌ای ذخیره نمی‌شود.
        </p>
      </div>
    </form>
  );
}
