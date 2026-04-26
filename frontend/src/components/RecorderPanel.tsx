import { Mic, Pause, Play, RotateCcw, Square } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { UsePipelineReturn } from '../hooks/usePipeline'
import { formatTime } from '../utils/formatTime'
import { getRecorderStatus } from '../utils/recorderStatus'
import { ToolbarBtn } from './ToolbarBtn'

const BAR_DELAYS = ['0ms', '120ms', '240ms', '360ms', '480ms']

type Props = Pick<UsePipelineReturn, 'state' | 'start' | 'pause' | 'resume' | 'restart' | 'finish' | 'discard'>

export function RecorderPanel({ state, start, pause, resume, restart, finish, discard }: Props) {
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (state.status === 'recording') {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (state.status === 'idle') setElapsed(0)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [state.status])

  const isRecording = state.status === 'recording'
  const isPaused = state.status === 'paused'
  const isActive = isRecording || isPaused
  const isError = state.status === 'error'

  const { statusLabel, micColor } = getRecorderStatus(state)

  return (
    <div className="flex flex-col items-center gap-8 py-12">

      {/* Animated mic orb */}
      <div className="relative flex items-center justify-center w-44 h-44" aria-hidden>
        {isRecording && (
          <>
            <span className="absolute w-full h-full rounded-full bg-red-400/20 animate-ping" />
            <span className="absolute w-32 h-32 rounded-full bg-red-400/20 animate-ping [animation-delay:200ms]" />
          </>
        )}
        <div className={`relative z-10 flex items-center justify-center w-28 h-28 rounded-full shadow-xl transition-colors duration-300 ${micColor}`}>
          <Mic size={44} strokeWidth={1.5} />
        </div>
      </div>

      {/* Status + timer */}
      <div className="flex flex-col items-center gap-2 min-h-[4rem]" aria-live="polite" aria-atomic>
        <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
          {statusLabel}
        </span>
        {isActive && (
          <span className="text-4xl font-mono font-bold tabular-nums text-foreground">
            {formatTime(elapsed)}
          </span>
        )}
        {isRecording && (
          <div className="flex items-center gap-1 h-8 mt-1" aria-hidden>
            {BAR_DELAYS.map((delay, i) => (
              <span
                key={i}
                className="w-1.5 rounded-full bg-red-400"
                style={{
                  height: '100%',
                  transformOrigin: 'bottom',
                  animation: 'bar 0.9s ease-in-out infinite',
                  animationDelay: delay,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap justify-center" role="toolbar" aria-label="Recording controls">
        {!isActive && !isError && (
          <ToolbarBtn onClick={() => void start()} icon={<Mic size={16} />} label="Start recording" primary />
        )}
        {isActive && (
          <>
            {isRecording
              ? <ToolbarBtn onClick={() => void pause()}  icon={<Pause size={16} />} label="Pause" />
              : <ToolbarBtn onClick={() => void resume()} icon={<Play  size={16} />} label="Resume" />
            }
            <ToolbarBtn onClick={restart} icon={<RotateCcw size={16} />} label="Restart" />
            <ToolbarBtn onClick={() => void finish(elapsed)} icon={<Square size={16} />} label="Finish" primary />
          </>
        )}
        {isError && (
          <ToolbarBtn onClick={discard} icon={<RotateCcw size={16} />} label="Try again" primary />
        )}
      </div>

      {isError && (
        <p role="alert" className="text-sm text-destructive max-w-sm text-center">
          {state.message}
        </p>
      )}
    </div>
  )
}
