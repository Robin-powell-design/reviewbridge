'use client'

import { useState } from 'react'
// @ts-expect-error no types for react-dom
import { createPortal } from 'react-dom'

export default function CopyLinkButton({ reviewId, reviewTitle }: { reviewId: string; reviewTitle: string }) {
  const [showModal, setShowModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sentEmails, setSentEmails] = useState<string[]>([])

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/r/${reviewId}` : `/r/${reviewId}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const input = document.createElement('input')
      input.value = shareUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const sendInvite = async () => {
    if (!email.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          reviewId,
          reviewTitle,
        }),
      })
      const data = await res.json()
      if (data.fallback) {
        handleCopy()
      } else if (data.success) {
        setSentEmails([...sentEmails, email])
        setEmail('')
      }
    } catch {
      // fallback to copy
      handleCopy()
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => setShowModal(true)}
      >
        Share Review Link
      </button>

      {showModal && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(6px)',
            zIndex: 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px 24px',
              width: 440,
              maxWidth: '90vw',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 600 }}>Share Review</h3>

            {/* Copy link */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                className="form-input"
                value={shareUrl}
                readOnly
                style={{ flex: 1, fontSize: 13 }}
              />
              <button className="btn btn-primary btn-sm" onClick={handleCopy}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>

            {/* Email invite */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                Send invite by email
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="form-input"
                  type="email"
                  placeholder="reviewer@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendInvite()}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-accent btn-sm"
                  onClick={sendInvite}
                  disabled={sending || !email.trim()}
                >
                  {sending ? '...' : 'Send'}
                </button>
              </div>
              {sentEmails.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  {sentEmails.map((e, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '3px 0' }}>
                      <span style={{ color: 'var(--green)' }}>✓</span> Sent to {e}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
