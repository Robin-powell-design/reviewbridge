import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
})

export async function POST(req: NextRequest) {
  try {
    const { title, context, embedType, questions } = await req.json()

    const questionsText = (questions || []).map((q: { text: string }, i: number) => `${i + 1}. ${q.text}`).join('\n')

    const prompt = `You are a senior UX/UI design reviewer. A designer has submitted their design for review through a feedback tool. Your job is to review THEIR design — not the feedback tool itself.

IMPORTANT: You are reviewing the designer's work described below. Do NOT review or comment on the review tool, the feedback interface, or anything about "ReviewBridge".

## The design being reviewed:
- Design name: "${title}"
- Designer's context/brief: "${context || 'No additional context provided'}"
- Design format: ${embedType === 'figma' ? 'Figma prototype' : embedType === 'screenshots' ? 'Static screenshots/mockups' : 'Interactive prototype'}
${questionsText ? `\n## Questions the designer wants feedback on:\n${questionsText}` : ''}

Based on the design name, context, and the designer's specific questions, provide a thorough review. Focus your feedback on:
- What the designer described and asked about
- Common UX/UI pitfalls for this type of design
- Actionable improvements specific to their project

Respond in valid JSON with this exact structure:
{
  "scores": [
    { "score": <number 1-10 with one decimal>, "label": "Visual Hierarchy", "text": "<1-2 sentence assessment specific to this design>" },
    { "score": <number 1-10 with one decimal>, "label": "Accessibility", "text": "<1-2 sentence assessment specific to this design>" },
    { "score": <number 1-10 with one decimal>, "label": "Consistency", "text": "<1-2 sentence assessment specific to this design>" },
    { "score": <number 1-10 with one decimal>, "label": "Usability", "text": "<1-2 sentence assessment specific to this design>" }
  ],
  "suggestions": [
    { "priority": "high|medium|low", "label": "<short title>", "text": "<1-2 sentence actionable suggestion>" },
    { "priority": "high|medium|low", "label": "<short title>", "text": "<1-2 sentence actionable suggestion>" },
    { "priority": "high|medium|low", "label": "<short title>", "text": "<1-2 sentence actionable suggestion>" },
    { "priority": "high|medium|low", "label": "<short title>", "text": "<1-2 sentence actionable suggestion>" }
  ]
}

Be honest but constructive. Only return valid JSON, no other text.`

    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from Grok')
    }

    const review = JSON.parse(content)
    return NextResponse.json(review)
  } catch (error) {
    console.error('AI review error:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI review' },
      { status: 500 }
    )
  }
}
