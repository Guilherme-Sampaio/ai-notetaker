# Design Document — AI Notetaker

## Architecture

```
┌─────────────────────── Browser ────────────────────────────┐
│                                                             │
│  /record ──▶ PipelinePage                                  │
│               └── usePipeline (FSM) + useRecorder          │
│                    ├── storage.api.ts  → GET /upload-url   │
│                    │                  → PUT audio → S3      │
│                    └── summarize.api.ts → POST /summarize  │
│                                                             │
│  /notes  ──▶ NotesListPage                                 │
│               └── notes.api.ts → GET/POST /notes           │
└────────────────────────┬────────────────────────────────────┘
                         │ JSON
┌────────────────────────▼────────────────────────────────────┐
│                    Express (Node.js)                         │
│                                                              │
│  GET  /upload-url  → validate mimeType → presigned S3 URL   │
│  POST /summarize   → S3 get → Whisper → GPT → S3 delete     │
│  GET  /notes       → notes.store (Map)                       │
│  POST /notes       → notes.store.insert(...)                 │
│                                                              │
│  AppError ──▶ errorHandler ──▶ { error, message }           │
└──────────────────────────────────────────────────────────────┘
```

## Pipeline state machine

`frontend/src/hooks/usePipeline.ts` owns every transition. Components only render the current state.

```
idle ──start()──▶ recording ◀──resume()──▶ paused
 │                   │ finish()
 │                   ▼
 │               review ──submit()──▶ processing
 │                 ▲                      │ error → back to review
 │                 │                      │ ok
 │            discard/restart             ▼
 │◀───────────────────────────────────  done
 │
 └── error (mic denied / no audio captured)
```

## The three most important trade-offs

### 1. Single long-lived POST over polling / async jobs

**Decision:** One HTTP request to `POST /api/summarize` stays open for the full Whisper + GPT pipeline.

**Why:** Simpler client code (no job ID, no polling loop), no server-side job queue, and no state to clean up. A 5-minute meeting completes in 10–20 seconds — well within typical proxy timeouts.

**Cost:** Long meetings (60+ min) risk hitting proxy timeout limits. The current implementation uses SSE to stream stage-level progress events (`uploading`, `transcribing`, `summarizing`) to the client, which keeps the connection alive and gives the advisor visible feedback — but doesn't eliminate the underlying timeout risk for very long recordings. A job queue is the correct fix if timeouts become a real constraint.

### 2. S3 for audio, in-memory Map for notes

**Decision:** Audio goes browser → S3 via presigned PUT URL; the backend fetches from S3, processes, and immediately deletes. Notes live in a `Map<id, Note>` for the lifetime of the process.

**Why:** Audio never touches the backend server, satisfying the privacy requirement without complex in-memory retry storage. Notes in process memory are enough for demo-day: they survive page reloads (so `/notes` is a real feature) but don't require a database.

**Cost:** If the browser crashes after the S3 upload but before `POST /api/summarize`, the S3 object is orphaned until an S3 lifecycle rule expires it (not yet configured). Notes are lost on server restart and shared across all clients (no auth scoping).

### 3. Batch transcription after recording ends, not live streaming

**Decision:** The full audio blob is uploaded and transcribed in one shot after the advisor stops recording.

**Why:** The transcription API is a single straightforward call. Live streaming requires chunked audio capture, a persistent WebSocket or SSE connection, partial-transcript stitching on the server, and incremental UI updates on the client — a meaningfully larger system surface for a demo.

**Cost:** Deliberate UX regression. For a 30-minute meeting the advisor sees a spinner for 20–40 seconds with no feedback. Streaming transcription is item #1 on the "next two weeks" list.

## What would be built next (two more weeks)

1. **Streaming transcription** — Stream transcription chunks to the client as they arrive, so advisors see partial transcripts in real time instead of waiting for the full round trip.

2. **S3 lifecycle rule** — Configure an expiry policy on the `uploads/` prefix to handle orphaned objects (browser crash after upload, before summarize completes).

3. **Async summarization via WebSocket** — Decouple the summarization pipeline from a single long-lived HTTP request. The client opens a WebSocket connection and triggers processing; the server streams stage events and pushes the final result when ready. This eliminates proxy timeout risk for long meetings and makes retries straightforward.

4. **Real persistence + auth** — Move `notes.store` behind a DynamoDB-backed implementation (the interface is already a thin abstraction), add advisor identity, and scope notes per advisor.