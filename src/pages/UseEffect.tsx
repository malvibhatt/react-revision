import { useEffect, useState } from 'react'
import Code from '../components/Code'

const KEY = 'react-revision-notes'

export default function UseEffect() {
  const [notes, setNotes] = useState<string[]>(() => {
    const saved = localStorage.getItem(KEY)
    return saved ? JSON.parse(saved) : []
  })
  const [draft, setDraft] = useState('')
  const [ticks, setTicks] = useState(0)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(notes))
  }, [notes])

  useEffect(() => {
    const id = setInterval(() => setTicks((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <h1 className="lesson-title">useEffect</h1>
      <p className="lesson-sub">Run side effects <em>after</em> render — DOM updates, subscriptions, network calls, timers.</p>

      <div className="highlight">
        <code>useEffect(fn, deps)</code> runs <code>fn</code> after render, and again whenever a value in <code>deps</code> changes. Return a <strong>cleanup function</strong> to tear the effect down before the next run or on unmount.
      </div>

      <h2 className="section">Dependency array cheat sheet</h2>
      <table className="map">
        <thead><tr><th>Dependency array</th><th>When it runs</th></tr></thead>
        <tbody>
          <tr><td><code>[value]</code></td><td>On mount + whenever <code>value</code> changes</td></tr>
          <tr><td><code>[]</code></td><td>Once on mount only (like <code>ngOnInit</code>)</td></tr>
          <tr><td><em>omitted</em></td><td>After every render (rarely correct)</td></tr>
        </tbody>
      </table>

      <h2 className="section">Persistence (TrackWise's localStorage pattern)</h2>
      <Code>{`useEffect(() => {
  localStorage.setItem('notes', JSON.stringify(notes));
}, [notes]); // re-run whenever notes change`}</Code>

      <div className="demo">
        <div className="demo-label">Type a note, hit Add. Refresh the page — it persists.</div>
        <input
          className="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="A note..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && draft.trim()) {
              setNotes((prev) => [...prev, draft])
              setDraft('')
            }
          }}
        />
        <button
          className="action"
          onClick={() => {
            if (!draft.trim()) return
            setNotes((prev) => [...prev, draft])
            setDraft('')
          }}
        >Add</button>
        <button className="action ghost" onClick={() => setNotes([])}>Clear</button>
        <div style={{ marginTop: '0.75rem' }}>
          {notes.length === 0
            ? <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No notes yet.</p>
            : notes.map((n, i) => <div key={i} className="tx-row income">{n}</div>)}
        </div>
      </div>

      <h2 className="section">Cleanup functions</h2>
      <Code>{`useEffect(() => {
  const id = setInterval(() => tick(), 1000);

  return () => clearInterval(id); // cleanup on unmount or before re-run
}, []);`}</Code>

      <div className="demo">
        <div className="demo-label">Timer that cleans up when this page unmounts (navigate away and back)</div>
        <div className="stat">Seconds on page <strong>{ticks}</strong></div>
      </div>

      <h2 className="section">Angular equivalents</h2>
      <ul className="mistakes">
        <li><code>{'useEffect(() => {}, [])'}</code> ≈ <code>ngOnInit</code></li>
        <li>Cleanup function ≈ <code>ngOnDestroy</code></li>
        <li><code>{'useEffect(() => {}, [x])'}</code> ≈ <code>ngOnChanges</code> for a single input</li>
      </ul>
    </>
  )
}
