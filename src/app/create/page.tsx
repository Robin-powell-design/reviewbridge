'use client'

import { useState } from 'react'
import Nav from '@/components/Nav'
import Toast, { showToast } from '@/components/Toast'
import { createReview, addInvitedEmail } from '@/lib/actions/reviews'
import { generateId } from '@/lib/utils'
import { uploadImage } from '@/lib/uploadImage'

export default function CreatePage() {
  const [step, setStep] = useState(1)
  const [reviewMode, setReviewMode] = useState<'standard' | 'compare'>('standard')
  const [title, setTitle] = useState('')
  const [context, setContext] = useState('')
  const [embedType, setEmbedType] = useState<'prototype' | 'figma' | 'upload'>('prototype')
  const [embedUrl, setEmbedUrl] = useState('')
  const [compareOptions, setCompareOptions] = useState([
    { label: 'Option A', embed_url: '' },
    { label: 'Option B', embed_url: '' },
  ])
  const [loomUrl, setLoomUrl] = useState('')
  const [questions, setQuestions] = useState([
    { text: '🎯 What is the first thing you notice?', type: 'Text' },
    { text: '🤔 Is anything confusing or unclear?', type: 'Text' },
    { text: '❌ What would you change or remove?', type: 'Text' },
    { text: '✅ What\'s working well?', type: 'Text' },
    { text: '🎉 Would you ship this as-is?', type: 'Text' },
  ])
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [sentEmails, setSentEmails] = useState<string[]>([])
  const [sendingEmail, setSendingEmail] = useState(false)
  const [shareTab, setShareTab] = useState<'slack' | 'email'>('slack')
  const [slackMessage, setSlackMessage] = useState('')
  const [deadline, setDeadline] = useState('')
  const [uploading, setUploading] = useState<number | null>(null)
  const [publishing, setPublishing] = useState(false)

  const addQuestion = () => {
    setQuestions([...questions, { text: '', type: 'Text' }])
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const updateQuestion = (index: number, field: 'text' | 'type', value: string) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    setQuestions(updated)
  }

  const goToStep = (s: number) => {
    if (s === 2 && !title.trim()) {
      showToast('Please enter a review title')
      return
    }
    setStep(s)
  }

  const handlePublish = async () => {
    setPublishing(true)
    try {
      const id = generateId()
      await createReview({
        id,
        title: title || 'Untitled Review',
        context,
        embed_url: reviewMode === 'standard' ? embedUrl : '',
        embed_type: embedType,
        loom_url: loomUrl,
        review_mode: reviewMode,
        compare_options: reviewMode === 'compare' ? compareOptions.filter(o => o.embed_url.trim()) : [],
        questions: questions.filter(q => q.text.trim()),
        deadline: deadline || null,
        invited_emails: sentEmails,
      })
      const baseUrl = window.location.origin
      const url = `${baseUrl}/r/${id}`
      setShareUrl(url)
      setSlackMessage(`Just published a new design for review: *${title || 'Untitled Review'}*\n\nI'm looking for feedback on:\n${questions.filter(q => q.text.trim()).map((q, i) => `${i + 1}. ${q.text}`).join('\n')}\n\nLeave your feedback here: ${url}`)
      setShowShareModal(true)
      showToast('✓ Review published!')
    } catch (err) {
      showToast('Error publishing review')
      console.error(err)
    } finally {
      setPublishing(false)
    }
  }

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      showToast('Copied to clipboard!')
    } catch {
      // fallback
      const input = document.querySelector('.share-link-input') as HTMLInputElement
      if (input) {
        input.select()
        document.execCommand('copy')
        showToast('Copied to clipboard!')
      }
    }
  }

  const sendInvite = async () => {
    if (!inviteEmail.trim()) return
    setSendingEmail(true)
    try {
      const res = await fetch('/api/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          reviewId: shareUrl.split('/r/')[1],
          reviewTitle: title,
        }),
      })
      const data = await res.json()
      if (data.fallback) {
        showToast('Email not configured yet — copy the link to share manually')
      } else if (data.success) {
        setSentEmails([...sentEmails, inviteEmail])
        const reviewId = shareUrl.split('/r/')[1]
        addInvitedEmail(reviewId, inviteEmail)
        showToast(`Invite sent to ${inviteEmail}`)
        setInviteEmail('')
      } else {
        showToast('Error sending invite')
      }
    } catch {
      showToast('Error sending invite')
    } finally {
      setSendingEmail(false)
    }
  }

  const copySlackMessage = async () => {
    try {
      await navigator.clipboard.writeText(slackMessage)
      showToast('Slack message copied! Paste it in your channel.')
    } catch {
      showToast('Could not copy — try selecting manually')
    }
  }

  return (
    <>
      <Nav />
      <div style={{ display: 'block', paddingTop: 64, minHeight: '100vh' }}>
        <div className="create-container">
          <div className="create-header animate-in">
            <h1>New Review</h1>
            <p>Share your work and get structured feedback in hours, not days.</p>
          </div>

          <div className="create-steps animate-in">
            <div className={`create-step ${step === 1 ? 'active' : step > 1 ? 'done' : ''}`}>
              <div className="create-step-num">{step > 1 ? '✓' : '1'}</div>
              Content
            </div>
            <div className="create-step-line" />
            <div className={`create-step ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`}>
              <div className="create-step-num">{step > 2 ? '✓' : '2'}</div>
              Questions
            </div>
            <div className="create-step-line" />
            <div className={`create-step ${step === 3 ? 'active' : ''}`}>
              <div className="create-step-num">3</div>
              Share
            </div>
          </div>

          {/* Step 1: Content */}
          {step === 1 && (
            <div className="animate-in">
              {/* Review mode toggle */}
              <div className="form-group">
                <label className="form-label">Review type</label>
                <div className="embed-options">
                  <div
                    className={`embed-option ${reviewMode === 'standard' ? 'selected' : ''}`}
                    onClick={() => setReviewMode('standard')}
                  >
                    <div className="embed-option-icon">📋</div>
                    <div className="embed-option-label">Standard Review</div>
                  </div>
                  <div
                    className={`embed-option ${reviewMode === 'compare' ? 'selected' : ''}`}
                    onClick={() => setReviewMode('compare')}
                  >
                    <div className="embed-option-icon">⚖️</div>
                    <div className="embed-option-label">A/B Compare</div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Review title</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Shipment Tracker Redesign"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Context</label>
                <textarea
                  className="form-input"
                  placeholder="What are you working on? Where are you stuck? What kind of feedback do you need?"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                />
                <p className="form-hint">Be specific — it helps reviewers give better feedback.</p>
              </div>

              {reviewMode === 'standard' ? (
                <div className="form-group">
                  <label className="form-label">Embed your design</label>
                  <div className="embed-options">
                    {(['prototype', 'figma', 'upload'] as const).map((type) => (
                      <div
                        key={type}
                        className={`embed-option ${embedType === type ? 'selected' : ''}`}
                        onClick={() => setEmbedType(type)}
                      >
                        <div className="embed-option-icon">
                          {type === 'prototype' ? '🔗' : type === 'figma' ? '🎨' : '📸'}
                        </div>
                        <div className="embed-option-label">
                          {type === 'prototype' ? 'Prototype URL' : type === 'figma' ? 'Figma Link' : 'Screenshots'}
                        </div>
                      </div>
                    ))}
                  </div>
                  {embedType === 'upload' ? (
                    embedUrl ? (
                      <div style={{ position: 'relative', marginTop: 8 }}>
                        <img
                          src={embedUrl}
                          alt="Uploaded design"
                          style={{ width: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
                        />
                        <button
                          onClick={() => setEmbedUrl('')}
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.6)',
                            color: 'white',
                            border: 'none',
                            fontSize: 14,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 180,
                        border: '2px dashed var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        cursor: uploading !== null ? 'wait' : 'pointer',
                        color: 'var(--text-tertiary)',
                        fontSize: 14,
                        gap: 8,
                        marginTop: 8,
                      }}>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            setUploading(-1)
                            try {
                              const url = await uploadImage(file, `standard_${Date.now()}`)
                              setEmbedUrl(url)
                            } catch (err) {
                              console.error(err)
                              showToast('Error uploading image')
                            } finally {
                              setUploading(null)
                            }
                          }}
                        />
                        {uploading === -1 ? (
                          <span>Uploading...</span>
                        ) : (
                          <>
                            <span style={{ fontSize: 32 }}>📸</span>
                            <span>Click to upload a screenshot</span>
                          </>
                        )}
                      </label>
                    )
                  ) : (
                    <input
                      className="form-input"
                      type="url"
                      placeholder={embedType === 'figma' ? 'Paste your Figma URL...' : 'Paste your prototype URL...'}
                      value={embedUrl}
                      onChange={(e) => setEmbedUrl(e.target.value)}
                    />
                  )}
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Design options to compare</label>
                  <p className="form-hint" style={{ marginBottom: 16, marginTop: 0 }}>
                    Upload 2–3 design screenshots. Reviewers will pick their favourite before leaving feedback.
                  </p>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {compareOptions.map((opt, i) => (
                      <div key={i} style={{
                        flex: '1 1 200px',
                        minWidth: 200,
                        border: '2px dashed var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        position: 'relative',
                      }}>
                        {/* Label input */}
                        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            className="form-input"
                            type="text"
                            placeholder={`Option ${String.fromCharCode(65 + i)}`}
                            value={opt.label}
                            onChange={(e) => {
                              const updated = [...compareOptions]
                              updated[i] = { ...updated[i], label: e.target.value }
                              setCompareOptions(updated)
                            }}
                            style={{ border: 'none', padding: 0, fontSize: 14, fontWeight: 600, background: 'transparent', flex: 1 }}
                          />
                          {compareOptions.length > 2 && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => setCompareOptions(compareOptions.filter((_, j) => j !== i))}
                              style={{ padding: '2px 6px', fontSize: 14, lineHeight: 1 }}
                            >
                              ×
                            </button>
                          )}
                        </div>

                        {/* Upload area */}
                        {opt.embed_url ? (
                          <div style={{ position: 'relative' }}>
                            <img
                              src={opt.embed_url}
                              alt={opt.label}
                              style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
                            />
                            <button
                              onClick={() => {
                                const updated = [...compareOptions]
                                updated[i] = { ...updated[i], embed_url: '' }
                                setCompareOptions(updated)
                              }}
                              style={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: 'rgba(0,0,0,0.6)',
                                color: 'white',
                                border: 'none',
                                fontSize: 14,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <label style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: 180,
                            cursor: uploading === i ? 'wait' : 'pointer',
                            color: 'var(--text-tertiary)',
                            fontSize: 13,
                            gap: 8,
                          }}>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                setUploading(i)
                                try {
                                  const url = await uploadImage(file, `compare_${Date.now()}`)
                                  const updated = [...compareOptions]
                                  updated[i] = { ...updated[i], embed_url: url }
                                  setCompareOptions(updated)
                                } catch (err) {
                                  console.error(err)
                                  showToast('Error uploading image')
                                } finally {
                                  setUploading(null)
                                }
                              }}
                            />
                            {uploading === i ? (
                              <span>Uploading...</span>
                            ) : (
                              <>
                                <span style={{ fontSize: 28 }}>📸</span>
                                <span>Click to upload</span>
                              </>
                            )}
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                  {compareOptions.length < 3 && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setCompareOptions([...compareOptions, { label: `Option ${String.fromCharCode(65 + compareOptions.length)}`, embed_url: '' }])}
                      style={{ marginTop: 12 }}
                    >
                      + Add option
                    </button>
                  )}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  Loom walkthrough <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  className="form-input"
                  type="url"
                  placeholder="Paste Loom URL..."
                  value={loomUrl}
                  onChange={(e) => setLoomUrl(e.target.value)}
                />
                <p className="form-hint">Walk through your thinking — reviewers respond better when they understand the &ldquo;why&rdquo;.</p>
              </div>

              <div className="form-actions">
                <button className="btn btn-ghost" onClick={() => window.location.href = '/'}>Cancel</button>
                <button className="btn btn-primary" onClick={() => goToStep(2)}>Next: Questions →</button>
              </div>
            </div>
          )}

          {/* Step 2: Questions */}
          {step === 2 && (
            <div className="animate-in">
              <div className="form-group">
                <label className="form-label">Feedback questions</label>
                <p className="form-hint" style={{ marginBottom: 16, marginTop: 0 }}>
                  Structure what you want to know. Better questions = better feedback.
                </p>

                <div className="questions-list">
                  {questions.map((q, i) => (
                    <div key={i} className="question-item">
                      <span className="question-drag">⠿</span>
                      <input
                        className="question-input"
                        value={q.text}
                        placeholder="Type your question..."
                        onChange={(e) => updateQuestion(i, 'text', e.target.value)}
                      />
                      <select
                        className="question-type"
                        value={q.type}
                        onChange={(e) => updateQuestion(i, 'type', e.target.value)}
                      >
                        <option>Text</option>
                        <option>Rating</option>
                        <option>Yes/No</option>
                      </select>
                      <button className="question-remove" onClick={() => removeQuestion(i)}>×</button>
                    </div>
                  ))}
                </div>

                <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={addQuestion}>
                  + Add question
                </button>
              </div>

              <div className="form-group" style={{ marginTop: 8 }}>
                <label className="form-label">
                  Deadline <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  className="form-input"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={{ maxWidth: 220 }}
                />
                <p className="form-hint">Reviewers will see the deadline. Reminders are sent 24h before.</p>
              </div>

              <div className="form-actions">
                <button className="btn btn-ghost" onClick={() => goToStep(1)}>← Back</button>
                <button className="btn btn-accent" onClick={handlePublish} disabled={publishing}>
                  {publishing ? 'Publishing...' : 'Publish & Share →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      <div className={`modal-overlay ${showShareModal ? 'active' : ''}`}>
        <div className="modal" style={{ maxWidth: 520 }}>
          <h2>{title || 'Your Review'}</h2>

          {/* Share link */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>🔗 Anyone with the link can view and respond</span>
            <button
              className="btn btn-primary btn-sm"
              onClick={copyShareLink}
              style={{ marginLeft: 'auto', fontSize: 12 }}
            >
              Copy Link
            </button>
          </div>
          <div className="share-link-box" style={{ marginBottom: 20 }}>
            <input className="share-link-input" value={shareUrl} readOnly />
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            marginBottom: 16,
            gap: 0,
          }}>
            <button
              onClick={() => setShareTab('slack')}
              style={{
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 600,
                background: 'none',
                border: 'none',
                borderBottom: shareTab === 'slack' ? '2px solid var(--text-primary)' : '2px solid transparent',
                color: shareTab === 'slack' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              💬 Post message
            </button>
            <button
              onClick={() => setShareTab('email')}
              style={{
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 600,
                background: 'none',
                border: 'none',
                borderBottom: shareTab === 'email' ? '2px solid var(--text-primary)' : '2px solid transparent',
                color: shareTab === 'email' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              ✉️ Send directly
            </button>
          </div>

          {/* Slack tab */}
          {shareTab === 'slack' && (
            <div>
              <textarea
                className="form-input"
                value={slackMessage}
                onChange={(e) => setSlackMessage(e.target.value)}
                style={{
                  minHeight: 140,
                  fontSize: 13,
                  lineHeight: 1.6,
                  resize: 'vertical',
                  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary" onClick={copySlackMessage} style={{ flex: 1 }}>
                  📋 Copy Message
                </button>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8, textAlign: 'center' }}>
                Paste this into Slack, Teams, or any messaging app
              </p>
            </div>
          )}

          {/* Email tab */}
          {shareTab === 'email' && (
            <div>
              <div className="invite-row" style={{ marginBottom: 12 }}>
                <input
                  className="form-input"
                  type="email"
                  placeholder="reviewer@company.com"
                  style={{ flex: 1 }}
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendInvite()}
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={sendInvite}
                  disabled={sendingEmail}
                >
                  {sendingEmail ? '...' : 'Send'}
                </button>
              </div>
              {sentEmails.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 6 }}>Sent to:</div>
                  {sentEmails.map((e, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 0',
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                    }}>
                      <span style={{ color: 'var(--green)' }}>✓</span> {e}
                    </div>
                  ))}
                </div>
              )}
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 12 }}>
                Sends a styled email invitation with a direct link to your review.
              </p>
            </div>
          )}

          <div className="modal-actions" style={{ marginTop: 20 }}>
            <button className="btn btn-ghost" onClick={() => { setShowShareModal(false); window.location.href = '/' }}>
              Done
            </button>
            <button className="btn btn-accent" onClick={() => {
              setShowShareModal(false)
              const id = shareUrl.split('/r/')[1]
              window.location.href = `/r/${id}`
            }}>
              Preview as Reviewer →
            </button>
          </div>
        </div>
      </div>

      <Toast />
    </>
  )
}
