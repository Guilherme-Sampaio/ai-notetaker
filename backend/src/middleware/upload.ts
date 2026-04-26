import multer from 'multer'

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
      cb(Object.assign(new Error(`Unsupported file type: ${file.mimetype}`), { status: 415 }))
    }
  },
})
