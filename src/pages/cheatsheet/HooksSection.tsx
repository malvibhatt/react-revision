import { useMemo, useState } from 'react'
import Code from '../../components/Code'
import { HOOKS, type HookCategory } from './hooksData'

const CATEGORIES: (HookCategory | 'All')[] = [
  'All', 'State', 'Effect', 'Context', 'Ref', 'Performance', 'React 19', 'Utility',
]

function slug(c: string) {
  return c.toLowerCase().replace(/\s+/g, '')
}

export default function HooksSection() {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<HookCategory | 'All'>('All')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return HOOKS.filter((h) => {
      const matchesCat = cat === 'All' || h.category === cat
      if (!matchesCat) return false
      if (!q) return true
      return (h.name + h.when + (h.avoid ?? '') + h.category).toLowerCase().includes(q)
    })
  }, [query, cat])

  return (
    <>
      <h2 className="section">Every hook — when to reach for it</h2>
      <p className="para">
        Search by name or by the problem you have (&ldquo;expensive&rdquo;, &ldquo;listener&rdquo;, &ldquo;form&rdquo;).
      </p>

      <div className="cs-toolbar">
        <input
          className="text cs-search"
          placeholder="Search hooks…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="cs-chips">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={`cs-chip${cat === c ? ' active' : ''}`}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <p className="cs-count">{visible.length} of {HOOKS.length} hooks</p>

      {visible.map((h) => (
        <article className="hook-card" key={h.name}>
          <header className="hook-head">
            <h3>{h.name}</h3>
            <span className={`badge b-${slug(h.category)}`}>{h.category}</span>
          </header>

          <code className="hook-sig">{h.signature}</code>

          <div className="hook-when">
            <span className="tag-good">USE WHEN</span>
            <p>{h.when}</p>
          </div>

          {h.avoid && (
            <div className="hook-when avoid">
              <span className="tag-bad">DON&apos;T USE FOR</span>
              <p>{h.avoid}</p>
            </div>
          )}

          <Code>{h.code}</Code>

          {h.extraCode && (
            <>
              <p className="hook-extra-label">{h.extraLabel}</p>
              <Code>{h.extraCode}</Code>
            </>
          )}

          {h.notes && (
            <ul className="hook-notes">
              {h.notes.map((n) => <li key={n}>{n}</li>)}
            </ul>
          )}
        </article>
      ))}

      {visible.length === 0 && <div className="cs-empty">No hook matches that search.</div>}

      <h2 className="section">Rules of hooks</h2>
      <ol className="cs-rules">
        <li><strong>Only call at the top level.</strong> Never inside conditions, loops or nested functions — React matches hooks by call order.</li>
        <li><strong>Only call from React functions.</strong> Components or other custom hooks.</li>
        <li><strong>Custom hooks must start with <code>use</code>.</strong> That is how the linter enforces rules 1 and 2.</li>
        <li><strong>Install <code>eslint-plugin-react-hooks</code></strong> and never silence <code>exhaustive-deps</code> without a comment saying why.</li>
      </ol>

      <div className="two-col">
        <div className="col-bad">
          <div className="col-head">Breaks — order changes between renders</div>
          <Code>{`if (isLoggedIn) {
  const [x] = useState(0);
}`}</Code>
        </div>
        <div className="col-good">
          <div className="col-head">Works — hook at top, condition inside</div>
          <Code>{`const [x, setX] = useState(0);

if (isLoggedIn) {
  /* use x */
}`}</Code>
        </div>
      </div>
    </>
  )
}
