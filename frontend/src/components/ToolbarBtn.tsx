export function ToolbarBtn({
  onClick, icon, label, primary = false, disabled = false,
}: {
  onClick: () => void
  icon: React.ReactNode
  label: string
  primary?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className={[
        'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50',
        primary
          ? 'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary'
          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-ring',
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  )
}
