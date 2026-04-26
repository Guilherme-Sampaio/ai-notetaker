# AI Notetaker

Single-page web app for academic advisors. Records a meeting, transcribes it with OpenAI's `gpt-4o-transcribe`, summarizes it with `gpt-5-mini`, and inserts a structured summary into an editable note. Saved notes are listed on a separate `/notes` page.

## Running locally

```bash
# 1. Install dependencies (from repo root)
npm install

# 2. Set up environment
cp .env.example backend/.env
# Edit backend/.env — set OPENAI_API_KEY to a real key (or "mock")

# 3. Start both servers
npm run dev

# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
# Health:   GET http://localhost:3001/api/health → { "status": "ok" }
```

The app has two routes:

- `/record` — record, review, process, edit, save
- `/notes` — list of saved notes, click to view detail

## Stack & why

| Layer       | Choice                              | Why                                                  |
|-------------|-------------------------------------|------------------------------------------------------|
| Frontend    | Vite + React + TypeScript           | Fast HMR, minimal config, first-class TS             |
| Routing     | react-router-dom v7                 | Two deep-linkable surfaces (`/record`, `/notes`)     |
| Styling     | Tailwind CSS + shadcn/ui + lucide   | Accessible primitives, keyboard support built-in     |
| Toasts      | sonner                              | Non-blocking failure feedback                        |
| Backend     | Node.js + Express + TypeScript      | Simple, well-understood, right-sized for two routes  |
| Validation  | Zod                                 | Runtime safety for LLM output and request bodies     |
| File handling | multer memoryStorage              | Audio never persists to disk                         |
| Tests       | Vitest + supertest + RTL            | One runner, backend + frontend                       |

## API

| Method | Path             | Purpose                                                         |
|--------|------------------|-----------------------------------------------------------------|
| GET    | `/api/health`    | Liveness check                                                  |
| POST   | `/api/summarize` | Audio in (multipart) → `{ transcript, summary }` out            |
| POST   | `/api/notes`     | Persist a note (`{ transcript, summary }`) → `Note` (201)       |
| GET    | `/api/notes`     | List saved notes (newest first)                                 |

## Real vs mocked

- **`gpt-4o-transcribe` (Whisper successor)** — real API. Chosen because a mocked transcript can't demonstrate that the pipeline actually works end-to-end. If you don't have a key, set `OPENAI_API_KEY=mock` and `services/openai.provider.ts` swaps in `openai.mock.service.ts`, which returns a canned transcript and summary so the rest of the UI is still exercisable. The route handler is identical in both modes.
- **`gpt-5-mini`** — real API (same key). Called with `response_format: { type: 'json_schema', strict: true }`, so OpenAI enforces the output shape before returning. Zod still validates at the boundary as defense in depth, with a safe empty-arrays fallback.
- **Object storage (S3) for audio** — deliberately omitted. `multer memoryStorage` means audio never leaves RAM. No IAM, no signed URLs, no deletion lifecycle.
- **Database for notes** — deliberately omitted. Notes live in an in-process `Map` (`backend/src/db/notes.store.ts`). Survive page reloads, vanish on server restart. The store is a small interface (`insert / findAll / findById / clear`) ready to swap for DynamoDB.

## Known gaps

- Audio is lost if transcription fails on the provider side (5xx). 422 validation failures (too short, no advising content) keep the blob client-side and let the user retry without re-recording.
- Saved notes are lost on server restart and are shared across all clients (no advisor scoping). Auth is out of scope per the challenge.
- Long meetings (60+ min) may approach proxy timeout limits — academic meetings are typically 15–30 min.
- Custom instructions are applied at the review step, not as a "regenerate" action on the editor — re-running with different emphasis means re-recording.
- Single-user only — no auth, no sessions (explicitly out of scope).
