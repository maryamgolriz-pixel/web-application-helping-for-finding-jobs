"use client";

import { useRef, useState } from "react";
import type { AnalysisResult, AnalyzeEvent } from "@/lib/events";
import InputForm, { EMPTY_FORM, type FormValues } from "./InputForm";
import LoadingPanel from "./LoadingPanel";
import Results from "./Results";

type View =
  | { status: "form"; error: string | null }
  | { status: "loading"; phase: "thinking" | "writing"; chars: number; startedAt: number }
  | { status: "done"; result: AnalysisResult };

const CONNECTION_LOST = "ارتباط با سرور قطع شد. لطفاً دوباره امتحان کنید.";

export default function ResumeCoach() {
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [view, setView] = useState<View>({ status: "form", error: null });
  const abortRef = useRef<AbortController | null>(null);

  const showForm = (error: string | null = null) => {
    setView({ status: "form", error });
    window.scrollTo({ top: 0 });
  };

  async function analyze() {
    const body = new FormData();
    body.set("jobAd", values.jobAd);
    body.set("workStatus", values.workStatus);
    if (values.resumeMode === "file" && values.resumeFile) {
      body.set("resumeFile", values.resumeFile);
    } else {
      body.set("resumeText", values.resumeText);
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setView({ status: "loading", phase: "thinking", chars: 0, startedAt: Date.now() });
    window.scrollTo({ top: 0 });

    try {
      const res = await fetch("/api/analyze", { method: "POST", body, signal: controller.signal });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        showForm(data?.error ?? CONNECTION_LOST);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newline: number;
        while ((newline = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, newline).trim();
          buffer = buffer.slice(newline + 1);
          if (!line) continue;
          const event = JSON.parse(line) as AnalyzeEvent;
          if (event.type === "progress") {
            setView((v) => (v.status === "loading" ? { ...v, phase: event.phase, chars: event.chars } : v));
          } else if (event.type === "result") {
            setView({ status: "done", result: event.result });
            window.scrollTo({ top: 0 });
            return;
          } else {
            showForm(event.message);
            return;
          }
        }
      }
      showForm(CONNECTION_LOST);
    } catch {
      if (controller.signal.aborted) return;
      showForm(CONNECTION_LOST);
    } finally {
      abortRef.current = null;
    }
  }

  if (view.status === "loading") {
    return (
      <LoadingPanel
        phase={view.phase}
        chars={view.chars}
        startedAt={view.startedAt}
        onCancel={() => {
          abortRef.current?.abort();
          showForm();
        }}
      />
    );
  }

  if (view.status === "done") {
    return (
      <Results
        result={view.result}
        onEdit={() => showForm()}
        onReset={() => {
          setValues(EMPTY_FORM);
          showForm();
        }}
      />
    );
  }

  return <InputForm values={values} onChange={setValues} onSubmit={analyze} error={view.error} />;
}
