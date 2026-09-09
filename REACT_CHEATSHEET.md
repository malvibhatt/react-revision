# React Cheatsheet

A practical reference: hooks, gotchas, and the workflows almost every app needs.

---

## Table of Contents

1. [Hooks — When to Use Which](#1-hooks--when-to-use-which)
2. [Rules of Hooks](#2-rules-of-hooks)
3. [Tips & Gotchas (with the *why*)](#3-tips--gotchas-with-the-why)
4. [Performance Optimization Toolkit](#4-performance-optimization-toolkit)
5. [Project Structure](#5-project-structure)
6. [Routing + Lazy Loading](#6-routing--lazy-loading)
7. [Auth: Context + Axios Interceptor + Guards](#7-auth-context--axios-interceptor--guards)
8. [RBAC (Role Based Access Control)](#8-rbac-role-based-access-control)
9. [HTTP GET / POST Workflow with Error Handling](#9-http-get--post-workflow-with-error-handling)
10. [Custom Hooks Worth Owning](#10-custom-hooks-worth-owning)
11. [Quick Decision Table](#11-quick-decision-table)

---

## 1. Hooks — When to Use Which

### `useState` — local, simple state

**Use when:** 1–3 independent values, simple transitions.

```tsx
const [count, setCount] = useState(0);

// ALWAYS use the updater form when new value depends on old
setCount(prev => prev + 1);   // safe in batches/async
setCount(count + 1);          // stale in loops & async callbacks
```

**Lazy init** — pass a function so the expensive work runs only on mount:

```tsx
const [rows, setRows] = useState(() => JSON.parse(localStorage.getItem('rows') ?? '[]'));
```

---

### `useReducer` — complex / related state

**Use when:** next state depends on previous, many fields change together, or you have 4+ `useState` calls that always move in sync (forms, wizards, data-tables, undo/redo).

```tsx
type State = { loading: boolean; data: User[]; error: string | null };
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
dispatch({ type: 'FETCH_START' });
```

> **Bonus:** `dispatch` is referentially stable — safe to pass down without `useCallback`.

---

### `useEffect` — synchronize with the outside world

**Use when:** subscriptions, timers, event listeners, logging, manual DOM work, data fetching (if not using a data library).

**Do NOT use for:** deriving state from props (just compute it), or reacting to user events (do it in the handler).

```tsx
useEffect(() => {
  const id = setInterval(() => tick(), 1000);
  return () => clearInterval(id);      // ← cleanup: prevents memory leak
}, []);                                 // [] = run once on mount
```

Dependency array cheat:

| Deps | Runs |
|---|---|
| *(omitted)* | after **every** render |
| `[]` | once on mount, cleanup on unmount |
| `[a, b]` | on mount + whenever `a` or `b` changes |

---

### `useLayoutEffect` — measure/mutate DOM before paint

**Use when:** you must read layout (`getBoundingClientRect`) and synchronously re-position, to avoid a visible flicker. Otherwise prefer `useEffect` (it doesn't block paint).

```tsx
useLayoutEffect(() => {
  const { height } = ref.current.getBoundingClientRect();
  setTooltipTop(height + 8);   // applied before the browser paints → no flash
}, [content]);
```

---

### `useContext` — read shared state without prop drilling

**Use when:** theme, auth user, locale, feature flags — low-frequency global values.

```tsx
const ThemeContext = createContext<'light' | 'dark'>('light');

// provider
<ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>

// consumer
const theme = useContext(ThemeContext);
```

> ⚠️ **Every consumer re-renders when the value changes.** Split fast-changing values into a separate context, and memoize the `value` object (see §4).

---

### `useRef` — a mutable box that doesn't cause re-render

Two jobs:

```tsx
// 1) DOM access
const inputRef = useRef<HTMLInputElement>(null);
<input ref={inputRef} />;
inputRef.current?.focus();

// 2) Instance variable across renders (timers, previous values, "did mount" flags)
const timerRef = useRef<number | null>(null);
timerRef.current = window.setTimeout(...);   // changing .current does NOT re-render
```

**Rule:** if the UI must update when it changes → `useState`. If not → `useRef`.

---

### `useMemo` — cache an expensive *value*

```tsx
const sorted = useMemo(
  () => [...items].sort((a, b) => a.price - b.price),
  [items]
);
```

**Use when:** (a) genuinely expensive computation, or (b) the result is an object/array passed to a memoized child or used in a dependency array (referential stability).

---

### `useCallback` — cache a *function* reference

```tsx
const handleSelect = useCallback((id: string) => setSelected(id), []);
<MemoizedRow onSelect={handleSelect} />   // Row won't re-render needlessly
```

**Only pays off** when the child is wrapped in `React.memo` or the function is an effect dependency. Otherwise it's overhead.

---

### `useTransition` — keep the UI responsive during heavy updates

**Use when:** typing in a filter box freezes a large list.

```tsx
const [isPending, startTransition] = useTransition();

function onChange(e) {
  setQuery(e.target.value);                  // urgent — input stays snappy
  startTransition(() => setResults(filter(e.target.value)));  // low priority
}
{isPending && <Spinner />}
```

---

### `useDeferredValue` — the "no wiring" version of the above

```tsx
const deferredQuery = useDeferredValue(query);
const list = useMemo(() => filter(deferredQuery), [deferredQuery]);
```

Use when you can't reach the `setState` call (e.g. value comes from props).

---

### `useId` — stable unique IDs for a11y

```tsx
const id = useId();
<label htmlFor={id}>Email</label>
<input id={id} />
```

Never use for list `key`s. SSR-safe (matches server + client).

---

### `useImperativeHandle` — expose methods from a child

**Use sparingly** — for reusable components like modals or inputs.

```tsx
const Modal = forwardRef((props, ref) => {
  const [open, setOpen] = useState(false);
  useImperativeHandle(ref, () => ({ open: () => setOpen(true), close: () => setOpen(false) }), []);
  return open ? <dialog>{props.children}</dialog> : null;
});

modalRef.current?.open();
```

---

### `useSyncExternalStore` — subscribe to a non-React store

**Use when:** wrapping browser APIs or external state (Redux-style stores, `localStorage`, media queries). Tear-free in concurrent rendering.

```tsx
const isOnline = useSyncExternalStore(
  cb => { window.addEventListener('online', cb); window.addEventListener('offline', cb);
          return () => { window.removeEventListener('online', cb); window.removeEventListener('offline', cb); }; },
  () => navigator.onLine,   // client snapshot
  () => true                // server snapshot
);
```

---

### `useDebugValue` — label custom hooks in React DevTools

```tsx
useDebugValue(isOnline ? 'Online' : 'Offline');
```

---

### React 19 hooks

#### `use` — read a promise or context conditionally

```tsx
function Comments({ promise }) {
  const comments = use(promise);   // suspends until resolved; needs <Suspense>
  return comments.map(c => <p key={c.id}>{c.text}</p>);
}
```

Unlike other hooks, `use` **can** be called inside conditions/loops.

#### `useActionState` — form submission state

```tsx
const [state, formAction, isPending] = useActionState(
  async (prev, formData) => {
    try { await login(formData.get('email')); return { ok: true }; }
    catch (e) { return { error: e.message }; }
  },
  { }
);

<form action={formAction}>
  <input name="email" />
  <button disabled={isPending}>{isPending ? 'Signing in…' : 'Sign in'}</button>
  {state.error && <p role="alert">{state.error}</p>}
</form>
```

#### `useOptimistic` — instant UI, reconcile later

```tsx
const [optimisticTodos, addOptimistic] = useOptimistic(
  todos,
  (curr, newTodo) => [...curr, { ...newTodo, pending: true }]
);

async function submit(formData) {
  addOptimistic({ text: formData.get('text') });   // shows immediately
  await createTodo(formData);                       // rolls back automatically on throw
}
```

#### `useFormStatus` — read parent form state from a child

```tsx
function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>;
}
```

---

## 2. Rules of Hooks

1. **Only call at the top level** — never inside conditions, loops, or nested functions. React matches hooks by call order.
2. **Only call from React functions** — components or other custom hooks.
3. **Custom hooks must start with `use`** — that's how the linter enforces rules 1 & 2.
4. Install `eslint-plugin-react-hooks` and never silence `exhaustive-deps` without a comment explaining why.

```tsx
// ❌ conditional hook — order changes between renders
if (isLoggedIn) { const [x] = useState(0); }

// ✅ hook at top, condition inside
const [x, setX] = useState(0);
if (isLoggedIn) { /* use x */ }
```

---

## 3. Tips & Gotchas (with the *why*)

### 3.1 Always clean up — **purpose: prevent memory leaks & state updates on unmounted components**

```tsx
useEffect(() => {
  const onResize = () => setWidth(window.innerWidth);
  window.addEventListener('resize', onResize);
  return () => window.removeEventListener('resize', onResize);  // ← or the listener lives forever
}, []);
```

Things that **must** be cleaned up: `setTimeout` / `setInterval`, event listeners, WebSocket / EventSource, `IntersectionObserver` / `ResizeObserver` / `MutationObserver`, store subscriptions, in-flight fetches.

### 3.2 Abort in-flight requests — **purpose: avoid race conditions & leaks**

```tsx
useEffect(() => {
  const controller = new AbortController();
  api.get(`/users/${id}`, { signal: controller.signal })
     .then(res => setUser(res.data))
     .catch(err => { if (err.name !== 'CanceledError') setError(err); });
  return () => controller.abort();   // stale response for old `id` never lands
}, [id]);
```

Without this, switching `id` fast means the **slower, older** response can overwrite the newer one.

### 3.3 Never mutate state — **purpose: React compares by reference**

```tsx
// ❌ same reference → no re-render
items.push(newItem); setItems(items);

// ✅ new reference
setItems(prev => [...prev, newItem]);
setUser(prev => ({ ...prev, name }));               // shallow
setState(prev => ({ ...prev, addr: { ...prev.addr, city } }));  // nested needs each level
```

### 3.4 Stable, meaningful `key`s — **purpose: correct reconciliation**

```tsx
{items.map((it, i) => <Row key={i} />)}    // ❌ breaks on insert/delete/sort — wrong DOM reused
{items.map(it => <Row key={it.id} />)}     // ✅
```

### 3.5 Functional updates in async code — **purpose: avoid stale closures**

```tsx
useEffect(() => {
  const id = setInterval(() => setCount(c => c + 1), 1000);  // ✅ always fresh
  // setInterval(() => setCount(count + 1), 1000)            // ❌ `count` frozen at 0
  return () => clearInterval(id);
}, []);
```

### 3.6 Don't derive state into state — **purpose: single source of truth**

```tsx
// ❌ two sources of truth + an extra render
const [total, setTotal] = useState(0);
useEffect(() => setTotal(items.reduce((s, i) => s + i.price, 0)), [items]);

// ✅ just compute
const total = items.reduce((s, i) => s + i.price, 0);
```

### 3.7 Guard `.map` on possibly-undefined data

```tsx
{data?.items?.map(...) ?? <EmptyState />}
```

### 3.8 Effects run twice in dev StrictMode — **purpose: it surfaces missing cleanup**

Don't disable StrictMode; fix the effect so it's idempotent.

### 3.9 Batch-friendly forms

```tsx
const [form, setForm] = useState({ email: '', password: '' });
const onChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
<input name="email" value={form.email} onChange={onChange} />
```

### 3.10 Error Boundaries catch render errors, not async ones

```tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err, info) { logToService(err, info); }
  render() { return this.state.hasError ? <Fallback /> : this.props.children; }
}
```

Wrap routes/widgets so one crash doesn't blank the whole app. `try/catch` still needed for promises and event handlers.

---

## 4. Performance Optimization Toolkit

| Tool | Fixes | Example |
|---|---|---|
| `React.memo` | Child re-renders with same props | `export default memo(Row)` |
| `useMemo` | Recomputing expensive values / unstable object refs | `useMemo(() => heavy(x), [x])` |
| `useCallback` | New function identity breaking `memo` | `useCallback(fn, [dep])` |
| `useTransition` | Blocking UI during big state updates | `startTransition(() => ...)` |
| `useDeferredValue` | Same, when you only have the value | `useDeferredValue(query)` |
| `React.lazy` + `Suspense` | Large initial bundle | route-level code splitting |
| Virtualization | Rendering 1000s of rows | `react-window` / `@tanstack/react-virtual` |
| State colocation | Whole tree re-rendering | move state down to the component that uses it |
| Context splitting | Every consumer re-rendering | separate `AuthUserContext` / `AuthActionsContext` |

**The memoized-context pattern** (this one bites everyone):

```tsx
// ❌ new object every render → every consumer re-renders
<AuthContext.Provider value={{ user, login, logout }}>

// ✅
const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
<AuthContext.Provider value={value}>
```

**Order of operations:** measure first (React DevTools Profiler) → colocate/restructure state → *then* memoize. Premature `useMemo`/`useCallback` everywhere costs memory and readability for no gain.

---

## 5. Project Structure

Feature-first scales better than type-first once you pass ~20 files.

```
src/
├── api/
│   ├── axiosInstance.ts        # base URL, timeout, headers
│   ├── interceptors.ts         # auth token, refresh, error normalization
│   └── endpoints.ts            # centralized URL constants
├── app/
│   ├── App.tsx
│   ├── router.tsx              # route tree + lazy imports
│   └── providers.tsx           # compose all context providers
├── assets/
├── components/                 # shared, dumb, reusable UI
│   ├── ui/                     # Button, Input, Modal, Table
│   └── layout/                 # Header, Sidebar, PageShell
├── config/
│   └── env.ts                  # typed env vars
├── constants/
│   ├── roles.ts
│   └── routes.ts
├── context/
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── features/                   # ← the important one
│   └── meals/
│       ├── api/mealsApi.ts
│       ├── components/MealCard.tsx
│       ├── hooks/useMeals.ts
│       ├── types/meal.types.ts
│       └── index.ts            # public surface of the feature
├── hooks/                      # shared hooks: useDebounce, useFetch…
├── pages/                      # route-level screens, thin — compose features
│   ├── Login/LoginPage.tsx
│   └── Dashboard/DashboardPage.tsx
├── reducers/                   # or store/ if using Redux/Zustand
├── services/                   # non-HTTP: storage, analytics, notifications
├── types/
│   ├── api.types.ts            # ApiResponse<T>, ApiError
│   └── user.types.ts
├── utils/
│   ├── formatters.ts
│   └── validators.ts
├── routes/
│   ├── ProtectedRoute.tsx
│   └── RoleRoute.tsx
└── main.tsx
```

**Rules that keep it clean**

- `pages/` are thin: fetch + layout + compose. No business logic.
- A feature may import from `components/`, `hooks/`, `utils/` — but **never from another feature's internals**, only its `index.ts`.
- Every API call lives in an `api/` file, never inline in a component.
- Types live next to their feature; only truly shared types go in `src/types/`.
- Path aliases (`@/features/meals`) beat `../../../`.

```ts
// src/types/api.types.ts
export interface ApiResponse<T> { data: T; message: string; success: boolean; }
export interface ApiError { status: number; message: string; code?: string; fields?: Record<string, string>; }
export interface Paginated<T> { items: T[]; page: number; total: number; }
```

---

## 6. Routing + Lazy Loading

```tsx
// src/app/router.tsx
import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';

const Dashboard = lazy(() => import('@/pages/Dashboard/DashboardPage'));
const Meals     = lazy(() => import('@/pages/Meals/MealsPage'));
const Admin     = lazy(() => import('@/pages/Admin/AdminPage'));

const withSuspense = (el: React.ReactNode) => (
  <Suspense fallback={<PageLoader />}>{el}</Suspense>
);

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,          // auth guard (see §7)
    children: [
      {
        element: <AppLayout />,           // Header + Sidebar + <Outlet />
        errorElement: <RouteError />,
        children: [
          { index: true,        element: withSuspense(<Dashboard />) },
          { path: 'meals',      element: withSuspense(<Meals />) },
          { path: 'meals/:id',  element: withSuspense(<MealDetail />) },
          {
            path: 'admin',
            element: <RoleRoute allowed={['ADMIN']} />,   // RBAC guard (see §8)
            children: [{ index: true, element: withSuspense(<Admin />) }],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },
]);

// main.tsx
<RouterProvider router={router} />
```

**Navigation & params**

```tsx
const navigate = useNavigate();          navigate('/meals', { replace: true });
const { id } = useParams();              // /meals/:id
const [params, setParams] = useSearchParams();   // ?q=chicken
const location = useLocation();          // location.pathname, location.state
<Link to="/meals">Meals</Link>
<NavLink to="/meals" className={({ isActive }) => isActive ? 'active' : ''} />
```

**Lazy-loading tips**

- Split at the **route** level first — biggest win for the least effort.
- Also lazy-load heavy widgets (charts, editors, maps) inside a page.
- Prefetch on hover to hide the latency: `onMouseEnter={() => import('@/pages/Meals/MealsPage')}`.
- Always give `<Suspense>` a real skeleton, not a blank screen.
- Wrap lazy routes in an error boundary — a failed chunk load (after a redeploy) should offer a reload, not a white page.

---

## 7. Auth: Context + Axios Interceptor + Guards

> High-level shape — wire your own token storage and endpoints.

### 7.1 Axios instance

```ts
// src/api/axiosInstance.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,      // if refresh token is an httpOnly cookie
});
```

### 7.2 Interceptors — attach token, refresh on 401, normalize errors

```ts
// src/api/interceptors.ts
import { api } from './axiosInstance';
import { tokenStore } from '@/services/tokenStore';

// ── REQUEST: attach access token ──────────────────────────────
api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── RESPONSE: refresh once, queue concurrent 401s ─────────────
let isRefreshing = false;
let queue: Array<(t: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        // park this request until the in-flight refresh finishes
        return new Promise((resolve) => {
          queue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;
      try {
        const { data } = await axios.post('/auth/refresh', null, { withCredentials: true });
        tokenStore.setAccess(data.accessToken);
        queue.forEach((cb) => cb(data.accessToken));
        queue = [];
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (e) {
        tokenStore.clear();
        window.location.href = '/login';       // hard logout
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 403) toast.error('You do not have permission.');

    // normalize so components handle ONE error shape
    return Promise.reject({
      status: error.response?.status ?? 0,
      message: error.response?.data?.message ?? error.message ?? 'Something went wrong',
      fields:  error.response?.data?.errors,
    });
  }
);
```

### 7.3 AuthContext

```tsx
// src/context/AuthContext.tsx
type AuthState = { user: User | null; status: 'loading' | 'authed' | 'guest' };

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState<AuthState>({ user: null, status: 'loading' });

  // restore session on app boot
  useEffect(() => {
    let alive = true;
    api.get('/auth/me')
      .then(({ data }) => alive && setState({ user: data, status: 'authed' }))
      .catch(() => alive && setState({ user: null, status: 'guest' }));
    return () => { alive = false; };
  }, []);

  const login = useCallback(async (creds: Credentials) => {
    const { data } = await api.post('/auth/login', creds);
    tokenStore.setAccess(data.accessToken);
    setState({ user: data.user, status: 'authed' });
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => {});
    tokenStore.clear();
    setState({ user: null, status: 'guest' });
  }, []);

  const value = useMemo(() => ({ ...state, login, logout }), [state, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
```

### 7.4 Auth guard

```tsx
// src/routes/ProtectedRoute.tsx
export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageLoader />;
  if (status === 'guest')
    return <Navigate to="/login" replace state={{ from: location }} />;  // return here after login

  return <Outlet />;
}
```

---

## 8. RBAC (Role Based Access Control)

### 8.1 Define roles & permissions in one place

```ts
// src/constants/roles.ts
export const ROLES = { ADMIN: 'ADMIN', MANAGER: 'MANAGER', USER: 'USER' } as const;
export type Role = keyof typeof ROLES;

export type Permission = 'meal:create' | 'meal:delete' | 'user:manage' | 'report:view';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN:   ['meal:create', 'meal:delete', 'user:manage', 'report:view'],
  MANAGER: ['meal:create', 'report:view'],
  USER:    [],
};
```

### 8.2 Permission hook

```tsx
// src/hooks/usePermission.ts
export function usePermission() {
  const { user } = useAuth();
  const perms = useMemo(
    () => new Set(user?.roles.flatMap(r => ROLE_PERMISSIONS[r] ?? [])),
    [user]
  );
  return {
    can:     (p: Permission) => perms.has(p),
    canAny:  (list: Permission[]) => list.some(p => perms.has(p)),
    hasRole: (r: Role) => !!user?.roles.includes(r),
  };
}
```

### 8.3 Route-level guard

```tsx
// src/routes/RoleRoute.tsx
export function RoleRoute({ allowed }: { allowed: Role[] }) {
  const { user } = useAuth();
  const ok = user?.roles.some(r => allowed.includes(r));
  return ok ? <Outlet /> : <Navigate to="/403" replace />;
}
```

### 8.4 UI-level guard

```tsx
// src/components/Can.tsx
export function Can({ perm, children, fallback = null }) {
  const { can } = usePermission();
  return can(perm) ? <>{children}</> : fallback;
}

// usage
<Can perm="meal:delete">
  <Button variant="danger" onClick={remove}>Delete</Button>
</Can>
```

> 🔒 **Client-side RBAC is UX, not security.** It hides buttons and routes; the API must enforce the same rules on every request. Never trust a role decoded from a token in the browser.

---

## 9. HTTP GET / POST Workflow with Error Handling

### 9.1 Typed API layer

```ts
// src/features/meals/api/mealsApi.ts
import { api } from '@/api/axiosInstance';
import type { Meal, CreateMealDto } from '../types/meal.types';

export const mealsApi = {
  list:   (params?: { page?: number; q?: string }, signal?: AbortSignal) =>
            api.get<Paginated<Meal>>('/meals', { params, signal }).then(r => r.data),
  byId:   (id: string, signal?: AbortSignal) =>
            api.get<Meal>(`/meals/${id}`, { signal }).then(r => r.data),
  create: (dto: CreateMealDto) => api.post<Meal>('/meals', dto).then(r => r.data),
  update: (id: string, dto: Partial<CreateMealDto>) => api.put<Meal>(`/meals/${id}`, dto).then(r => r.data),
  remove: (id: string) => api.delete<void>(`/meals/${id}`),
};
```

### 9.2 GET — reusable hook with loading / error / abort

```tsx
// src/features/meals/hooks/useMeals.ts
export function useMeals(query: string) {
  const [state, dispatch] = useReducer(reducer, { loading: true, data: [], error: null });

  useEffect(() => {
    const controller = new AbortController();
    dispatch({ type: 'FETCH_START' });

    mealsApi.list({ q: query }, controller.signal)
      .then(res => dispatch({ type: 'FETCH_SUCCESS', payload: res.items }))
      .catch(err => {
        if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;  // ignore aborts
        dispatch({ type: 'FETCH_ERROR', payload: err.message });
      });

    return () => controller.abort();     // cancel on query change / unmount
  }, [query]);

  return state;
}
```

```tsx
// consuming component — always render all four states
function MealsPage() {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 400);
  const { loading, data, error } = useMeals(debounced);

  if (loading) return <MealsSkeleton />;
  if (error)   return <ErrorState message={error} onRetry={() => setQuery(q => q)} />;
  if (!data.length) return <EmptyState />;

  return <MealList meals={data} />;
}
```

### 9.3 POST — submit with pending state, field errors, and no double-submit

```tsx
function CreateMealForm() {
  const [form, setForm] = useState<CreateMealDto>({ name: '', calories: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;                 // guard double click

    const clientErrors = validate(form);    // validate before hitting the network
    if (Object.keys(clientErrors).length) return setErrors(clientErrors);

    setSubmitting(true);
    setErrors({});
    try {
      const meal = await mealsApi.create(form);
      toast.success('Meal created');
      navigate(`/meals/${meal.id}`);
    } catch (err: any) {
      if (err.status === 422) setErrors(err.fields ?? {});   // server field validation
      else toast.error(err.message);                          // 500 / network / timeout
    } finally {
      setSubmitting(false);                 // ← finally, so it resets on BOTH paths
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <input name="name" value={form.name}
             onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
      {errors.name && <span role="alert">{errors.name}</span>}
      <button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}
```

### 9.4 Error handling layers

| Layer | Handles | How |
|---|---|---|
| Interceptor | 401 refresh, 403 toast, error shape normalization | `api.interceptors.response` |
| API function | Response parsing, typing | `.then(r => r.data)` |
| Hook / handler | Loading, retry, aborts, field errors | `try/catch/finally` |
| Component | Skeleton / error / empty / data states | conditional render |
| Error Boundary | Unexpected render crashes | `errorElement` per route |

### 9.5 The same with React Query (recommended for real apps)

Caching, retries, dedupe, and background refetch come free:

```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ['meals', query],
  queryFn: ({ signal }) => mealsApi.list({ q: query }, signal),
  staleTime: 60_000,
});

const { mutate, isPending } = useMutation({
  mutationFn: mealsApi.create,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meals'] }),
  onError: (e) => toast.error(e.message),
});
```

---

## 10. Custom Hooks Worth Owning

```tsx
// useDebounce — delay expensive work (search, autosave)
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);        // cancel previous timer
  }, [value, delay]);
  return debounced;
}

// useLocalStorage — persisted state
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : initial; }
    catch { return initial; }
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(value)); }, [key, value]);
  return [value, setValue] as const;
}

// useToggle
export const useToggle = (init = false) => {
  const [on, setOn] = useState(init);
  return [on, useCallback(() => setOn(v => !v), [])] as const;
};

// useClickOutside — close dropdowns/modals
export function useClickOutside<T extends HTMLElement>(ref: RefObject<T>, onOut: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onOut(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, onOut]);
}

// usePrevious
export function usePrevious<T>(value: T) {
  const ref = useRef<T>();
  useEffect(() => { ref.current = value; }, [value]);
  return ref.current;
}
```

---

## 11. Quick Decision Table

| I need to… | Use |
|---|---|
| Hold a simple value that renders | `useState` |
| Hold complex/related state, or many transitions | `useReducer` |
| Talk to something outside React (timers, listeners, fetch) | `useEffect` + cleanup |
| Measure the DOM before paint | `useLayoutEffect` |
| Share a value deep in the tree | `useContext` |
| Keep a value across renders **without** re-rendering | `useRef` |
| Access a DOM node | `useRef` + `ref` |
| Skip an expensive recalculation | `useMemo` |
| Keep a callback identity stable for a memoized child | `useCallback` |
| Stop a heavy update from freezing input | `useTransition` / `useDeferredValue` |
| Unique a11y ids | `useId` |
| Expose imperative methods from a child | `useImperativeHandle` + `forwardRef` |
| Subscribe to an external/browser store | `useSyncExternalStore` |
| Read a promise in render (React 19) | `use` + `<Suspense>` |
| Track form submission state (React 19) | `useActionState` / `useFormStatus` |
| Show an instant result before the server confirms | `useOptimistic` |
| Cache server data, retry, refetch | **React Query** (not a built-in hook) |

---

### Final checklist before shipping a component

- [ ] Every effect that subscribes also unsubscribes
- [ ] Every fetch in an effect is abortable
- [ ] `key`s are stable ids, not indexes
- [ ] Loading / error / empty / success states all render something
- [ ] No state mutation — new references everywhere
- [ ] Context `value` is memoized
- [ ] Async setState uses the updater form
- [ ] `finally` resets `submitting` on both success and failure
- [ ] Route is code-split and behind the right guard
- [ ] Permissions are enforced on the server too
