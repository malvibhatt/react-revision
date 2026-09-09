import Code from '../../components/Code'

const TREE = `src/
├── api/
│   ├── axiosInstance.ts        # base URL, timeout, default headers
│   ├── interceptors.ts         # auth token, refresh, error normalization
│   └── endpoints.ts            # centralized URL constants
├── app/
│   ├── App.tsx
│   ├── router.tsx              # route tree + lazy imports
│   └── providers.tsx           # compose every context provider
├── assets/                     # images, fonts, icons
├── components/                 # shared, dumb, reusable UI
│   ├── ui/                     # Button, Input, Modal, Table
│   └── layout/                 # Header, Sidebar, PageShell
├── config/
│   └── env.ts                  # typed environment variables
├── constants/
│   ├── roles.ts
│   └── routes.ts
├── context/
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── features/                   # <- the part that makes it scale
│   └── meals/
│       ├── api/mealsApi.ts
│       ├── components/MealCard.tsx
│       ├── hooks/useMeals.ts
│       ├── types/meal.types.ts
│       └── index.ts            # the feature's public surface
├── hooks/                      # shared hooks: useDebounce, useFetch
├── pages/                      # route screens - thin, they compose features
│   ├── Login/LoginPage.tsx
│   └── Dashboard/DashboardPage.tsx
├── reducers/                   # or store/ when using Redux / Zustand
├── routes/
│   ├── ProtectedRoute.tsx      # auth guard
│   └── RoleRoute.tsx           # RBAC guard
├── services/                   # non-HTTP: storage, analytics, notifications
├── types/
│   ├── api.types.ts            # ApiResponse<T>, ApiError, Paginated<T>
│   └── user.types.ts
├── utils/
│   ├── formatters.ts
│   └── validators.ts
└── main.tsx`

export default function StructureSection() {
  return (
    <>
      <h2 className="section">Project structure</h2>
      <p className="para">
        Group by <strong>feature</strong>, not by file type. Type-first (<code>components/</code>, <code>hooks/</code>, <code>services/</code>)
        is fine for a demo and painful past roughly twenty files, because one change touches five folders.
      </p>

      <pre className="tree">{TREE}</pre>

      <h2 className="section">The rules that keep it clean</h2>
      <ul className="mistakes">
        <li><strong>Pages stay thin.</strong> Fetch, lay out, compose. No business logic, no inline API calls.</li>
        <li><strong>Features are sealed.</strong> A feature may import from <code>components/</code>, <code>hooks/</code> and <code>utils/</code>, but never reach into another feature&apos;s internals, only its <code>index.ts</code>.</li>
        <li><strong>Every HTTP call lives in an <code>api/</code> file.</strong> Components never see axios.</li>
        <li><strong>Types live beside their feature.</strong> Only genuinely shared shapes go in <code>src/types/</code>.</li>
        <li><strong>Use path aliases.</strong> <code>@/features/meals</code> beats <code>../../../features/meals</code>.</li>
      </ul>

      <h2 className="section">Shared API types</h2>
      <Code>{`// src/types/api.types.ts
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  fields?: Record<string, string>;   // server-side field validation
}

export interface Paginated<T> {
  items: T[];
  page: number;
  total: number;
}`}</Code>

      <h2 className="section">A feature&apos;s public surface</h2>
      <Code>{`// src/features/meals/index.ts
export { default as MealCard } from './components/MealCard';
export { useMeals } from './hooks/useMeals';
export type { Meal } from './types/meal.types';
// everything else stays private to the feature`}</Code>

      <h2 className="section">Path aliases</h2>
      <Code>{`// vite.config.ts
resolve: {
  alias: { '@': path.resolve(__dirname, './src') },
}

// tsconfig.app.json
"paths": { "@/*": ["./src/*"] }`}</Code>

      <h2 className="section">Composing providers</h2>
      <Code>{`// src/app/providers.tsx: keeps main.tsx from becoming a pyramid
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}`}</Code>
    </>
  )
}
