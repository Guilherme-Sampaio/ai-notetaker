# Security Rules

These rules are non-negotiable. Cursor must enforce them inline.

## Audio handling

- `multer` must use `memoryStorage()` — never `diskStorage()`
- `multer` `fileFilter` must whitelist only: `audio/webm`, `audio/wav`, `audio/mp4`, `audio/mpeg`
- No route may return audio data back to the client

## Secrets

- No OpenAI API key or any secret in any frontend file
- No secrets in any committed file (`.env` is gitignored)
- All env vars must be read from `backend/src/config/env.ts`

## LLM output

- All LLM output must be validated with Zod before it reaches a route handler response
- Use `parseSummaryResponse()` from `summarize.validator.ts` — never parse raw JSON inline in a route

## CORS

- CORS `origin` must come from the `FRONTEND_URL` env var — never hardcoded
- Only `GET` and `POST` methods are allowed

## Body limits

- `express.json()` body limit is `1mb` on all JSON routes
- Audio upload limit is `25mb` enforced by multer `limits.fileSize`

## Error handling

- Never call `res.status()` inline in route handlers — always use `next(error)`
- The central `errorHandler` middleware in `backend/src/middleware/errorHandler.ts` owns all error responses
