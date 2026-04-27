# Design Document — AI Notetaker

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                              Browser                                  │
│                                                                       │
│   ┌─────────┐                                                         │
│   │ Sidebar │   /record  ──────────────────────────────────────┐     │
│   │  nav    │   /notes   ──────────────────────┐               │     │
│   └─────────┘                                  │               │     │
│                                                ▼               ▼     │
│                                       ┌────────────┐  ┌────────────┐ │
│                                       │  Notes     │  │  Pipeline  │ │
│                                       │  ListPage  │  │  Page      │ │
│                                       └─────┬──────┘  └─────┬──────┘ │
│                                             │               │        │
│                                             │        ┌──────┴───────┐│
│                                             │        │ usePipeline  ││
│                                             │        │ (state FSM)  ││
│                                             │        │ + useRecorder││
│                                             │        │  (MediaRec.) ││
│                                             │        └──────┬───────┘│
│                              ┌──────────────▼─┐             │        │
│                              │  notes.api.ts  │    ┌────────▼───────┐│
│                              │  GET /api/notes│    │ storage.api.ts ││
│                              │  POST /api/    │    │ GET /api/      ││
│                              │  notes         │    │ upload-url     ││
│                              └──────┬─────────┘    │ PUT → S3       ││
│                                     │              └────────┬───────┘│
│                                     │              ┌────────▼───────┐│
│                                     │              │summarize.api.ts││
│                                     │              │POST /api/      ││
│                                     │              │summarize       ││
│                                     │              └────────┬───────┘│
└─────────────────────────────────────┼─────────────────────-┼────────┘
                                      │ application/json      │ application/json
                                      │                       │ { key, customInstructions }
                     ┌────────────────▼───────────────────────▼───────┐
                     │                  AWS S3                         │
                     │  Browser PUTs audio blob via presigned URL      │
                     │  Backend GETs audio buffer + deletes after use  │
                     └────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────┐
│                         Express (Node.js)                             │
│                                                                       │
│   ┌─────────────────────────────┐   ┌─────────────────────────────┐  │
│   │  notes.routes ──▶ handler   │   │ uploadUrl.routes             │  │
│   │  ▼                          │   │  ▼ uploadUrl.handler         │  │
│   │  notes.service              │   │    (validate mimeType,       │  │
│   │  ▼                          │   │     generate presigned URL)  │  │
│   │  notes.store (Map<id,Note>) │   └─────────────────────────────┘  │
│   └─────────────────────────────┘   ┌─────────────────────────────┐  │
│                                     │ summarize.routes             │  │
│                                     │  ▼ summarize.handler         │  │
│                                     │    (validate key,            │  │
│                                     │     getObjectBuffer,         │  │
│                                     │     openai.provider ◀──────┐ │  │
│                                     │     switches by env:        │ │  │
│                                     │       real ⇄ mock          │ │  │
│                                     │     transcribeAudio,        │ │  │
│                                     │     summarizeTranscript,    │ │  │
│                                     │     deleteObject [finally]) │ │  │
│                                     │  ▼                          │ │  │
│                                     │  parseSummaryResponse       │ │  │
│                                     │   (Zod, safe fallback)      │ │  │
│                                     │  ▼                          │ │  │
│                                     │  { transcript, summary }    │ │  │
│                                     └─────────────────────────────┘ │  │
│                                                                      │  │
│   AppError ──▶ errorHandler middleware ──▶ JSON { error, msg }  ◀───┘  │
└──────────────────────────────────────────────────────────────────────┘
```

## Pipeline state machine

`frontend/src/hooks/usePipeline.ts` owns every transition. Components only render the current state.

```
                       start()
              ┌──────────────────────┐
              ▼                      │
┌────────┐  pause()  ┌────────┐  resume()  ┌──────────┐
│  idle  │◀─────────│ paused │◀──────────▶│ recording │
└───┬────┘ restart() └────────┘            └─────┬─────┘
    │                                            │
    │  discard()/restart()           finish(durationSeconds)
    │       ▲                                    ▼
    │       │                            ┌──────────────┐
    │       │       submit()             │    review    │
    │       │  ┌────────────────────────▶│ blob,        │
    │       │  │                         │ durationSec  │
    │       │  │                         │ submitError? │
    │       │  │                         └──────┬───────┘
    │       │  │                                │ submit(customInstructions)
    │       │  │                                ▼
    │       │  │                         ┌──────────────┐
    │       │  │                         │  processing  │
    │       │  │   error (non-fatal)     │  (upload →   │
    │       │  └─────────────────────────│   summarize) │
    │       │   (back to review,         └──────┬───────┘
    │       │    submitError set)               │ ok
    │       │                                   ▼
    │       │                            ┌──────────────┐
    │       └────────────────────────────│    done      │
    │       discard / save → /notes      │ transcript,  │
    │                                    │ summary      │
    │                                    └──────────────┘
    │
    └──── error  (mic permission denied / no audio captured)
```

## API

| Method | Path                | Body / Query                                      | Returns                              |
|--------|---------------------|---------------------------------------------------|--------------------------------------|
| GET    | `/api/health`       | —                                                 | `{ status: 'ok' }`                   |
| GET    | `/api/upload-url`   | `?mimeType=audio/webm`                            | `{ uploadUrl, key }`                 |
| POST   | `/api/summarize`    | `application/json` `{ key, customInstructions? }` | `{ transcript, summary }`            |
| POST   | `/api/notes`        | `application/json` `{ transcript, summary }`      | `Note` (201)                         |
| GET    | `/api/notes`        | —                                                 | `{ notes: Note[] }` (newest first)   |

All errors funnel through `errorHandler` middleware, which serializes `AppError` instances to `{ error, message }` with the right status code and falls back to a generic 500 for unhandled throws. Route handlers always call `next(err)` — never `res.status()` inline.

## The three most important trade-offs

### 1. Single long-lived POST over polling / async jobs

**Decision:** One HTTP request to `POST /api/summarize` stays open for the full Whisper + GPT pipeline.

**Why:** Simpler client code (no job ID, no polling loop), no server-side job queue, and no state to clean up. A 5-minute meeting completes in 10–20 seconds — well within typical proxy timeouts.

**Cost:** Long meetings risk hitting HTTP timeout limits at the proxy/load-balancer layer. Streaming or a job queue would fix this but doubles system complexity.

### 2. S3 for audio, in-memory Map for notes

**Decision:** Audio goes browser → S3 via presigned PUT URL; the backend fetches from S3, processes, and immediately deletes. Notes live in a `Map<id, Note>` for the lifetime of the process.

**Why:** Audio never touches the backend server, satisfying the privacy requirement without complex in-memory retry storage. Notes in process memory are enough for demo-day: they survive page reloads (so `/notes` is a real feature) but don't require a database.

**Cost:** If the browser crashes after the S3 upload but before `POST /api/summarize`, the S3 object is orphaned until an S3 lifecycle rule expires it (not yet configured). Notes are lost on server restart and shared across all clients (no auth scoping).

### 3. Batch transcription after recording ends, not live streaming

**Decision:** The full audio blob is uploaded and transcribed in one shot after the advisor stops recording.

**Why:** The transcription API is a single straightforward call. Live streaming requires chunked audio capture, a persistent WebSocket or SSE connection, partial-transcript stitching on the server, and incremental UI updates on the client — a meaningfully larger system surface for a demo.

**Cost:** Deliberate UX regression. For a 30-minute meeting the advisor sees a spinner for 20–40 seconds with no feedback. Streaming transcription is item #1 on the "next two weeks" list.

## Notable design choices made during build

- **Review step before submission.** A `review` state sits between recording and processing. The advisor confirms the recording, optionally adds custom instructions, and only then triggers the LLM round trip. This places the custom-instructions input at the prompt boundary — where it actually changes the outcome.
- **Presigned URL upload.** Audio goes browser → S3 directly. The backend server never receives audio bytes, which keeps the server stateless with respect to audio and avoids the 25 MB body limit entirely.
- **Object deleted in `finally`.** The S3 object is deleted after processing regardless of success or failure. This prevents long-term PII residency even when transcription fails.
- **Error path simplified.** All errors set `submitError` in the `review` state unconditionally; the prior 422-vs-5xx distinction was fragile and has been removed.
- **NavigationConfirm guard.** An accessible modal fires when the user tries to leave the pipeline mid-session (`useBlocker` for in-app navigation, `beforeunload` for browser close). Focus trap, Escape cancels, `aria-modal`.
- **Mock provider behind a runtime switch.** `services/openai.provider.ts` re-exports either `openai.service` or `openai.mock.service` depending on whether `OPENAI_API_KEY === 'mock'`. The route handler is identical in both modes — no `if (mock)` branching downstream.
- **gpt-5-mini in `json_schema` strict mode.** The summary structure is enforced by OpenAI's response_format. Zod still validates the parsed JSON at the boundary as defense in depth, with a safe empty-arrays fallback if the schema ever drifts.

## What would be built next (two more weeks)

1. **Streaming transcription** — Stream transcription chunks to the client as they arrive, so advisors see partial transcripts in real time instead of waiting for the full round trip.

2. **S3 lifecycle rule** — Configure an expiry policy on the `uploads/` prefix to handle orphaned objects (browser crash after upload, before summarize completes).

3. **Real persistence + auth** — Move `notes.store` behind a DynamoDB-backed implementation (the interface is already a thin abstraction), add advisor identity, and scope notes per advisor.

4. **Search and tagging on the notes list** — Full-text search across transcripts, plus advisor-defined tags (course, term, student) on each note.
