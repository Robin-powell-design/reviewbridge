'use client'

import { useRouter } from 'next/navigation'
import { getTimeAgo, getVibeColor } from '@/lib/utils'
import type { Review } from '@/lib/types'
import { updateReviewStatus, deleteReview } from '@/lib/actions/reviews'
import { showToast } from './Toast'
import { showConfirm } from './ConfirmModal'

export default function ReviewCard({ review, isArchived }: { review: Review; isArchived: boolean }) {
  const router = useRouter()
  const timeAgo = getTimeAgo(review.created_at)
  const icon = review.embed_type === 'figma' ? '🎨' : review.embed_type === 'prototype' ? '🔗' : '📸'
  const responses = review.responses || []
  const responseCount = responses.length
  const scores = responses.map((r) => r.vibe_score).filter(Boolean)
  const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null
  const vibeWidth = avgScore ? (parseFloat(avgScore) / 10) * 100 : 0
  const vibeColor = avgScore ? getVibeColor(parseFloat(avgScore)) : 'var(--text-tertiary)'

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await updateReviewStatus(review.id, 'closed')
    showToast('✓ Review closed and archived')
  }

  const handleReopen = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await updateReviewStatus(review.id, 'active')
    showToast('✓ Review reopened')
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    showConfirm(
      'Delete review?',
      `"${review.title}" and all its feedback will be permanently deleted.`,
      async () => {
        await deleteReview(review.id)
        showToast('✓ Review deleted')
      }
    )
  }

  return (
    <div className="review-card" onClick={() => router.push(`/r/${review.id}`)}>
      <div className="review-card-preview">
        <div className="review-card-preview-placeholder">{icon}</div>
        <span className={`review-card-badge ${isArchived ? 'badge-closed' : 'badge-active'}`}>
          {isArchived ? 'Closed' : 'Active'}
        </span>
        <div className="review-card-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="card-action-btn card-action-close"
            onClick={(e) => { e.stopPropagation(); router.push(`/edit/${review.id}`) }}
            title="Edit"
            style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}
          >✎</button>
          {isArchived ? (
            <button className="card-action-btn card-action-close" onClick={handleReopen} title="Reopen">↩</button>
          ) : (
            <button className="card-action-btn card-action-close" onClick={handleClose} title="Close & archive">✓</button>
          )}
          <button className="card-action-btn card-action-delete" onClick={handleDelete} title="Delete">✕</button>
        </div>
      </div>
      <div className="review-card-body">
        <div className="review-card-title">{review.title}</div>
        <div className="review-card-desc">{review.context || 'No description provided.'}</div>
        <div className="review-card-meta">
          <div className="review-card-vibe">
            <div className="vibe-mini-bar">
              <div className="vibe-mini-fill" style={{ width: `${vibeWidth}%`, background: vibeColor }} />
            </div>
            <span className="vibe-mini-score" style={{ color: vibeColor }}>{avgScore || '—'}</span>
          </div>
          <div className="review-card-date">
            {responseCount > 0 ? `${responseCount} responses · ` : ''}{timeAgo}
          </div>
        </div>
      </div>
    </div>
  )
}
