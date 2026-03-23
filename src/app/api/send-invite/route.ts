import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { email, reviewId, reviewTitle } = await request.json()

  if (!email || !reviewId) {
    return NextResponse.json({ error: 'Email and reviewId are required' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'
  const reviewUrl = `${appUrl}/r/${reviewId}`

  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email invite - no API key] To: ${email}, Review: ${reviewTitle}, URL: ${reviewUrl}`)
    return NextResponse.json({
      success: false,
      error: 'Email not configured. Add RESEND_API_KEY to enable email invites.',
      fallback: true,
      reviewUrl,
    }, { status: 200 })
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'ReviewBridge <onboarding@resend.dev>'

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `Feedback requested: ${reviewTitle || 'Design Review'}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; width: 40px; height: 40px; background: #1a1a1a; color: white; border-radius: 10px; font-size: 20px; font-weight: 700; line-height: 40px; text-align: center;">R</div>
          </div>
          <h2 style="font-size: 22px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px;">You've been invited to review</h2>
          <h3 style="font-size: 18px; font-weight: 600; color: #FF6B35; margin: 0 0 16px;">${reviewTitle || 'Design Review'}</h3>
          <p style="font-size: 15px; color: #666; line-height: 1.6; margin: 0 0 28px;">
            Someone wants your feedback on their design. It only takes a few minutes — your input helps shape better work.
          </p>
          <a href="${reviewUrl}" style="display: inline-block; padding: 14px 32px; background: #1a1a1a; color: white; border-radius: 100px; text-decoration: none; font-weight: 600; font-size: 15px;">
            Review Now →
          </a>
          <p style="font-size: 12px; color: #999; margin-top: 32px; line-height: 1.5;">
            This invite was sent via <span style="font-weight: 600;">ReviewBridge</span>. If you weren't expecting this, you can ignore it.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Email invite error]', err)
    return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 })
  }
}
