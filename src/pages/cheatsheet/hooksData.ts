export type HookCategory = 'State' | 'Effect' | 'Context' | 'Ref' | 'Performance' | 'React 19' | 'Utility'

export interface HookDef {
  name: string
  category: HookCategory
  signature: string
  when: string
  avoid?: string
  code: string
  extraLabel?: string
  extraCode?: string
  notes?: string[]
}

export const HOOKS: HookDef[] = [
  {
    name: 'useState',
    category: 'State',
    signature: 'const [value, setValue] = useState(initial)',
    when: 'You need 1–3 independent values with simple transitions, and the UI must re-render when they change.',
    code: `const [count, setCount] = useState(0);

// ALWAYS use the updater form when the new value depends on the old one
setCount(prev => prev + 1);   // safe in batches & async callbacks
setCount(count + 1);          // stale inside loops / timers / promises`,
    extraLabel: 'Lazy initialiser — expensive work runs only on mount',
    extraCode: `const [rows, setRows] = useState(
  () => JSON.parse(localStorage.getItem('rows') ?? '[]')
);`,
    notes: [
      'State updates are asynchronous — reading the variable right after setting it gives you the old value.',
      'Passing a value runs the expression on every render; passing a function runs it once.',
    ],
  },
  {
    name: 'useReducer',
    category: 'State',
    signature: 'const [state, dispatch] = useReducer(reducer, initialState)',
    when: 'State is complex or fields move together: forms, wizards, data tables, undo/redo. Rule of thumb — 4+ useState calls that always change in sync.',
    code: `type State = { loading: boolean; data: User[]; error: string | null };
type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: User[] }
  | { type: 'FETCH_ERROR'; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':   return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS': return { loading: false, data: action.payload, error: null };
    case 'FETCH_ERROR':   return { ...state, loading: false, error: action.payload };
    default:              return state;
  }
}

const [state, dispatch] = useReducer(reducer, { loading: false, data: [], error: null });
dispatch({ type: 'FETCH_START' });`,
    notes: [
      'dispatch is referentially stable — safe to pass to children without useCallback.',
      'All transition logic lives in one testable pure function instead of scattered handlers.',
    ],
  },
  {
    name: 'useEffect',
    category: 'Effect',
    signature: 'useEffect(setup, deps?)',
    when: 'Synchronising with something outside React: subscriptions, timers, event listeners, logging, manual DOM work, data fetching.',
    avoid: 'Deriving state from props (just compute it) or reacting to a user action (do it in the handler).',
    code: `useEffect(() => {
  const id = setInterval(() => tick(), 1000);
  return () => clearInterval(id);   // cleanup — prevents a memory leak
}, []);                              // [] = run once on mount`,
    extraLabel: 'Dependency array behaviour',
    extraCode: `useEffect(fn)          // after EVERY render
useEffect(fn, [])      // once on mount, cleanup on unmount
useEffect(fn, [a, b])  // on mount + whenever a or b changes`,
    notes: [
      'The returned function runs before the next effect and on unmount.',
      'In dev StrictMode effects run twice on purpose — it exposes missing cleanup.',
    ],
  },
  {
    name: 'useLayoutEffect',
    category: 'Effect',
    signature: 'useLayoutEffect(setup, deps?)',
    when: 'You must read layout (getBoundingClientRect, scrollHeight) and synchronously reposition, to avoid a visible flicker.',
    avoid: 'Everything else — it blocks paint. Default to useEffect.',
    code: `useLayoutEffect(() => {
  const { height } = ref.current.getBoundingClientRect();
  setTooltipTop(height + 8);   // applied before paint → no flash
}, [content]);`,
    notes: ['Tooltips, popovers, auto-scroll-to-bottom, measuring text overflow.'],
  },
  {
    name: 'useContext',
    category: 'Context',
    signature: 'const value = useContext(SomeContext)',
    when: 'Sharing low-frequency global values without prop drilling: theme, auth user, locale, feature flags.',
    avoid: 'High-frequency values (mouse position, form keystrokes) — every consumer re-renders.',
    code: `const ThemeContext = createContext<'light' | 'dark'>('light');

// provider
<ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>

// consumer, anywhere below
const theme = useContext(ThemeContext);`,
    extraLabel: 'Always memoize an object value',
    extraCode: `// new object every render → EVERY consumer re-renders
<AuthContext.Provider value={{ user, login, logout }}>

// stable reference
const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
<AuthContext.Provider value={value}>`,
    notes: ['Split fast-changing and slow-changing values into separate contexts.'],
  },
  {
    name: 'useRef',
    category: 'Ref',
    signature: 'const ref = useRef(initial)',
    when: 'Two jobs: reach a DOM node, or keep a mutable value across renders WITHOUT triggering a re-render (timers, previous values, "did mount" flags).',
    code: `// 1) DOM access
const inputRef = useRef<HTMLInputElement>(null);
<input ref={inputRef} />;
inputRef.current?.focus();

// 2) Instance variable across renders
const timerRef = useRef<number | null>(null);
timerRef.current = window.setTimeout(...);   // changing .current does NOT re-render`,
    notes: ['If the UI must update when it changes → useState. If not → useRef.'],
  },
  {
    name: 'useMemo',
    category: 'Performance',
    signature: 'const value = useMemo(() => compute(a), [a])',
    when: 'A genuinely expensive computation, OR the result is an object/array passed to a memoized child or used in a dependency array (referential stability).',
    avoid: 'Simple arithmetic — the memo bookkeeping costs more than the maths.',
    code: `const sorted = useMemo(
  () => [...items].sort((a, b) => a.price - b.price),
  [items]
);`,
    notes: ['Wrong deps = stale value. Anything the function reads must be listed.'],
  },
  {
    name: 'useCallback',
    category: 'Performance',
    signature: 'const fn = useCallback(callback, [deps])',
    when: 'The function is passed to a React.memo child, or used as an effect / hook dependency.',
    avoid: 'Plain handlers on plain DOM elements — pure overhead.',
    code: `const handleSelect = useCallback((id: string) => setSelected(id), []);

<MemoizedRow onSelect={handleSelect} />   // Row no longer re-renders needlessly`,
    notes: ['useCallback(fn, deps) is exactly useMemo(() => fn, deps).'],
  },
  {
    name: 'useTransition',
    category: 'Performance',
    signature: 'const [isPending, startTransition] = useTransition()',
    when: 'A heavy state update freezes the UI — typing in a filter box over a huge list, switching a slow tab.',
    code: `const [isPending, startTransition] = useTransition();

function onChange(e) {
  setQuery(e.target.value);                                    // urgent — input stays snappy
  startTransition(() => setResults(filter(e.target.value)));   // low priority, interruptible
}

{isPending && <Spinner />}`,
    notes: ['Only for state updates — you cannot await inside and keep the pending flag in React 18.'],
  },
  {
    name: 'useDeferredValue',
    category: 'Performance',
    signature: 'const deferred = useDeferredValue(value)',
    when: 'Same problem as useTransition, but you cannot reach the setState call — e.g. the value arrives as a prop.',
    code: `const deferredQuery = useDeferredValue(query);
const list = useMemo(() => filter(deferredQuery), [deferredQuery]);

const isStale = query !== deferredQuery;   // dim the list while catching up`,
  },
  {
    name: 'useId',
    category: 'Utility',
    signature: 'const id = useId()',
    when: 'Generating unique, SSR-safe ids to link form controls and labels or aria attributes.',
    avoid: 'List keys — use your data id.',
    code: `const id = useId();

<label htmlFor={id}>Email</label>
<input id={id} aria-describedby={\`\${id}-hint\`} />
<p id={\`\${id}-hint\`}>We never share it.</p>`,
  },
  {
    name: 'useImperativeHandle',
    category: 'Ref',
    signature: 'useImperativeHandle(ref, createHandle, [deps])',
    when: 'A reusable component must expose imperative methods to its parent — modal.open(), input.focus(), player.play().',
    avoid: 'Anything props can express declaratively.',
    code: `const Modal = forwardRef((props, ref) => {
  const [open, setOpen] = useState(false);
  useImperativeHandle(ref, () => ({
    open:  () => setOpen(true),
    close: () => setOpen(false),
  }), []);
  return open ? <dialog>{props.children}</dialog> : null;
});

modalRef.current?.open();`,
  },
  {
    name: 'useSyncExternalStore',
    category: 'Utility',
    signature: 'useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)',
    when: 'Subscribing to state that lives outside React: browser APIs, a Redux-style store, localStorage, media queries. Tear-free under concurrent rendering.',
    code: `const isOnline = useSyncExternalStore(
  (cb) => {
    window.addEventListener('online', cb);
    window.addEventListener('offline', cb);
    return () => {
      window.removeEventListener('online', cb);
      window.removeEventListener('offline', cb);
    };
  },
  () => navigator.onLine,   // client snapshot
  () => true                // server snapshot (SSR)
);`,
    notes: ['getSnapshot must return a cached value — returning a new object each call causes an infinite loop.'],
  },
  {
    name: 'useDebugValue',
    category: 'Utility',
    signature: 'useDebugValue(value, format?)',
    when: 'Labelling a custom hook so it reads clearly in React DevTools.',
    code: `function useOnlineStatus() {
  const isOnline = ...;
  useDebugValue(isOnline ? 'Online' : 'Offline');
  return isOnline;
}`,
  },
  {
    name: 'use',
    category: 'React 19',
    signature: 'const value = use(promiseOrContext)',
    when: 'Reading a promise during render (suspends until it resolves) or reading context conditionally.',
    code: `function Comments({ promise }) {
  const comments = use(promise);   // suspends — needs a <Suspense> above
  return comments.map(c => <p key={c.id}>{c.text}</p>);
}

<Suspense fallback={<Skeleton />}>
  <Comments promise={fetchComments()} />
</Suspense>`,
    notes: ['Unlike every other hook, use() CAN be called inside conditions and loops.'],
  },
  {
    name: 'useActionState',
    category: 'React 19',
    signature: 'const [state, action, isPending] = useActionState(fn, initialState)',
    when: 'Form submission: you want the result, the error and the pending flag without three useState calls.',
    code: `const [state, formAction, isPending] = useActionState(
  async (prev, formData) => {
    try { await login(formData.get('email')); return { ok: true }; }
    catch (e) { return { error: e.message }; }
  },
  {}
);

<form action={formAction}>
  <input name="email" />
  <button disabled={isPending}>{isPending ? 'Signing in…' : 'Sign in'}</button>
  {state.error && <p role="alert">{state.error}</p>}
</form>`,
  },
  {
    name: 'useOptimistic',
    category: 'React 19',
    signature: 'const [optimistic, addOptimistic] = useOptimistic(state, updateFn)',
    when: 'Showing the result instantly while the request is still in flight — likes, todos, chat messages.',
    code: `const [optimisticTodos, addOptimistic] = useOptimistic(
  todos,
  (curr, newTodo) => [...curr, { ...newTodo, pending: true }]
);

async function submit(formData) {
  addOptimistic({ text: formData.get('text') });   // shows immediately
  await createTodo(formData);                       // rolls back automatically if it throws
}`,
  },
  {
    name: 'useFormStatus',
    category: 'React 19',
    signature: 'const { pending, data, method } = useFormStatus()',
    when: 'A child component (a shared SubmitButton) needs the parent form’s submission state without prop drilling.',
    code: `function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>;
}

// must be rendered INSIDE the <form>, not in the component that renders it
<form action={save}><SubmitButton /></form>`,
  },
]
