import Code from '../../components/Code'

const TOOLS = [
  { tool: 'React.memo', fixes: 'A child re-rendering with identical props', example: 'export default memo(Row)' },
  { tool: 'useMemo', fixes: 'Recomputing expensive values, unstable object refs', example: 'useMemo(() => heavy(x), [x])' },
  { tool: 'useCallback', fixes: 'A new function identity breaking React.memo', example: 'useCallback(fn, [dep])' },
  { tool: 'useTransition', fixes: 'A big update blocking typing / clicking', example: 'startTransition(() => setResults(r))' },
  { tool: 'useDeferredValue', fixes: 'Same, when you only have the value', example: 'useDeferredValue(query)' },
  { tool: 'React.lazy + Suspense', fixes: 'A large initial bundle', example: 'lazy(() => import("./Page"))' },
  { tool: 'Virtualization', fixes: 'Rendering thousands of rows', example: 'react-window / @tanstack/react-virtual' },
  { tool: 'State colocation', fixes: 'The whole tree re-rendering', example: 'move state down to who uses it' },
  { tool: 'Context splitting', fixes: 'Every consumer re-rendering', example: 'AuthUser + AuthActions contexts' },
]

export default function PerfSection() {
  return (
    <>
      <h2 className="section">Performance toolkit</h2>
      <p className="para">Pick the tool that matches the symptom, not all of them at once.</p>

      <table className="map">
        <thead>
          <tr><th>Tool</th><th>Fixes</th><th>Example</th></tr>
        </thead>
        <tbody>
          {TOOLS.map((t) => (
            <tr key={t.tool}>
              <td><code>{t.tool}</code></td>
              <td>{t.fixes}</td>
              <td><code>{t.example}</code></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="highlight">
        <strong>Order of operations:</strong> measure with the React DevTools Profiler → move state closer to where it is used →
        <em> then</em> memoize what is left. Sprinkling <code>useMemo</code> everywhere costs memory and readability for no gain.
      </div>

      <h2 className="section">The memoized context value</h2>
      <p className="para">This one catches almost everyone. A provider value object is recreated on every render, so every consumer re-renders even when nothing changed.</p>
      <div className="two-col">
        <div className="col-bad">
          <div className="col-head">New object each render</div>
          <Code>{`<AuthContext.Provider value={{ user, login, logout }}>
  {children}
</AuthContext.Provider>`}</Code>
        </div>
        <div className="col-good">
          <div className="col-head">Stable identity</div>
          <Code>{`const value = useMemo(
  () => ({ user, login, logout }),
  [user, login, logout]
);

<AuthContext.Provider value={value}>
  {children}
</AuthContext.Provider>`}</Code>
        </div>
      </div>

      <h2 className="section">React.memo done right</h2>
      <Code>{`const Row = memo(function Row({ item, onSelect }) {
  return <li onClick={() => onSelect(item.id)}>{item.name}</li>;
});

// memo only helps if BOTH props are stable:
const onSelect = useCallback((id) => setSelected(id), []);   // stable fn
const items    = useMemo(() => raw.filter(Boolean), [raw]);  // stable array`}</Code>
      <ul className="mistakes">
        <li><strong>memo compares props shallowly.</strong> One inline object or arrow function prop defeats it completely.</li>
        <li><strong>children counts as a prop.</strong> <code>{'<Memoized><Child /></Memoized>'}</code> creates new children every render.</li>
        <li><strong>Don&apos;t memo everything.</strong> The comparison itself costs time; for cheap components it is a net loss.</li>
      </ul>

      <h2 className="section">Colocation beats memoization</h2>
      <Code>{`// Before: typing re-renders <ExpensiveList /> on every keystroke
function Page() {
  const [query, setQuery] = useState('');
  return <><SearchBox value={query} onChange={setQuery} /><ExpensiveList /></>;
}

// After: state lives where it is used, so ExpensiveList never re-renders
function SearchBox() {
  const [query, setQuery] = useState('');
  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}`}</Code>
    </>
  )
}
