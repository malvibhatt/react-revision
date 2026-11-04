import { Link } from 'react-router-dom'
import Callout from '../../components/Callout'
import type { ReviewPage } from './reviewPages'

/**
 * Rendered in place of a page that is planned but not written, so every entry
 * in the sidebar is navigable and still says what it will cover.
 */
export default function Pending({ page }: { page: ReviewPage }) {
  return (
    <>
      <h1 className="lesson-title">{page.title}</h1>
      <p className="lesson-sub">{page.blurb}</p>

      <Callout kind="note" title="Not written yet">
        <p>
          This page is in the plan and has not been built. Pages are written one at a
          time: each one gets reviewed before the next one starts, because the first
          finding sets the voice and the length for every finding after it.
        </p>
        <p>
          <Link to="/review">See how a finding is put together →</Link>
        </p>
      </Callout>

      <h2 className="section">What it will cover</h2>
      <ul className="checklist">
        {page.covers.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
    </>
  )
}
