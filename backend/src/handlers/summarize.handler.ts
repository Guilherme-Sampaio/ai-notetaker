import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { AppError } from '../errors/AppError.js'
import { summarizeTranscript, transcribeAudio } from '../services/openai.service.js'
import { deleteObject, getObjectBuffer } from '../services/storage.service.js'
import { mimeTypeFromKey } from '../utils/mimeType.js'

const BodySchema = z.object({
  key: z.string().min(1).startsWith('uploads/', { message: 'Invalid key' }),
  customInstructions: z.string().optional(),
})

export async function handleSummarize(req: Request, res: Response, next: NextFunction) {
  const result = BodySchema.safeParse(req.body)
  if (!result.success) {
    return next(new AppError(result.error.issues[0].message, 400))
  }

  const { key, customInstructions } = result.data

  try {
    const buffer = await getObjectBuffer(key)
    const transcript = await transcribeAudio(buffer, mimeTypeFromKey(key))
    const summary = await summarizeTranscript(transcript, customInstructions)

    res.json({ transcript, summary })
  } catch (err) {
    next(err)
  } finally {
    deleteObject(key).catch((e) => console.error('[s3] deleteObject failed:', e))
  }
}
