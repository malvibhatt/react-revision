import { useState } from 'react'
import Code from '../components/Code'

interface Item { id: number; text: string }

export default function UseState() {
  const [count, setCount] = useState(0)
  const [items, setItems] = useState<Item[]>([])
  const [draft, setDraft] = useState('')

  function addItem() {
    if (!draft.trim()) return
    setItems((prev) => [...prev, { id: Date.now(), text: draft }])
    setDraft('')
  }

  function removeItem(id: number) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <>
      <h1 className="lesson-title">useState</h1>
      <p className="lesson-sub">The core hook for local, reactive state inside a component.</p>

      <div className="highlight">
        <code>useState</code> returns a <strong>[value, setter]</strong> tuple. Call the setter to schedule a re-render. Never mutate the value directly — always pass a new reference.
      </div>

      <h2 className="section">Basic form</h2>
      <Code>{`const [count, setCount] = useState(0);

// Setter accepts either a new value...
setCount(5);

// ...or a function of the previous value (safer when updating from stale state)
setCount((prev) => prev + 1);`}</Code>

      <h2 className="section">Live demo — counter</h2>
      <div className="demo">
        <div className="demo-label">Two setter forms — same result</div>
        <button className="action" onClick={() => setCount(count + 1)}>Direct: count + 1</button>
        <button className="action" onClick={() => setCount((c) => c + 1)}>Functional: prev + 1</button>
        <button className="action ghost" onClick={() => setCount(0)}>Reset</button>
        <div className="stat">Count <strong>{count}</strong></div>
      </div>

      <h2 className="section">Never mutate — always spread</h2>
      <Code>{`// WRONG — mutates existing array, React can't detect the change
items.push(newItem);
setItems(items);

// RIGHT — new array reference
setItems((prev) => [...prev, newItem]);

// RIGHT — filter to remove
setItems((prev) => prev.filter(i => i.id !== id));`}</Code>

      <h2 className="section">Live demo — list add/remove</h2>
      <div className="demo">
        <div className="demo-label">Controlled input + immutable updates</div>
        <input
          className="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a note..."
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
        />
        <button className="action" onClick={addItem}>Add</button>
        <div style={{ marginTop: '0.75rem' }}>
          {items.length === 0 && <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>List is empty.</p>}
          {items.map((i) => (
            <div key={i.id} className="tx-row income">
              <span>{i.text}</span>
              <button onClick={() => removeItem(i.id)}>×</button>
            </div>
          ))}
        </div>
      </div>

      <h2 className="section">Angular equivalent</h2>
      <p className="para">A public class property on the component. Change detection watches it. React needs the setter because it doesn't run change detection zones — the setter is the signal.</p>
    </>
  )
}
