import ResumeCoach from "@/components/ResumeCoach";

function MapleLeaf({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M12 1.5l1.9 3.7 2-.9-.6 4.6 3-2.6.7 1.8 2.8-.5-1 3.3 1.4.8-4.4 3.7.6 1.6-4.4-.7.2 4.6h-1.2l.2-4.6-4.4.7.6-1.6L4.3 13.6l1.4-.8-1-3.3 2.8.5.7-1.8 3 2.6-.6-4.6 2 .9z"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
      <header className="flex items-center gap-3 py-6 print:hidden">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-stone-200">
          <MapleLeaf className="h-6 w-6 text-maple" />
        </span>
        <div>
          <p className="text-lg font-bold text-stone-900">رزومه‌یار کانادا</p>
          <p className="text-sm text-stone-500">مربی رزومه برای فارسی‌زبانان تازه‌وارد</p>
        </div>
      </header>
      <ResumeCoach />
    </div>
  );
}
