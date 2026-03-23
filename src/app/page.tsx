import Nav from '@/components/Nav'
import DashboardStats from '@/components/DashboardStats'
import ReviewCard from '@/components/ReviewCard'
import ArchivedSection from '@/components/ArchivedSection'
import Toast from '@/components/Toast'
import ConfirmModal from '@/components/ConfirmModal'
import { getReviews } from '@/lib/actions/reviews'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const reviews = await getReviews()
  const activeReviews = reviews.filter((r: any) => r.status !== 'closed')

  return (
    <>
      <Nav />
      <div className="view active" style={{ display: 'block', paddingTop: 64, minHeight: '100vh' }}>
        <div className="container">
          <div className="dash-header animate-in">
            <div>
              <h1>Your Reviews</h1>
              <p>Collect structured feedback on your work — fast.</p>
            </div>
            <a href="/create" className="btn btn-primary" style={{ textDecoration: 'none' }}>+ New Review</a>
          </div>

          <DashboardStats reviews={reviews} />

          <div className="section-header animate-in">
            <h2>Recent Reviews</h2>
          </div>

          <div className="review-grid animate-in">
            {activeReviews.length > 0 ? (
              activeReviews.map((r: any) => (
                <ReviewCard key={r.id} review={r} isArchived={false} />
              ))
            ) : (
              <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                <div className="empty-state-icon">📋</div>
                <h3>No active reviews</h3>
                <p>Create your first review to start collecting feedback.</p>
                <a href="/create" className="btn btn-primary" style={{ textDecoration: 'none' }}>+ New Review</a>
              </div>
            )}
          </div>

          <ArchivedSection reviews={reviews} />
        </div>
      </div>
      <Toast />
      <ConfirmModal />
    </>
  )
}
