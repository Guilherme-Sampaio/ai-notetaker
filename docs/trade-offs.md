# Known Trade-offs and Gaps

This document honestly describes what was cut and why.

## Audio lost on Whisper failure

If the transcription call fails (network error, quota exceeded, timeout), the S3 object is deleted in the `finally` block and the advisor must re-record. There is no client-side retry buffer.

**Why accepted:** Keeping the blob client-side after an upload-and-process failure would require signaling the specific failure type back through the error response, then having the frontend decide whether to retain the blob. The simpler model: always delete the object on the backend, always require re-recording on failure. For a demo this is acceptable. A production system would use a short-TTL (5-minute) presigned GET URL returned alongside the error so the client could re-submit the same key without re-recording.

**Partial mitigation already in place:** Errors that occur before the S3 upload (recording too short, no audio captured) surface as `submitError` in the `review` state and keep the blob client-side. Only errors that happen after the upload lose the audio.

## S3 orphan-object risk

If the browser crashes after the S3 upload but before `POST /api/summarize` is called, the `uploads/<uuid>` object sits in S3 indefinitely.

**Why accepted:** The failure window is a few seconds and the probability of a browser crash in that window is very low for a demo. The correct mitigation is an S3 lifecycle rule that expires objects under the `uploads/` prefix after a short TTL (e.g., 1 hour) — this is not currently configured but is the documented next step.

## Notes persist in process memory only; no multi-tenancy

Saved notes live in a `Map<id, Note>` inside the Node process (`backend/src/db/notes.store.ts`). They survive page reloads and navigation, so the `/notes` list is a real working feature — but they vanish on server restart. There is no concept of a logged-in advisor: all requests are anonymous, and two advisors hitting the same backend would see each other's notes.

**Why accepted:** The challenge spec lists both persistent storage and auth as out of scope. Process memory is the cheapest way to make save → list → re-open work end-to-end without a database. The store is a small interface (`insert / findAll / findById / clear`) so swapping in DynamoDB is a one-file change. Auth-scoped per-advisor notes is the right next step, but depends on the auth work that is also out of scope.

## Batch transcription — no live streaming

The full audio blob is uploaded and transcribed in one shot after the advisor stops recording. The advisor sees nothing until the complete round trip finishes — 20–40 seconds of spinner for a 30-minute meeting.

**Why accepted:** Live streaming requires chunked audio capture, a persistent WebSocket or SSE connection, partial-transcript stitching on the server, and incremental UI updates on the client — a meaningfully larger system surface for a demo. Streaming transcription is item #1 on the "next two weeks" list precisely because it is the most user-visible gap.

## Long meetings may approach HTTP timeout limits

An hour-long recording could push the single open `POST /api/summarize` request close to typical proxy timeout limits (60–120 seconds at most cloud load balancers).

**Partial mitigation already in place:** The backend streams SSE stage-level progress events (`uploading`, `transcribing`, `summarizing`) to the client, keeping the connection alive and giving the advisor visible feedback throughout the round trip.

**Why accepted:** Academic advisor meetings are typically 15–30 minutes. The transcription model processes approximately 1 minute of audio per 5–10 seconds. A 30-minute meeting processes in well under 60 seconds. The risk is real but low for the target use case. The correct fix for very long recordings is an async job queue with WebSocket delivery — item #3 on the "next two weeks" list.
