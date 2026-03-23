import type { Review } from '@/lib/types'

export default function DashboardStats({ reviews }: { reviews: Review[] }) {
  const activeReviews = reviews.filter(r => r.status !== 'closed')
  const totalResponses = reviews.reduce((sum, r) => sum + (r.responses || []).length, 0)
  const allScores = reviews.flatMap(r => (r.responses || []).map(x => x.vibe_score)).filter(Boolean)
  const avgVibe = allScores.length > 0 ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1) : '—'

  return (
    <div className="dash-stats animate-in">
      <div className="stat-card">
        <div className="stat-label">Active Reviews</div>
        <div className="stat-value">{activeReviews.length}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Responses</div>
        <div className="stat-value">{totalResponses}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Avg. Vibe Score</div>
        <div className="stat-value">{avgVibe}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Reviews Created</div>
        <div className="stat-value">{reviews.length}</div>
      </div>
    </div>
  )
}
