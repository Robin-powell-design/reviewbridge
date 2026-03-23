import { getReviewById } from '@/lib/actions/reviews'
import { notFound } from 'next/navigation'
import Nav from '@/components/Nav'
import Toast from '@/components/Toast'
import type { Response } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const review = await getReviewById(id)
  return {
    title: review ? `${review.title} — Results — ReviewBridge` : 'Results Not Found',
  }
}

function getVibeEmoji(score: number): string {
  if (score >= 9) return '😍'
  if (score >= 7.5) return '🤩'
  if (score >= 6) return '😊'
  if (score >= 4.5) return '🙂'
  if (score >= 3) return '😕'
  return '😐'
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const review = await getReviewById(id)

  if (!review) {
    notFound()
  }

  const responses: Response[] = review.responses || []
  const scores = responses.map(r => r.vibe_score).filter(Boolean)
  const avgScore = scores.length > 0
    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
    : '—'
  const avgScoreNum = parseFloat(avgScore) || 0
  const vibeColor = avgScoreNum >= 7 ? 'var(--green)' : avgScoreNum >= 5 ? 'var(--yellow)' : 'var(--red)'

  // Vibe breakdown
  const vibeRanges = [
    { emoji: '😍', min: 8, count: 0 },
    { emoji: '😊', min: 6, count: 0 },
    { emoji: '🙂', min: 4, count: 0 },
    { emoji: '😐', min: 0, count: 0 },
  ]
  scores.forEach(s => {
    const range = vibeRanges.find(r => s >= r.min)
    if (range) range.count++
  })
  const maxCount = Math.max(...vibeRanges.map(r => r.count), 1)

  const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1']

  return (
    <>
      <Nav />
      <div style={{ display: 'block', paddingTop: 64, minHeight: '100vh' }}>
        <div className="container">
          <div className="results-header animate-in">
            <div>
              <h1>{review.title} — Results</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
                {responses.length} response{responses.length !== 1 ? 's' : ''} · {getTimeAgo(review.created_at)}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={`/r/${review.id}`} className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                Share Review Link
              </a>
            </div>
          </div>

          {responses.length === 0 ? (
            <div className="empty-state animate-in">
              <div className="empty-state-icon">📊</div>
              <h3>No responses yet</h3>
              <p>Share the review link with your team to start collecting feedback.</p>
              <a href={`/r/${review.id}`} className="btn btn-primary" style={{ textDecoration: 'none' }}>
                Copy Review Link
              </a>
            </div>
          ) : (
            <>
              <div className="results-overview animate-in">
                <div className="results-vibe-summary">
                  <div className="results-vibe-score" style={{ color: vibeColor }}>{avgScore}</div>
                  <div className="results-vibe-label">Average Vibe Score</div>

                  <div className="results-vibe-breakdown">
                    {vibeRanges.map((range, i) => (
                      <div key={i} className="vibe-breakdown-row">
                        <span className="vibe-breakdown-emoji">{range.emoji}</span>
                        <div className="vibe-breakdown-bar">
                          <div
                            className="vibe-breakdown-fill"
                            style={{
                              width: `${(range.count / maxCount) * 100}%`,
                              background: i === 0 ? 'var(--green)' : i === 1 ? 'var(--blue)' : i === 2 ? 'var(--yellow)' : 'var(--text-tertiary)',
                            }}
                          />
                        </div>
                        <span className="vibe-breakdown-count">{range.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="results-responses">
                  <h3>Responses</h3>
                  {responses.map((resp, i) => {
                    const color = colors[i % colors.length]
                    const initials = (resp.reviewer_name || 'A').substring(0, 2).toUpperCase()
                    const emoji = getVibeEmoji(resp.vibe_score)
                    const respAnswers = (resp.answers as any[]) || []
                    const respPins = (resp.pins as any[]) || []

                    return (
                      <div key={resp.id} className="response-item">
                        <div className="response-author">
                          <div className="response-avatar" style={{ background: color }}>{initials}</div>
                          <span className="response-name">{resp.reviewer_name}</span>
                          <span className="response-vibe">{emoji} {resp.vibe_score}</span>
                        </div>
                        <div className="response-answers">
                          {resp.quick_take && (
                            <div>
                              <div className="response-answer-q">Quick take</div>
                              <div className="response-answer-a">{resp.quick_take}</div>
                            </div>
                          )}
                          {respAnswers.filter((a: any) => a.answer).map((a: any, j: number) => (
                            <div key={j}>
                              <div className="response-answer-q">{a.question}</div>
                              <div className="response-answer-a">{a.answer}</div>
                            </div>
                          ))}
                          {respPins.length > 0 && (
                            <div>
                              <div className="response-answer-q">Pin comments</div>
                              {respPins.map((p: any, k: number) => (
                                <div key={k} className="response-answer-a">📌 #{p.pin}: {p.comment}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <Toast />
    </>
  )
}
