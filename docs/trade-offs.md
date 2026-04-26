# Known Trade-offs and Gaps

This document honestly describes what was cut and why.

## Audio lost on Whisper failure

If the transcription call fails (network error, quota exceeded, timeout), the audio buffer is discarded when the request ends. The advisor must re-record.

**Why accepted:** Adding retry storage means adding either a Redis instance or a disk-based temp file — both contradict the "audio never persists" privacy goal. For a demo this is acceptable. A production system would use a short-TTL (5-minute) encrypted in-memory retry buffer keyed by session.

**Partial mitigation already in place:** Validation errors that *aren't* a transcription failure — recording too short (`422`), summary came back empty (`422`) — keep the recorded blob in memory on the client and drop the user back into the review state with `submitError` set. The advisor can adjust custom instructions and re-submit without re-recording. Only true upstream failures (5xx from the provider, network drop) lose the audio.

## Notes persist in process memory only

Saved notes live in a `Map<id, Note>` inside the Node process (`backend/src/db/notes.store.ts`). They survive page reloads and navigation, so the `/notes` list is a real working feature — but they vanish on server restart, and they are shared across every client that hits the server (no advisor scoping).

**Why accepted:** The challenge spec lists persistent storage as out of scope, but the demo needed *some* notion of "saved notes" for the summary-into-note user story to feel real. Process memory is the cheapest way to make save → list → re-open work end-to-end without dragging in a database. The store is a small interface (`insert / findAll / findById / clear`) so swapping in DynamoDB later is a one-file change. Auth-scoped per-advisor notes is the right next step, but lives behind the auth work that is also out of scope.

## Single-user, no multi-tenancy

There is no concept of a logged-in advisor. All requests are anonymous. Two advisors using the same backend would see each other's saved notes.

**Why accepted:** Auth is explicitly out of scope. For a single-user demo it is invisible; for a real deployment it would be the first thing to fix, and it gates the per-advisor notes scoping above.

## Batch transcription — no live streaming

The full audio blob is uploaded and transcribed in one shot after the advisor stops recording. The advisor sees nothing until the complete round trip finishes — 20–40 seconds of spinner for a 30-minute meeting.

**Why accepted:** This is a deliberate UX regression. Live streaming requires chunked audio capture, a persistent WebSocket or SSE connection, partial-transcript stitching on the server, and incremental UI updates on the client. That is a meaningfully larger system surface for a demo. Streaming transcription is item #1 on the "next two weeks" list precisely because it is the most user-visible gap.

## Long meetings may approach HTTP timeout limits

An hour-long recording could push the single open POST request close to typical proxy timeout limits (60–120 seconds at most cloud load balancers).

**Why accepted:** Academic advisor meetings are typically 15–30 minutes. The transcription model processes approximately 1 minute of audio per 5–10 seconds. A 30-minute meeting processes in well under 60 seconds. The risk is real but low for the target use case.

## Custom instructions act before processing, not after

The custom-instructions textarea lives in the review panel (between recording and processing), not in the note editor. An advisor who wants to re-run the summary with different emphasis must record again — there is no "regenerate with new instructions" button on the editor.

**Why accepted:** Re-running the summary against a stored transcript would require either keeping the transcript on the server keyed by some session id (more state, more cleanup) or sending it back from the client (works, but doubles the prompt path). Neither felt warranted for a demo. The review-panel placement also makes the cost model honest: instructions affect the LLM round trip, so they belong at the boundary that triggers it.
