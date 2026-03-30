import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sets this header)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email not configured' }, { status: 500 })
  }

  const supabase = await createServerSupabaseClient()

  // Get active reviews with deadlines within the next 24 hours
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, title, deadline, invited_emails, responses(reviewer_name)')
    .eq('status', 'active')
    .not('deadline', 'is', null)
    .lte('deadline', in24h.toISOString())
    .gte('deadline', now.toISOString())

  if (!reviews?.length) {
    return NextResponse.json({ message: 'No reviews need reminders', sent: 0 })
  }

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'ReviewBridge <onboarding@resend.dev>'

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || 'http://localhost:3000'

  let totalSent = 0

  for (const review of reviews) {
    const invitedEmails: string[] = review.invited_emails || []
    const respondedNames = (review.responses || []).map((r: any) => r.reviewer_name?.toLowerCase())
    const pendingEmails = invitedEmails.filter(e => !respondedNames.some((n: string) => e.toLowerCase().includes(n)))

    if (pendingEmails.length === 0) continue

    const reviewUrl = `${appUrl}/r/${review.id}`
    const deadlineDate = new Date(review.deadline!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

    for (const email of pendingEmails) {
      try {
        await resend.emails.send({
          from: fromEmail,
          to: email,
          subject: `Reminder: "${review.title}" needs your feedback by ${deadlineDate}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; width: 40px; height: 40px; background: #1a1a1a; color: white; border-radius: 10px; font-size: 20px; font-weight: 700; line-height: 40px; text-align: center;">R</div>
              </div>
              <h2 style="font-size: 22px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px;">Deadline approaching</h2>
              <h3 style="font-size: 18px; font-weight: 600; color: #FF6B35; margin: 0 0 16px;">${review.title}</h3>
              <p style="font-size: 15px; color: #666; line-height: 1.6; margin: 0 0 28px;">
                This design review is due by <strong>${deadlineDate}</strong>. Your feedback hasn't been received yet — it only takes a few minutes.
              </p>
              <a href="${reviewUrl}" style="display: inline-block; padding: 14px 32px; background: #1a1a1a; color: white; border-radius: 100px; text-decoration: none; font-weight: 600; font-size: 15px;">
                Review Now →
              </a>
              <p style="font-size: 12px; color: #999; margin-top: 32px; line-height: 1.5;">
                This automated reminder was sent via <span style="font-weight: 600;">ReviewBridge</span>.
              </p>
            </div>
          `,
        })
        totalSent++
      } catch (err) {
        console.error(`[Cron reminder error] ${email}:`, err)
      }
    }
  }

  return NextResponse.json({ message: `Sent ${totalSent} reminder(s)`, sent: totalSent })
}
