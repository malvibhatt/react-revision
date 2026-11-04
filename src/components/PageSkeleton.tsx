/**
 * Fallback for a lazily-loaded page. Shaped like a page — a title, a
 * subtitle and a few blocks — so the layout does not jump when the real
 * content arrives. A centred spinner would be a different height from every
 * page it stands in for, which guarantees a reflow exactly as the reader
 * starts reading.
 */
export default function PageSkeleton() {
  return (
    <div className="skeleton" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading page</span>
      <div className="sk-line sk-title" />
      <div className="sk-line sk-sub" />
      <div className="sk-block" />
      <div className="sk-line" />
      <div className="sk-line sk-short" />
      <div className="sk-block" />
    </div>
  )
}
