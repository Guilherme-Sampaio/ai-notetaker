import { useRef } from 'react'
import { useFocusTrap } from '../hooks/useFocusTrap'

export function NavigationConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useFocusTrap(dialogRef, onCancel)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="nav-confirm-title"
      aria-describedby="nav-confirm-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-xl p-6 flex flex-col gap-4 focus:outline-none"
      >
        <div>
          <p id="nav-confirm-title" className="text-base font-semibold text-foreground">Leave this page?</p>
          <p id="nav-confirm-desc" className="text-sm text-muted-foreground mt-1">
            Your current recording will be lost if you leave.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Stay
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Leave anyway
          </button>
        </div>
      </div>
    </div>
  )
}
