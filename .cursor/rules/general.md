# General Cursor Rules

Refer to `CLAUDE.md` at the repo root for full project context before making any changes.

## Component patterns

- No pipeline logic in components — all state transitions live in `usePipeline.ts`
- Components receive state and callbacks as props; they never import pipeline logic directly
- All recording logic is encapsulated in `useRecorder.ts`

## API calls

- All backend calls go through `frontend/src/services/api.ts` only
- No component or hook should call `fetch`/`axios` directly to the backend

## UI

- Use shadcn/ui components — do not create custom UI primitives from scratch
- Tailwind for layout and spacing; no inline styles

## State

- Pipeline state is a discriminated union (`PipelineState`)
- Always handle every `status` case explicitly — no fallthrough, no unhandled states
- Never store derived data separately if it can be derived from `PipelineState`

## Request model

- No polling — the pipeline runs in a single long-lived `POST /api/process` request
- Do not add timers, intervals, or status-check endpoints
