import { Link } from 'react-router-dom'
import Code from '../../components/Code'
import Callout from '../../components/Callout'
import Table from '../../components/Table'

export default function StateCorrectness() {
  return (
    <>
      <h1 className="lesson-title">State that is wrong, not just slow</h1>
      <p className="lesson-sub">
        Five findings that survive review because the code reads correctly: stale values,
        duplicated truth, and failures that render as something other than failure.
      </p>

      <div className="highlight">
        Nothing on this page is a performance problem. Every one of these ships{' '}
        <strong>incorrect data to a user who has no way to know</strong>, and four of the
        five do it without logging anything, throwing anything, or failing a test that
        anybody thought to write.
      </div>

      <h2 className="section" id="one">
        1. Mutation, and the bug that appears two clicks later
      </h2>

      <p className="para">
        You have the array and you want one more item in it. <code>push</code> is the verb
        for that in every other context, and then you hand the array to the setter because
        that is how state is updated. Both halves are reasonable; together they do nothing.
      </p>

      <Code kind="bad" caption="features/transactions/useTransactions.ts">{`function addTransaction(tx) {
  transactions.push(tx);
  setTransactions(transactions);
}`}</Code>

      <Callout kind="trap" title="Why this is worse than simply not working">
        <p>
          <strong>First, nothing happens — and then something happens.</strong> The setter
          receives the reference it already has, so React bails out and does not re-render.
          The transaction is in the array and not on the screen. It appears later, when
          something <em>unrelated</em> triggers a render: a resize, a route change, another
          click. So the report is "sometimes I have to click Add twice" or "it shows up when
          I switch tabs", and neither of those sounds anything like a mutation bug. You can
          lose an afternoon to this.
        </p>
        <p>
          <strong>Second, memoizing the list makes it permanent.</strong> If the row list is
          wrapped in <code>memo</code> — which it should be, per{' '}
          <Link to="/review/rerenders">Re-renders</Link> — then even the accidental later
          render will not show the new row, because the prop reference still has not changed.
          The intermittent bug becomes a reproducible one at the moment somebody fixes a
          performance problem, which is not where anyone will look.
        </p>
        <p>
          <strong>Third, and this is the one that catches experienced people:{' '}
          <code>.sort()</code> mutates.</strong> So does <code>.reverse()</code>. A
          component that does <code>rows.sort(byDate)</code> while rendering is reordering
          the state array itself as a side effect of drawing the screen, and the order you
          end up with depends on how many times the component happened to render. That is as
          close to non-deterministic as a React app gets, and the line looks completely
          innocent.
        </p>
      </Callout>

      <Callout kind="warn" title="The tell">
        <p>
          Any of <code>push</code>, <code>pop</code>, <code>shift</code>,{' '}
          <code>splice</code>, <code>sort</code>, <code>reverse</code>, or an assignment to{' '}
          <code>something.field</code> where <code>something</code> came out of{' '}
          <code>useState</code>. The first four are obvious once you know; the middle two
          are the ones that get through review, because they do not look like writes.
        </p>
      </Callout>

      <Code kind="good" caption="features/transactions/useTransactions.ts">{`setTransactions((prev) => [...prev, tx]);
setTransactions((prev) => prev.filter((t) => t.id !== id));
setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, note } : t)));`}</Code>

      <Code kind="good" caption="And when you need a sorted view">{`// Copy first. .sort() has no non-mutating form, so [...rows] is not
// defensive style, it is the only correct way to call it on state.
const sorted = [...rows].sort(byDate);

// toSorted() does this natively, where your browser targets allow it.
const sorted = rows.toSorted(byDate);`}</Code>

      <Callout kind="good" title="The rule, in one line">
        <p>
          React compares <strong>references</strong>. A changed value means a new object at{' '}
          <em>every level you changed</em> — a spread copies one level, so{' '}
          <code>{'{ ...tx, splits: [...tx.splits, s] }'}</code> needs both halves spelled
          out.
        </p>
      </Callout>

      <h2 className="section" id="two">
        2. The autosave that saves an empty string forever
      </h2>

      <p className="para">
        TW-55 autosaves the note field every five seconds while the detail panel is open.
        Note that the cleanup is present and correct here — this is deliberately not the
        finding from <Link to="/review/effects-and-leaks">Effects &amp; leaks</Link>, and
        that page&apos;s tell does not fire on it.
      </p>

      <Code kind="bad" caption="features/transactions/NoteField.tsx">{`export function NoteField({ txId }) {
  const [note, setNote] = useState("");

  useEffect(() => {
    const id = setInterval(() => {
      saveNote(txId, note);          // note is "" on every single tick
    }, 5000);
    return () => clearInterval(id);  // cleanup is here and is correct
  }, []);

  return <textarea value={note} onChange={(e) => setNote(e.target.value)} />;
}`}</Code>

      <Callout kind="trap" title="Autosave that destroys data, and the fix that makes it worse">
        <p>
          <strong>First, it is actively deleting the user&apos;s work.</strong> The effect ran
          once, so the arrow inside it closed over <code>note</code> while it was{' '}
          <code>""</code> and keeps that copy for as long as the panel is open. Every five
          seconds it writes an empty string over whatever was saved. This is not "autosave
          does not work" — it is autosave as a data-loss feature, firing on a timer, and it
          is wrong from the first tick.
        </p>
        <p>
          <strong>Second, the dependency lint catches it and recommends a second
          bug.</strong> The suggested fix is <code>[note, txId]</code>. Add it and the effect
          now tears down and recreates the interval on every keystroke, so the five-second
          timer restarts with every character — and the save never fires at all until the
          user stops typing for a full five seconds. The dependencies are now correct and the
          feature is still broken, which is the worst place to stop.
        </p>
        <p>
          <strong>Third, and this is the trap worth internalising: you are asking a question
          the dependency array cannot answer.</strong> A dependency array says{' '}
          <em>re-run this when the value changes</em>. What an autosave wants is{' '}
          <em>read the current value at the moment I fire</em>. Those are different
          questions, and <code>useEffect</code> only has syntax for the first one — which is
          why no amount of adjusting the deps produces the right behaviour.
        </p>
      </Callout>

      <Callout kind="warn" title="The tell">
        <p>
          A <strong>long-lived callback</strong> — an interval, an event listener, a
          subscription, a debounced function — that reads state or props. Ask one question
          about it: <strong>which render&apos;s value does this see?</strong> If the callback
          was created once and the value changes, the answer is "the first one".
        </p>
      </Callout>

      <Code kind="good" caption="features/transactions/NoteField.tsx">{`const noteRef = useRef(note);
noteRef.current = note;          // refreshed on every render, cheaply

useEffect(() => {
  const id = setInterval(() => {
    saveNote(txId, noteRef.current);   // the value now, not the value then
  }, 5000);
  return () => clearInterval(id);
}, [txId]);                            // restarts only when the transaction changes`}</Code>

      <Callout kind="note" title="The same trick, built in">
        <p>
          <code>setNote((prev) =&gt; …)</code> is this pattern provided by React: the updater
          form exists precisely because a callback created in an earlier render cannot see the
          current state. Use the updater when you only need the state{' '}
          <em>to compute the next state</em>, and a ref when you need to read it for
          something else — a save, a log, a measurement.
        </p>
      </Callout>

      <Callout kind="good" title="The rule, in one line">
        <p>
          A dependency array answers <strong>"when should this re-run?"</strong>. A ref
          answers <strong>"what is the value now?"</strong>. A callback that outlives the
          render that made it almost always wants the second.
        </p>
      </Callout>

      <h2 className="section" id="three">
        3. Server data copied into component state
      </h2>

      <p className="para">
        Fetch on mount, keep it in state. It is the first data-fetching pattern anybody
        learns, it is what{' '}
        <Link to="/async-data">the async data page</Link> shows, and for one screen reading
        one thing it is completely fine. It stops being fine at the second reader, and
        nothing announces the transition.
      </p>

      <Code kind="bad" caption="Two features, two copies of the same server data">{`// features/transactions/TransactionsScreen.tsx
const [rows, setRows] = useState([]);
useEffect(() => { readTransactions({ month }).then(setRows); }, [month]);

// features/dashboard/Totals.tsx
const [totals, setTotals] = useState(null);
useEffect(() => { readTotals({ month }).then(setTotals); }, [month]);`}</Code>

      <Callout kind="trap" title="Two copies of one truth, and no owner for either">
        <p>
          <strong>First, a write updates one of them.</strong> Add a transaction from the
          transactions screen and the list updates immediately. The dashboard totals do not,
          because they are a separate fetch in a component that is not currently mounted.
          Whether the dashboard is right when you navigate to it depends entirely on whether
          it unmounted and refetched — which depends on your router configuration. That is
          why this reproduces for one person and not another.
        </p>
        <p>
          <strong>Second, every write grows a notification problem.</strong> Each mutation
          now has to tell every other copy, and the usual answer is an event bus — which is
          exactly the bus whose subscription leak is finding 3 on{' '}
          <Link to="/review/effects-and-leaks">Effects &amp; leaks</Link>. That leak is not
          an unrelated mistake; it is the cost of having no owner for server state, paid in a
          different file.
        </p>
        <p>
          <strong>Third, and in this app this is the serious one: nothing knows how old the
          data is.</strong> There is no fetch timestamp, no stale marker and no refetch when
          the window regains focus. A user who opened the tab this morning and comes back
          after lunch is looking at this morning&apos;s balances, presented identically to
          live ones. In a finance app that is not a polish issue — it is somebody deciding
          whether they can afford something, using numbers that are eight hours old, with
          nothing on screen to suggest they might be.
        </p>
      </Callout>

      <Callout kind="warn" title="The tell">
        <p>
          <code>useState</code> holding something that <strong>came from the server</strong>,
          in more than one component. One is a pattern. Two is a cache with no invalidation
          strategy, and the second one is the moment to change approach — not the sixth.
        </p>
      </Callout>

      <Code kind="good" caption="One owner, with invalidation as an explicit act">{`// Reads are keyed and shared: both features asking for the same key get the
// same data, one request, one copy.
const { data: rows, status } = useQuery({
  queryKey: ["transactions", month],
  queryFn: ({ signal }) => readTransactions({ month, signal }),
});

// A write says what it invalidated. Every reader of that key refetches,
// including the dashboard, including the ones not currently mounted.
const addTransaction = useMutation({
  mutationFn: createTransaction,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
});`}</Code>

      <h3 className="sub" id="three-library">
        Is a data library really warranted for this?
      </h3>

      <p className="para">
        It is a fair question and the answer is genuinely "not always". What settles it is
        not the size of the app but whether server state has more than one reader.
      </p>

      <Table
        caption="When state plus an effect is the right answer"
        head={['Situation', 'What to do']}
        rows={[
          [
            'One component reads it, no writes',
            'useState and an effect. Add the AbortController from Effects & leaks and you are done — a library would be ceremony.',
          ],
          [
            'A second component needs the same data',
            'Change approach now. This is the moment the copies can disagree, and it is much cheaper to fix here than after four more readers.',
          ],
          [
            'Writes that other screens must reflect',
            'A keyed cache with explicit invalidation. Either a library, or one module that owns the data and the subscription.',
          ],
          [
            '"We will just add an event bus"',
            'You have chosen to write the library, one incident at a time. Caching, deduping concurrent requests, invalidation, refetch on focus and retry are what you are signing up to build.',
          ],
        ]}
      />

      <Callout kind="good" title="The rule, in one line">
        <p>
          Server data is a <strong>cache, not state</strong>. The question is never whether
          to cache it — you already are — but whether anything in the app is responsible for
          saying when the copy is wrong.
        </p>
      </Callout>

      <h2 className="section" id="four">
        4. Six booleans describing four situations
      </h2>

      <p className="para">
        Each flag was added for a real reason, by someone fixing a real bug, one at a time.
        Nobody wrote this in one sitting, and that is exactly why it is worth looking at: it
        is what a component becomes after four months of correct individual decisions.
      </p>

      <Code kind="bad" caption="features/transactions/TransactionsScreen.tsx">{`const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [rows, setRows] = useState([]);
const [submitting, setSubmitting] = useState(false);
const [submitError, setSubmitError] = useState(null);
const [success, setSuccess] = useState(false);`}</Code>

      <Callout kind="trap" title="Sixty-four combinations, four of which mean anything">
        <p>
          <strong>First, every impossible state is reachable.</strong>{' '}
          <code>loading</code> and <code>error</code> both true. <code>success</code> and{' '}
          <code>submitError</code> both true. Six booleans describe sixty-four states and the
          screen has about four, so sixty of them are nonsense that the code can still
          produce — and the JSX fills up with defensive conditions guarding against
          situations that should not have been expressible.
        </p>
        <p>
          <strong>Second, the transitions live at the call sites.</strong> Starting a request
          means setting <code>loading</code> true <em>and</em> clearing <code>error</code>,
          as two separate statements, in every place a request starts. Miss the second one in
          the retry handler and the retry renders the previous error above the fresh results.
          There is no single place that says what "start loading" means, so it means whatever
          each handler remembered.
        </p>
        <p>
          <strong>Third, and this is the trap: the empty state has become
          undecidable.</strong> <code>rows.length === 0</code> with no error and nothing
          loading means either "the server said you have none" or "we have not asked yet" —
          and those need two completely different screens. The information needed to tell
          them apart was never stored, so whatever the component renders here is a guess.
          That guess is the next finding.
        </p>
      </Callout>

      <Callout kind="warn" title="The tell">
        <p>
          <strong>Two booleans that can never both be true.</strong> If{' '}
          <code>loading</code> and <code>error</code> are mutually exclusive, they were
          always one value with a name — and the fact that the code can set both is a
          statement about the code, not about the screen.
        </p>
      </Callout>

      <Code kind="good" caption="features/transactions/types.ts">{`// Four states, exactly. The compiler now refuses to build a component that
// reads rows while the request is still in flight, because in that state
// there is no rows field to read.
type ListState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; rows: Transaction[] };`}</Code>

      <Code kind="good" caption="And the transitions become one statement each">{`const [state, setState] = useState<ListState>({ status: "idle" });

// "Start loading" is now a single assignment that cannot forget to clear
// the error, because the error does not exist in this state.
setState({ status: "loading" });
setState({ status: "error", message: toMessage(err) });
setState({ status: "ok", rows });`}</Code>

      <Callout kind="good" title="The rule, in one line">
        <p>
          <strong>Make the impossible states unrepresentable</strong> and the defensive
          guards disappear on their own — they were never logic, only insurance against a
          state space larger than the screen.
        </p>
      </Callout>

      <h2 className="section" id="five">
        5. The server error that tells the user their data is gone
      </h2>

      <p className="para">
        Three states are rendered: loading, empty, and the list. Each branch is correct in
        isolation, the empty state is friendly and well-written, and the whole thing passes
        review in about four seconds because there is visibly nothing wrong with it.
      </p>

      <Code kind="bad" caption="features/transactions/TransactionsScreen.tsx">{`if (loading) return <Spinner />;

return rows.length === 0
  ? <EmptyState message="No transactions yet. Add your first one!" />
  : <List rows={rows} />;`}</Code>

      <Callout kind="trap" title="What a 500 renders, and what it stops you from knowing">
        <p>
          <strong>First, a failed request renders that cheerful message.</strong> The{' '}
          <code>catch</code> set <code>loading</code> to false and left <code>rows</code> as{' '}
          <code>[]</code>, so a server error produces "No transactions yet. Add your first
          one!" — which to somebody with four years of history in this app reads as{' '}
          <em>my financial records have been deleted</em>. It is the single worst sentence
          this screen could say, and it is reserved for the one path nobody clicked through.
        </p>
        <p>
          <strong>Second, there is no way out of it.</strong> No error text, no retry, no
          indication anything failed. The only available action is a hard refresh, which the
          user will try, and if the API is still down they get the identical message a second
          time — which confirms the conclusion they had already drawn.
        </p>
        <p>
          <strong>Third, and this is the trap: it hides the incident from you as
          well.</strong> Nothing threw, so no error boundary caught anything, no handler
          logged anything, and no monitoring event was raised — the failure was converted
          into a state change and discarded. The API&apos;s own metrics show a spike of 500s,
          and the frontend cannot tell you whether one user saw it or every user did. You
          lose the ability to size your own outage.
        </p>
      </Callout>

      <Callout kind="warn" title="The tell">
        <p>
          A component that renders <strong>three</strong> states. Every read has four
          outcomes — pending, failed, succeeded-and-empty, succeeded-with-data — so a
          component with three branches has quietly merged two of them, and the merged pair is
          almost always "failed" and "empty".
        </p>
      </Callout>

      <Code kind="good" caption="features/transactions/TransactionsScreen.tsx">{`// Built on the ListState from finding 4, so "failed" and "empty" are
// different values and not the same absence of data.
switch (state.status) {
  case "idle":
  case "loading":
    return <ListSkeleton />;
  case "error":
    return <ErrorState message={state.message} onRetry={refetch} />;
  case "ok":
    return state.rows.length === 0
      ? <EmptyState message="No transactions yet. Add your first one!" />
      : <List rows={state.rows} />;
}`}</Code>

      <Code kind="good" caption="data/transactions.ts: and the failure is still reported">{`catch (err) {
  reportError(err, { call: "readTransactions", month });   // monitoring still hears
  throw toAppError(err);                                   // the caller still decides
}`}</Code>

      <Callout kind="note" title="And an error boundary for the ones status cannot hold">
        <p>
          A <code>status</code> field covers failures you caught. It does nothing for a
          render-time throw — a null dereference on a field the API stopped sending — which
          without a boundary unmounts the entire tree and leaves a white page. One boundary
          per route, rendering the same <code>ErrorState</code>, is the floor.
        </p>
      </Callout>

      <Callout kind="good" title="The rule, in one line">
        <p>
          Every read has <strong>four</strong> outcomes. If a component renders three of
          them, one of its branches is telling the user something untrue — and it is usually
          the friendly one.
        </p>
      </Callout>

      <h2 className="section" id="tells">
        The tells, in one table
      </h2>

      <Table
        caption="What to look for, and what the user sees when it is wrong"
        head={['If you see this', 'The problem', 'What it should be']}
        rows={[
          [
            'push, splice, sort, reverse, or a field assignment on state',
            'The reference is unchanged so React skips the render; the change surfaces later on an unrelated render, or never once the list is memoized. .sort() also reorders state during render.',
            'An updater that returns a new value, spread at every level you changed. Copy before sorting.',
          ],
          [
            'A long-lived callback reading state or props',
            'It sees the value from the render that created it, forever. Adding the dep restarts the timer on every keystroke, so correct dependencies produce a second bug.',
            'A ref for "the value now", the updater form for "the next value from the last". Deps answer a different question.',
          ],
          [
            'Server data in useState, in more than one component',
            'Two caches with no owner: a write updates one, the other goes stale, and whether it is right depends on the router. Nothing records how old either copy is.',
            'One keyed cache with explicit invalidation. The second reader is the signal to switch, not the sixth.',
          ],
          [
            'Several booleans that can never all be true',
            'Sixty-four representable states for a screen with four, transitions spread across call sites, and no way to distinguish "empty" from "not asked yet".',
            'One discriminated union. Impossible states stop compiling and the defensive guards become unnecessary.',
          ],
          [
            'A component rendering loading, empty and data',
            'A failure renders as emptiness: in a finance app, a 500 that reads as data loss, with no retry and no monitoring event raised.',
            'Four branches: pending, error with a retry, empty, data. Report the error on the way through, and keep an error boundary for render-time throws.',
          ],
        ]}
      />

      <h3 className="sub" id="common">
        What these five have in common
      </h3>

      <p className="para">
        Every one is a <strong>representation</strong> problem rather than a logic one. The
        same truth stored twice, in findings 1 and 3. A value read from the wrong render, in
        finding 2. A state space several times larger than the situation it describes, in
        findings 4 and 5. In no case is the code doing the wrong thing with the data it has;
        in every case the shape of the data made the wrong thing expressible, and then
        somebody expressed it.
      </p>

      <p className="para">
        Which is why this page is the one where TypeScript actually helps. It cannot tell you
        that an interval is leaking or that a bundle is too large, but a discriminated union
        makes finding 4 a compile error and finding 5 a non-exhaustive switch. For the other
        three the only defence is the tells: a mutating method, a callback that outlives its
        render, and the second component to put the same server data in{' '}
        <code>useState</code>. None of those is subtle once you are looking for it, and none
        of them looks like anything at all when you are not — which the{' '}
        <Link to="/review">overview</Link> argues is true of every finding in this section,
        and is the reason they are written down rather than remembered.
      </p>
    </>
  )
}
