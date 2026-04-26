import { Router } from 'express'
import { audioUpload } from '../middleware/upload.js'
import { handleSummarize } from '../handlers/summarize.handler.js'

const router = Router()

router.post('/', audioUpload.single('audio'), handleSummarize)

export default router
