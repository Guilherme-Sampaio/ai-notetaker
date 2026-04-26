import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import summarizeRouter from './routes/summarize.routes.js'
import notesRouter from './routes/notes.routes.js'

const app = express()

app.use(
  cors({
    origin: env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  }),
)

app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/summarize', summarizeRouter)
app.use('/api/notes', notesRouter)

app.use(errorHandler)

const PORT = env.PORT

if (process.env['VITEST'] !== 'true') {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`)
  })
}

export default app
