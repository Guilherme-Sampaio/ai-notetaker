import type { NextFunction, Request, Response } from 'express'
import { transcribeAudio } from '../services/openai.provider.js'

export async function handleSummarize(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return next(Object.assign(new Error('No audio file provided'), { status: 400 }))
    }

    const transcript = await transcribeAudio(req.file.buffer, req.file.mimetype)

    res.json({ transcript })
  } catch (err) {
    next(err)
  }
}
