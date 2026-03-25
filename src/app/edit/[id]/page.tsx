'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Nav from '@/components/Nav'
import Toast, { showToast } from '@/components/Toast'
import { updateReview } from '@/lib/actions/reviews'
import { createClient } from '@/lib/supabase/client'
import { uploadImage } from '@/lib/uploadImage'

export default function EditPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [context, setContext] = useState('')
  const [embedType, setEmbedType] = useState<'prototype' | 'figma' | 'upload'>('prototype')
  const [embedUrl, setEmbedUrl] = useState('')
  const [loomUrl, setLoomUrl] = useState('')
  const [reviewMode, setReviewMode] = useState<'standard' | 'compare'>('standard')
  const [compareOptions, setCompareOptions] = useState([
    { label: 'Option A', embed_url: '' },
    { label: 'Option B', embed_url: '' },
  ])
  const [questions, setQuestions] = useState<{ text: string; type: string }[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', id)
        .single()

      if (data) {
        setTitle(data.title || '')
        setContext(data.context || '')
        setEmbedType(data.embed_type || 'prototype')
        setEmbedUrl(data.embed_url || '')
        setLoomUrl(data.loom_url || '')
        setReviewMode(data.review_mode || 'standard')
        setCompareOptions(data.compare_options?.length ? data.compare_options : [
          { label: 'Option A', embed_url: '' },
          { label: 'Option B', embed_url: '' },
        ])
        setQuestions(data.questions || [])
      } else {
        showToast('Review not found')
        router.push('/')
      }
      setLoading(false)
    }
    load()
  }, [id, router])

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

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('Please enter a review title')
      return
    }
    setSaving(true)
    try {
      await updateReview(id, {
        title,
        context,
        embed_url: reviewMode === 'standard' ? embedUrl : '',
        embed_type: embedType,
        loom_url: loomUrl,
        review_mode: reviewMode,
        compare_options: reviewMode === 'compare' ? compareOptions.filter(o => o.embed_url.trim()) : [],
        questions: questions.filter(q => q.text.trim()),
      })
      showToast('✓ Review updated!')
      setTimeout(() => router.push('/'), 1000)
    } catch (err) {
      showToast('Error saving review')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <Nav />
        <div style={{ display: 'block', paddingTop: 64, minHeight: '100vh' }}>
          <div className="create-container">
            <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-tertiary)' }}>
              Loading review...
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Nav />
      <div style={{ display: 'block', paddingTop: 64, minHeight: '100vh' }}>
        <div className="create-container">
          <div className="create-header animate-in">
            <h1>Edit Review</h1>
            <p>Update your review details and questions.</p>
          </div>

          <div className="animate-in">
            {/* Review mode */}
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

            {/* Details */}
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
                placeholder="What are you working on? What kind of feedback do you need?"
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
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
            </div>

            {/* Questions */}
            <div className="form-group" style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <label className="form-label">Feedback questions</label>
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

            {/* Actions */}
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => router.push('/')}>Cancel</button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => router.push(`/r/${id}`)}
                >
                  Preview →
                </button>
                <button
                  className="btn btn-accent"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : '✓ Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toast />
    </>
  )
}
