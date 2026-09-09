import Code from '../../components/Code'

export default function ApiSection() {
  return (
    <>
      <h2 className="section">The API layer</h2>
      <p className="para">
        Every endpoint gets one typed function. Components import the function, never axios — so a URL change touches one file
        and mocking in tests is trivial.
      </p>

      <Code>{`// src/features/meals/api/mealsApi.ts
import { api } from '@/api/axiosInstance';
import type { Meal, CreateMealDto } from '../types/meal.types';
import type { Paginated } from '@/types/api.types';

export const mealsApi = {
  list: (params?: { page?: number; q?: string }, signal?: AbortSignal) =>
    api.get<Paginated<Meal>>('/meals', { params, signal }).then(r => r.data),

  byId: (id: string, signal?: AbortSignal) =>
    api.get<Meal>(\`/meals/\${id}\`, { signal }).then(r => r.data),

  create: (dto: CreateMealDto) =>
    api.post<Meal>('/meals', dto).then(r => r.data),

  update: (id: string, dto: Partial<CreateMealDto>) =>
    api.put<Meal>(\`/meals/\${id}\`, dto).then(r => r.data),

  remove: (id: string) => api.delete<void>(\`/meals/\${id}\`),
};`}</Code>

      <h2 className="section">GET — a reusable hook with loading, error and abort</h2>
      <Code>{`// src/features/meals/hooks/useMeals.ts
export function useMeals(query: string) {
  const [state, dispatch] = useReducer(reducer, { loading: true, data: [], error: null });

  useEffect(() => {
    const controller = new AbortController();
    dispatch({ type: 'FETCH_START' });

    mealsApi.list({ q: query }, controller.signal)
      .then(res => dispatch({ type: 'FETCH_SUCCESS', payload: res.items }))
      .catch(err => {
        // an aborted request is not an error - ignore it
        if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
        dispatch({ type: 'FETCH_ERROR', payload: err.message });
      });

    return () => controller.abort();   // cancel when query changes or on unmount
  }, [query]);

  return state;
}`}</Code>

      <h2 className="section">Render all four states — always</h2>
      <div className="state-row">
        <span className="state-pill s-load">loading</span>
        <span className="state-pill s-err">error</span>
        <span className="state-pill s-empty">empty</span>
        <span className="state-pill s-ok">success</span>
      </div>
      <Code>{`function MealsPage() {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 400);          // don't fire per keystroke
  const { loading, data, error } = useMeals(debounced);

  if (loading)        return <MealsSkeleton />;
  if (error)          return <ErrorState message={error} onRetry={refetch} />;
  if (!data.length)   return <EmptyState message="No meals yet" />;

  return <MealList meals={data} />;
}`}</Code>
      <p className="para">
        &ldquo;Empty&rdquo; is the state everyone forgets — a successful response with zero rows should say so, not render a blank area
        that looks broken.
      </p>

      <h2 className="section">POST — submit, field errors, no double-submit</h2>
      <Code>{`function CreateMealForm() {
  const [form, setForm] = useState<CreateMealDto>({ name: '', calories: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;                  // guard against a double click

    const clientErrors = validate(form);     // validate before touching the network
    if (Object.keys(clientErrors).length) return setErrors(clientErrors);

    setSubmitting(true);
    setErrors({});
    try {
      const meal = await mealsApi.create(form);
      toast.success('Meal created');
      navigate(\`/meals/\${meal.id}\`);
    } catch (err: any) {
      if (err.status === 422) setErrors(err.fields ?? {});   // server validation
      else                    toast.error(err.message);      // 500 / network / timeout
    } finally {
      setSubmitting(false);                  // finally -> resets on BOTH paths
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <input
        name="name"
        value={form.name}
        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
      />
      {errors.name && <span role="alert">{errors.name}</span>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}`}</Code>

      <h2 className="section">Where each error is handled</h2>
      <table className="map">
        <thead><tr><th>Layer</th><th>Handles</th><th>How</th></tr></thead>
        <tbody>
          <tr><td>Interceptor</td><td>401 refresh, 403 toast, error shape</td><td><code>api.interceptors.response</code></td></tr>
          <tr><td>API function</td><td>Response parsing and typing</td><td><code>{'.then(r => r.data)'}</code></td></tr>
          <tr><td>Hook / handler</td><td>Loading, retry, aborts, field errors</td><td><code>try / catch / finally</code></td></tr>
          <tr><td>Component</td><td>Skeleton, error, empty, data</td><td>conditional render</td></tr>
          <tr><td>Error boundary</td><td>Unexpected render crashes</td><td><code>errorElement</code> per route</td></tr>
        </tbody>
      </table>

      <h2 className="section">Status codes worth branching on</h2>
      <table className="map">
        <thead><tr><th>Code</th><th>Meaning</th><th>Do</th></tr></thead>
        <tbody>
          <tr><td><code>400</code></td><td>Bad request</td><td>Show the message, do not retry</td></tr>
          <tr><td><code>401</code></td><td>Not authenticated</td><td>Refresh token, then log out</td></tr>
          <tr><td><code>403</code></td><td>Authenticated but not allowed</td><td>Toast / redirect to 403 page</td></tr>
          <tr><td><code>404</code></td><td>Missing resource</td><td>Render a not-found state, not an error</td></tr>
          <tr><td><code>422</code></td><td>Validation failed</td><td>Map <code>fields</code> onto the form inputs</td></tr>
          <tr><td><code>429</code></td><td>Rate limited</td><td>Back off and retry after a delay</td></tr>
          <tr><td><code>5xx</code></td><td>Server error</td><td>Generic message + retry button, log it</td></tr>
        </tbody>
      </table>

      <h2 className="section">The same thing with React Query</h2>
      <p className="para">
        For a real app, reach for TanStack Query. Caching, deduping, retries, background refetch and cancellation come free —
        the hand-rolled hook above is what it replaces.
      </p>
      <Code>{`const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['meals', query],                              // cache key
  queryFn: ({ signal }) => mealsApi.list({ q: query }, signal),
  staleTime: 60_000,                                       // 1 min before refetching
});

const { mutate, isPending } = useMutation({
  mutationFn: mealsApi.create,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meals'] }),
  onError: (e) => toast.error(e.message),
});`}</Code>
    </>
  )
}
