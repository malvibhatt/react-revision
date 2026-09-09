import { createContext, useContext, useState, type ReactNode } from 'react'
import Code from '../components/Code'

interface CounterCtx {
  count: number
  increment: () => void
  decrement: () => void
}

const CounterContext = createContext<CounterCtx | null>(null)

function CounterProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0)
  return (
    <CounterContext.Provider
      value={{
        count,
        increment: () => setCount((c) => c + 1),
        decrement: () => setCount((c) => c - 1),
      }}
    >
      {children}
    </CounterContext.Provider>
  )
}

function useCounter() {
  const ctx = useContext(CounterContext)
  if (!ctx) throw new Error('useCounter must be used inside <CounterProvider>')
  return ctx
}

function DisplayDeep() {
  const { count } = useCounter()
  return <div className="stat">Deeply-nested reader: <strong>{count}</strong></div>
}

function ControlsDeep() {
  const { increment, decrement } = useCounter()
  return (
    <div style={{ marginTop: '0.75rem' }}>
      <button className="action" onClick={increment}>+ increment</button>
      <button className="action ghost" onClick={decrement}>− decrement</button>
    </div>
  )
}

function OuterWrapper({ children }: { children: ReactNode }) {
  return <div style={{ padding: '0.75rem', border: '1px dashed var(--border)', borderRadius: 6 }}>{children}</div>
}

export default function ContextAPI() {
  return (
    <>
      <h1 className="lesson-title">Context API</h1>
      <p className="lesson-sub">Share state across the component tree without prop-drilling through every intermediate layer.</p>

      <div className="highlight">
        Three pieces: <code>createContext</code> defines the shape, <code>{'<Ctx.Provider value=...>'}</code> exposes the data, <code>useContext(Ctx)</code> reads it in any descendant.
      </div>

      <h2 className="section">The three-piece setup</h2>
      <Code>{`// 1. Define the context and its type
const CounterContext = createContext<CounterCtx | null>(null);

// 2. Provide the data high up in the tree
<CounterContext.Provider value={{ count, increment, decrement }}>
  <App />
</CounterContext.Provider>

// 3. Consume anywhere below
const { count, increment } = useContext(CounterContext);`}</Code>

      <h2 className="section">Live demo: one Provider, deeply nested readers</h2>
      <CounterProvider>
        <div className="demo">
          <div className="demo-label">Provider is at the top; wrappers below don't know about the counter</div>
          <OuterWrapper>
            <OuterWrapper>
              <OuterWrapper>
                <DisplayDeep />
                <ControlsDeep />
              </OuterWrapper>
            </OuterWrapper>
          </OuterWrapper>
        </div>
      </CounterProvider>

      <h2 className="section">The custom-hook wrapper (recommended)</h2>
      <Code>{`function useCounter() {
  const ctx = useContext(CounterContext);
  if (!ctx) throw new Error('useCounter must be used inside <CounterProvider>');
  return ctx;
}`}</Code>
      <p className="para">Wrapping <code>useContext</code> in a hook gives you: a single import, a runtime check for missing Provider, and a place to add default behavior later.</p>

      <h2 className="section">Angular equivalent</h2>
      <p className="para">An <code>@Injectable()</code> service consumed via <code>inject()</code> or constructor injection. The <code>Provider</code> is the DI scope; <code>useContext</code> is the injector lookup.</p>

      <h2 className="section">Watch out for</h2>
      <ul className="mistakes">
        <li><strong>Every consumer re-renders</strong> when the context value changes. Split contexts by change frequency if perf matters.</li>
        <li><strong>Object literals in <code>value=</code> create a new reference every render.</strong> Move them to state or wrap in <code>useMemo</code> if consumers are expensive.</li>
      </ul>
    </>
  )
}
