'use client'

import { useState } from 'react'

export default function ReminderPanel({
  reviewId,
  invitedEmails,
  pendingEmails,
  respondedCount,
  deadline,
  isOverdue,
}: {
  reviewId: string
  invitedEmails: string[]
  pendingEmails: string[]
  respondedCount: number
  deadline: string | null
  isOverdue: boolean
}) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const sendReminders = async () => {
    if (!pendingEmails.length) return
    setSending(true)
    try {
      const res = await fetch('/api/send-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, emails: pendingEmails }),
      })
      const data = await res.json()
      if (data.success) {
        setSent(true)
        setTimeout(() => setSent(false), 5000)
      }
    } catch {
      // silent fail
    } finally {
      setSending(false)
    }
  }

  if (invitedEmails.length === 0) return null

  return (
    <div className="animate-in" style={{
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border)',
      padding: '20px 24px',
      marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Review Progress</h3>
        {deadline && (
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            background: isOverdue ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
            color: isOverdue ? '#ef4444' : '#22c55e',
          }}>
            {isOverdue ? 'Overdue' : `Due ${deadline}`}
          </span>
        )}
      </div>

      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
        {respondedCount} of {invitedEmails.length} invited reviewer{invitedEmails.length !== 1 ? 's' : ''} responded
      </div>

      <div style={{
        width: '100%',
        height: 6,
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-full)',
        marginBottom: 16,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${invitedEmails.length > 0 ? (respondedCount / invitedEmails.length) * 100 : 0}%`,
          height: '100%',
          background: 'var(--green)',
          borderRadius: 'var(--radius-full)',
          transition: 'width 0.5s ease',
        }} />
      </div>

      {/* Invited list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {invitedEmails.map((email, i) => {
          const responded = !pendingEmails.includes(email)
          return (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: responded ? 'var(--text-secondary)' : 'var(--text-primary)',
            }}>
              <span style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                background: responded ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                color: responded ? '#22c55e' : '#ef4444',
                flexShrink: 0,
              }}>
                {responded ? '✓' : '·'}
              </span>
              <span style={{ textDecoration: responded ? 'line-through' : 'none', opacity: responded ? 0.6 : 1 }}>
                {email}
              </span>
              {responded && <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>responded</span>}
            </div>
          )
        })}
      </div>

      {/* Send reminder button */}
      {pendingEmails.length > 0 && (
        <button
          className="btn btn-accent btn-sm"
          onClick={sendReminders}
          disabled={sending || sent}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {sent ? '✓ Reminders sent!' : sending ? 'Sending...' : `Send Reminder to ${pendingEmails.length} pending reviewer${pendingEmails.length !== 1 ? 's' : ''}`}
        </button>
      )}
    </div>
  )
}
