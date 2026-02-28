import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import { Sun, Moon, Compass, Home } from 'lucide-react'

export default function NavBar() {
  const { theme, toggle } = useTheme()
  const location = useLocation()

  if (location.pathname === '/') return null

  return (
    <nav
      className="animate-fade-in fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-14 px-8"
      style={{
        backgroundColor: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* Wordmark — Dot Matrix */}
      <Link
        to="/home"
        className="text-[13px] tracking-[0.25em] uppercase hover:opacity-70 transition-opacity"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}
      >
        cronicl
      </Link>

      {/* Nav links — ABC Synt Mono */}
      <div className="flex items-center gap-1">
        <NavLink to="/home" icon={<Home size={14} strokeWidth={1.5} />} label="Home" current={location.pathname} />
        <NavLink to="/explore" icon={<Compass size={14} strokeWidth={1.5} />} label="Explore" current={location.pathname} />

        <div className="w-px h-4 mx-3" style={{ backgroundColor: 'var(--color-border)' }} />

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="flex items-center justify-center w-8 h-8 rounded-full cursor-pointer transition-colors"
          style={{
            color: 'var(--color-muted)',
            background: 'none',
            border: 'none',
          }}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={14} strokeWidth={1.5} /> : <Moon size={14} strokeWidth={1.5} />}
        </button>
      </div>
    </nav>
  )
}

function NavLink({ to, icon, label, current }: { to: string; icon: React.ReactNode; label: string; current: string }) {
  const active = current === to || current.startsWith(to + '/')
  return (
    <Link
      to={to}
      className="flex items-center gap-2 px-3 py-1.5 text-[11px] tracking-[0.04em] rounded-md transition-all duration-150"
      style={{
        fontFamily: 'var(--font-system)',
        color: active ? 'var(--color-primary)' : 'var(--color-muted)',
        backgroundColor: active ? 'var(--color-surface-2)' : 'transparent',
      }}
    >
      {icon}
      {label}
    </Link>
  )
}
