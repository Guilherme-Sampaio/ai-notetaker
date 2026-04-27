Review the current git diff (staged + unstaged) against this project's security constraints. Report violations and warnings only — no praise, no summary of what's fine.

## Constraints to enforce

**Audio privacy**
- Audio must never be publicly addressable (no public S3 URLs, no presigned URL bypasses)
- No route may return audio data to the client
- The backend must never receive or buffer audio bytes — the upload flow is browser → S3 via presigned PUT URL
- The S3 object key must be validated server-side (`key.startsWith('uploads/')`) before any AWS call
- The S3 object must be deleted in a `finally` block after processing, regardless of success or failure

**Secrets**
- No API keys, tokens, or credentials hardcoded anywhere
- No secrets in frontend code — especially no OpenAI key or AWS credentials
- All secrets must come from env vars validated in `backend/src/config/env.ts`

**Transport & access control**
- CORS origin must come from `FRONTEND_URL` env var — never hardcoded
- Presigned URL MIME type must be validated against the allowlist before generation; codec parameters must be stripped before matching
- Allowed MIME types: `audio/webm`, `audio/wav`, `audio/mp4`, `audio/mpeg`, `application/octet-stream`

**PII**
- Transcripts and summaries must not be logged or persisted beyond the request lifecycle
- No user-identifiable data written to disk or external services beyond the OpenAI API call

For each violation: file path, line number, what rule it breaks, and a one-line fix.
