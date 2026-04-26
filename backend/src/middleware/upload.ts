import multer from 'multer'
import { AppError } from '../errors/AppError.js'

const ALLOWED_MIME_TYPES = [
  'audio/webm',
  'audio/wav',
  'audio/mp4',
  'audio/mpeg',
  'application/octet-stream', // browsers may report recorded blobs with this type
]

export const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new AppError(`Unsupported file type: ${file.mimetype}`, 415))
    }
  },
})
