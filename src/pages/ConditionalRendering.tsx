import { useState } from 'react'
import Code from '../components/Code'

export default function ConditionalRendering() {
  const [items, setItems] = useState<string[]>(['Coffee'])
  const [balance, setBalance] = useState(500)

  return (
    <>
      <h1 className="lesson-title">Conditional Rendering</h1>
      <p className="lesson-sub">JSX has no <code>*ngIf</code>. You use plain JS: early returns, <code>&amp;&amp;</code>, and ternaries.</p>

      <div className="highlight">
        JSX evaluates JavaScript inside <code>{'{ }'}</code>. That means <em>any</em> JS expression works — return early, short-circuit with <code>&amp;&amp;</code>, pick with a ternary. There's no special template syntax.
      </div>

      <h2 className="section">1. Early return</h2>
      <Code>{`if (items.length === 0) return <p>No items yet.</p>;

return <ul>{items.map(i => <li key={i}>{i}</li>)}</ul>;`}</Code>

      <h2 className="section">2. && — render only when truthy</h2>
      <Code>{`{items.length > 0 && <h2>Showing {items.length} items</h2>}`}</Code>

      <h2 className="section">3. Ternary — render one or the other</h2>
      <Code>{`{balance >= 0
  ? <p style={{ color: 'green' }}>You're in profit</p>
  : <p style={{ color: 'red' }}>You're in deficit</p>}`}</Code>

      <h2 className="section">Live demo</h2>
      <div className="demo">
        <div className="demo-label">All three patterns wired into one form</div>

        <input
          className="text"
          placeholder="Add an item, press Enter..."
          onKeyDown={(e) => {
            const v = (e.target as HTMLInputElement).value.trim()
            if (e.key === 'Enter' && v) {
              setItems((prev) => [...prev, v])
              ;(e.target as HTMLInputElement).value = ''
            }
          }}
        />
        <button className="action ghost" onClick={() => setItems([])}>Clear items</button>

        <div style={{ marginTop: '0.9rem' }}>
          <button className="action" onClick={() => setBalance((b) => b + 100)}>+100</button>
          <button className="action danger" onClick={() => setBalance((b) => b - 200)}>−200</button>
          <div className="stat">Balance <strong>${balance}</strong></div>
        </div>

        <div style={{ marginTop: '0.9rem', padding: '0.75rem', background: 'var(--panel-2)', borderRadius: 6 }}>
          {items.length === 0
            ? <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No items yet.</p>
            : items.map((i, idx) => <div key={idx} className="tx-row income">{i}</div>)
          }

          {items.length > 0 && (
            <p style={{ marginTop: '0.6rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Showing <strong style={{ color: 'var(--text-strong)' }}>{items.length}</strong> item(s)
            </p>
          )}

          <p style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: balance >= 0 ? 'var(--income)' : 'var(--expense)' }}>
            {balance >= 0 ? "You're in profit" : "You're in deficit"}
          </p>
        </div>
      </div>

      <h2 className="section">Watch out — the "zero bug"</h2>
      <Code>{`// If items.length === 0, React renders the literal "0"
{items.length && <List items={items} />}

// Cast to boolean explicitly
{items.length > 0 && <List items={items} />}`}</Code>
      <p className="para">Because <code>0</code> is falsy in JS but not <code>null/undefined/false</code>, React renders it as text. Always compare, don't rely on truthiness of numbers.</p>

      <h2 className="section">Angular equivalent</h2>
      <ul className="mistakes">
        <li><code>*ngIf="cond"</code> ≈ <code>{'{cond && <X />}'}</code></li>
        <li><code>*ngIf; else other</code> ≈ <code>{'{cond ? <X /> : <Other />}'}</code></li>
      </ul>
    </>
  )
}
