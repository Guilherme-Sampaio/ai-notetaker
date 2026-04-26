import { Router } from 'express'
import { handleSaveNote, handleListNotes } from '../controllers/notes.controller.js'

const router = Router()

router.post('/', handleSaveNote)
router.get('/', handleListNotes)

export default router
