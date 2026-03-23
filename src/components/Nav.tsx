'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useAdmin } from '@/lib/AdminContext'

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const { isAdmin, toggleAdmin } = useAdmin()

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
