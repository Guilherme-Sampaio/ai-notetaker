# Known Trade-offs and Gaps

This document honestly describes what was cut and why.

## Audio lost on Whisper failure

If the transcription call fails (network error, quota exceeded, timeout), the S3 object is deleted in the `finally` block and the advisor must re-record. There is no client-side retry buffer.

**Why accepted:** Keeping the blob client-side after an upload-and-process failure would require signaling the specific failure type back through the error response, then having the frontend decide whether to retain the blob. The simpler model: always delete the object on the backend, always require re-recording on failure. For a demo this is acceptable. A production system would use a short-TTL (5-minute) presigned GET URL returned alongside the error so the client could re-submit the same key without re-recording.

**Partial mitigation already in place:** Errors that occur before the S3 upload (recording too short, no audio captured) surface as `submitError` in the `review` state and keep the blob client-side. Only errors that happen after the upload lose the audio.

## S3 orphan-object risk

If the browser crashes after the S3 upload but before `POST /api/summarize` is called, the `uploads/<uuid>` object sits in S3 indefinitely.

**Why accepted:** The failure window is a few seconds and the probability of a browser crash in that window is very low for a demo. The correct mitigation is an S3 lifecycle rule that expires objects under the `uploads/` prefix after a short TTL (e.g., 1 hour) — this is not currently configured but is the documented next step.

## Notes persist in process memory only

Saved notes live in a `Map<id, Note>` inside the Node process (`backend/src/db/notes.store.ts`). They survive page reloads and navigation, so the `/notes` list is a real working feature — but they vanish on server restart, and they are shared across every client that hits the server (no advisor scoping).

**Why accepted:** The challenge spec lists persistent storage as out of scope. Process memory is the cheapest way to make save → list → re-open work end-to-end without dragging in a database. The store is a small interface (`insert / findAll / findById / clear`) so swapping in DynamoDB later is a one-file change. Auth-scoped per-advisor notes is the right next step, but lives behind the auth work that is also out of scope.

## Single-user, no multi-tenancy

There is no concept of a logged-in advisor. All requests are anonymous. Two advisors using the same backend would see each other's saved notes.

**Why accepted:** Auth is explicitly out of scope. For a single-user demo it is invisible; for a real deployment it would be the first thing to fix.

## Batch transcription — no live streaming

The full audio blob is uploaded and transcribed in one shot after the advisor stops recording. The advisor sees nothing until the complete round trip finishes — 20–40 seconds of spinner for a 30-minute meeting.

**Why accepted:** Live streaming requires chunked audio capture, a persistent WebSocket or SSE connection, partial-transcript stitching on the server, and incremental UI updates on the client — a meaningfully larger system surface for a demo. Streaming transcription is item #1 on the "next two weeks" list precisely because it is the most user-visible gap.

## Long meetings may approach HTTP timeout limits

An hour-long recording could push the single open `POST /api/summarize` request close to typical proxy timeout limits (60–120 seconds at most cloud load balancers).

**Why accepted:** Academic advisor meetings are typically 15–30 minutes. The transcription model processes approximately 1 minute of audio per 5–10 seconds. A 30-minute meeting processes in well under 60 seconds. The risk is real but low for the target use case.

## Custom instructions act before processing, not after

The custom-instructions textarea lives in the review panel (between recording and processing), not in the note editor. An advisor who wants to re-run the summary with different emphasis must record again — there is no "regenerate with new instructions" button on the editor.

**Why accepted:** Re-running the summary against a stored transcript would require either keeping the transcript on the server keyed by some session id (more state, more cleanup) or sending it back from the client (works, but doubles the prompt path). Neither felt warranted for a demo. The review-panel placement also makes the cost model honest: instructions affect the LLM round trip, so they belong at the boundary that triggers it.
