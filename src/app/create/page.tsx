'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import Toast, { showToast } from '@/components/Toast'
import { createReview } from '@/lib/actions/reviews'
import { generateId } from '@/lib/utils'

export default function CreatePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [context, setContext] = useState('')
  const [embedType, setEmbedType] = useState<'prototype' | 'figma' | 'upload'>('prototype')
  const [embedUrl, setEmbedUrl] = useState('')
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
        embed_url: embedUrl,
        embed_type: embedType,
        loom_url: loomUrl,
        questions: questions.filter(q => q.text.trim()),
      })
      const baseUrl = window.location.origin
      setShareUrl(`${baseUrl}/r/${id}`)
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
    try {
      await fetch('/api/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          reviewId: shareUrl.split('/r/')[1],
          reviewTitle: title,
        }),
      })
      showToast(`Invite sent to ${inviteEmail}`)
      setInviteEmail('')
    } catch {
      showToast('Error sending invite')
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
                <input
                  className="form-input"
                  type="url"
                  placeholder={embedType === 'figma' ? 'Paste your Figma URL...' : 'Paste your prototype URL...'}
                  value={embedUrl}
                  onChange={(e) => setEmbedUrl(e.target.value)}
                />
              </div>

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
                <button className="btn btn-ghost" onClick={() => router.push('/')}>Cancel</button>
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
        <div className="modal">
          <h2>Share your review</h2>
          <p>Anyone with this link can view the design and leave feedback.</p>

          <div className="share-link-box">
            <input className="share-link-input" value={shareUrl} readOnly />
            <button className="btn btn-primary btn-sm" onClick={copyShareLink}>Copy</button>
          </div>

          <div>
            <label className="form-label">Invite reviewers by email</label>
            <div className="invite-row">
              <input
                className="form-input"
                type="email"
                placeholder="email@company.com"
                style={{ flex: 1 }}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendInvite()}
              />
              <button className="btn btn-secondary btn-sm" onClick={sendInvite}>Send</button>
            </div>
          </div>

          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => { setShowShareModal(false); router.push('/') }}>
              Close
            </button>
            <button className="btn btn-accent" onClick={() => {
              setShowShareModal(false)
              const id = shareUrl.split('/r/')[1]
              router.push(`/r/${id}`)
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
