# Design Document — AI Notetaker

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                            Browser                                │
│                                                                   │
│   ┌─────────┐                                                     │
│   │ Sidebar │   /record  ─────────────────────────────────┐      │
│   │  nav    │   /notes   ──────────────────────┐          │      │
│   └─────────┘                                  │          │      │
│                                                ▼          ▼      │
│                                       ┌────────────┐  ┌────────────┐
│                                       │  Notes     │  │  Pipeline  │
│                                       │  ListPage  │  │  Page      │
│                                       └─────┬──────┘  └────────────┘
│                                             │              │      │
│                                             │       ┌──────┴──────┐
│                                             │       │ usePipeline │
│                                             │       │ (state FSM) │
│                                             │       │ + useRecorder│
│                                             │       │  (MediaRec.) │
│                                             │       └──────┬──────┘
│                                             │              │      │
│                              ┌──────────────▼─┐    ┌───────▼──────┐
│                              │  notes.api.ts  │    │ summarize.   │
│                              │  GET /api/     │    │ api.ts       │
│                              │  notes         │    │ POST /api/   │
│                              │  POST /api/    │    │ summarize    │
│                              │  notes         │    │              │
│                              └──────┬─────────┘    └──────┬───────┘
│                                     │                     │      │
└─────────────────────────────────────┼─────────────────────┼──────┘
                                      │ application/json    │ multipart/form-data
                                      │                     │ (audio + customInstructions)
┌─────────────────────────────────────▼─────────────────────▼──────┐
│                         Express (Node.js)                         │
│                                                                   │
│   ┌─────────────────────────────┐   ┌─────────────────────────┐  │
│   │  notes.routes ──▶ handler   │   │ summarize.routes        │  │
│   │  ▼                          │   │  ▼ multer (memoryStorage)│ │
│   │  notes.service              │   │  ▼ summarize.handler    │  │
│   │  ▼                          │   │  ▼                      │  │
│   │  notes.store (Map<id,Note>) │   │  openai.provider ◀──────┐│ │
│   └─────────────────────────────┘   │  switches by env:       ││ │
│                                     │   real ⇄ mock           ││ │
│                                     │  ▼                      ││ │
│                                     │  openai.service         ││ │
│                                     │   ├─ gpt-4o-transcribe  ││ │
│                                     │   └─ gpt-5-mini         ││ │
│                                     │      (json_schema strict)│ │
│                                     │      ▼                  ││ │
│                                     │  parseSummaryResponse   ││ │
│                                     │   (Zod, safe fallback)  ││ │
│                                     │  ▼                      ││ │
│                                     │  { transcript, summary }││ │
│                                     └─────────────────────────┘│ │
│                                                                 │ │
│   AppError ──▶ errorHandler middleware ──▶ JSON { error, msg } ◀┘ │
└──────────────────────────────────────────────────────────────────┘
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
    │       │       submit()             │   review     │
    │       │  ┌────────────────────────▶│ blob,        │
    │       │  │                         │ submitError? │
    │       │  │                         └──────┬───────┘
    │       │  │                                │ submit(customInstructions)
    │       │  │                                ▼
    │       │  │                         ┌──────────────┐
    │       │  └─────────── 422 ─────────│ processing   │
    │       │       (back to review,     └──────┬───────┘
    │       │        keep blob)                 │ ok
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

| Method | Path                | Body                                              | Returns                              |
|--------|---------------------|---------------------------------------------------|--------------------------------------|
| GET    | `/api/health`       | —                                                 | `{ status: 'ok' }`                   |
| POST   | `/api/summarize`    | `multipart/form-data` (audio + customInstructions)| `{ transcript, summary }`            |
| POST   | `/api/notes`        | `application/json` (transcript + summary)         | `Note` (201)                         |
| GET    | `/api/notes`        | —                                                 | `{ notes: Note[] }` (newest first)   |

All errors funnel through `errorHandler` middleware, which serializes `AppError` instances to `{ error, message }` with the right status code and falls back to a generic 500 for unhandled throws. Route handlers always call `next(err)` — never `res.status()` inline.

## The three most important trade-offs

### 1. Single long-lived POST over polling / async jobs

**Decision:** One HTTP request stays open for the full Whisper + GPT pipeline.

**Why:** Simpler client code (no job ID, no polling loop), no server-side job queue, and no state to clean up. A 5-minute meeting completes in 10–20 seconds — well within typical proxy timeouts.

**Cost:** Long meetings risk hitting HTTP timeout limits at the proxy/load-balancer layer. Streaming or a job queue would fix this but doubles system complexity.

### 2. In-memory audio + in-memory notes over real persistence (S3 + DB)

**Decision:** `multer memoryStorage` for audio, a `Map<id, Note>` for saved notes (`backend/src/db/notes.store.ts`). Nothing touches disk.

**Why:** One coherent privacy/simplicity posture. Audio lives only in RAM for the lifetime of one request and disappears. Notes live in process memory — they survive page reloads (so the `/notes` list is a real feature, not a stub) but disappear on server restart. No storage layer, no signed URLs, no IAM, no migrations, no deletion policy.

**Cost:** Audio is lost if the Whisper call fails. Saved notes are lost on server restart and shared across all clients (no auth, no scoping). Acceptable for a time-boxed demo; a production system would back the same `notes.store` interface with DynamoDB and put audio in S3 with short-TTL encrypted retry storage.

### 3. Batch transcription after recording ends, not live streaming

**Decision:** The full audio blob is uploaded and transcribed in one shot after the advisor stops recording. The advisor sees nothing until the complete round trip finishes.

**Why:** The transcription API is a single straightforward call. Live streaming requires chunked audio capture, a persistent WebSocket or SSE connection, partial-transcript stitching on the server, and incremental UI updates on the client — a meaningfully larger system surface for a demo.

**Cost:** Deliberate UX regression. For a 30-minute meeting the advisor stares at a spinner for 20–40 seconds with no feedback. Streaming transcription is item #1 on the "next two weeks" list precisely because it is the most user-visible gap.

## Notable design choices made during build

- **Review step before submission.** A `review` state was inserted between `paused/recording` and `processing`. The advisor confirms the recording, optionally adds custom instructions, and only then triggers the LLM round trip. This places the custom-instructions input where it actually changes the outcome — at the prompt boundary — rather than after the summary has already been produced.
- **422 errors degrade in place.** "Recording too short" and "doesn't look like an advising session" return `422` from the backend. The frontend keeps the blob and drops the user back into the `review` state with `submitError` set, instead of tearing down the recording. Other errors surface via Sonner toast without disrupting state.
- **Mock provider behind a runtime switch.** `services/openai.provider.ts` re-exports either `openai.service` or `openai.mock.service` depending on whether `OPENAI_API_KEY === 'mock'`. The route handler is identical in both modes — there is no `if (mock)` branching downstream. This keeps the demo runnable without a real key and lets backend integration tests run offline.
- **gpt-5-mini in `json_schema` strict mode.** The summary structure is enforced by OpenAI's response_format, not just by the prompt. Zod still validates the parsed JSON at the boundary as defense in depth, with a safe empty-arrays fallback if the schema ever drifts.

## What would be built next (two more weeks)

1. **Streaming transcription** — Stream transcription chunks to the client as they arrive, so advisors see partial transcripts in real time instead of waiting for the full round trip.

2. **Real persistence + auth** — Move `notes.store` behind a DynamoDB-backed implementation (the interface is already a thin abstraction), add advisor identity, and scope notes per advisor. Pair with short-TTL encrypted audio retry storage so failed Whisper calls don't force re-recording.

3. **Search and tagging on the notes list** — As soon as notes survive across sessions, the linear list stops scaling. Full-text search across transcripts, plus advisor-defined tags (course, term, student) on each note.
