import type { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../src/errors/AppError.js'
import { handleListNotes, handleSaveNote } from '../../src/handlers/notes.handler.js'
import { listNotes, saveNote } from '../../src/services/notes.service.js'

const validSummary = {
  keyDecisions: ['d1'],
  upcomingDeadlines: [] as string[],
  followUpTasks: [] as string[],
  resourcesMentioned: [] as string[],
}

vi.mock('../../src/services/notes.service.js', () => ({
  saveNote: vi.fn(),
  listNotes: vi.fn(),
}))

describe('notes.handler', () => {
  beforeEach(() => {
    vi.mocked(saveNote).mockReset()
    vi.mocked(listNotes).mockReset()
  })

  describe('handleSaveNote', () => {
    it('calls next with 400 when body is invalid', async () => {
      const next = vi.fn()
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response
      const req = { body: {} } as Request

      await handleSaveNote(req, res, next as unknown as NextFunction)

      expect(saveNote).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalledTimes(1)
      const err = vi.mocked(next).mock.calls[0][0]
      expect(err).toBeInstanceOf(AppError)
      expect((err as AppError).status).toBe(400)
      expect((err as AppError).message).toBe('Invalid request body')
    })

    it('returns 201 with saved note when body is valid', async () => {
      const saved = {
        id: 'note-1',
        createdAt: '2026-01-01T00:00:00.000Z',
        transcript: 'hello',
        summary: validSummary,
      }
      vi.mocked(saveNote).mockReturnValue(saved)

      const next = vi.fn()
      const status = vi.fn().mockReturnThis()
      const json = vi.fn()
      const res = { status, json } as unknown as Response
      const req = {
        body: { transcript: 'hello', summary: validSummary },
      } as Request

      await handleSaveNote(req, res, next as unknown as NextFunction)

      expect(saveNote).toHaveBeenCalledWith({ transcript: 'hello', summary: validSummary })
      expect(status).toHaveBeenCalledWith(201)
      expect(json).toHaveBeenCalledWith(saved)
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('handleListNotes', () => {
    it('returns notes from listNotes', () => {
      const items = [
        {
          id: 'a',
          createdAt: '2026-01-02T00:00:00.000Z',
          transcript: 't',
          summary: validSummary,
        },
      ]
      vi.mocked(listNotes).mockReturnValue(items)

      const next = vi.fn()
      const json = vi.fn()
      const res = { json } as unknown as Response

      handleListNotes({} as Request, res, next as unknown as NextFunction)

      expect(json).toHaveBeenCalledWith({ notes: items })
      expect(next).not.toHaveBeenCalled()
    })
  })
})
