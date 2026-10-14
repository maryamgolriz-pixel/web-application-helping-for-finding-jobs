import { createHash } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { AnalysisResult, AnalyzeEvent } from "@/lib/events";
import { PROMPT_VERSION, SYSTEM_PROMPT } from "@/lib/prompt";
import { readResumeFile, ResumeFileError, type ResumeInput } from "@/lib/resume-file";
import { AnalysisSchema } from "@/lib/schema";
import { computeScore } from "@/lib/scoring";

export const runtime = "nodejs";
// A full analysis usually takes 1-3 minutes.
export const maxDuration = 300;

const MODEL = "claude-opus-5-5";
const MAX_TEXT_CHARS = 30_000;
const MIN_JOB_AD_CHARS = 80;
const PROGRESS_INTERVAL_MS = 1500;

// Same resume + job ad -> same result. Kept in memory while the server runs.
type Cache = Map<string, Omit<AnalysisResult, "cached">>;
const globalCache = globalThis as unknown as { __analysisCache?: Cache };
const cache: Cache = (globalCache.__analysisCache ??= new Map());
const CACHE_LIMIT = 200;

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function field(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function buildUserContent(
  resume: ResumeInput,
  jobAd: string,
  workStatus: string,
): Anthropic.Beta.BetaContentBlockParam[] {
  const blocks: Anthropic.Beta.BetaContentBlockParam[] = [];
  let resumePart: string;

  if (resume.kind === "pdf") {
    blocks.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: resume.base64 },
      title: "Resume",
    });
    resumePart = "<resume>\nThe resume is the attached PDF document.\n</resume>";
  } else if (resume.source === "docx") {
    resumePart =
      "<resume>\n" +
      "(Converted from a Word .docx file to HTML. <table> means the original uses a table; <img> means an embedded image such as a photo. Page headers and footers were not extracted.)\n\n" +
      resume.text +
      "\n</resume>";
  } else {
    resumePart = `<resume>\n${resume.text}\n</resume>`;
  }

  const eligibility = workStatus
    ? `<work_eligibility>\n${workStatus}\n</work_eligibility>`
    : "<work_eligibility>\nThe user has not stated their work eligibility in Canada.\n</work_eligibility>";

  blocks.push({ type: "text", text: `${resumePart}\n\n<job_ad>\n${jobAd}\n</job_ad>\n\n${eligibility}` });
  return blocks;
}

function cacheKey(resume: ResumeInput, jobAd: string, workStatus: string): string {
  const hash = createHash("sha256");
  hash.update(`${PROMPT_VERSION}\0${MODEL}\0`);
  hash.update(resume.kind === "pdf" ? `pdf\0${resume.base64}` : `${resume.source}\0${resume.text}`);
  hash.update(`\0${jobAd}\0${workStatus}`);
  return hash.digest("hex");
}

function friendlyApiError(error: unknown): string {
  if (error instanceof Anthropic.AuthenticationError) {
    return "کلید API معتبر نیست. لطفاً مقدار ANTHROPIC_API_KEY را در فایل ‎.env.local‎ بررسی کنید.";
  }
  if (error instanceof Anthropic.RateLimitError) {
    return "تعداد درخواست‌ها زیاد شده است. لطفاً یک دقیقه صبر کنید و دوباره امتحان کنید.";
  }
  if (error instanceof Anthropic.BadRequestError) {
    return "درخواست پذیرفته نشد. اگر فایل PDF فرستاده‌اید، متن رزومه را کپی و جای‌گذاری کنید و دوباره امتحان کنید.";
  }
  if (error instanceof Anthropic.APIError) {
    return "سرویس هوش مصنوعی موقتاً در دسترس نیست. لطفاً چند دقیقه‌ی دیگر دوباره امتحان کنید.";
  }
  return "مشکلی پیش آمد. لطفاً دوباره امتحان کنید.";
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError("درخواست نامعتبر است.", 400);
  }

  const jobAd = field(form, "jobAd");
  const resumeText = field(form, "resumeText");
  const workStatus = field(form, "workStatus").slice(0, 200);
  const resumeFile = form.get("resumeFile");

  if (jobAd.length < MIN_JOB_AD_CHARS) {
    return jsonError("لطفاً متن کامل آگهی شغلی را وارد کنید.", 400);
  }
  if (jobAd.length > MAX_TEXT_CHARS || resumeText.length > MAX_TEXT_CHARS) {
    return jsonError("متن واردشده خیلی طولانی است (حداکثر ۳۰٬۰۰۰ کاراکتر).", 400);
  }

  let resume: ResumeInput;
  try {
    if (resumeFile instanceof File && resumeFile.size > 0) {
      resume = await readResumeFile(resumeFile);
    } else if (resumeText.length >= MIN_JOB_AD_CHARS) {
      resume = { kind: "text", text: resumeText, source: "pasted" };
    } else {
      return jsonError("لطفاً متن رزومه را وارد کنید یا فایل آن را بارگذاری کنید.", 400);
    }
  } catch (error) {
    if (error instanceof ResumeFileError) return jsonError(error.message, 400);
    console.error("reading resume file failed", error);
    return jsonError("خواندن فایل رزومه ممکن نشد. لطفاً متن رزومه را کپی و جای‌گذاری کنید.", 400);
  }
  if (resume.kind === "text" && resume.text.length > MAX_TEXT_CHARS * 2) {
    return jsonError("رزومه خیلی طولانی است. لطفاً نسخه‌ی کوتاه‌تری بفرستید.", 400);
  }

  const key = cacheKey(resume, jobAd, workStatus);
  const encoder = new TextEncoder();
  const line = (event: AnalyzeEvent) => encoder.encode(JSON.stringify(event) + "\n");

  const cached = cache.get(key);
  if (cached) {
    return new Response(line({ type: "result", result: { ...cached, cached: true } }), {
      headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return jsonError(
      "کلید API تنظیم نشده است. فایل ‎.env.local‎ را بسازید و ANTHROPIC_API_KEY را در آن قرار دهید (راهنما در README).",
      500,
    );
  }
  const client = new Anthropic();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let phase: "thinking" | "writing" = "thinking";
      let chars = 0;
      const send = (event: AnalyzeEvent) => {
        try {
          controller.enqueue(line(event));
        } catch {
          // Client already went away.
        }
      };
      // Regular progress events keep the connection alive during long thinking.
      const ticker = setInterval(() => send({ type: "progress", phase, chars }), PROGRESS_INTERVAL_MS);

      try {
        const stream = client.beta.messages.stream(
          {
            model: MODEL,
            max_tokens: 64000,
            thinking: { type: "adaptive" },
            output_config: { effort: "high", format: betaZodOutputFormat(AnalysisSchema) },
            // If Claude declines for policy reasons, retry on the default fallback model.
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
            system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
            messages: [{ role: "user", content: buildUserContent(resume, jobAd, workStatus) }],
          },
          { signal: req.signal },
        );
        stream.on("text", (delta) => {
          phase = "writing";
          chars += delta.length;
        });

        const message = await stream.finalMessage();

        if (message.stop_reason === "refusal") {
          send({ type: "error", message: "این درخواست قابل بررسی نبود. لطفاً متن رزومه و آگهی را بررسی کنید و دوباره امتحان کنید." });
          return;
        }
        if (message.stop_reason === "max_tokens") {
          send({ type: "error", message: "پاسخ ناقص ماند. لطفاً رزومه یا آگهی کوتاه‌تری امتحان کنید." });
          return;
        }

        const parsed = AnalysisSchema.safeParse(message.parsed_output);
        if (!parsed.success) {
          console.error("analysis did not match schema", parsed.error);
          send({ type: "error", message: "پاسخ هوش مصنوعی کامل نبود. لطفاً دوباره امتحان کنید." });
          return;
        }

        const result = { analysis: parsed.data, score: computeScore(parsed.data) };
        if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value!);
        cache.set(key, result);
        send({ type: "result", result: { ...result, cached: false } });
      } catch (error) {
        if (req.signal.aborted) return;
        console.error("analysis failed", error);
        send({ type: "error", message: friendlyApiError(error) });
      } finally {
        clearInterval(ticker);
        try {
          controller.close();
        } catch {
          // Client already went away.
        }
      }
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
