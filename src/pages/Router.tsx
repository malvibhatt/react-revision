import { Link, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import Code from '../components/Code'

function DemoHome() {
  return <div className="stat">Nested route: <strong>/router/home</strong></div>
}

function DemoAbout() {
  return <div className="stat">Nested route: <strong>/router/about</strong></div>
}

function DemoUser() {
  const { id } = useParams()
  return <div className="stat">User id from URL: <strong>{id}</strong></div>
}

function LocationBadge() {
  const location = useLocation()
  return <div className="stat">useLocation → <strong>{location.pathname}</strong></div>
}

function NavigateButtons() {
  const nav = useNavigate()
  return (
    <div style={{ marginTop: '0.75rem' }}>
      <button className="action" onClick={() => nav('/router/user/42')}>navigate('/router/user/42')</button>
      <button className="action ghost" onClick={() => nav(-1)}>navigate(-1)</button>
    </div>
  )
}

export default function Router() {
  return (
    <>
      <h1 className="lesson-title">React Router</h1>
      <p className="lesson-sub">Client-side routing via <code>react-router-dom</code>. Everything is a component.</p>

      <div className="highlight">
        Wrap the app in <code>{'<BrowserRouter>'}</code> once at the root. Declare routes in <code>{'<Routes>'}</code>. Navigate with <code>{'<Link>'}</code> or the <code>useNavigate</code> hook.
      </div>

      <h2 className="section">Setup: 3 lines you need</h2>
      <Code>{`// main.tsx: wrap once
<BrowserRouter><App /></BrowserRouter>

// App.tsx: declare routes
<Routes>
  <Route path="/" element={<Dashboard />} />
  <Route path="/history" element={<History />} />
  <Route path="/user/:id" element={<User />} />
</Routes>

// Anywhere: navigate
<Link to="/history">History</Link>`}</Code>

      <h2 className="section">Live demo: nested routes</h2>
      <div className="demo">
        <div className="demo-label">Click a link and the outlet swaps</div>
        <div>
          <Link to="/router/home" className="action" style={{ display: 'inline-block', textDecoration: 'none' }}>/router/home</Link>
          <Link to="/router/about" className="action" style={{ display: 'inline-block', textDecoration: 'none' }}>/router/about</Link>
          <Link to="/router/user/7" className="action" style={{ display: 'inline-block', textDecoration: 'none' }}>/router/user/7</Link>
        </div>
        <div style={{ marginTop: '0.9rem' }}>
          <Routes>
            <Route path="home" element={<DemoHome />} />
            <Route path="about" element={<DemoAbout />} />
            <Route path="user/:id" element={<DemoUser />} />
            <Route path="*" element={<p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Pick a link above to render a nested route here.</p>} />
          </Routes>
        </div>
      </div>

      <h2 className="section">Route params + hooks</h2>
      <Code>{`const { id } = useParams();      // /user/:id → id = "42"
const navigate = useNavigate();   // programmatic push
const location = useLocation();   // current pathname / search / state`}</Code>

      <div className="demo">
        <div className="demo-label">Programmatic navigation + current location</div>
        <LocationBadge />
        <NavigateButtons />
      </div>

      <h2 className="section">Angular equivalent</h2>
      <ul className="mistakes">
        <li><code>BrowserRouter</code> ≈ <code>RouterModule.forRoot()</code></li>
        <li><code>{'<Link to="/x">'}</code> ≈ <code>routerLink="/x"</code></li>
        <li><code>{'<Routes>'}</code> ≈ <code>{'<router-outlet>'}</code></li>
        <li><code>useParams()</code> ≈ <code>ActivatedRoute.snapshot.params</code></li>
        <li><code>useNavigate()</code> ≈ <code>Router.navigate([...])</code></li>
      </ul>
    </>
  )
}
