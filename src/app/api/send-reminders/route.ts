import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { reviewId, emails } = await request.json()

  if (!reviewId || !emails?.length) {
    return NextResponse.json({ error: 'reviewId and emails are required' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  // Get review details
  const { data: review } = await supabase
    .from('reviews')
    .select('title, responses(reviewer_name)')
    .eq('id', reviewId)
    .single()

  if (!review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || 'http://localhost:3000'
  const reviewUrl = `${appUrl}/r/${reviewId}`

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({
      success: false,
      error: 'Email not configured. Add RESEND_API_KEY to enable reminders.',
      fallback: true,
    })
  }

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'ReviewBridge <onboarding@resend.dev>'

  const results: { email: string; success: boolean }[] = []

  for (const email of emails) {
    try {
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: `Reminder: Feedback needed on "${review.title}"`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-block; width: 40px; height: 40px; background: #1a1a1a; color: white; border-radius: 10px; font-size: 20px; font-weight: 700; line-height: 40px; text-align: center;">R</div>
            </div>
            <h2 style="font-size: 22px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px;">Friendly reminder</h2>
            <h3 style="font-size: 18px; font-weight: 600; color: #FF6B35; margin: 0 0 16px;">${review.title}</h3>
            <p style="font-size: 15px; color: #666; line-height: 1.6; margin: 0 0 28px;">
              Your feedback is still needed on this design review. It only takes a few minutes — your perspective matters.
            </p>
            <a href="${reviewUrl}" style="display: inline-block; padding: 14px 32px; background: #1a1a1a; color: white; border-radius: 100px; text-decoration: none; font-weight: 600; font-size: 15px;">
              Review Now →
            </a>
            <p style="font-size: 12px; color: #999; margin-top: 32px; line-height: 1.5;">
              This reminder was sent via <span style="font-weight: 600;">ReviewBridge</span>.
            </p>
          </div>
        `,
      })
      results.push({ email, success: true })
    } catch (err) {
      console.error(`[Reminder error] ${email}:`, err)
      results.push({ email, success: false })
    }
  }

  return NextResponse.json({ success: true, results })
}
