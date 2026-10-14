"use client";

import { useState } from "react";

export function faNum(n: number): string {
  return n.toLocaleString("fa-IR", { maximumFractionDigits: 1 });
}

export function Section({
  title,
  children,
  aside,
}: {
  title: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 sm:p-7 print:break-inside-avoid-page print:shadow-none">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-stone-900">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

// English text that goes to employers: left-to-right, Latin font.
export function Ltr({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div dir="ltr" className={`text-left font-latin ${className}`}>
      {children}
    </div>
  );
}

// A short English phrase inside a Persian (right-aligned) line.
export function InlineLtr({ children }: { children: React.ReactNode }) {
  return (
    <bdi dir="ltr" className="font-latin">
      {children}
    </bdi>
  );
}

// Highlights [placeholders] the user still has to fill in.
export function WithPlaceholders({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]\n]{1,200}\])/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="placeholder">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function CopyButton({ text, label = "کپی" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard blocked; nothing useful to do.
        }
      }}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-600 transition hover:border-teal-300 hover:text-teal-800 print:hidden"
    >
      {copied ? (
        <>
          <CheckIcon className="h-3.5 w-3.5 text-teal-700" />
          کپی شد
        </>
      ) : (
        <>
          <CopyIcon className="h-3.5 w-3.5" />
          {label}
        </>
      )}
    </button>
  );
}

type IconProps = { className?: string };

export function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true" className={className}>
      <path d="M4.5 10.5l3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CrossIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true" className={className}>
      <path d="M5.5 5.5l9 9m0-9l-9 9" strokeLinecap="round" />
    </svg>
  );
}

export function HalfIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className}>
      <circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M10 3.5a6.5 6.5 0 010 13z" fill="currentColor" />
    </svg>
  );
}

export function CopyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" className={className}>
      <rect x="7" y="7" width="9.5" height="9.5" rx="2" />
      <path d="M13 7V5a1.5 1.5 0 00-1.5-1.5h-6A1.5 1.5 0 004 5v6a1.5 1.5 0 001.5 1.5H7" />
    </svg>
  );
}

export function UploadIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" className={className}>
      <path d="M12 15V4m0 0l-4 4m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3" strokeLinecap="round" />
    </svg>
  );
}

export function FileIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" className={className}>
      <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" strokeLinejoin="round" />
      <path d="M14 3v5h5M9 13h6M9 17h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
