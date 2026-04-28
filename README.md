# AI Notetaker

Single-page web app for academic advisors. Records a meeting, transcribes it with OpenAI's `gpt-4o-transcribe`, summarizes it with `gpt-5.4-nano`, and inserts a structured summary into an editable note. Saved notes are listed on a separate `/notes` page.

## Running locally

```bash
# 1. Install dependencies (from repo root)
npm install

# 2. Set up environment
cp .env.example backend/.env
# Edit backend/.env — set OPENAI_API_KEY, S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY

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

| Layer         | Choice                            | Why                                                        |
|---------------|-----------------------------------|------------------------------------------------------------|
| Frontend      | Vite + React + TypeScript         | Fast HMR, minimal config, first-class TS                   |
| Routing       | react-router-dom v7               | Two deep-linkable surfaces (`/record`, `/notes`)           |
| Styling       | Tailwind CSS + shadcn/ui + lucide | Accessible primitives, keyboard support built-in           |
| Toasts        | sonner                            | Non-blocking failure feedback                              |
| Backend       | Node.js + Express + TypeScript    | Simple, well-understood, right-sized for three routes      |
| Validation    | Zod                               | Runtime safety for LLM output and request bodies           |
| Object storage | AWS S3 (presigned URLs)          | Audio goes browser → S3 directly; backend never buffers it |
| Tests         | Vitest + supertest + RTL          | One runner, backend + frontend                             |

## Real vs mocked

- **`gpt-4o-transcribe`** — real API, no mock. Mocking transcription would hide the cases that matter most: short silences, crosstalk, fast speech. Testing against real audio on a real model is the only way to validate the pipeline end-to-end.
- **`gpt-5.4-nano` (summarization)** — real API, called with `response_format: { type: 'json_schema', strict: true }` so OpenAI enforces the output shape before returning. Mocking the LLM output would mask prompt-reliability risks — exactly the part most likely to break in production. Zod validates the parsed JSON at the boundary as defense in depth.
- **Notes persistence** — deliberately in-memory (`Map` in `backend/src/db/notes.store.ts`). Notes survive page reloads but vanish on server restart. The store interface is ready to swap for a real database; adding a DB would have consumed more time than it would have revealed about the interesting parts of the system.

## Known gaps

- Audio is lost if transcription fails on the provider side (5xx) — the S3 object is deleted in the `finally` block regardless of success. The advisor must re-record.
- If the browser crashes after the S3 upload but before `POST /api/summarize`, the object is orphaned. An S3 lifecycle rule (e.g., expire `uploads/` after 1 hour) is the correct mitigation but is not currently configured.
- Long meetings (60+ min) may approach proxy timeout limits — academic meetings are typically 15–30 min.
- Saved notes are lost on server restart and are shared across all clients (no advisor scoping). Auth is out of scope.
- Custom instructions apply at the review step, not as a "regenerate" action on the editor.
- Single-user only — no auth, no sessions (explicitly out of scope).

## Demo

https://github.com/user-attachments/assets/305f9e24-7616-473f-b0b1-c05add99ab55

> **Note:** The transcription step in this recording was mocked with a pre-written transcript to keep the demo short. All other stages — upload to S3, summarization, editing, and saving — run against real services.

---

*Built with effort and coffee ☕☕☕*
