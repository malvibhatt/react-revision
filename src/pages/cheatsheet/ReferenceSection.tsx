import Code from '../../components/Code'

const DECISIONS = [
  ['Hold a simple value that renders', 'useState'],
  ['Hold complex or related state, many transitions', 'useReducer'],
  ['Talk to something outside React (timers, listeners, fetch)', 'useEffect + cleanup'],
  ['Measure the DOM before paint', 'useLayoutEffect'],
  ['Share a value deep in the tree', 'useContext'],
  ['Keep a value across renders WITHOUT re-rendering', 'useRef'],
  ['Access a DOM node', 'useRef + ref'],
  ['Skip an expensive recalculation', 'useMemo'],
  ['Keep a callback stable for a memoized child', 'useCallback'],
  ['Stop a heavy update from freezing input', 'useTransition / useDeferredValue'],
  ['Unique ids for labels and aria', 'useId'],
  ['Expose imperative methods from a child', 'useImperativeHandle + forwardRef'],
  ['Subscribe to an external or browser store', 'useSyncExternalStore'],
  ['Read a promise during render', 'use + <Suspense>'],
  ['Track form submission state', 'useActionState / useFormStatus'],
  ['Show a result before the server confirms', 'useOptimistic'],
  ['Cache server data, retry, refetch', 'React Query (not a built-in)'],
]

const CHECKLIST = [
  'Every effect that subscribes also unsubscribes',
  'Every fetch inside an effect is abortable',
  'Keys are stable ids, not array indexes',
  'Loading, error, empty and success all render something',
  'No state mutation — new references everywhere',
  'Context provider value is memoized',
  'Async setState uses the updater form',
  'finally resets submitting on both success and failure',
  'The route is code-split and behind the right guard',
  'Permissions are enforced on the server too',
]

export default function ReferenceSection() {
  return (
    <>
      <h2 className="section">I need to… → use</h2>
      <table className="map">
        <thead><tr><th>I need to…</th><th>Use</th></tr></thead>
        <tbody>
          {DECISIONS.map(([need, use]) => (
            <tr key={need}><td>{need}</td><td><code>{use}</code></td></tr>
          ))}
        </tbody>
      </table>

      <h2 className="section">Custom hooks worth owning</h2>
      <p className="para">Every app ends up needing these. Write them once in <code>src/hooks/</code>.</p>

      <p className="hook-extra-label">useDebounce — delay expensive work (search, autosave)</p>
      <Code>{`export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);   // cancel the previous timer on every keystroke
  }, [value, delay]);

  return debounced;
}`}</Code>

      <p className="hook-extra-label">useLocalStorage — state that survives a refresh</p>
      <Code>{`export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch { return initial; }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}`}</Code>

      <p className="hook-extra-label">useToggle — modals, drawers, accordions</p>
      <Code>{`export const useToggle = (init = false) => {
  const [on, setOn] = useState(init);
  return [on, useCallback(() => setOn(v => !v), [])] as const;
};`}</Code>

      <p className="hook-extra-label">useClickOutside — close dropdowns and popovers</p>
      <Code>{`export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T>,
  onOutside: () => void,
) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onOutside]);
}`}</Code>

      <p className="hook-extra-label">usePrevious — compare against the last render</p>
      <Code>{`export function usePrevious<T>(value: T) {
  const ref = useRef<T>(undefined);
  useEffect(() => { ref.current = value; }, [value]);
  return ref.current;
}`}</Code>

      <h2 className="section">Before you ship a component</h2>
      <ul className="checklist">
        {CHECKLIST.map((c) => <li key={c}>{c}</li>)}
      </ul>
    </>
  )
}
