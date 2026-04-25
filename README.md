# AI Notetaker

Single-page web app for academic advisors. Records a meeting, transcribes it with OpenAI Whisper, summarizes it with gpt-5-mini, and inserts a structured summary into an editable note.

## Running locally

```bash
# 1. Install dependencies (from repo root)
npm install

# 2. Set up environment
cp .env.example backend/.env
# Edit backend/.env — set OPENAI_API_KEY to a real key

# 3. Start both servers
npm run dev

# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
# Health:   GET http://localhost:3001/api/health → { "status": "ok" }
```

## Stack & why

| Layer | Choice | Why |
|---|---|---|
| Frontend | Vite + React + TypeScript | Fast HMR, minimal config, first-class TS |
| Styling | Tailwind CSS + shadcn/ui | Accessible primitives, keyboard support built-in |
| Backend | Node.js + Express + TypeScript | Simple, well-understood, right-sized for one endpoint |
| Validation | Zod | Runtime safety for LLM output |
| File handling | multer memoryStorage | Audio never persists to disk |

## Real vs mocked

- **OpenAI Whisper** — real API. Chosen because a mocked transcript can't demonstrate that the pipeline actually works end-to-end. If you don't have a key, set `OPENAI_API_KEY=mock` and the service returns a placeholder transcript so the rest of the UI is still exercisable.
- **gpt-5-mini** — real API (same key). Chosen because a hardcoded fake summary obscures whether the prompt and Zod validation are actually correct. Falls back to empty arrays on validation failure so the UI never crashes on a bad LLM response.
- **Object storage (S3)** — deliberately omitted. `multer memoryStorage` means audio never persists anywhere, which is the simplest possible privacy posture. A real S3 integration would require IAM, signed URLs, and a deletion lifecycle — complexity that adds no demo value.

## Known gaps

- Audio is lost if Whisper fails — no retry without re-recording (adding retry storage would contradict the "audio never persists" privacy goal)
- Notes reset on page refresh — no persistence across sessions (explicitly out of scope per the challenge)
- Long meetings (60+ min) may approach proxy timeout limits — academic meetings are typically 15–30 min, so risk is low in the target use case
- Single user only — no auth, no sessions (explicitly out of scope)
