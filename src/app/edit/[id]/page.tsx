'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Nav from '@/components/Nav'
import Toast, { showToast } from '@/components/Toast'
import { updateReview } from '@/lib/actions/reviews'
import { createClient } from '@/lib/supabase/client'

export default function EditPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [context, setContext] = useState('')
  const [embedType, setEmbedType] = useState<'prototype' | 'figma' | 'upload'>('prototype')
  const [embedUrl, setEmbedUrl] = useState('')
  const [loomUrl, setLoomUrl] = useState('')
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
        embed_url: embedUrl,
        embed_type: embedType,
        loom_url: loomUrl,
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
