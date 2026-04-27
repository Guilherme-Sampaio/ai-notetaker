import { Router } from 'express'
import { handleSummarize } from '../handlers/summarize.handler.js'

const router = Router()

router.post('/', handleSummarize)

export default router
