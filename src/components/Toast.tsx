'use client'

import { useEffect, useState } from 'react'

let showToastFn: ((message: string) => void) | null = null

export function showToast(message: string) {
  if (showToastFn) showToastFn(message)
}

export default function Toast() {
  const [message, setMessage] = useState('')
  const [active, setActive] = useState(false)

  useEffect(() => {
    showToastFn = (msg: string) => {
      setMessage(msg)
      setActive(true)
      setTimeout(() => setActive(false), 3000)
    }
    return () => { showToastFn = null }
  }, [])

  return (
    <div className={`toast ${active ? 'active' : ''}`}>
      {message}
    </div>
  )
}
