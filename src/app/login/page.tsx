'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      window.location.href = from
    } else {
      const data = await res.json()
      setError(data.error || 'Invalid password')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div className="card" style={{ maxWidth: 400, width: '100%', margin: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
          <h2 style={{ margin: 0 }}>ReviewBridge</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
            Enter the password to continue
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            className="input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            style={{ width: '100%', marginBottom: '16px', height: '48px', paddingLeft: '12px' }}
          />
          {error && (
            <p style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 12 }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !password}
            style={{ width: '100%' }}
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  )
}
