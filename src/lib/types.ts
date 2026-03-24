export interface Review {
  id: string
  title: string
  context: string
  embed_url: string
  embed_type: 'prototype' | 'figma' | 'upload'
  loom_url: string
  questions: Question[]
  status: 'active' | 'closed'
  created_at: string
  updated_at: string
  responses?: Response[]
}

export interface Question {
  text: string
  type: 'Text' | 'Rating' | 'Yes/No'
}

export interface Response {
  id: string
  review_id: string
  reviewer_name: string
  vibe_score: number
  brand_score: number
  flow_score: number
  quick_take: string
  answers: QuestionAnswer[]
  pins: PinComment[]
  submitted_at: string
}

export interface QuestionAnswer {
  question: string
  answer: string
}

export interface PinComment {
  pin: string
  comment: string
  x?: number
  y?: number
}
