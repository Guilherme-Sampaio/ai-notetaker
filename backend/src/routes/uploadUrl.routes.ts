import { Router } from 'express'
import { handleGetUploadUrl } from '../handlers/uploadUrl.handler.js'

const router = Router()

router.get('/', handleGetUploadUrl)

export default router
