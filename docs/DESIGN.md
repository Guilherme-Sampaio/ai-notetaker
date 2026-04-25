# Design Document — AI Notetaker

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                           │
│                                                          │
│  ┌──────────────┐    ┌──────────────┐                   │
│  │ useRecorder  │    │  usePipeline │                   │
│  │              │───▶│  (state FSM) │                   │
│  │ MediaRecorder│    │              │                   │
│  └──────────────┘    └──────┬───────┘                   │
│                             │                            │
│                    ┌────────▼────────┐                  │
│                    │  api.ts         │                  │
│                    │  POST /api/     │                  │
│                    │  process        │                  │
│                    └────────┬────────┘                  │
└─────────────────────────────┼───────────────────────────┘
                              │ multipart/form-data
                              │ (audio blob + customInstructions)
┌─────────────────────────────▼───────────────────────────┐
│                     Express (Node.js)                    │
│                                                          │
│  multer (memoryStorage)                                  │
│       │                                                  │
│       ▼                                                  │
│  process.routes.ts                                       │
│       │                                                  │
│       ▼                                                  │
│  openai.service.ts                                       │
│   ├── Whisper API ──▶ transcript: string                 │
│   └── gpt-5-mini  ──▶ raw JSON string                   │
│       │                                                  │
│       ▼                                                  │
│  parseSummaryResponse()  (Zod validation)                │
│       │                                                  │
│       ▼                                                  │
│  { transcript, summary }  ──▶  200 JSON                  │
└─────────────────────────────────────────────────────────┘
```

## The three most important trade-offs

### 1. Single long-lived POST over polling / async jobs

**Decision:** One HTTP request stays open for the full Whisper + GPT pipeline.

**Why:** Simpler client code (no job ID, no polling loop), no server-side job queue, and no state to clean up. Whisper on a 5-minute meeting completes in 10–20 seconds — well within typical proxy timeouts.

**Cost:** Long meetings risk hitting HTTP timeout limits at the proxy/load-balancer layer. Streaming or a job queue would fix this but doubles system complexity.

### 2. In-memory audio over object storage (S3)

**Decision:** `multer memoryStorage` — audio lives only in RAM for the lifetime of one request.

**Why:** Eliminates a storage layer, a signed-URL layer, a lifecycle/deletion policy, and any risk of audio becoming publicly addressable. Simplest possible privacy posture.

**Cost:** Audio is lost if the Whisper call fails. No retry without re-recording. Acceptable for a time-boxed demo; a production system would want at least a short-TTL retry store.

### 3. Batch transcription after recording ends, not live streaming

**Decision:** The full audio blob is uploaded and transcribed in one shot after the advisor stops recording. The advisor sees nothing until the complete round trip finishes.

**Why:** Whisper's batch API is a single straightforward call. Live streaming requires chunked audio capture, a persistent WebSocket or SSE connection, partial-transcript stitching on the server, and incremental UI updates on the client — a meaningfully larger system surface for a demo.

**Cost:** Deliberate UX regression. For a 30-minute meeting the advisor stares at a spinner for 20–40 seconds with no feedback. Streaming transcription would be item #1 on the "next two weeks" list precisely because it's the most user-visible gap.

## What would be built next (two more weeks)

1. **Streaming transcription** — Stream Whisper chunks to the client as they arrive, so advisors see partial transcripts in real time instead of waiting for the full upload + processing round trip.

2. **Retry storage** — A short-TTL Redis or in-memory buffer that holds the audio buffer for 5 minutes after a Whisper failure, so the advisor can retry without re-recording.

3. **Session persistence** — A DynamoDB table to persist notes and transcripts across sessions, with a "past meetings" list. DynamoDB fits here because the data is naturally key-value, access patterns are simple point lookups, and it scales to multi-tenant without schema migrations.
