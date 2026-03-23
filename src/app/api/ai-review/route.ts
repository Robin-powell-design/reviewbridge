import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { title, context, embedUrl, embedType, questions } = await req.json()

    const prompt = `You are a senior UX/UI design reviewer. You are reviewing a design called "${title}".

Context from the designer: "${context || 'No context provided'}"
Design type: ${embedType || 'prototype'}
Design URL: ${embedUrl || 'Not provided'}
Feedback questions the designer is asking reviewers:
${(questions || []).map((q: { text: string }, i: number) => `${i + 1}. ${q.text}`).join('\n')}

Based on this information, provide a thorough design review. Respond in valid JSON with this exact structure:
{
  "scores": [
    { "score": <number 1-10 with one decimal>, "label": "Visual Hierarchy", "text": "<1-2 sentence assessment>" },
    { "score": <number 1-10 with one decimal>, "label": "Accessibility", "text": "<1-2 sentence assessment>" },
    { "score": <number 1-10 with one decimal>, "label": "Consistency", "text": "<1-2 sentence assessment>" },
    { "score": <number 1-10 with one decimal>, "label": "Usability", "text": "<1-2 sentence assessment>" }
  ],
  "suggestions": [
    { "priority": "high|medium|low", "label": "<short title>", "text": "<1-2 sentence actionable suggestion>" },
    { "priority": "high|medium|low", "label": "<short title>", "text": "<1-2 sentence actionable suggestion>" },
    { "priority": "high|medium|low", "label": "<short title>", "text": "<1-2 sentence actionable suggestion>" },
    { "priority": "high|medium|low", "label": "<short title>", "text": "<1-2 sentence actionable suggestion>" }
  ]
}

Make your review SPECIFIC to this design based on its title, context, and the questions the designer is asking. Do not give generic advice — tailor every score and suggestion to what this design is about. Be honest but constructive. Only return valid JSON, no other text.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    const review = JSON.parse(content.text)
    return NextResponse.json(review)
  } catch (error) {
    console.error('AI review error:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI review' },
      { status: 500 }
    )
  }
}
