# AI Notetaker — Project Context

## What this is

A single-page web app for academic advisors. The advisor records a student meeting in the browser, and the app automatically produces a structured summary — key decisions, upcoming deadlines, follow-up tasks, resources mentioned — inserted into an editable note field.

The advisor stays present in the conversation. The app handles note-taking.

## Pipeline

```
Record → Submit → Transcribe → Summarize → Edit
```

1. **Record** — Browser MediaRecorder captures audio (webm/wav). Full start / pause / resume / restart / stop support.
2. **Submit** — The recorded Blob is sent as `multipart/form-data` to `POST /api/process`. A single HTTP request stays open for the full pipeline; no polling.
3. **Transcribe** — Backend pipes the audio buffer directly to OpenAI Whisper. Audio never touches disk (`multer memoryStorage`).
4. **Summarize** — Whisper transcript is sent to `gpt-5-mini` with a structured prompt that returns JSON.
5. **Edit** — The validated summary drops into a textarea. The advisor edits before saving (in-memory; no persistence).

## Stack decisions

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Vite + React + TypeScript | Fast HMR, first-class TS, minimal config |
| Styling | Tailwind CSS + shadcn/ui | Accessible primitives out of the box |
| Backend | Node.js + Express + TypeScript | Simple, well-understood, fast enough |
| Validation | Zod | Runtime safety for LLM output |
| File handling | multer memoryStorage | Audio never persists to disk |
| Tests | Vitest | Works in both browser and Node ESM contexts |

## Security model

- `multer` uses `memoryStorage()` — audio only ever lives in RAM for the duration of one request
- `multer` fileFilter whitelists: `audio/webm`, `audio/wav`, `audio/mp4`, `audio/mpeg`
- 25 MB upload limit on audio; 1 MB limit on JSON body
- CORS origin is set from `FRONTEND_URL` env var — never hardcoded
- All env vars are validated at startup in `backend/src/config/env.ts` — the server refuses to boot with missing required vars
- No route returns audio to the client
- No OpenAI key in any frontend code

## Prompts layer

`backend/src/prompts/` contains three files treated as first-class code:

- `summarize.prompt.ts` — `SYSTEM_PROMPT` constant + `buildUserPrompt(transcript, customInstructions?)`. Instructs the model to return **only** valid JSON.
- `summarize.schema.ts` — Zod schema for `SummaryOutput`. Single source of truth for the shape.
- `summarize.validator.ts` — `parseSummaryResponse(raw)` wraps `JSON.parse` + Zod. Returns a safe fallback object on any failure — never throws.

## Pipeline state machine

Located in `frontend/src/hooks/usePipeline.ts`. All state transitions live here; no pipeline logic in components.

```typescript
type PipelineState =
  | { status: 'idle' }
  | { status: 'recording' }
  | { status: 'paused' }
  | { status: 'processing' }
  | { status: 'done'; transcript: string; summary: SummaryOutput }
  | { status: 'error'; stage: string; message: string }
```

## API contract

### POST /api/process

Request: `multipart/form-data`
- `audio` — audio file (webm/wav/mp4/mpeg, max 25 MB)
- `customInstructions` — string, optional

Response `200`:
```json
{
  "transcript": "string",
  "summary": {
    "keyDecisions": ["string"],
    "upcomingDeadlines": ["string"],
    "followUpTasks": ["string"],
    "resourcesMentioned": ["string"]
  }
}
```

### GET /api/health

Response `200`: `{ "status": "ok" }`

## Conventions

- Route handlers call `next(error)` — never `res.status()` inline
- Central `errorHandler` middleware owns all error responses
- All backend calls from the frontend go through `frontend/src/services/api.ts` only
- Use shadcn components — do not create custom UI primitives
- State discriminated union: always handle every case explicitly

## Out of scope

- Authentication, sessions, multi-tenancy
- Persistent storage across reloads
- Deployment / hosting config
- Mobile-native features
- Analytics or logging infrastructure
- Streaming transcription
- Retry storage for failed Whisper calls

## Running locally

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and add your OpenAI key
cp .env.example backend/.env
# edit backend/.env and set OPENAI_API_KEY

# 3. Start both servers
npm run dev

# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
# Health:   http://localhost:3001/api/health
```
