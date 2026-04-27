# AI Notetaker — Project Context

## What this is

A single-page web app for academic advisors. The advisor records a student meeting in the browser, and the app automatically produces a structured summary — key decisions, upcoming deadlines, follow-up tasks, resources mentioned — inserted into an editable note field.

The advisor stays present in the conversation. The app handles note-taking.

## Pipeline

```
Record → Review → Upload → Transcribe → Summarize → Edit
```

1. **Record** — Browser MediaRecorder captures audio (webm/wav). Full start / pause / resume / restart / stop support.
2. **Review** — Advisor confirms the recording and optionally adds custom instructions before submitting.
3. **Upload** — Browser calls `GET /api/upload-url` for a presigned S3 PUT URL, then PUTs the audio blob directly to S3. Audio never passes through the backend server.
4. **Transcribe + Summarize** — Browser sends `POST /api/summarize` with `{ key, customInstructions? }`. Backend fetches the buffer from S3, transcribes with OpenAI Whisper, summarizes with `gpt-5-mini`, then deletes the S3 object in a `finally` block.
5. **Edit** — The validated summary drops into a textarea. The advisor edits before saving (in-memory; no persistence).

## Stack decisions

| Layer          | Choice                            | Reason                                          |
|----------------|-----------------------------------|-------------------------------------------------|
| Frontend       | Vite + React + TypeScript         | Fast HMR, first-class TS, minimal config        |
| Styling        | Tailwind CSS + shadcn/ui          | Accessible primitives out of the box            |
| Backend        | Node.js + Express + TypeScript    | Simple, well-understood, fast enough            |
| Validation     | Zod                               | Runtime safety for LLM output and request bodies|
| Object storage | AWS S3 (presigned URLs)           | Audio goes browser → S3 directly; backend never buffers it |
| Tests          | Vitest                            | Works in both browser and Node ESM contexts     |

## Security model

- Audio is uploaded directly from the browser to S3 using a presigned PUT URL (5-minute expiry). The backend never buffers audio.
- S3 object key is validated server-side (`key.startsWith('uploads/')`) before any AWS call — prevents path traversal.
- Audio is deleted from S3 in a `finally` block immediately after processing — no long-term PII residency.
- `GET /api/upload-url` validates MIME type against an allowlist: `audio/webm`, `audio/wav`, `audio/mp4`, `audio/mpeg`, `application/octet-stream` (codec parameters stripped before matching).
- CORS origin is set from `FRONTEND_URL` env var — never hardcoded.
- All env vars are validated at startup in `backend/src/config/env.ts` — the server refuses to boot with missing required vars.
- No route returns audio to the client.
- No OpenAI key or AWS credentials in any frontend code.

## AI layer

`backend/src/ai/` contains three files treated as first-class code:

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
  | { status: 'review'; blob: Blob; durationSeconds: number; submitError?: string }
  | { status: 'processing' }
  | { status: 'done'; transcript: string; summary: SummaryOutput }
  | { status: 'error'; stage: string; message: string }
```

## Frontend service layer

All backend HTTP calls go through dedicated service files in `frontend/src/services/`:

- `storage.api.ts` — `getUploadUrl(mimeType)`, `uploadToS3(url, blob)`
- `summarize.api.ts` — `summarizeAudio(blob, customInstructions?)` — orchestrates the full upload + summarize flow
- `notes.api.ts` — `createNote(...)`, `getNotes()`

Components never call `fetch` directly.

## API contract

### GET /api/upload-url

Query: `mimeType=audio/webm` (or wav/mp4/mpeg)

Response `200`:
```json
{ "uploadUrl": "https://s3.amazonaws.com/...", "key": "uploads/<uuid>.webm" }
```

### POST /api/summarize

Request: `application/json`
```json
{ "key": "uploads/<uuid>.webm", "customInstructions": "optional string" }
```

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
- Use shadcn components — do not create custom UI primitives
- State discriminated union: always handle every case explicitly

## Environment variables

Required in `backend/.env`:

```
OPENAI_API_KEY=          # real key or "mock"
S3_BUCKET=
S3_REGION=
S3_ACCESS_KEY=
S3_SECRET_KEY=
FRONTEND_URL=            # defaults to http://localhost:5173
PORT=                    # defaults to 3001
```

## Out of scope

- Authentication, sessions, multi-tenancy
- Persistent storage across reloads
- Deployment / hosting config
- Mobile-native features
- Analytics or logging infrastructure
- Streaming transcription
- S3 lifecycle rules for orphaned objects

## Running locally

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in values
cp .env.example backend/.env

# 3. Start both servers
npm run dev

# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
# Health:   http://localhost:3001/api/health
```
