import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { AppError } from '../errors/AppError.js'
import { SummaryOutputSchema } from '../prompts/summarize.schema.js'
import { saveNote, listNotes } from '../services/notes.service.js'

const SaveNoteSchema = z.object({
  transcript: z.string().min(1),
  summary: SummaryOutputSchema,
})

export async function handleSaveNote(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = SaveNoteSchema.safeParse(req.body)
    if (!parsed.success) {
      return next(new AppError('Invalid request body', 400))
    }
    const note = saveNote(parsed.data)
    res.status(201).json(note)
  } catch (err) {
    next(err)
  }
}

export function handleListNotes(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ notes: listNotes() })
  } catch (err) {
    next(err)
  }
}
