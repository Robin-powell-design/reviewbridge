import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { email, reviewId, reviewTitle } = await request.json()

  if (!email || !reviewId) {
    return NextResponse.json({ error: 'Email and reviewId are required' }, { status: 400 })
  }

  const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://reviewbridge.vercel.app'}/r/${reviewId}`

  // TODO: Wire up Resend when API key is available
  // For now, just log and return success
  // import { Resend } from 'resend'
  // const resend = new Resend(process.env.RESEND_API_KEY)
  // await resend.emails.send({
  //   from: 'ReviewBridge <reviews@yourdomain.com>',
  //   to: email,
  //   subject: `Review requested: ${reviewTitle}`,
  //   html: `
  //     <h2>You've been invited to review: ${reviewTitle}</h2>
  //     <p>Click the link below to view the design and share your feedback:</p>
  //     <a href="${reviewUrl}" style="display:inline-block;padding:12px 24px;background:#FF6B35;color:white;border-radius:8px;text-decoration:none;font-weight:600">Review Now</a>
  //   `
  // })

  console.log(`[Email invite] To: ${email}, Review: ${reviewTitle}, URL: ${reviewUrl}`)

  return NextResponse.json({ success: true, message: 'Invite sent (placeholder)' })
}
