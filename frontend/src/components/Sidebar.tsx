import { FileText, Mic } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { NavItem } from './NavItem'

export function Sidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return (
    <nav
      aria-label="Main navigation"
      className="flex flex-col items-center gap-2 w-16 px-2 py-4 border-r border-border bg-card shrink-0"
    >
      <NavItem
        icon={<Mic size={20} />}
        label="Record"
        active={pathname === '/record'}
        onClick={() => navigate('/record')}
      />
      <NavItem
        icon={<FileText size={20} />}
        label="Notes"
        active={pathname === '/notes'}
        onClick={() => navigate('/notes')}
      />
    </nav>
  )
}
