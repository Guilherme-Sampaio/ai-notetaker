import type { NextFunction, Request, Response } from 'express'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { AppError } from '../errors/AppError.js'
import { getPresignedUploadUrl } from '../services/storage.service.js'

const ALLOWED_MIME_TYPES = ['audio/webm', 'audio/wav', 'audio/mp4', 'audio/mpeg', 'application/octet-stream']

const MIME_TO_EXT: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/wav': 'wav',
  'audio/mp4': 'mp4',
  'audio/mpeg': 'mp3',
  'application/octet-stream': 'bin',
}

const QuerySchema = z.object({
  mimeType: z.string().min(1),
})

export async function handleGetUploadUrl(req: Request, res: Response, next: NextFunction) {
  try {
    const result = QuerySchema.safeParse(req.query)
    if (!result.success) {
      return next(new AppError('mimeType is required', 400))
    }

    const mimeType = result.data.mimeType.split(';')[0].trim()

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return next(new AppError('Unsupported mimeType', 415))
    }

    const ext = MIME_TO_EXT[mimeType] ?? 'bin'
    const key = `uploads/${randomUUID()}.${ext}`
    const uploadUrl = await getPresignedUploadUrl(key, mimeType)

    res.json({ uploadUrl, key })
  } catch (err) {
    next(err)
  }
}
