import { useEffect, useState } from 'react'
import Code from '../components/Code'

interface Post {
  id: number
  title: string
}

export default function AsyncData() {
  const [posts, setPosts] = useState<Post[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetch('https://jsonplaceholder.typicode.com/posts?_limit=5', {
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data: Post[]) => setPosts(data))
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err)
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [reloadKey])

  return (
    <>
      <h1 className="lesson-title">Async data &amp; API calls</h1>
      <p className="lesson-sub">React has no RxJS. You build async flows from <code>useEffect</code> + <code>useState</code>, or reach for a data library.</p>

      <div className="highlight">
        The mental shift from Angular: there's no <code>Observable</code>, no <code>HttpClient</code>, no <code>pipe</code>. React gives you primitives and expects you to compose them (or use TanStack Query / SWR in real apps).
      </div>

      <h2 className="section">Layer 1: The baseline pattern</h2>
      <p>Three pieces of state: <code>data</code>, <code>loading</code>, <code>error</code>. Fetch inside a <code>useEffect</code>.</p>
      <Code>{`const [data, setData] = useState<User[] | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<Error | null>(null);

useEffect(() => {
  let cancelled = false;
  setLoading(true);

  fetch('/api/users')
    .then((r) => r.json())
    .then((users) => { if (!cancelled) setData(users); })
    .catch((err) => { if (!cancelled) setError(err); })
    .finally(() => { if (!cancelled) setLoading(false); });

  return () => { cancelled = true; }; // your "switchMap": ignore stale response
}, []);`}</Code>

      <h2 className="section">The one big gotcha</h2>
      <p>You <strong>cannot</strong> make the effect function itself <code>async</code>, because it must return a cleanup function or nothing, not a promise.</p>
      <Code>{`// wrong: async fn returns a Promise, not a cleanup function
useEffect(async () => {
  const data = await fetch('/api/users').then((r) => r.json());
  setData(data);
}, []);

// right: declare async inside, then call it
useEffect(() => {
  async function load() {
    const data = await fetch('/api/users').then((r) => r.json());
    setData(data);
  }
  load();
}, []);`}</Code>

      <h2 className="section">Race conditions &amp; cancellation</h2>
      <p>If the user changes filters quickly, an older response can arrive <em>after</em> a newer one and overwrite it. Two ways to handle it:</p>

      <Code>{`// Option A: cancelled flag (works everywhere)
useEffect(() => {
  let cancelled = false;
  fetch(\`/api/users?filter=\${filter}\`)
    .then((r) => r.json())
    .then((data) => { if (!cancelled) setUsers(data); });
  return () => { cancelled = true; };
}, [filter]);

// Option B: AbortController (also aborts the network request)
useEffect(() => {
  const controller = new AbortController();
  fetch(\`/api/users?filter=\${filter}\`, { signal: controller.signal })
    .then((r) => r.json())
    .then(setUsers)
    .catch((err) => { if (err.name !== 'AbortError') setError(err); });
  return () => controller.abort();
}, [filter]);`}</Code>

      <div className="demo">
        <div className="demo-label">Live demo: fetches 5 posts. Hit "Reload" to see the effect re-run (old request aborts).</div>
        <button className="action" onClick={() => setReloadKey((k) => k + 1)}>Reload</button>
        <div style={{ marginTop: '0.75rem' }}>
          {loading && <p style={{ color: 'var(--text-dim)' }}>Loading...</p>}
          {error && <p style={{ color: 'crimson' }}>Error: {error.message}</p>}
          {posts && posts.map((p) => <div key={p.id} className="tx-row income">{p.title}</div>)}
        </div>
      </div>

      <h2 className="section">Layer 2: Extract a custom hook</h2>
      <p>The <code>data</code>/<code>loading</code>/<code>error</code> boilerplate repeats. Extract it once and reuse.</p>
      <Code>{`function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    fetch(url, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(\`HTTP \${r.status}\`);
        return r.json();
      })
      .then((d: T) => setData(d))
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [url]);

  return { data, loading, error };
}

// Usage
function UserList() {
  const { data, loading, error } = useFetch<User[]>('/api/users');
  if (loading) return <Spinner />;
  if (error) return <ErrorBox error={error} />;
  return <ul>{data!.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;
}`}</Code>

      <h2 className="section">Layer 3: TanStack Query (the real answer)</h2>
      <p>For any real app, use <strong>TanStack Query</strong> (formerly React Query) or <strong>SWR</strong>. They give you caching, deduping, background refetch, retries, mutations, and pagination, all the things RxJS + Angular services give you plus a proper cache layer.</p>
      <Code>{`import { useQuery } from '@tanstack/react-query';

function UserList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then((r) => r.json()),
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorBox error={error} />;
  return <ul>{data.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;
}`}</Code>
      <ul className="mistakes">
        <li>Automatic caching by <code>queryKey</code>, so no duplicate requests</li>
        <li>Refetches on window focus, network reconnect, or interval</li>
        <li>Optimistic updates via <code>useMutation</code></li>
        <li>Devtools that show every query's state</li>
      </ul>

      <h2 className="section">React 19+: the <code>use()</code> hook &amp; Suspense</h2>
      <p>Newer React lets you unwrap a promise directly with <code>use()</code>, and let <code>&lt;Suspense&gt;</code> handle the loading state declaratively.</p>
      <Code>{`function UserList({ usersPromise }: { usersPromise: Promise<User[]> }) {
  const users = use(usersPromise); // suspends until resolved
  return <ul>{users.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;
}

// Parent
<Suspense fallback={<Spinner />}>
  <UserList usersPromise={fetchUsers()} />
</Suspense>`}</Code>

      <h2 className="section">Angular → React async cheat sheet</h2>
      <table className="map">
        <thead><tr><th>Angular / RxJS</th><th>React equivalent</th></tr></thead>
        <tbody>
          <tr><td><code>HttpClient.get()</code></td><td><code>fetch()</code> in <code>useEffect</code></td></tr>
          <tr><td><code>Observable</code></td><td><code>Promise</code> (one-shot) or state + effect</td></tr>
          <tr><td><code>| async</code> pipe</td><td>Manual <code>loading</code>/<code>error</code>/<code>data</code> state, or <code>use()</code> + <code>Suspense</code></td></tr>
          <tr><td><code>switchMap</code></td><td>Cleanup function (cancelled flag / <code>AbortController</code>)</td></tr>
          <tr><td><code>map</code></td><td><code>.then((r) =&gt; transform(r))</code></td></tr>
          <tr><td><code>tap</code></td><td><code>{'.then((r) => { sideEffect(r); return r; })'}</code></td></tr>
          <tr><td><code>catchError</code></td><td><code>.catch(handler)</code></td></tr>
          <tr><td><code>shareReplay</code> / caching service</td><td>TanStack Query cache</td></tr>
          <tr><td><code>combineLatest</code></td><td><code>Promise.all([...])</code> or two <code>useQuery</code> calls</td></tr>
          <tr><td><code>Subject</code> / <code>BehaviorSubject</code></td><td>Context + <code>useState</code>, or Zustand / Redux</td></tr>
          <tr><td><code>takeUntil(destroy$)</code></td><td>Cleanup function returned from <code>useEffect</code></td></tr>
        </tbody>
      </table>

      <h2 className="section">Common mistakes</h2>
      <ul className="mistakes">
        <li>Making the <code>useEffect</code> callback <code>async</code> directly: return a cleanup fn, not a promise.</li>
        <li>Forgetting to cancel stale requests when deps change, which causes flicker and wrong data.</li>
        <li>Fetching in the render body, which runs on every render, causing infinite loops.</li>
        <li>Not handling the error branch, so the UI hangs on "loading" forever.</li>
        <li>Building your own cache layer instead of using TanStack Query, because you'll reinvent it badly.</li>
      </ul>
    </>
  )
}
