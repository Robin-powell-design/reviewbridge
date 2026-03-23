'use client'

import { useState, useCallback } from 'react'

let showConfirmFn: ((title: string, message: string, onConfirm: () => void) => void) | null = null

export function showConfirm(title: string, message: string, onConfirm: () => void) {
  if (showConfirmFn) showConfirmFn(title, message, onConfirm)
}

export default function ConfirmModal() {
  const [active, setActive] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [onConfirm, setOnConfirm] = useState<(() => void) | null>(null)

  showConfirmFn = useCallback((t: string, m: string, fn: () => void) => {
    setTitle(t)
    setMessage(m)
    setOnConfirm(() => fn)
    setActive(true)
  }, [])

  const close = () => {
    setActive(false)
    setOnConfirm(null)
  }

  return (
    <div className={`confirm-modal ${active ? 'active' : ''}`}>
      <div className="confirm-box">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="btn btn-secondary" onClick={close}>Cancel</button>
          <button
            className="btn btn-primary"
            style={{ background: 'var(--red)' }}
            onClick={() => { onConfirm?.(); close() }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
