// TODO: validate all required env vars at startup using Zod
// If any required var is missing, throw and prevent the server from booting.
// Export: env object with typed fields { OPENAI_API_KEY, PORT, FRONTEND_URL }

export const env = {
  OPENAI_API_KEY: process.env['OPENAI_API_KEY'] ?? '',
  PORT: Number(process.env['PORT'] ?? 3001),
  FRONTEND_URL: process.env['FRONTEND_URL'] ?? 'http://localhost:5173',
}
