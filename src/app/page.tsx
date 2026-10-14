import MatchoraLogo from "@/components/MatchoraLogo";
import ResumeCoach from "@/components/ResumeCoach";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-1 py-6 print:py-2">
        <MatchoraLogo className="h-11 w-auto sm:h-12" />
        <span aria-hidden="true" className="hidden h-8 w-px bg-stone-300 sm:block print:hidden" />
        <p className="text-sm text-stone-500 print:hidden">مربی رزومه برای فارسی‌زبانان تازه‌وارد کانادا</p>
      </header>
      <ResumeCoach />
    </div>
  );
}
