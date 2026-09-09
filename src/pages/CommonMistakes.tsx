import Code from '../components/Code'

export default function CommonMistakes() {
  return (
    <>
      <h1 className="lesson-title">Common Mistakes</h1>
      <p className="lesson-sub">The traps everyone hits when moving from Angular. Print this on your monitor.</p>

      <div className="highlight">
        Most React "weirdness" comes from three rules: <strong>never mutate state</strong>, <strong>never call setState during render</strong>, and <strong>hooks must be called in the same order every render</strong>.
      </div>

      <h2 className="section">1. Never call setState during render</h2>
      <Code>{`function Broken() {
  const [n, setN] = useState(0);
  setN(n + 1); // infinite render loop
  return <div>{n}</div>;
}

// Only inside event handlers or effects
<button onClick={() => setN(n + 1)} />`}</Code>

      <h2 className="section">2. Never mutate state directly</h2>
      <Code>{`// same reference — React thinks nothing changed
transactions.push(newTx);
setTransactions(transactions);

// new reference
setTransactions((prev) => [...prev, newTx]);
setTransactions((prev) => prev.filter(t => t.id !== id));`}</Code>

      <h2 className="section">3. Event handler needs a reference, not a call</h2>
      <Code>{`// calls handleDelete IMMEDIATELY on every render
<button onClick={handleDelete(id)}>Delete</button>

// pass a function that will call it later
<button onClick={() => handleDelete(id)}>Delete</button>

// also fine if handler takes the event directly
<button onClick={handleDelete}>Delete</button>`}</Code>

      <h2 className="section">4. Hooks must be called at the top level</h2>
      <Code>{`function Broken({ user }) {
  if (!user) return null;    // hook is now conditional
  const [x, setX] = useState(0);
}

// hooks first, conditions after
function Ok({ user }) {
  const [x, setX] = useState(0);
  if (!user) return null;
}`}</Code>

      <h2 className="section">5. Always give lists a stable key</h2>
      <Code>{`// index changes when list reorders — breaks child state
{items.map((item, i) => <Row key={i} item={item} />)}

// stable id from the data itself
{items.map((item) => <Row key={item.id} item={item} />)}`}</Code>

      <h2 className="section">6. Don't over-useMemo</h2>
      <p className="para">Wrapping <code>a + b</code> in <code>useMemo</code> is slower than just computing it. Reach for it when you have a big filter/map/reduce chain, or when the value is passed to a memoized child that would otherwise re-render on every parent render.</p>

      <h2 className="section">7. Missing dependency array</h2>
      <Code>{`// runs after every render — often infinite loop
useEffect(() => fetchData());

// once on mount
useEffect(() => { fetchData() }, []);

// when userId changes
useEffect(() => { fetchData(userId) }, [userId]);`}</Code>

      <h2 className="section">Quick sanity checklist</h2>
      <ul className="mistakes">
        <li><strong>Setter inside JSX?</strong> Move it to an event handler.</li>
        <li><strong>Modifying an array/object?</strong> Spread it into a new one.</li>
        <li><strong>Handler firing on mount?</strong> You probably wrote <code>{'onClick={fn(arg)}'}</code> instead of <code>{'onClick={() => fn(arg)}'}</code>.</li>
        <li><strong>List not updating right?</strong> Check your <code>key</code> — is it stable?</li>
        <li><strong>useEffect re-running unexpectedly?</strong> Check its dependency array for object/array literals that get a new reference each render.</li>
      </ul>
    </>
  )
}
