import { Router } from 'express'
import { handleSaveNote, handleListNotes } from '../handlers/notes.handler.js'

const router = Router()

router.post('/', handleSaveNote)
router.get('/', handleListNotes)

export default router
