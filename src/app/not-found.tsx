import Nav from '@/components/Nav'

export default function NotFound() {
  return (
    <>
      <Nav />
      <div style={{ display: 'block', paddingTop: 64, minHeight: '100vh' }}>
        <div className="container">
          <div className="empty-state" style={{ marginTop: 60 }}>
            <div className="empty-state-icon">🔍</div>
            <h3>Page not found</h3>
            <p>The review you&apos;re looking for doesn&apos;t exist or may have been deleted.</p>
            <a href="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
