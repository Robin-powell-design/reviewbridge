'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useAdmin } from '@/lib/AdminContext'

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const { isAdmin, toggleAdmin, isDark, toggleTheme } = useAdmin()

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname.startsWith(path)) return true
    return false
  }

  return (
    <nav className="nav">
      <div className="nav-inner">
        <div className="nav-logo" onClick={() => router.push('/')}>
          <div className="nav-logo-icon">R</div>
          ReviewBridge
        </div>
        <div className="nav-tabs">
          <button
            className={`nav-tab ${isActive('/') ? 'active' : ''}`}
            onClick={() => router.push('/')}
          >
            Dashboard
          </button>
          <button
            className={`nav-tab ${isActive('/create') ? 'active' : ''}`}
            onClick={() => router.push('/create')}
          >
            New Review
          </button>
        </div>
        <div className="nav-actions">
          <div
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              cursor: 'pointer',
              width: 44,
              height: 24,
              borderRadius: 12,
              background: 'var(--bg-secondary)',
              position: 'relative',
              transition: 'var(--transition)',
              flexShrink: 0,
              border: '1px solid var(--border)',
            }}
          >
            <div style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: isDark ? '#4a4a55' : '#fff',
              position: 'absolute',
              top: 2,
              left: isDark ? 22 : 2,
              transition: 'var(--transition)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              color: isDark ? '#fff' : '#1a1a1a',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }}>
              {isDark ? '☀' : '🌙'}
            </div>
          </div>
          <span style={{ fontSize: 11, color: isAdmin ? 'var(--text-secondary)' : 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {isAdmin ? 'Admin' : 'Reviewer'}
          </span>
          <div
            className="nav-avatar"
            onClick={toggleAdmin}
            title={isAdmin ? 'Viewing as Admin — click to preview as Reviewer' : 'Viewing as Reviewer — click to switch back to Admin'}
            style={{
              cursor: 'pointer',
              position: 'relative',
              outline: isAdmin ? 'none' : '2px solid var(--accent)',
              outlineOffset: 2,
            }}
          >
            {isAdmin ? 'RP' : '👤'}
          </div>
        </div>
      </div>
    </nav>
  )
}
