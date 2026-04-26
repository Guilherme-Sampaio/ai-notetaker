Review the current git diff (staged + unstaged) against this project's security constraints. Report violations and warnings only — no praise, no summary of what's fine.

## Constraints to enforce

**Audio privacy**
- Audio must never be publicly addressable (no public S3 URLs, no signed URL bypasses)
- No route may return audio data to the client
- multer must use `memoryStorage()` — never `diskStorage`

**Secrets**
- No API keys, tokens, or credentials hardcoded anywhere
- No secrets in frontend code — especially no OpenAI key
- All secrets must come from env vars validated in `backend/src/config/env.ts`

**Transport & access control**
- CORS origin must come from `FRONTEND_URL` env var — never hardcoded
- Audio upload limit must remain ≤ 25 MB
- multer fileFilter must whitelist only: `audio/webm`, `audio/wav`, `audio/mp4`, `audio/mpeg`

**PII**
- Transcripts and summaries must not be logged or persisted beyond the request lifecycle
- No user-identifiable data written to disk or external services beyond the OpenAI API call

For each violation: file path, line number, what rule it breaks, and a one-line fix.
