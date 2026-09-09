import Code from '../../components/Code'

export default function RoutingSection() {
  return (
    <>
      <h2 className="section">Route tree with lazy loading</h2>
      <p className="para">
        Guards, layouts and code splitting all compose as nested routes. Each <code>lazy()</code> import becomes its own bundle
        the browser only downloads when that route is visited.
      </p>

      <Code>{`// src/app/router.tsx
import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const Dashboard = lazy(() => import('@/pages/Dashboard/DashboardPage'));
const Meals     = lazy(() => import('@/pages/Meals/MealsPage'));
const Admin     = lazy(() => import('@/pages/Admin/AdminPage'));

const withSuspense = (el: React.ReactNode) => (
  <Suspense fallback={<PageSkeleton />}>{el}</Suspense>
);

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,                 // 1. must be logged in
    children: [
      {
        element: <AppLayout />,                  // 2. Header + Sidebar + <Outlet />
        errorElement: <RouteError />,            // 3. catches render errors below
        children: [
          { index: true,       element: withSuspense(<Dashboard />) },
          { path: 'meals',     element: withSuspense(<Meals />) },
          { path: 'meals/:id', element: withSuspense(<MealDetail />) },
          {
            path: 'admin',
            element: <RoleRoute allowed={['ADMIN']} />,   // 4. must have the role
            children: [{ index: true, element: withSuspense(<Admin />) }],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },
]);`}</Code>

      <Code>{`// main.tsx
<RouterProvider router={router} />`}</Code>

      <h2 className="section">The layout route</h2>
      <Code>{`function AppLayout() {
  return (
    <div className="shell">
      <Sidebar />
      <main>
        <Outlet />   {/* the matched child route renders here */}
      </main>
    </div>
  );
}`}</Code>

      <h2 className="section">Navigation API</h2>
      <table className="map">
        <thead><tr><th>Need</th><th>API</th></tr></thead>
        <tbody>
          <tr><td>Declarative link</td><td><code>{'<Link to="/meals">Meals</Link>'}</code></td></tr>
          <tr><td>Link that knows if it is active</td><td><code>{'<NavLink className={({isActive}) => ...} />'}</code></td></tr>
          <tr><td>Navigate from code</td><td><code>{"navigate('/meals', { replace: true })"}</code></td></tr>
          <tr><td>Go back</td><td><code>navigate(-1)</code></td></tr>
          <tr><td>Read <code>/meals/:id</code></td><td><code>{'const { id } = useParams()'}</code></td></tr>
          <tr><td>Read / write <code>?q=chicken</code></td><td><code>{'const [params, setParams] = useSearchParams()'}</code></td></tr>
          <tr><td>Current path &amp; state</td><td><code>const location = useLocation()</code></td></tr>
          <tr><td>Redirect during render</td><td><code>{'<Navigate to="/login" replace />'}</code></td></tr>
        </tbody>
      </table>

      <h2 className="section">Lazy-loading checklist</h2>
      <ul className="mistakes">
        <li><strong>Split at the route level first.</strong> Biggest bundle win for the least effort.</li>
        <li><strong>Then split heavy widgets</strong> inside a page: charts, rich-text editors, maps, PDF viewers.</li>
        <li><strong>Prefetch on hover</strong> so the chunk is already there by the time the click lands.</li>
        <li><strong>Give Suspense a real skeleton</strong> that matches the page shape, not a blank screen or a bare spinner.</li>
        <li><strong>Wrap lazy routes in an error boundary.</strong> After a redeploy an old chunk URL 404s, so offer a reload instead of a white page.</li>
      </ul>

      <Code>{`// prefetch the chunk before the user clicks
<Link
  to="/meals"
  onMouseEnter={() => import('@/pages/Meals/MealsPage')}
>
  Meals
</Link>`}</Code>

      <Code>{`// handle a stale chunk after deployment
window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});`}</Code>

      <h2 className="section">Scroll restoration &amp; 404</h2>
      <Code>{`// react-router v6.4+ gives you this for free inside the root route
<ScrollRestoration />

// catch-all must be LAST
{ path: '*', element: <NotFound /> }`}</Code>
    </>
  )
}
