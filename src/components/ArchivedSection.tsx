'use client'

import { useState } from 'react'
import type { Review } from '@/lib/types'
import ReviewCard from './ReviewCard'

export default function ArchivedSection({ reviews }: { reviews: Review[] }) {
  const [open, setOpen] = useState(false)
  const closedReviews = reviews.filter(r => r.status === 'closed')

  if (closedReviews.length === 0) return null

  return (
    <>
      <button
        className={`archived-toggle ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
      >
        <span className="arrow">▶</span>
        Archived Reviews <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>({closedReviews.length})</span>
      </button>
      <div className={`archived-grid ${open ? 'open' : ''}`}>
        {closedReviews.map(r => (
          <ReviewCard key={r.id} review={r} isArchived={true} />
        ))}
      </div>
    </>
  )
}
