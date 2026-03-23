import { getReviewById } from '@/lib/actions/reviews'
import { notFound } from 'next/navigation'
import ReviewerView from './ReviewerView'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const review = await getReviewById(id)
  return {
    title: review ? `${review.title} — ReviewBridge` : 'Review Not Found',
    description: review?.context || 'Design review feedback',
  }
}

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const review = await getReviewById(id)

  if (!review) {
    notFound()
  }

  return <ReviewerView review={review} />
}
