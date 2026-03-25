'use client'

import { useState, useRef, useCallback } from 'react'
import { useAdmin } from '@/lib/AdminContext'
import type { Review, Question } from '@/lib/types'
import { convertToEmbedUrl, convertLoomToEmbed } from '@/lib/utils'
import { submitResponse } from '@/lib/actions/responses'
import Toast, { showToast } from '@/components/Toast'

interface Pin {
  id: number
  x: number
  y: number
  comment: string
}

export default function ReviewerView({ review }: { review: Review }) {
  const { isAdmin } = useAdmin()
  const [activeTab, setActiveTab] = useState<'vibe' | 'feedback' | 'pins'>('vibe')
  const [vibeValue, setVibeValue] = useState(70)
  const [brandValue, setBrandValue] = useState(50)
  const [flowValue, setFlowValue] = useState(50)
  const [quickTake, setQuickTake] = useState('')
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [pins, setPins] = useState<Pin[]>([])
  const [pinMode, setPinMode] = useState(false)
  const [reviewerName, setReviewerName] = useState('')
  const [showNameModal, setShowNameModal] = useState(true)
  const [nameInput, setNameInput] = useState('')
  const [chosenOption, setChosenOption] = useState<string | null>(null)
  const [comparePhase, setComparePhase] = useState(review.review_mode === 'compare')
  const [vibeVisited, setVibeVisited] = useState(true)
  const [questionsVisited, setQuestionsVisited] = useState(false)
  const [pinsVisited, setPinsVisited] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showLoom, setShowLoom] = useState(false)
  const frameRef = useRef<HTMLDivElement>(null)

  const vibeScore = (vibeValue / 10).toFixed(1)
  const getVibeEmoji = () => {
    if (vibeValue <= 15) return '😐'
    if (vibeValue <= 30) return '😕'
    if (vibeValue <= 45) return '🙂'
    if (vibeValue <= 60) return '😊'
    if (vibeValue <= 75) return '😄'
    if (vibeValue <= 90) return '🤩'
    return '😍'
  }

  const brandScore = (brandValue / 10).toFixed(1)
  const getBrandEmoji = () => {
    if (brandValue <= 20) return '😬'
    if (brandValue <= 40) return '🤔'
    if (brandValue <= 60) return '🤨'
    if (brandValue <= 80) return '😏'
    return '🤩'
  }

  const flowScore = (flowValue / 10).toFixed(1)
  const getFlowEmoji = () => {
    if (flowValue <= 20) return '😵'
    if (flowValue <= 40) return '😕'
    if (flowValue <= 60) return '🙂'
    if (flowValue <= 80) return '😊'
    return '⚡'
  }

  const getSliderBackground = (value: number) => {
    const hue = (value / 100) * 120
    const sat = 70 + (value / 100) * 20
    return `linear-gradient(90deg, hsl(0, 0%, 85%) 0%, hsl(${hue}, ${sat}%, 55%) ${value}%, hsl(0, 0%, 92%) ${value}%)`
  }

  const handlePinClick = useCallback((e: React.MouseEvent) => {
    if (!pinMode || !frameRef.current) return
    const rect = frameRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    const newPin: Pin = { id: pins.length + 1, x, y, comment: '' }
    setPins([...pins, newPin])
    setActiveTab('pins')
  }, [pinMode, pins])

  const updatePinComment = (id: number, comment: string) => {
    setPins(pins.map(p => p.id === id ? { ...p, comment } : p))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await submitResponse({
        id: 'resp_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
        review_id: review.id,
        reviewer_name: reviewerName,
        vibe_score: parseFloat(vibeScore),
        brand_score: parseFloat(brandScore),
        flow_score: parseFloat(flowScore),
        chosen_option: chosenOption,
        quick_take: quickTake,
        answers: (review.questions || []).map((q: Question, i: number) => ({
          question: q.text,
          answer: answers[i] || '',
        })).filter((a: { question: string; answer: string }) => a.answer),
        pins: pins.filter(p => p.comment).map(p => ({
          pin: String(p.id),
          comment: p.comment,
          x: p.x,
          y: p.y,
        })),
      })
      setSubmitted(true)
      showToast('✓ Feedback submitted!')
      setTimeout(() => window.location.href = `/results/${review.id}`, 1500)
    } catch (err) {
      showToast('Error submitting feedback')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  // For compare reviews, show the chosen option's embed after selection
  const chosenEmbedRaw = review.review_mode === 'compare' && chosenOption
    ? (review.compare_options || []).find(o => o.label === chosenOption)?.embed_url || ''
    : review.embed_url
  // Step completion tracking
  const vibeComplete = vibeVisited
  const hasAnswers = !review.questions?.length || Object.values(answers).some(a => a.trim())
  const questionsComplete = questionsVisited && hasAnswers
  const pinsComplete = pinsVisited
  // Linear flow: which tabs are unlocked
  const questionsUnlocked = vibeComplete
  const pinsUnlocked = questionsComplete

  const isUploadedImage = /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(chosenEmbedRaw) || chosenEmbedRaw.includes('/storage/v1/object/public/')
  const embedUrl = isUploadedImage ? null : convertToEmbedUrl(chosenEmbedRaw, review.embed_type)
  const loomEmbedUrl = convertLoomToEmbed(review.loom_url)

  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Pin mode banner */}
      {pinMode && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: 'calc((100% - 420px) / 2)',
          transform: 'translateX(-50%)',
          zIndex: 100,
          background: 'var(--accent)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: 'var(--radius-full)',
          fontSize: 13,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: 'var(--shadow-lg)',
          animation: 'fadeIn 0.2s ease',
        }}>
          <span>📌 Click anywhere on the design to place a pin</span>
          <button
            onClick={() => setPinMode(false)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: 12,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Done
          </button>
        </div>
      )}

      {/* Nav bar for reviewer */}
      <nav className="nav" style={{ zIndex: 200 }}>
        <div className="nav-inner">
          <div className="nav-logo" onClick={() => window.location.href = '/'} style={{ cursor: 'pointer' }}>
            <div className="nav-logo-icon">R</div>
            ReviewBridge
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Reviewing: <strong>{review.title}</strong>
            </span>
          </div>
          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              onClick={() => { setNameInput(reviewerName); setShowNameModal(true) }}
              style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px 12px', borderRadius: 'var(--radius-full)', background: 'var(--bg-secondary)' }}
            >
              {reviewerName || 'Anonymous'}
            </span>
            {isAdmin && (
              <>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => window.location.href = `/results/${review.id}`}
                  style={{ fontSize: 12, height: 29, display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}
                >
                  📊 Results
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => window.location.href = `/edit/${review.id}`}
                  style={{ fontSize: 12, height: 29, display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}
                >
                  ✎ Edit
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Compare Phase — full-width option selection */}
      {comparePhase && (
        <div style={{
          position: 'fixed',
          top: 56,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'var(--bg)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
        }}>
          <div style={{
            textAlign: 'center',
            padding: '32px 24px 16px',
          }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{review.title}</h2>
            {review.context && (
              <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--text-secondary)', maxWidth: 500, marginInline: 'auto' }}>
                {review.context}
              </p>
            )}
            <p style={{ margin: '12px 0 0', fontSize: 15, color: 'var(--text-secondary)', fontWeight: 500 }}>
              Pick your preferred option to continue
            </p>
          </div>
          <div style={{
            display: 'flex',
            gap: 20,
            padding: '16px 24px 32px',
            flex: 1,
            minHeight: 0,
          }}>
            {(review.compare_options || []).map((opt, i) => {
              const isImage = /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(opt.embed_url) || opt.embed_url.includes('/storage/v1/object/public/')
              const optEmbedUrl = isImage ? null : convertToEmbedUrl(opt.embed_url, review.embed_type)
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border)',
                    overflow: 'hidden',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)'
                    e.currentTarget.style.boxShadow = '0 0 0 1px var(--accent)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{opt.label}</span>
                    <span style={{
                      fontSize: 12,
                      color: 'var(--text-tertiary)',
                      background: 'var(--bg-secondary)',
                      padding: '2px 10px',
                      borderRadius: 'var(--radius-full)',
                    }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                  </div>
                  <div style={{ flex: 1, position: 'relative', minHeight: 300, overflow: 'auto' }}>
                    {isImage ? (
                      <img
                        src={opt.embed_url}
                        alt={opt.label}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                      />
                    ) : optEmbedUrl ? (
                      <iframe
                        src={optEmbedUrl}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        allow="clipboard-write"
                        allowFullScreen
                      />
                    ) : (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: 'var(--text-tertiary)',
                        fontSize: 14,
                      }}>
                        No design provided
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
                    <button
                      className="btn btn-accent"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => {
                        setChosenOption(opt.label)
                        setComparePhase(false)
                      }}
                    >
                      Pick {opt.label}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="reviewer-layout" style={{ display: comparePhase ? 'none' : undefined }}>
        {/* Left: Prototype / Embed */}
        <div className="reviewer-prototype">
          <div className="prototype-frame" ref={frameRef}>
            {/* Pin overlay */}
            <div
              className={`pin-overlay ${pinMode ? 'pin-mode' : ''}`}
              onClick={handlePinClick}
              style={pinMode ? { cursor: 'crosshair' } : undefined}
            />
            {/* Render pins */}
            {pins.map((pin) => (
              <div
                key={pin.id}
                className="pin-marker"
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              >
                <span>{pin.id}</span>
              </div>
            ))}

            {isUploadedImage ? (
              <img
                src={chosenEmbedRaw}
                alt={review.title}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : embedUrl ? (
              <iframe
                src={embedUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="clipboard-write"
                allowFullScreen
              />
            ) : loomEmbedUrl ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <iframe
                    src={loomEmbedUrl}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allowFullScreen
                    allow="autoplay; fullscreen"
                  />
                </div>
                <div style={{ padding: '12px 16px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>🎥 Loom walkthrough by the designer</span>
                </div>
              </div>
            ) : (
              <div className="prototype-placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 40 }}>
                <div style={{ fontSize: 64, opacity: 0.3 }}>
                  {review.embed_type === 'figma' ? '🎨' : '🔗'}
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {review.title}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-tertiary)', maxWidth: 400, textAlign: 'center' }}>
                  {review.context || 'No design embedded yet. The reviewer will see the embedded prototype or Figma file here.'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Feedback Panel */}
        <div className="reviewer-panel">
          <div className="panel-header">
            <h2>{review.title}</h2>
            {chosenOption && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 6,
                padding: '4px 12px',
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                borderRadius: 'var(--radius-full)',
                fontSize: 12,
                fontWeight: 600,
              }}>
                You chose: {chosenOption}
              </div>
            )}
            {review.context && (
              <p style={{ margin: '4px 0 0', opacity: 0.6, fontSize: 13 }}>{review.context.substring(0, 100)}{review.context.length > 100 ? '...' : ''}</p>
            )}
            {review.loom_url && (
              <button
                onClick={() => setShowLoom(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 8,
                  padding: '8px 16px',
                  background: 'var(--purple-soft)',
                  color: 'var(--purple)',
                  border: '1px solid var(--purple)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
              >
                🎥 Watch walkthrough
              </button>
            )}
          </div>

          <div className="panel-tabs">
            <button className={`panel-tab ${activeTab === 'vibe' ? 'active' : ''}`} onClick={() => { setActiveTab('vibe'); setVibeVisited(true) }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%', fontSize: 11, fontWeight: 700, marginRight: 6, background: vibeComplete ? 'var(--green)' : 'var(--bg-secondary)', color: vibeComplete ? 'white' : 'var(--text-tertiary)', transition: 'all 0.2s' }}>
                {vibeComplete ? '✓' : '1'}
              </span>
              Vibe Check
            </button>
            <button
              className={`panel-tab ${activeTab === 'feedback' ? 'active' : ''}`}
              onClick={() => { if (questionsUnlocked) { setActiveTab('feedback'); setQuestionsVisited(true) } }}
              style={{ opacity: questionsUnlocked ? 1 : 0.4, cursor: questionsUnlocked ? 'pointer' : 'not-allowed' }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%', fontSize: 11, fontWeight: 700, marginRight: 6, background: questionsComplete ? 'var(--green)' : 'var(--bg-secondary)', color: questionsComplete ? 'white' : 'var(--text-tertiary)', transition: 'all 0.2s' }}>
                {questionsComplete ? '✓' : '2'}
              </span>
              Questions
            </button>
            <button
              className={`panel-tab ${activeTab === 'pins' ? 'active' : ''}`}
              onClick={() => { if (pinsUnlocked) { setActiveTab('pins'); setPinsVisited(true) } }}
              style={{ opacity: pinsUnlocked ? 1 : 0.4, cursor: pinsUnlocked ? 'pointer' : 'not-allowed' }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%', fontSize: 11, fontWeight: 700, marginRight: 6, background: pinsComplete ? 'var(--green)' : 'var(--bg-secondary)', color: pinsComplete ? 'white' : 'var(--text-tertiary)', transition: 'all 0.2s' }}>
                {pinsComplete ? '✓' : '3'}
              </span>
              Pins {pins.length > 0 && <span style={{ background: 'var(--accent)', color: 'white', borderRadius: '50%', padding: '1px 6px', fontSize: 10, marginLeft: 4 }}>{pins.length}</span>}
            </button>
          </div>

          <div className="panel-content">
            {/* Vibe Check */}
            {activeTab === 'vibe' && (
              <div className="panel-section active" style={{ display: 'block' }}>
                <div className="vibe-check">
                  <div className="vibe-label">How does this design make you feel?</div>
                  <div className="vibe-score-display" style={{ marginTop: 4, marginBottom: 12 }}>
                    <span style={{ fontSize: 28, lineHeight: 1, marginRight: 6 }}>{getVibeEmoji()}</span>
                    Score: {vibeScore} / 10
                  </div>
                  <div className="vibe-slider-container">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={vibeValue}
                      className="vibe-slider"
                      style={{ background: getSliderBackground(vibeValue) }}
                      onChange={(e) => setVibeValue(parseInt(e.target.value))}
                    />
                  </div>
                  <div className="vibe-labels">
                    <span>😐 Meh</span>
                    <span>😊 Good</span>
                    <span>😍 Love it</span>
                  </div>
                </div>

                {/* Brand slider */}
                <div className="vibe-check" style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                  <div className="vibe-label">Does this feel on-brand?</div>
                  <div className="vibe-score-display" style={{ marginTop: 4, marginBottom: 12 }}>
                    <span style={{ fontSize: 28, lineHeight: 1, marginRight: 6 }}>{getBrandEmoji()}</span>
                    Score: {brandScore} / 10
                  </div>
                  <div className="vibe-slider-container">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={brandValue}
                      className="vibe-slider"
                      style={{ background: getSliderBackground(brandValue) }}
                      onChange={(e) => setBrandValue(parseInt(e.target.value))}
                    />
                  </div>
                  <div className="vibe-labels">
                    <span>Off-brand</span>
                    <span>Partially</span>
                    <span>Mostly</span>
                    <span>Nailed it</span>
                  </div>
                </div>

                {/* Flow slider */}
                <div className="vibe-check" style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                  <div className="vibe-label">How intuitive is the flow?</div>
                  <div className="vibe-score-display" style={{ marginTop: 4, marginBottom: 12 }}>
                    <span style={{ fontSize: 28, lineHeight: 1, marginRight: 6 }}>{getFlowEmoji()}</span>
                    Score: {flowScore} / 10
                  </div>
                  <div className="vibe-slider-container">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={flowValue}
                      className="vibe-slider"
                      style={{ background: getSliderBackground(flowValue) }}
                      onChange={(e) => setFlowValue(parseInt(e.target.value))}
                    />
                  </div>
                  <div className="vibe-labels">
                    <span>Confusing</span>
                    <span>Some friction</span>
                    <span>Smooth</span>
                    <span>Effortless</span>
                  </div>
                </div>

                <div style={{ marginTop: 28 }}>
                  <label className="form-label">
                    Quick take <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <textarea
                    className="feedback-answer"
                    placeholder="What's your gut reaction? No need to overthink it..."
                    style={{ minHeight: 60 }}
                    value={quickTake}
                    onChange={(e) => setQuickTake(e.target.value)}
                  />
                </div>

                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}
                  onClick={() => { setActiveTab('feedback'); setQuestionsVisited(true) }}
                >
                  Next: Questions →
                </button>
              </div>
            )}

            {/* Questions */}
            {activeTab === 'feedback' && (
              <div className="panel-section active" style={{ display: 'block' }}>
                <div className="feedback-section">
                  {(review.questions || []).map((q: Question, i: number) => (
                    <div key={i} className="feedback-question">
                      <div className="feedback-q-label">
                        <span className="feedback-q-num">{i + 1}</span>
                        {q.text}
                      </div>
                      {q.type === 'Rating' ? (
                        <div className="feedback-rating">
                          {['Not at all', 'Somewhat', 'Yes', 'Very much'].map((label) => (
                            <button
                              key={label}
                              className={`feedback-rating-btn ${answers[i] === label ? 'selected' : ''}`}
                              onClick={() => setAnswers({ ...answers, [i]: label })}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      ) : q.type === 'Yes/No' ? (
                        <div className="feedback-rating">
                          {['Yes', 'No'].map((label) => (
                            <button
                              key={label}
                              className={`feedback-rating-btn ${answers[i] === label ? 'selected' : ''}`}
                              onClick={() => setAnswers({ ...answers, [i]: label })}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <textarea
                          className="feedback-answer"
                          placeholder="Type your thoughts..."
                          value={answers[i] || ''}
                          onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                        />
                      )}
                    </div>
                  ))}
                  {(!review.questions || review.questions.length === 0) && (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
                      No questions set for this review.
                    </div>
                  )}
                </div>

                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 20, opacity: hasAnswers ? 1 : 0.4 }}
                  disabled={!hasAnswers}
                  onClick={() => { setActiveTab('pins'); setPinsVisited(true) }}
                >
                  {hasAnswers ? 'Next: Pins →' : 'Answer at least one question to continue'}
                </button>
              </div>
            )}

            {/* Pins */}
            {activeTab === 'pins' && (
              <div className="panel-section active" style={{ display: 'block' }}>
                {pins.length > 0 ? (
                  <div className="pin-comment-list">
                    {pins.map((pin) => (
                      <div key={pin.id} className="pin-comment">
                        <div className="pin-num">{pin.id}</div>
                        <div className="pin-comment-body" style={{ flex: 1 }}>
                          <textarea
                            className="feedback-answer"
                            placeholder="What's your thought about this area?"
                            style={{ minHeight: 50, fontSize: 13 }}
                            value={pin.comment}
                            onChange={(e) => updatePinComment(pin.id, e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                    <div style={{ textAlign: 'center', marginTop: 8 }}>
                      <button
                        className="btn btn-sm"
                        style={{ padding: '6px 20px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                        onClick={() => setPinMode(true)}
                      >
                        📌 Add another pin
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="add-pin-prompt" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                    <span>📌</span>
                    <span style={{ fontSize: 13 }}>Click the button below to start<br />adding comments to the design</span>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setPinMode(true)}
                    >
                      📌 Enter Pin Mode
                    </button>
                  </div>
                )}

                <div style={{ marginTop: 20, padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-tertiary)' }}>
                    Pins are optional — add them if you want, then submit below.
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Submit bar */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <button
              className="btn btn-accent"
              style={{ width: '100%', justifyContent: 'center', opacity: pinsComplete ? 1 : 0.4 }}
              onClick={handleSubmit}
              disabled={!pinsComplete || submitting || submitted}
            >
              {submitted ? '✓ Submitted!' : submitting ? 'Submitting...' : pinsComplete ? 'Submit Feedback' : 'Complete all steps to submit'}
            </button>
          </div>
        </div>
      </div>

      {/* Loom Lightbox */}
      {showLoom && loomEmbedUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowLoom(false)}
        >
          <div
            style={{
              width: '80%',
              maxWidth: 960,
              aspectRatio: '16/9',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-xl)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={loomEmbedUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allowFullScreen
              allow="autoplay; fullscreen"
            />
            <button
              onClick={() => setShowLoom(false)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)',
                color: 'white',
                border: 'none',
                fontSize: 18,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(8px)',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Name modal */}
      {showNameModal && (
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
        >
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px 28px',
              width: 380,
              maxWidth: '90vw',
              boxShadow: 'var(--shadow-xl)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>👋</div>
            <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 600 }}>Welcome, reviewer!</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-secondary)' }}>
              Let us know who you are, or stay anonymous.
            </p>
            <input
              className="form-input"
              type="text"
              placeholder="Your name..."
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && nameInput.trim()) {
                  setReviewerName(nameInput.trim())
                  setShowNameModal(false)
                }
              }}
              autoFocus
              style={{ width: '100%', padding: '10px 14px', fontSize: 14, borderRadius: 'var(--radius)', marginBottom: 12 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => {
                  setReviewerName('Anonymous')
                  setShowNameModal(false)
                }}
              >
                Stay anonymous
              </button>
              <button
                className="btn btn-accent"
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={!nameInput.trim()}
                onClick={() => {
                  setReviewerName(nameInput.trim())
                  setShowNameModal(false)
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast />
    </div>
  )
}
