# Stack Decisions

## React

Component model maps naturally to the pipeline's discrete states — each status (idle, recording, paused, review, processing, done, error) renders a clearly scoped subtree. The hook system (`useRecorder`, `usePipeline`) lets state logic live outside components and be tested independently. React 18's concurrent features aren't needed here, but the ecosystem (Testing Library, shadcn/ui's Radix primitives, react-router) made it the lowest-friction choice for a project with real accessibility requirements.

## TypeScript

Used across both frontend and backend. The `SummaryOutput` Zod schema in `backend/src/ai/summarize.schema.ts` is the single source of truth for the LLM output shape, and the matching `SummaryOutput` interface is mirrored in `frontend/src/types/summary.types.ts` so a schema change is immediately a type error in the frontend. Zod infers TypeScript types from the same schema it validates at runtime, so the type and the validator are always in sync.

## Vite

Native ESM in development and esbuild for transforms gives sub-500ms cold starts and instant HMR regardless of dependency tree size. TypeScript path aliases work out of the box. It is the current standard for new React projects and has no maintenance concerns.

## Node.js and Express

Node.js keeps the entire stack in TypeScript — shared types between frontend and backend, one runtime to configure, one package manager. Express on top of it brings the largest ecosystem of production-tested middleware (multer, cors) and the most well-understood error-handling model (`(err, req, res, next)`). For a backend with two endpoints, simplicity and ecosystem coverage matter more than raw throughput. The four-argument error middleware maps directly to the "all errors flow through one place" requirement — in practice, every handler calls `next(new AppError(...))` and the central `errorHandler` serializes it.

## multer

Standard Express middleware for `multipart/form-data` with a well-tested `memoryStorage` adapter that keeps the audio buffer in RAM only. Filesize limits and MIME type filtering are first-class options, which covers two of the security requirements (25 MB cap, audio-only whitelist) without any custom parsing code. The whitelist also accepts `application/octet-stream` because `MediaRecorder` blobs occasionally arrive with that content type from Chromium.

## shadcn/ui and Tailwind

shadcn components are built on Radix UI primitives, which implement WAI-ARIA patterns — focus trapping, keyboard navigation, screen reader announcements — correctly out of the box. This covers the accessibility requirements (keyboard-operable controls, aria-live regions) without any custom implementation. Tailwind handles spacing and layout without a separate CSS file. `lucide-react` is the standard shadcn icon set and pairs with it directly.

## Zod

LLMs return untyped strings. Without runtime validation, a hallucinated key name or missing field silently becomes `undefined` in TypeScript, bypassing type safety entirely. Zod validates parsed JSON at the boundary and either returns a typed `SummaryOutput` or falls back to safe empty arrays. Nothing downstream ever sees unvalidated LLM data.

The same `SummaryOutputSchema` is also reused by `notes.handler.ts` to validate the body of `POST /api/notes` — one schema, two boundaries.

In practice, gpt-5-mini is called with `response_format: { type: 'json_schema', strict: true }`, which means OpenAI itself enforces the shape before returning. Zod is defense in depth: cheap to keep, the only thing that catches a model regression or a future provider switch.

## Vitest + supertest + Testing Library

Vitest works in both browser-like (jsdom) and Node ESM contexts with one config, which means the same test runner covers backend handlers (with `supertest` mounting `app` directly — no live port) and frontend components (with `@testing-library/react`). One mental model, one CLI, one set of mocks. Backend tests can hit the real Express app without spinning up an HTTP server; frontend hook tests can drive `MediaRecorder` mocks without a real browser.