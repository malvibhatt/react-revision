import Code from '../../components/Code'
import Mermaid from '../../components/Mermaid'
import { AUTH_DIAGRAMS } from './authDiagrams'

export default function AuthSection() {
  return (
    <>
      <h2 className="section">Auth flow: the moving parts</h2>
      <p className="para">High-level shape. Swap in your own endpoints and token storage.</p>

      <div className="flow">
        <div className="flow-step"><span className="flow-n">1</span><div><strong>axiosInstance</strong><p>base URL, timeout, credentials</p></div></div>
        <div className="flow-arrow">→</div>
        <div className="flow-step"><span className="flow-n">2</span><div><strong>request interceptor</strong><p>attaches the access token</p></div></div>
        <div className="flow-arrow">→</div>
        <div className="flow-step"><span className="flow-n">3</span><div><strong>response interceptor</strong><p>refresh on 401, normalize errors</p></div></div>
        <div className="flow-arrow">→</div>
        <div className="flow-step"><span className="flow-n">4</span><div><strong>AuthContext</strong><p>user, login, logout, boot session</p></div></div>
        <div className="flow-arrow">→</div>
        <div className="flow-step"><span className="flow-n">5</span><div><strong>guards</strong><p>ProtectedRoute + RoleRoute</p></div></div>
      </div>

      <h2 className="section">Workflow diagrams</h2>
      <p className="para">
        The same flow drawn end to end, then one worked example per use case: login, an allowed admin route, a
        permission-denied route and an unauthenticated route. Diamonds are decisions, rectangles are actions,
        cylinders are stores.
      </p>

      {AUTH_DIAGRAMS.map((d) => (
        <div className="diagram-card" key={d.id}>
          <div className="diagram-head">
            <h3>{d.title}</h3>
            <span className={`diagram-tag t-${d.tagKind}`}>{d.tag}</span>
          </div>
          <p className="diagram-scenario">{d.scenario}</p>
          <Mermaid chart={d.chart} />
        </div>
      ))}

      <h2 className="section">1. The axios instance</h2>
      <Code>{`// src/api/axiosInstance.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,   // needed if the refresh token is an httpOnly cookie
});`}</Code>

      <h2 className="section">2. Request interceptor: attach the token</h2>
      <Code>{`// src/api/interceptors.ts
api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  return config;
});`}</Code>

      <h2 className="section">3. Response interceptor: refresh once, queue the rest</h2>
      <p className="para">
        The subtle part: if five requests 401 at the same moment you must refresh <em>once</em> and replay all five,
        not fire five refresh calls.
      </p>
      <Code>{`let isRefreshing = false;
let queue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;                       // only ever retry once

      if (isRefreshing) {
        // park this request until the in-flight refresh finishes
        return new Promise((resolve) => {
          queue.push((token) => {
            original.headers.Authorization = \`Bearer \${token}\`;
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;
      try {
        const { data } = await axios.post('/auth/refresh', null, { withCredentials: true });
        tokenStore.setAccess(data.accessToken);
        queue.forEach((replay) => replay(data.accessToken));
        queue = [];
        original.headers.Authorization = \`Bearer \${data.accessToken}\`;
        return api(original);                       // replay the original call
      } catch (e) {
        tokenStore.clear();
        window.location.href = '/login';            // refresh failed -> hard logout
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 403) toast.error('You do not have permission.');

    // normalize so every component handles ONE error shape
    return Promise.reject({
      status:  error.response?.status ?? 0,
      message: error.response?.data?.message ?? error.message ?? 'Something went wrong',
      fields:  error.response?.data?.errors,
    });
  }
);`}</Code>

      <h2 className="section">4. AuthContext</h2>
      <Code>{`// src/context/AuthContext.tsx
type AuthState = { user: User | null; status: 'loading' | 'authed' | 'guest' };

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState<AuthState>({ user: null, status: 'loading' });

  // restore the session on app boot
  useEffect(() => {
    let alive = true;
    api.get('/auth/me')
      .then(({ data }) => alive && setState({ user: data, status: 'authed' }))
      .catch(()       => alive && setState({ user: null, status: 'guest' }));
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

// throwing here turns "undefined is not an object" into a clear message
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};`}</Code>

      <div className="highlight">
        The <code>loading</code> status matters: without it, a refresh of the page flashes the login screen for a moment
        before <code>/auth/me</code> resolves.
      </div>

      <h2 className="section">5. Auth guard</h2>
      <Code>{`// src/routes/ProtectedRoute.tsx
export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageLoader />;
  if (status === 'guest')
    return <Navigate to="/login" replace state={{ from: location }} />;

  return <Outlet />;
}

// on the login page, send them back where they came from
const from = location.state?.from?.pathname ?? '/';
await login(creds);
navigate(from, { replace: true });`}</Code>

      <h2 className="section">RBAC: roles &amp; permissions</h2>
      <p className="para">Map roles to permissions in one file, then check <em>permissions</em> everywhere else. Adding a role becomes a one-line change.</p>

      <Code>{`// src/constants/roles.ts
export const ROLES = { ADMIN: 'ADMIN', MANAGER: 'MANAGER', USER: 'USER' } as const;
export type Role = keyof typeof ROLES;

export type Permission =
  | 'meal:create' | 'meal:delete' | 'user:manage' | 'report:view';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN:   ['meal:create', 'meal:delete', 'user:manage', 'report:view'],
  MANAGER: ['meal:create', 'report:view'],
  USER:    [],
};`}</Code>

      <Code>{`// src/hooks/usePermission.ts
export function usePermission() {
  const { user } = useAuth();

  const perms = useMemo(
    () => new Set(user?.roles.flatMap(r => ROLE_PERMISSIONS[r] ?? [])),
    [user]
  );

  return {
    can:     (p: Permission)   => perms.has(p),
    canAny:  (ps: Permission[]) => ps.some(p => perms.has(p)),
    hasRole: (r: Role)          => !!user?.roles.includes(r),
  };
}`}</Code>

      <h2 className="section">Guarding a route vs guarding a button</h2>
      <div className="two-col">
        <div className="col-plain">
          <div className="col-head">Route level</div>
          <Code>{`// src/routes/RoleRoute.tsx
export function RoleRoute({ allowed }: { allowed: Role[] }) {
  const { user } = useAuth();
  const ok = user?.roles.some(r => allowed.includes(r));
  return ok ? <Outlet /> : <Navigate to="/403" replace />;
}`}</Code>
        </div>
        <div className="col-plain">
          <div className="col-head">UI level</div>
          <Code>{`// src/components/Can.tsx
export function Can({ perm, children, fallback = null }) {
  const { can } = usePermission();
  return can(perm) ? <>{children}</> : fallback;
}

<Can perm="meal:delete">
  <Button variant="danger" onClick={remove}>Delete</Button>
</Can>`}</Code>
        </div>
      </div>

      <div className="danger-note">
        <strong>Client-side RBAC is UX, not security.</strong> It hides buttons and routes so users are not offered actions they
        cannot perform. Anyone can edit the JavaScript in their browser, so the API must enforce the same rules on every single
        request. Never trust a role decoded from a token on the client.
      </div>
    </>
  )
}
