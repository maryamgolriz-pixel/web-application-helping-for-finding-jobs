# Matchora: resume coach for newcomers to Canada

A web app for Persian-speaking newcomers to Canada. You paste a resume (or upload a PDF, .docx or .txt file) and one job ad. The app returns:

1. A match score out of 100
2. The job ad's requirements, each marked Met / Partial / Missing with evidence from the resume
3. Missing ATS keywords
4. Canadian format tips
5. Rewritten bullets
6. A tailored cover letter
7. Questions for the user

Explanations are in Persian. Resume text and the cover letter are in English.

## Run it locally

1. Install packages (once):
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and paste your Anthropic API key (from https://console.anthropic.com/settings/keys):
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Start the app:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000. Click **«امتحان با یک نمونه»** to try it with a made-up resume and job ad.

## How it works

| File | What it does |
|---|---|
| `src/lib/prompt.ts` | The coaching instructions sent to Claude (honesty rules, the 7 steps, Canadian format checklist) |
| `src/lib/schema.ts` | The exact structure Claude must return (requirements, keywords, format findings, bullets, cover letter, questions) |
| `src/lib/scoring.ts` | Computes the score in code from Claude's classifications, using the fixed weights 35 / 25 / 10 / 15 / 15 |
| `src/app/api/analyze/route.ts` | Reads the resume (PDF goes to Claude directly; .docx is converted to HTML so tables and photos are still visible), calls Claude Opus 5.5, streams progress back to the page |
| `src/components/` | The Persian, right-to-left interface |

**Why the score is computed in code:** Claude decides whether each requirement is Met, Partial or Missing and which keywords are found. The arithmetic (must-haves count double, −3 per format issue, and so on) is done in `scoring.ts`, so it's always exact. The same resume and job ad also return the saved result while the server is running, so re-submitting gives the same score.

**Format issues vs tips:** only real problems (photo, date of birth, missing Canadian city, tables, etc.) cost 3 points each. Suggestions such as "present Persian as an asset" are shown as tips and cost nothing.

## Before putting it online

- Add `ANTHROPIC_API_KEY` as an environment variable in your hosting (e.g. Vercel → Project → Settings → Environment Variables).
- Each analysis is a paid call to Claude Opus 5.5. If the site is public, add protection against abuse (a sign-in, an access code, or rate limiting) so strangers can't use up your credits.
- An analysis takes 1–3 minutes. The route allows up to 300 seconds (`maxDuration`), which requires a Vercel plan that supports it.
