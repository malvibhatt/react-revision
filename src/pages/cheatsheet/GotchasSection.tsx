import Code from '../../components/Code'

interface TipProps {
  n: number
  title: string
  purpose: string
  children: React.ReactNode
}

function Tip({ n, title, purpose, children }: TipProps) {
  return (
    <article className="tip-card">
      <header className="tip-head">
        <span className="tip-num">{n}</span>
        <h3>{title}</h3>
      </header>
      <p className="tip-purpose"><strong>Purpose:</strong> {purpose}</p>
      {children}
    </article>
  )
}

export default function GotchasSection() {
  return (
    <>
      <h2 className="section">Tips &amp; gotchas, each one with the reason behind it</h2>
      <p className="para">These are the bugs that reach production. Every rule below states what it prevents.</p>

      <Tip n={1} title="Always clean up your effects" purpose="prevents memory leaks and state updates on unmounted components">
        <Code>{`useEffect(() => {
  const onResize = () => setWidth(window.innerWidth);
  window.addEventListener('resize', onResize);
  return () => window.removeEventListener('resize', onResize);
}, []);`}</Code>
        <p className="para">Must be cleaned up:</p>
        <div className="pill-row">
          <span className="pill">setTimeout / setInterval</span>
          <span className="pill">event listeners</span>
          <span className="pill">WebSocket / EventSource</span>
          <span className="pill">IntersectionObserver</span>
          <span className="pill">ResizeObserver</span>
          <span className="pill">MutationObserver</span>
          <span className="pill">store subscriptions</span>
          <span className="pill">in-flight fetches</span>
        </div>
      </Tip>

      <Tip n={2} title="Abort in-flight requests" purpose="prevents race conditions where a slow old response overwrites a newer one">
        <Code>{`useEffect(() => {
  const controller = new AbortController();

  api.get(\`/users/\${id}\`, { signal: controller.signal })
     .then(res => setUser(res.data))
     .catch(err => { if (err.name !== 'CanceledError') setError(err); });

  return () => controller.abort();   // stale response for the old id never lands
}, [id]);`}</Code>
        <p className="para">Without this, switching <code>id</code> quickly means request #1 can resolve <em>after</em> request #2 and win.</p>
      </Tip>

      <Tip n={3} title="Never mutate state" purpose="React compares by reference, so same reference means no re-render">
        <div className="two-col">
          <div className="col-bad">
            <div className="col-head">Mutation: UI does not update</div>
            <Code>{`items.push(newItem);
setItems(items);`}</Code>
          </div>
          <div className="col-good">
            <div className="col-head">New reference every time</div>
            <Code>{`setItems(prev => [...prev, newItem]);
setUser(prev => ({ ...prev, name }));

// nested needs a copy at EACH level
setState(prev => ({
  ...prev,
  addr: { ...prev.addr, city },
}));`}</Code>
          </div>
        </div>
      </Tip>

      <Tip n={4} title="Use stable, meaningful keys" purpose="correct reconciliation: index keys reuse the wrong DOM node">
        <div className="two-col">
          <div className="col-bad">
            <div className="col-head">Breaks on insert / delete / sort</div>
            <Code>{`{items.map((it, i) => <Row key={i} />)}`}</Code>
          </div>
          <div className="col-good">
            <div className="col-head">Identity travels with the item</div>
            <Code>{`{items.map(it => <Row key={it.id} />)}`}</Code>
          </div>
        </div>
      </Tip>

      <Tip n={5} title="Functional updates inside async code" purpose="avoids stale closures capturing an old value">
        <Code>{`useEffect(() => {
  const id = setInterval(() => setCount(c => c + 1), 1000);  // always fresh
  // setInterval(() => setCount(count + 1), 1000)            // count frozen at 0 forever
  return () => clearInterval(id);
}, []);`}</Code>
      </Tip>

      <Tip n={6} title="Don't copy derived data into state" purpose="single source of truth: avoids desync and an extra render">
        <div className="two-col">
          <div className="col-bad">
            <div className="col-head">Two sources of truth</div>
            <Code>{`const [total, setTotal] = useState(0);

useEffect(() => {
  setTotal(items.reduce((s, i) => s + i.price, 0));
}, [items]);`}</Code>
          </div>
          <div className="col-good">
            <div className="col-head">Just compute during render</div>
            <Code>{`const total = items.reduce(
  (s, i) => s + i.price, 0
);`}</Code>
          </div>
        </div>
      </Tip>

      <Tip n={7} title="Guard optional data before mapping" purpose="stops the classic 'cannot read properties of undefined' crash on first render">
        <Code>{`{data?.items?.map(renderRow) ?? <EmptyState />}`}</Code>
      </Tip>

      <Tip n={8} title="Effects run twice in dev StrictMode" purpose="it deliberately surfaces missing cleanup, so don't disable it">
        <p className="para">If running an effect twice breaks your app, the effect is not idempotent. Fix the effect, not StrictMode.</p>
      </Tip>

      <Tip n={9} title="One state object for form fields" purpose="fewer re-renders and one generic change handler">
        <Code>{`const [form, setForm] = useState({ email: '', password: '' });

const onChange = (e) =>
  setForm(p => ({ ...p, [e.target.name]: e.target.value }));

<input name="email" value={form.email} onChange={onChange} />`}</Code>
      </Tip>

      <Tip n={10} title="Error boundaries catch render errors, not async ones" purpose="one crashing widget shouldn't blank the whole app">
        <Code>{`class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err, info) { logToService(err, info); }
  render() { return this.state.hasError ? <Fallback /> : this.props.children; }
}`}</Code>
        <p className="para">Wrap routes and independent widgets. You still need <code>try/catch</code> for promises and event handlers, because boundaries do not see those.</p>
      </Tip>
    </>
  )
}
