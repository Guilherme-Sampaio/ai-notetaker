import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'

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

app.use(errorHandler)

const PORT = env.PORT

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})

export default app
