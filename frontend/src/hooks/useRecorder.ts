import { useCallback, useRef, useState } from 'react'

export type RecorderStatus = 'idle' | 'recording' | 'paused'

interface UseRecorderReturn {
  status: RecorderStatus
  start: () => Promise<void>
  pause: () => Promise<void>
  resume: () => Promise<void>
  stop: () => Promise<Blob | null>
  restart: () => void
}

export function useRecorder(): UseRecorderReturn {
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const mimeTypeRef = useRef<string>('audio/webm')

  const acquireStream = async () => {
    if (!streamRef.current) {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
    }
    return streamRef.current
  }

  const releaseStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  const attachRecorder = (stream: MediaStream) => {
    const mr = new MediaRecorder(stream)
    mimeTypeRef.current = mr.mimeType
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    mediaRecorderRef.current = mr
    return mr
  }

  const start = useCallback(async () => {
    const stream = await acquireStream()
    chunksRef.current = []
    const mr = attachRecorder(stream)
    mr.start(100)
    setStatus('recording')
  }, [])

  // Stops the recorder and releases the mic — microphone light goes off
  const pause = useCallback((): Promise<void> => {
    return new Promise(resolve => {
      const mr = mediaRecorderRef.current
      if (!mr) { resolve(); return }
      mr.onstop = () => {
        releaseStream()
        mediaRecorderRef.current = null
        setStatus('paused')
        resolve()
      }
      mr.stop()
    })
  }, [])

  // Re-acquires mic and continues appending to the same chunks array
  const resume = useCallback(async () => {
    const stream = await acquireStream()
    const mr = attachRecorder(stream)
    mr.start(100)
    setStatus('recording')
  }, [])

  // Assembles blob from all chunks collected across recording segments
  const stop = useCallback((): Promise<Blob | null> => {
    return new Promise(resolve => {
      const mr = mediaRecorderRef.current

      // Called while paused: stream already released, just assemble chunks
      if (!mr) {
        const blob = chunksRef.current.length > 0
          ? new Blob(chunksRef.current, { type: mimeTypeRef.current })
          : null
        chunksRef.current = []
        setStatus('idle')
        resolve(blob)
        return
      }

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType })
        chunksRef.current = []
        releaseStream()
        mediaRecorderRef.current = null
        setStatus('idle')
        resolve(blob)
      }
      mr.stop()
    })
  }, [])

  // Tears down everything and returns to idle — does NOT auto-start
  const restart = useCallback(() => {
    const mr = mediaRecorderRef.current
    if (mr) { mr.onstop = null; mr.stop() }
    releaseStream()
    mediaRecorderRef.current = null
    chunksRef.current = []
    setStatus('idle')
  }, [])

  return { status, start, pause, resume, stop, restart }
}
