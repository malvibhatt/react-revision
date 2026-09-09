import { useMemo, useState } from 'react'
import Code from '../components/Code'

interface Tx { id: number; type: 'income' | 'expense'; amount: number }

const seed: Tx[] = [
  { id: 1, type: 'income', amount: 3000 },
  { id: 2, type: 'expense', amount: 800 },
  { id: 3, type: 'income', amount: 500 },
  { id: 4, type: 'expense', amount: 1200 },
]

export default function UseMemo() {
  const [txs, setTxs] = useState<Tx[]>(seed)
  const [other, setOther] = useState(0)

  const totals = useMemo(() => {
    const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return { income, expense, balance: income - expense }
  }, [txs])

  function addRandom() {
    setTxs((prev) => [
      ...prev,
      { id: Date.now(), type: Math.random() > 0.5 ? 'income' : 'expense', amount: Math.floor(Math.random() * 1000) + 100 },
    ])
  }

  return (
    <>
      <h1 className="lesson-title">useMemo</h1>
      <p className="lesson-sub">Cache the result of an expensive calculation until its dependencies change.</p>

      <div className="highlight">
        <code>useMemo(fn, deps)</code> runs <code>fn</code> once, remembers the result, and only re-runs when a value in <code>deps</code> changes. Use it for <strong>derived data</strong>, not for for simple expressions.
      </div>

      <h2 className="section">The pattern (TrackWise's SummaryBar)</h2>
      <Code>{`const totalIncome = useMemo(
  () => transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0),
  [transactions] // dependency: recomputes when this changes
);`}</Code>

      <h2 className="section">Live demo</h2>
      <div className="demo">
        <div className="demo-label">Totals recompute when txs change, not when unrelated state changes</div>
        <div>
          <div className="stat">Income <strong style={{ color: 'var(--income)' }}>${totals.income}</strong></div>
          <div className="stat">Expense <strong style={{ color: 'var(--expense)' }}>${totals.expense}</strong></div>
          <div className="stat">Balance <strong>${totals.balance}</strong></div>
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <button className="action" onClick={addRandom}>Add random tx (recomputes)</button>
          <button className="action ghost" onClick={() => setOther((n) => n + 1)}>Bump unrelated state ({other}) (no recompute)</button>
        </div>
      </div>

      <h2 className="section">When to use it (and when not)</h2>
      <ul className="mistakes">
        <li><strong>DO use for</strong> filter/map/reduce chains, sort operations, or anything that iterates over a big array.</li>
        <li><strong>DON'T use for</strong> simple arithmetic like <code>income - expense</code>. The memoization overhead costs more than the calculation.</li>
        <li><strong>Wrong deps = stale value.</strong> If the function reads a variable, that variable must be in the deps array.</li>
      </ul>

      <h2 className="section">Angular equivalent</h2>
      <p className="para">A pure pipe (<code>{'@Pipe({ pure: true })'}</code>) or a getter. Angular's change detection is coarser, so React needs an explicit memoization primitive.</p>
    </>
  )
}
