import { Navigate, useParams } from 'react-router-dom'
import { findReviewPage } from './reviewPages'
import Pending from './Pending'

/**
 * Translates an address into one rendered thing, and stops. No fetching, no
 * layout, no state — the review pages themselves are plain components that a
 * test or any other screen could render without a router.
 */
export default function ReviewRoute() {
  const { slug } = useParams()
  const page = findReviewPage(slug)
  if (!page) return <Navigate to="/review" replace />

  const { Page } = page
  return Page ? <Page /> : <Pending page={page} />
}
