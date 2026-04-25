# Known Trade-offs and Gaps

This document honestly describes what was cut and why.

## Audio lost on Whisper failure

If the Whisper API call fails (network error, quota exceeded, timeout), the audio buffer is discarded when the request ends. The advisor must re-record.

**Why accepted:** Adding retry storage means adding either a Redis instance or a disk-based temp file — both contradict the "audio never persists" privacy goal. For a demo this is acceptable. A production system would use a short-TTL (5-minute) encrypted in-memory retry buffer keyed by session.

## No persistent notes across sessions

Notes exist only in React state. A page refresh loses everything.

**Why accepted:** The challenge spec explicitly calls this out of scope. The production path would be a DynamoDB table keyed by advisor and date — naturally key-value, simple point lookups, scales to multi-tenant without schema migrations.

## Single-user, no multi-tenancy

There is no concept of a logged-in advisor. All requests are anonymous. Multiple advisors using the app simultaneously would overwrite each other's state (if server-side state were added).

**Why accepted:** Auth is explicitly out of scope. The in-memory model has no shared server-side state, so concurrent users don't interfere today.

## Batch transcription — no live streaming

The full audio blob is uploaded and transcribed in one shot after the advisor stops recording. The advisor sees nothing until the complete round trip finishes — 20–40 seconds of spinner for a 30-minute meeting.

**Why accepted:** This is a deliberate UX regression. Live streaming requires chunked audio capture, a persistent WebSocket or SSE connection, partial-transcript stitching on the server, and incremental UI updates on the client. That is a meaningfully larger system surface for a demo. Streaming transcription is item #1 on the "next two weeks" list precisely because it is the most user-visible gap.

## Long meetings may approach HTTP timeout limits

An hour-long recording could push the single open POST request close to typical proxy timeout limits (60–120 seconds at most cloud load balancers).

**Why accepted:** Academic advisor meetings are typically 15–30 minutes. Whisper processes approximately 1 minute of audio per 5–10 seconds. A 30-minute meeting processes in well under 60 seconds. The risk is real but low for the target use case.

