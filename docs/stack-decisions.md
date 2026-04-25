# Stack Decisions

## React

Component model maps naturally to the pipeline's discrete states — each status (idle, recording, processing, done, error) renders a clearly scoped subtree. The hook system (`useRecorder`, `usePipeline`) lets state logic live outside components and be tested independently. React 18's concurrent features aren't needed here, but the ecosystem (Testing Library, shadcn/ui's Radix primitives) made it the lowest-friction choice for a project with real accessibility requirements.

## TypeScript

Used across both frontend and backend. Shared types (e.g. `SummaryOutput`) are defined once and imported by both sides, so a schema change in the backend is immediately a type error in the frontend. This matters most at the LLM boundary — Zod infers TypeScript types from the same schema it validates at runtime, so the type and the validator are always in sync.

## Vite

Native ESM in development and esbuild for transforms gives sub-500ms cold starts and instant HMR regardless of dependency tree size. TypeScript path aliases work out of the box. It is the current standard for new React projects and has no maintenance concerns.

## Node.js and Express

Node.js keeps the entire stack in TypeScript — shared types between frontend and backend, one runtime to configure, one package manager. Express on top of it brings the largest ecosystem of production-tested middleware (multer, cors, helmet) and the most well-understood error-handling model (`(err, req, res, next)`). For a backend with a single endpoint, simplicity and ecosystem coverage matter more than raw throughput. The four-argument error middleware maps directly to the "all errors flow through one place" requirement.

## multer

Standard Express middleware for `multipart/form-data` with a well-tested `memoryStorage` adapter that keeps the audio buffer in RAM only. Filesize limits and MIME type filtering are first-class options, which covers two of the security requirements (25 MB cap, audio-only whitelist) without any custom parsing code.

## shadcn/ui and Tailwind

shadcn components are built on Radix UI primitives, which implement WAI-ARIA patterns — focus trapping, keyboard navigation, screen reader announcements — correctly out of the box. This covers the accessibility requirements (keyboard-operable controls, aria-live regions) without any custom implementation. Tailwind handles spacing and layout without a separate CSS file.

## Zod

LLMs return untyped strings. Without runtime validation, a hallucinated key name or missing field silently becomes `undefined` in TypeScript, bypassing type safety entirely. Zod validates parsed JSON at the boundary and either returns a typed `SummaryOutput` or falls back to safe empty arrays. Nothing downstream ever sees unvalidated LLM data.
