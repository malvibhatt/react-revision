import { Link } from 'react-router-dom'
import Code from '../../components/Code'
import Callout from '../../components/Callout'
import Table from '../../components/Table'

export default function Rerenders() {
  return (
    <>
      <h1 className="lesson-title">Work that happens for no reason</h1>
      <p className="lesson-sub">
        Five findings about renders you are paying for, and why most of the fixes are a
        deletion or a move rather than another <code>useMemo</code>.
      </p>

      <div className="highlight">
        React decides what to re-render by <strong>comparing references</strong>, and four
        of these five are a place where the reference is new but the value is not. The
        profiler will tell you a component rendered nine hundred times. It will not tell you
        which of these it was, and the fixes point in opposite directions.
      </div>

      <h2 className="section" id="one">
        1. The context value rebuilt on every render
      </h2>

      <p className="para">
        TrackWise keeps the signed-in user in a context at the root of the app, because
        every screen needs it and prop-drilling a user through eleven levels is not a
        design. The provider holds the state and hands it down. This is the shape every
        tutorial shows, including the one on{' '}
        <Link to="/context-api">the Context API page</Link>.
      </p>

      <Code kind="bad" caption="features/auth/AuthProvider.tsx">{`export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("checking");

  function login(creds) { /* ... */ }
  function logout() { /* ... */ }

  return (
    <AuthContext.Provider value={{ user, status, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}`}</Code>

      <Callout kind="trap" title="What an object literal costs at the root of the tree">
        <p>
          <strong>First, every consumer re-renders every time, whatever changed.</strong>{' '}
          Context compares the new value to the old one by identity. An object literal is a
          new object on every render, so the comparison never matches and every component
          calling <code>useContext(AuthContext)</code> re-renders — including the ones that
          only read <code>logout</code>, which has not changed since the app started.
        </p>
        <p>
          <strong>Second, this provider wraps the whole app, so "every consumer" means
          every screen.</strong> And it re-renders whenever any of its own state moves,
          including <code>status</code>, which flips twice during a background token
          refresh. A refresh the user never sees re-renders the entire application, twice.
        </p>
        <p>
          <strong>Third, and this is the trap: the obvious fix does nothing.</strong> Faced
          with a slow screen, the next person wraps the expensive children in{' '}
          <code>React.memo</code>. <code>memo</code> compares <em>props</em>, and context is
          not a prop — a context update re-renders every consumer straight through any
          number of memo boundaries. So they end up with memo wrappers across the codebase,
          a comparison cost on every one of them, and the identical render count. The fix has
          to happen at the provider; nothing downstream can help.
        </p>
      </Callout>

      <Callout kind="warn" title="The tell">
        <p>
          <code>value=</code> followed immediately by <code>{'{{'}</code>. It is the most
          reliable one-character tell in React: a brace there is an object literal, and an
          object literal in a provider is a guaranteed miss on every render.
        </p>
      </Callout>

      <Code kind="good" caption="features/auth/AuthProvider.tsx: stabilise the functions first">{`// Memoizing the value while passing freshly-declared functions achieves
// nothing: login and logout would be new references, so the deps change
// every render and the useMemo recomputes every render.
const login = useCallback((creds) => { /* ... */ }, []);
const logout = useCallback(() => { /* ... */ }, []);

const value = useMemo(
  () => ({ user, status, login, logout }),
  [user, status, login, logout],
);`}</Code>

      <p className="para">
        That is correct, and it still re-renders every consumer whenever{' '}
        <code>status</code> changes, including the components that only ever call{' '}
        <code>logout</code>. The second fix is the one that makes the token refresh free.
      </p>

      <Code kind="good" caption="features/auth/AuthProvider.tsx: split by how often it changes">{`// Two contexts, because these two things change at completely different rates.
const AuthStateContext = createContext(null);    // changes twice a session
const AuthActionsContext = createContext(null);  // never changes

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, status: "checking" });

  // Empty deps: setState is stable, so this object is created once for the
  // life of the app and every consumer of it re-renders exactly never.
  const actions = useMemo(() => ({ login, logout }), []);

  return (
    <AuthActionsContext.Provider value={actions}>
      <AuthStateContext.Provider value={state}>{children}</AuthStateContext.Provider>
    </AuthActionsContext.Provider>
  );
}`}</Code>

      <h3 className="sub" id="one-split">
        Two contexts for one concept — isn&apos;t that over-engineering?
      </h3>

      <p className="para">
        It would be, if the split were "state and actions" as a reflex. The thing that earns
        it is a measurable difference in change frequency between two halves of the same
        value, and that is a question with an answer rather than a matter of taste.
      </p>

      <Callout kind="why" title="The question that decides it">
        <p>
          <strong>Do the parts of this value change at the same rate?</strong> A user object
          changes at login and logout. A <code>logout</code> function changes never. A filter
          object changes per keystroke. Where the answer is "no, by an order of magnitude",
          the slow half is being re-rendered at the speed of the fast half, and splitting
          stops that for free.
        </p>
        <p>
          Where everything in the value moves together — a theme context holding a theme name
          and a setter — splitting buys nothing and costs a file. Leave it.
        </p>
      </Callout>

      <h2 className="section" id="two">
        2. The memo that never passes
      </h2>

      <p className="para">
        The transactions list renders eight hundred rows and the search box filters them, so
        the row got wrapped in <code>memo</code>. That is the right call for the right
        reason, and it is the start of the problem rather than the end of it.
      </p>

      <Code kind="bad" caption="features/transactions/TransactionList.tsx">{`const TransactionRow = memo(function TransactionRow({ tx, onDelete, style }) {
  /* ... */
});

{rows.map((tx) => (
  <TransactionRow
    key={tx.id}
    tx={tx}
    onDelete={() => remove(tx.id)}               // new function, every render
    style={{ opacity: tx.pending ? 0.5 : 1 }}    // new object, every render
  />
))}`}</Code>

      <Callout kind="trap" title="Why this is slower than having no memo at all">
        <p>
          <strong>First, the comparison fails on every row, every time.</strong>{' '}
          <code>memo</code> does a shallow compare of props. Two of these four props are
          constructed inline, so they are new references on every parent render and the
          compare never matches. Eight hundred rows re-render on every keystroke in the
          search box, exactly as they did before anyone wrote <code>memo</code>.
        </p>
        <p>
          <strong>Second, you added work to get the same result.</strong> The memo is not
          free: it compares four props on eight hundred rows before deciding to re-render
          all of them anyway. The optimised version does strictly more work than the
          unoptimised one.
        </p>
        <p>
          <strong>Third, and this is what makes it stick around: it reads as
          solved.</strong> The word <code>memo</code> in the source says "somebody thought
          about performance here", so the next person profiling this screen scrolls past it
          and goes looking somewhere else. A broken optimisation is worse than a missing one,
          because a missing one does not misdirect the investigation.
        </p>
      </Callout>

      <Callout kind="warn" title="The tell">
        <p>
          <code>memo(</code> on the component, and a prop in its JSX beginning with{' '}
          <code>{'{{'}</code>, <code>{'{['}</code> or <code>{'{('}</code>. Anything
          constructed in the parent&apos;s render is new each time, and one unstable prop is
          enough to defeat the whole comparison.
        </p>
      </Callout>

      <Code kind="good" caption="features/transactions/TransactionList.tsx">{`// The row already knows its own id, so it can hand it back rather than
// having a closure built for it eight hundred times.
const remove = useCallback((id) => { /* ... */ }, []);

{rows.map((tx) => (
  <TransactionRow key={tx.id} tx={tx} onDelete={remove} />
))}`}</Code>

      <Code kind="good" caption="features/transactions/TransactionRow.tsx">{`const TransactionRow = memo(function TransactionRow({ tx, onDelete }) {
  return (
    <div className={tx.pending ? "tx-row pending" : "tx-row"}>   {/* was an inline style */}
      ...
      <button onClick={() => onDelete(tx.id)}>Delete</button>
    </div>
  );
});`}</Code>

      <Callout kind="note" title="The inline arrow inside the row is fine">
        <p>
          It looks like the same mistake and it is not. That arrow is a prop handed to a{' '}
          <code>{'<button>'}</code>, and DOM elements are not memoized — React attaches the
          handler either way, so a fresh reference costs nothing. The rule is about props
          crossing a <code>memo</code> boundary, not about arrows in JSX generally.
        </p>
      </Callout>

      <Callout kind="good" title="The rule, in one line">
        <p>
          <code>memo</code> is a <strong>contract with the parent</strong>. Every prop has to
          be stable or it is a comparison you pay for and never pass — so if you are not
          prepared to check all of them, delete the memo instead.
        </p>
      </Callout>

      <h2 className="section" id="three">
        3. key={'{i}'} on a list that moves
      </h2>

      <p className="para">
        The transactions list is sortable by date or amount, and each row can be expanded to
        add a note. The rows come out of a <code>.map</code>, React asks for a key, and the
        index is right there in the callback.
      </p>

      <Code kind="bad" caption="features/transactions/TransactionList.tsx">{`{sorted.map((tx, i) => (
  <TransactionRow key={i} tx={tx} />
))}`}</Code>

      <Callout kind="trap" title="The note you were typing is now on a different transaction">
        <p>
          <strong>First, and this is broken today: state follows the position, not the
          row.</strong> Open the note field on the coffee transaction, start typing, then
          sort by amount. React matches old to new by key, so the component at{' '}
          <code>key={'{0}'}</code> is the same component it was a moment ago — it just gets
          different props. The transaction data updates; the open note field, its text and
          its focus do not. Your half-written note is now attached to the rent payment, and
          nothing warned you.
        </p>
        <p>
          <strong>Second, deleting one row disturbs every row below it.</strong> Delete index
          three of ten and keys three through eight all now hold different transactions.
          React reuses those component instances with new props, so the whole tail of the
          list re-renders, and any CSS transition on the rows plays as "the list reshuffled"
          rather than "one row left".
        </p>
        <p>
          <strong>Third, and this is the trap: it silently cancels the previous
          finding.</strong> Prepend one new transaction and every key after it now points at
          a different row, so the memo comparison fails for all of them. You can fix finding
          2 perfectly — stable handlers, no inline objects — and still re-render the entire
          list on every insert, because the keys are shifting underneath it. The two findings
          look unrelated and the second one makes the first one pointless.
        </p>
      </Callout>

      <Callout kind="warn" title="The tell">
        <p>
          <code>key={'{i}'}</code>, <code>key={'{index}'}</code>, or any key computed from
          position. And its louder cousin, <code>key={'{Math.random()}'}</code>, which is
          worse in a way that is easy to miss: a new key every render means React unmounts
          and remounts every row every time, losing state, focus and scroll position, and
          running every effect in the subtree again.
        </p>
      </Callout>

      <Code kind="good" caption="features/transactions/TransactionList.tsx">{`{sorted.map((tx) => (
  <TransactionRow key={tx.id} tx={tx} />
))}`}</Code>

      <h3 className="sub" id="three-when">
        When is the index actually acceptable?
      </h3>

      <p className="para">
        It has a real answer, and the answer is narrower than people hope. The index is safe
        when all three of these hold, and unsafe as soon as one stops.
      </p>

      <Table
        caption="The three conditions, all of which must hold"
        head={['Condition', 'What breaks when it stops holding']}
        rows={[
          [
            'The list is never reordered or sorted',
            'State and DOM stay at the old position while the data moves. The bug above.',
          ],
          [
            'Items are only ever appended, never inserted or removed',
            'Every key after the change point now names a different item, so the whole tail re-renders with mismatched state.',
          ],
          [
            'No item holds state, focus, or an uncontrolled input',
            'There is nothing to attach to the wrong row, so the mismatch has no visible symptom — until someone adds a checkbox.',
          ],
        ]}
      />

      <Callout kind="good" title="Which makes the practical rule shorter than the exception">
        <p>
          A stable id costs you nothing when the conditions hold and saves you a bug when
          they stop. The third condition in particular is not yours to keep: it is broken by
          whoever adds a checkbox to the row next quarter, and they will have no reason to
          look at how the list is keyed.
        </p>
        <p>
          The one thing to avoid is manufacturing an id from the index to satisfy the rule.{' '}
          <code>id: `row-${'$'}{'{i}'}`</code> is the index wearing a disguise and behaves
          identically.
        </p>
      </Callout>

      <h2 className="section" id="four">
        4. useMemo on things cheaper than the memo
      </h2>

      <p className="para">
        Someone says "this page is slow, it needs memoizing" in review. The advice is
        well-meant, it is occasionally right, and applied uniformly it produces this.
      </p>

      <Code kind="bad" caption="features/dashboard/Summary.tsx">{`const net = useMemo(() => income - expenses, [income, expenses]);
const label = useMemo(() => \`\${count} transactions\`, [count]);
const isOver = useMemo(() => net > budget, [net, budget]);
const style = useMemo(() => ({ color: isOver ? "red" : "green" }), [isOver]);`}</Code>

      <Callout kind="trap" title="Three of those four are a net loss">
        <p>
          <strong>First, the memo costs more than the work it skips.</strong> Each{' '}
          <code>useMemo</code> allocates a dependency array on every render, runs{' '}
          <code>Object.is</code> over each entry, and holds the previous result alive.
          Comparing two numbers to avoid subtracting two numbers is strictly more work than
          subtracting them, every single render, forever.
        </p>
        <p>
          <strong>Second, it destroys the signal.</strong> When everything in a file is
          memoized, the one <code>useMemo</code> that was added against a real measurement is
          indistinguishable from the three that were added out of habit. A reviewer can no
          longer tell which of them is load-bearing, so none of them can safely be removed.
        </p>
        <p>
          <strong>Third, and this is the one that actually hurts: you have given a correct
          expression a way to be wrong.</strong> Dependency arrays are hand-maintained. Miss
          one and the memo returns the previous render&apos;s value indefinitely, with no
          error and no warning — the number on screen is simply from a while ago. You took
          something that could not be stale and made staleness possible, in exchange for
          skipping a subtraction.
        </p>
      </Callout>

      <Code kind="good" caption="features/dashboard/Summary.tsx: delete three, keep one">{`const net = income - expenses;
const label = \`\${count} transactions\`;
const isOver = net > budget;

// This one stays, and not because it is expensive — it is an object literal
// handed to a memoized child, so its identity is what keeps that memo passing.
const style = useMemo(() => ({ color: isOver ? "red" : "green" }), [isOver]);`}</Code>

      <Code kind="good" caption="features/transactions/TransactionList.tsx: and this is the case that pays">{`// 4,000 rows, sorted and grouped, on a component that re-renders on every
// keystroke in the search box. Measured at 60ms in the profiler before,
// 0ms on the renders where rows has not changed.
const grouped = useMemo(() => groupByMonth(sortByDate(rows)), [rows]);`}</Code>

      <Callout kind="good" title="The rule, in one line">
        <p>
          <code>useMemo</code> earns its place for exactly two reasons:{' '}
          <strong>you measured the work, or you need the identity</strong> to keep a
          memoized child&apos;s props stable. Anything else is a cache for a value cheaper
          than the cache.
        </p>
      </Callout>

      <h2 className="section" id="five">
        5. State living higher than anything that reads it
      </h2>

      <p className="para">
        The search box sits at the top of the transactions screen and the list below it needs
        the query, so the state goes in their nearest common parent. That is the standard
        advice, it is usually right, and here it is one level too high.
      </p>

      <Code kind="bad" caption="features/transactions/TransactionsScreen.tsx">{`export function TransactionsScreen() {
  const [query, setQuery] = useState("");

  return (
    <>
      <ScreenHeader />                      {/* re-renders on every keystroke */}
      <MonthlySummary />                    {/* re-renders on every keystroke */}
      <SearchInput value={query} onChange={setQuery} />
      <TransactionList query={query} />
      <ExportPanel />                       {/* re-renders on every keystroke */}
    </>
  );
}`}</Code>

      <Callout kind="trap" title="Three components that have never heard of the search box">
        <p>
          <strong>First, typing one character renders the entire screen.</strong>{' '}
          <code>ScreenHeader</code>, <code>MonthlySummary</code> and{' '}
          <code>ExportPanel</code> do not receive <code>query</code>, do not read it, and
          re-render anyway, because their parent re-rendered. <code>MonthlySummary</code>{' '}
          draws a chart.
        </p>
        <p>
          <strong>Second, the standard fix is a permanent tax.</strong> Wrapping all three in{' '}
          <code>memo</code> works, and it costs three wrappers, three shallow comparisons per
          keystroke, and three more components whose props must now stay stable forever —
          which is finding 2 waiting to happen, three times over.
        </p>
        <p>
          <strong>Third, and this is the trap: the renders are the small
          half.</strong>{' '}
          <code>query</code> is now a screen-level concern, so the screen is where the next
          search-related thing goes. Someone adds <code>onClearSearch</code> here, then a{' '}
          <code>highlightMatches</code> flag, then passes both down through two components
          that do not care. In six months the screen component owns the search feature and
          nothing can be moved. The re-renders were a symptom; the widening is the cost.
        </p>
      </Callout>

      <Callout kind="warn" title="The tell">
        <p>
          A <code>useState</code> in a component where <strong>most of the children do not
          read it</strong>. Count the JSX elements between the state and its last reader: if
          there are siblings outside that span, the state is higher than it needs to be.
        </p>
      </Callout>

      <Code kind="good" caption="features/transactions/SearchableTransactions.tsx">{`// The smallest component that contains everything reading the query.
// Keystrokes now re-render exactly these two children and nothing else.
function SearchableTransactions() {
  const [query, setQuery] = useState("");
  return (
    <>
      <SearchInput value={query} onChange={setQuery} />
      <TransactionList query={query} />
    </>
  );
}`}</Code>

      <Code kind="good" caption="When it genuinely cannot move down: hand the subtree in as children">{`// The chart is created by the screen and passed through as a prop, so
// SearchProvider re-rendering does not re-create it. Same elements, same
// identity, no memo involved.
export function TransactionsScreen() {
  return (
    <SearchProvider>
      <MonthlySummary />
    </SearchProvider>
  );
}`}</Code>

      <Callout kind="good" title="The rule, in one line">
        <p>
          State belongs in the <strong>smallest component that contains everything reading
          it</strong>. <code>memo</code> is what you reach for after you have checked that it
          cannot move, not instead of checking.
        </p>
      </Callout>

      <h2 className="section" id="tells">
        The tells, in one table
      </h2>

      <Table
        caption="What to look for, and which direction the fix goes"
        head={['If you see this', 'The problem', 'What it should be']}
        rows={[
          [
            'value={{ … }} on a context provider',
            'A new object every render, so every consumer re-renders regardless of what changed. memo on the children cannot help: context bypasses it.',
            'useMemo the value, with the functions inside it stabilised first. Split the context when two halves change at different rates.',
          ],
          [
            'memo() with an inline object, array or arrow prop',
            'The comparison fails every time, so you pay for the compare and re-render anyway. It also reads as solved and misdirects the next profile.',
            'useCallback the handler, move inline styles to a class. One unstable prop defeats the whole memo.',
          ],
          [
            'key={i} on a list that sorts, filters or deletes',
            'State, focus and uncontrolled inputs stay at the index while the data moves. It also shifts every key after an insert, defeating any memo on the row.',
            'A stable id from the data. Index keys are safe only for an append-only list of stateless items.',
          ],
          [
            'useMemo around an expression you can read at a glance',
            'More work than it saves, no signal left about which memo was measured, and a hand-maintained dependency array that can now go stale.',
            'Delete it. Keep useMemo for measured work, or for identity a memoized child depends on.',
          ],
          [
            'useState whose siblings mostly ignore it',
            'Every keystroke re-renders components that never read the value, and the state widens into a screen-level concern that cannot be moved later.',
            'Move it down to the smallest component spanning its readers, or pass the expensive subtree in as children.',
          ],
        ]}
      />

      <h3 className="sub" id="common">
        What these five have in common
      </h3>

      <p className="para">
        Four of them are <strong>identity</strong>. React has no way to know whether{' '}
        <code>{'{ color: "red" }'}</code> is the same object as the{' '}
        <code>{'{ color: "red" }'}</code> from the last render, so it asks the only question
        it can — is this the same reference? — and in a context value, an inline prop, a
        shifting key and a dependency array, the answer is no while the value is unchanged.
      </p>

      <p className="para">
        Which points at the thing worth taking away, because it runs against the instinct.
        When a page is slow the reflex is to <em>add</em> something: a memo, a useMemo, a
        useCallback. Three of these five are fixed by removing a value, moving a value, or
        not creating one in a render at all, and in two of the five the added memoization was
        itself the thing making the page slower. Reach for the profiler before the wrapper —{' '}
        <Link to="/review/effects-and-leaks">Effects &amp; leaks</Link> has the version of
        this where the extra renders are being caused by an effect that should not exist.
      </p>
    </>
  )
}
