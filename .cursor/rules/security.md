# Security Rules

These rules are non-negotiable. Cursor must enforce them inline.

## Audio handling

- Audio is uploaded directly from the browser to S3 using a presigned PUT URL — the backend must never buffer audio in memory or on disk
- `GET /api/upload-url` must validate `mimeType` against the allowlist before generating any presigned URL
- Allowed MIME types: `audio/webm`, `audio/wav`, `audio/mp4`, `audio/mpeg`, `application/octet-stream`; codec parameters (`;codecs=opus`) must be stripped before matching
- The S3 object key passed to `POST /api/summarize` must be validated server-side: `key.startsWith('uploads/')` — reject anything else before any AWS call
- The S3 object must be deleted in a `finally` block after processing, regardless of success or failure
- No route may return audio data back to the client

## Secrets

- No OpenAI API key, AWS credentials, or any secret in any frontend file
- No secrets in any committed file (`.env` is gitignored)
- All env vars must be read from `backend/src/config/env.ts`
- AWS credentials (`S3_ACCESS_KEY`, `S3_SECRET_KEY`) must never appear in responses or logs

## LLM output

- All LLM output must be validated with Zod before it reaches a route handler response
- Use `parseSummaryResponse()` from `backend/src/ai/summarize.validator.ts` — never parse raw JSON inline in a route

## CORS

- CORS `origin` must come from the `FRONTEND_URL` env var — never hardcoded
- Only `GET` and `POST` methods are allowed

## Body limits

- `express.json()` body limit is `1mb` on all JSON routes
- S3 upload size is governed by the presigned URL expiry (5 minutes) — the backend does not receive audio bytes

## Error handling

- Never call `res.status()` inline in route handlers — always use `next(error)`
- The central `errorHandler` middleware in `backend/src/middleware/errorHandler.ts` owns all error responses
