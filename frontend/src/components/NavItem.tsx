interface Props {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}

export function NavItem({ icon, label, active, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={[
        'flex flex-col items-center gap-1.5 w-full py-3 px-2 rounded-lg text-xs font-medium transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent',
      ].join(' ')}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </button>
  )
}
