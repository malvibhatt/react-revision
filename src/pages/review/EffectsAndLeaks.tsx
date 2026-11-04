import { Link } from 'react-router-dom'
import Code from '../../components/Code'
import Callout from '../../components/Callout'
import Table from '../../components/Table'

export default function EffectsAndLeaks() {
  return (
    <>
      <h1 className="lesson-title">The effect that never cleaned up</h1>
      <p className="lesson-sub">
        Five findings about <code>useEffect</code>, each shown as the code that causes it,
        what it costs you later, and the version that avoids it.
      </p>

      <div className="highlight">
        Four of these five are the same missing line. <strong>useEffect hands you a setup
        half and a teardown half</strong>, and the setup half is the one you need in order
        to see the feature work. So the teardown gets written later, which in practice means
        never, because the thing it prevents does not happen while you are looking.
      </div>

      <h2 className="section" id="one">
        1. The interval nobody stopped
      </h2>

      <p className="para">
        TW-18 wants the dashboard to show how long ago the data was synced, counting up
        live. A ticking number needs a timer, a timer belongs in an effect, and the effect
        should run once on mount. Three correct instincts, in order.
      </p>

      <Code kind="bad" caption="features/dashboard/SyncStatus.tsx">{`export function SyncStatus({ lastSync }) {
  const [ago, setAgo] = useState(0);

  useEffect(() => {
    setInterval(() => {
      setAgo(ago + 1);
    }, 1000);
  }, []);

  return <p>Last synced {ago}s ago</p>;
}`}</Code>

      <Callout kind="trap" title="Three things, and the first one is already wrong">
        <p>
          <strong>First, the number is stuck at 1.</strong> The effect runs once, so the
          arrow inside it captures <code>ago</code> while it is still <code>0</code> and
          keeps that copy forever. Every second it computes <code>0 + 1</code> and sets the
          state to <code>1</code> again. The timer is working perfectly; the display never
          moves past one second. This is not a future cost — it is wrong on the first render,
          and it is the kind of wrong that gets reported as "the sync status is a bit flaky".
        </p>
        <p>
          <strong>Second, nothing ever stops it.</strong> Navigate to the transactions screen
          and the component unmounts, but the interval does not: it is registered with the
          browser, not with React. Come back and a second one starts. Ten visits to the
          dashboard in a session leaves ten timers firing every second for as long as the tab
          is open, and React 18 removed the "setState on an unmounted component" warning, so
          not one of them says a word.
        </p>
        <p>
          <strong>Third, and this is the one that bites: the timer outlives the
          session.</strong> The moment that callback does anything more than set state —
          refetch the totals, ping analytics, touch a chart instance — it keeps doing it
          after the user has logged out, because logging out unmounts a tree and unmounting
          a tree does nothing to a timer. You get authenticated calls firing on behalf of a
          screen nobody is looking at, with a token the app has already decided to discard.
        </p>
      </Callout>

      <Callout kind="warn" title="The tell">
        <p>
          An effect whose body <strong>creates</strong> something — a timer, a listener, an
          observer, a subscription, a socket — and whose arrow returns nothing. You do not
          need to know what the thing is. If the effect made it and the effect returns no
          function, nobody is going to take it away.
        </p>
      </Callout>

      <Code kind="good" caption="features/dashboard/SyncStatus.tsx: the two missing pieces">{`useEffect(() => {
  const id = setInterval(() => {
    setAgo((prev) => prev + 1);    // reads the current value, not the captured one
  }, 1000);
  return () => clearInterval(id);  // and now it stops
}, []);`}</Code>

      <p className="para">
        That is the finding fixed. It is still not the code to ship, because counting seconds
        is the wrong mechanism for measuring elapsed time.
      </p>

      <Code kind="good" caption="features/dashboard/SyncStatus.tsx: what TW-18 actually asked for">{`// Browsers throttle timers in background tabs to once a minute or less, so a
// counter that adds 1 per tick drifts badly the moment you switch away. Read
// the clock instead, and a missed tick costs nothing.
const [now, setNow] = useState(() => Date.now());

useEffect(() => {
  const id = setInterval(() => setNow(Date.now()), 1000);
  return () => clearInterval(id);
}, []);

const ago = Math.floor((now - lastSync) / 1000);`}</Code>

      <Callout kind="good" title="The rule, in one line">
        <p>
          An effect that <strong>creates</strong> something returns the function that
          destroys it. If the body has no <code>return</code>, read it again and check that
          it made nothing.
        </p>
      </Callout>

      <h3 className="sub" id="one-strict">
        Isn&apos;t the StrictMode double-mount the real problem here?
      </h3>

      <p className="para">
        This is the usual objection, normally phrased as "it only breaks in development". It
        is worth answering properly, because the conclusion people draw from it is backwards.
      </p>

      <Callout kind="why" title="The double-mount is the detector, not the defect">
        <p>
          In development, StrictMode mounts, unmounts and remounts every component, so an
          effect with no cleanup leaves exactly one orphan behind on the first mount. That is
          deliberate. It reproduces, immediately and on your own machine, the leak production
          would only show you after someone has navigated around for twenty minutes.
        </p>
        <p>
          So the honest reading is the reverse of the usual one. The bug is not caused by
          StrictMode and it is not confined to development — StrictMode is the reason you
          have any chance of noticing on a laptop. Turning it off does not fix the leak, it
          unplugs the smoke alarm.
        </p>
      </Callout>

      <h2 className="section" id="two">
        2. The listener that cannot be removed
      </h2>

      <p className="para">
        TW-41 collapses the transactions filter bar below 900px. The component needs to know
        the window width, the browser announces width changes with an event, so you listen
        for the event.
      </p>

      <Code kind="bad" caption="features/transactions/FilterBar.tsx">{`export function FilterBar({ filters, onChange }) {
  const [narrow, setNarrow] = useState(window.innerWidth < 900);

  useEffect(() => {
    window.addEventListener("resize", () => {
      setNarrow(window.innerWidth < 900);
    });
  }, []);

  return narrow ? <FilterSheet /> : <FilterRow />;
}`}</Code>

      <Callout kind="trap" title="What this costs, and why its shape blocks its own fix">
        <p>
          <strong>First, you could not clean this up if you tried.</strong>{' '}
          <code>removeEventListener</code> needs the same function reference you passed in,
          and this one is an inline arrow that exists nowhere else. There is nothing to pass.
          The fix is not "add a cleanup line", it is "name the handler, then add a cleanup
          line" — which is why this version gets past reviewers who do know the rule.
        </p>
        <p>
          <strong>Second, the cost per visit is not one handler, it is sixty calls a
          second.</strong> Resize fires continuously while a window is being dragged. Ten
          visits to the transactions screen leaves ten handlers attached, so one drag runs six
          hundred <code>setNarrow</code> calls a second, nine tenths of them into components
          that no longer exist.
        </p>
        <p>
          <strong>Third, the leak is not the listener. It is the list.</strong>{' '}
          <code>window</code> is never garbage collected, so every handler attached to it
          stays reachable for the life of the tab, and each handler closes over{' '}
          <code>setNarrow</code>, which holds the component&apos;s fiber, which holds its
          props. On this screen the props include the rendered transactions. Each abandoned
          handler is a few bytes; what it pins is the entire filtered list it was showing at
          the time. That is how a tab left open over lunch reaches two gigabytes.
        </p>
      </Callout>

      <Callout kind="warn" title="The tell">
        <p>
          <code>addEventListener</code> with an arrow written in place. If you cannot name
          the function you cannot remove it, so an inline handler and a missing cleanup are
          one finding rather than two.
        </p>
      </Callout>

      <Code kind="good" caption="lib/useMediaQuery.ts: one implementation, owned in one place">{`// matchMedia fires on the boundary crossing, not on every pixel, so this runs
// twice per drag instead of a hundred times.
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);     // width may have changed before we subscribed
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}`}</Code>

      <Code kind="good" caption="features/transactions/FilterBar.tsx">{`import { useMediaQuery } from "../../lib/useMediaQuery";

const narrow = useMediaQuery("(max-width: 899px)");
// No listener here, so this component cannot forget to remove one.`}</Code>

      <Callout kind="good" title="Why a hook, and not just a cleanup line">
        <p>
          Because this is the fourth component that needs the window width, and a cleanup
          line is something each of them has to remember. A hook in <code>lib/</code> is
          something one of them has to get right. The app&apos;s listener count becomes a
          number you can reason about instead of a grep.
        </p>
      </Callout>

      <h2 className="section" id="three">
        3. The subscription whose unsubscriber you threw away
      </h2>

      <p className="para">
        Adding a transaction should refresh the dashboard totals, and the two screens share
        no parent worth threading a callback through. So the app has an event bus and the
        dashboard listens to it. The architecture is right; the subscription is the problem.
      </p>

      <Code kind="bad" caption="features/dashboard/Totals.tsx">{`useEffect(() => {
  bus.on("transaction:added", () => refetchTotals());
}, []);`}</Code>

      <Callout kind="trap" title="The same leak, with a bill attached">
        <p>
          <strong>First, every stale subscriber still reacts.</strong> The accumulation is
          the same as the previous two findings, but the consequence is louder: after five
          visits to the dashboard, adding one transaction fires five identical requests for
          the totals. Four of them are rendered by nobody.
        </p>
        <p>
          <strong>Second, those five responses race.</strong> Five requests for the same
          resource resolve in whatever order the network decides, and all five write state.
          Four write into dead components and one writes into the live one — but which
          subscriber is live is not the same as which request was issued last, so the totals
          on screen can come from the oldest of the five.
        </p>
        <p>
          <strong>Third, and this is the trap: the bug scales with how long the tab has been
          open, not with the code.</strong> Nothing gets worse as you add features; it gets
          worse as the user keeps working. A thirty-second click-through in review is
          flawless, and the support ticket reads "it gets slower through the day" — the
          hardest class of report to act on, because nobody can reproduce it at their desk.
        </p>
      </Callout>

      <Callout kind="warn" title="The tell">
        <p>
          A <code>subscribe</code>-shaped call whose return value you did not keep. And if
          the bus has no return value to keep, the tell points at the bus:{' '}
          <strong>an API that cannot be called correctly is a bug in the API</strong>, not in
          its thirty callers.
        </p>
      </Callout>

      <Code kind="good" caption="lib/eventBus.ts: on() hands back the way out">{`export function on(event: string, fn: Handler) {
  (handlers[event] ??= new Set()).add(fn);
  return () => handlers[event].delete(fn);   // the whole fix, one line
}`}</Code>

      <Code kind="good" caption="features/dashboard/Totals.tsx">{`// on() returns the unsubscriber, and an effect's return value IS its cleanup,
// so correct and incorrect are now the same number of keystrokes.
useEffect(() => bus.on("transaction:added", refetchTotals), [refetchTotals]);`}</Code>

      <Callout kind="good" title="The rule, in one line">
        <p>
          Make the <strong>correct</strong> call the short one. When <code>on()</code> hands
          back an unsubscriber, the one-line effect is the one that cleans up and the leak
          takes extra typing.
        </p>
      </Callout>

      <h2 className="section" id="four">
        4. The request that resolves into the wrong month
      </h2>

      <p className="para">
        The transactions list is filtered by month, and changing the month means fetching
        again. An effect keyed on <code>month</code> is exactly the right tool, and this is
        what almost everybody writes.
      </p>

      <Code kind="bad" caption="features/transactions/TransactionList.tsx">{`useEffect(() => {
  setLoading(true);
  fetchTransactions({ month }).then((rows) => {
    setRows(rows);
    setLoading(false);
  });
}, [month]);`}</Code>

      <Callout kind="trap" title="Three failures, none of which logs anything">
        <p>
          <strong>First, the slow answer wins.</strong> Click March, then April before March
          has come back. Two requests are in flight and nothing guarantees they resolve in
          the order they were sent. If March lands second, <code>setRows</code> runs with
          March&apos;s rows last and the screen shows March&apos;s transactions under an
          April heading. No error, no warning, no console output — the wrong numbers,
          formatted perfectly. On localhost the round trip is four milliseconds and this
          never happens; on a train it happens constantly.
        </p>
        <p>
          <strong>Second, the spinner lies.</strong> Whichever response arrives first sets{' '}
          <code>loading</code> to false while the other is still in flight, so the user gets
          a screen that looks finished and then silently rewrites itself.
        </p>
        <p>
          <strong>Third, a rejection hangs the screen forever.</strong> There is no{' '}
          <code>.catch</code>, so a failed request leaves <code>loading</code> true for the
          life of the page: a spinner with no error, no retry and no end. That is the same
          shape as the last finding on{' '}
          <Link to="/review/state-correctness">State correctness</Link> — a failure
          rendering as something other than a failure.
        </p>
      </Callout>

      <Callout kind="warn" title="The tell">
        <p>
          An effect with a dependency that can change, and a <code>.then</code> that writes
          state. Ask one question: <strong>if this effect runs twice in quick succession, can
          the first run win?</strong> If it can, it will, on somebody&apos;s connection.
        </p>
      </Callout>

      <Code kind="good" caption="features/transactions/TransactionList.tsx">{`useEffect(() => {
  const ac = new AbortController();
  setStatus("loading");

  fetchTransactions({ month, signal: ac.signal })
    .then((rows) => { setRows(rows); setStatus("ok"); })
    .catch((err) => {
      if (err.name === "AbortError") return;   // superseded, not failed
      setStatus("error");
    });

  return () => ac.abort();   // changing month cancels the month before it
}, [month]);`}</Code>

      <p className="para">
        The <code>AbortError</code> branch is not optional tidying. Without it, every month
        you click past on the way to the one you wanted renders an error, because cancelling
        a request rejects its promise.
      </p>

      <Code kind="good" caption="When the data layer cannot take a signal">{`// A cancelled request still costs bandwidth, but a cancelled *result* cannot
// overwrite a newer one, which is the half that was actually wrong.
useEffect(() => {
  let current = true;
  setStatus("loading");

  fetchTransactions({ month })
    .then((rows) => { if (current) { setRows(rows); setStatus("ok"); } })
    .catch(() => { if (current) setStatus("error"); });

  return () => { current = false; };
}, [month]);`}</Code>

      <Callout kind="good" title="The rule, in one line">
        <p>
          An effect that writes state <strong>after an await</strong> needs a way to be
          cancelled. Either the request stops or the result is ignored, but one of the two
          has to happen in the cleanup.
        </p>
      </Callout>

      <Callout kind="note" title="Why that is one status and not two booleans">
        <p>
          Both fixes replaced <code>loading</code> with a single <code>status</code>. With
          separate <code>loading</code> and <code>error</code> flags, "loading and errored"
          and "neither loading nor loaded" are both representable and neither means anything,
          so every render has to guard against states that should not exist. That has its own
          entry on <Link to="/review/state-correctness">State correctness</Link>.
        </p>
      </Callout>

      <h2 className="section" id="five">
        5. The effect that was never an effect
      </h2>

      <p className="para">
        The list has a category filter and a running total underneath it. The total depends
        on the filtered rows, the filtered rows depend on the rows and the category, and
        "when X changes, update Y" is the exact sentence <code>useEffect</code> is for. So it
        gets two effects, and both of them are correct.
      </p>

      <Code kind="bad" caption="features/transactions/TransactionList.tsx">{`const [rows, setRows] = useState([]);
const [filtered, setFiltered] = useState([]);
const [total, setTotal] = useState(0);

useEffect(() => {
  setFiltered(rows.filter((r) => r.category === category));
}, [rows, category]);

useEffect(() => {
  setTotal(filtered.reduce((n, r) => n + r.amount, 0));
}, [filtered]);`}</Code>

      <Callout kind="trap" title="What three states cost when one would do">
        <p>
          <strong>First, one click costs three renders, and you can see one of them.</strong>{' '}
          Changing the category renders with the new category and the old rows, then the
          first effect runs and renders again with new rows and the old total, then the
          second effect runs and renders a third time. That middle render reaches the screen:
          a filtered list with a total belonging to the previous filter. On a few hundred
          rows it is a visible flash of wrong money.
        </p>
        <p>
          <strong>Second, the same truth is now stored in three places</strong> and nothing
          keeps them agreeing. <code>rows</code>, <code>filtered</code> and{' '}
          <code>total</code> have to be consistent, and the only thing enforcing that is two
          effects that happen to be written correctly today.
        </p>
        <p>
          <strong>Third, and this is the one that traps you: the next person adds a search
          box.</strong> Now <code>filtered</code> depends on rows, category and query, and
          there are two effects to update rather than one expression. They update the first
          and miss the second. The total is now right for the category filter and stale for
          the search, which does not look like a missing dependency — it looks like a
          rounding bug, and it gets debugged as one, for an afternoon.
        </p>
      </Callout>

      <Callout kind="warn" title="The tell">
        <p>
          A <code>useState</code> whose <strong>only writer is a useEffect</strong>. That is
          not state. It is a calculation that has been given somewhere to live, a render to
          happen in, and an opportunity to disagree with its inputs.
        </p>
      </Callout>

      <Code kind="good" caption="features/transactions/TransactionList.tsx">{`const [rows, setRows] = useState([]);
const [category, setCategory] = useState("all");

// Computed on the way to the screen, so they cannot be out of date with rows.
// One render per change, two fewer pieces of state, and adding a search box is
// an edit to one line.
const filtered = rows.filter((r) => category === "all" || r.category === category);
const total = filtered.reduce((n, r) => n + r.amount, 0);`}</Code>

      <h3 className="sub" id="five-cost">
        That filter now runs on every render. Isn&apos;t that worse?
      </h3>

      <p className="para">
        It runs on every render of this component, yes. The version it replaced ran once per
        change but charged two extra renders of the component and all its children for the
        privilege, so for a list of a few hundred rows the computed version is the cheaper of
        the two as well as the correct one.
      </p>

      <Callout kind="good" title="Where the line actually sits">
        <p>
          Reach for <code>useMemo</code> when you have measured a cost, or when the value is
          handed to a memoized child that would otherwise re-render anyway. Reach for it
          because of a profile, not because a <code>.filter()</code> looked expensive in the
          diff. That trade-off, including the cases where memoizing makes things slower, is
          the subject of <Link to="/review/rerenders">Re-renders &amp; memoization</Link>.
        </p>
        <p>
          What is never the answer is keeping the value in state and syncing it with an
          effect. That is not a cheaper calculation. It is the same calculation, plus a
          render, plus a second copy of the truth.
        </p>
      </Callout>

      <Callout kind="good" title="The rule, in one line">
        <p>
          If you can <strong>calculate</strong> it from state you already hold, it is not
          state. An effect that only sets state from other state is a render you are paying
          for and a disagreement you are waiting for.
        </p>
      </Callout>

      <h2 className="section" id="tells">
        The tells, in one table
      </h2>

      <p className="para">
        All five are visible in a diff without running anything, which is the only review
        that reliably happens.
      </p>

      <Table
        caption="What to look for in an effect, and what it means"
        head={['If you see this', 'The problem', 'What it should be']}
        rows={[
          [
            'An effect that creates something and returns nothing',
            'What it made is registered with the browser, not with React, so unmounting does not touch it. One orphan per mount, for the life of the tab.',
            'Return the teardown. If the body has no return, check that it made nothing.',
          ],
          [
            'addEventListener with an inline arrow',
            'There is no reference to pass to removeEventListener, so the shape of the code prevents its own fix. Each orphan pins the props it closed over.',
            'A named handler and a matching remove — or better, one hook in lib/ that owns the listener for every caller.',
          ],
          [
            'A subscribe call whose return value is discarded',
            'Stale subscribers keep reacting. With a refetch in the callback, one user action fires N requests and the oldest can win.',
            'Return the unsubscriber as the cleanup. If the bus does not give you one, fix the bus.',
          ],
          [
            'A .then that sets state, in an effect with changing deps',
            'Responses resolve in network order, not call order, so a superseded request can overwrite the current one. A missing catch leaves the spinner up forever.',
            'Abort in the cleanup, or guard the write with a flag the cleanup flips. Swallow AbortError so a supersede does not read as a failure.',
          ],
          [
            'A useState written only by a useEffect',
            'Derived data stored as state: extra renders with visibly inconsistent values, and a second copy of the truth that the next change will forget to update.',
            'Calculate it during render. Add useMemo only against a measurement.',
          ],
        ]}
      />

      <h3 className="sub" id="common">
        What these five have in common
      </h3>

      <p className="para">
        Four of the five are a missing <code>return</code>, and the fifth is an effect that
        should never have existed. Together they say something fairly specific about the
        hook: <code>useEffect</code> is a <strong>pair</strong>, and the half you need in
        order to watch the feature work is the first half. The second half only matters when
        the component goes away, which is the one moment you are never looking at.
      </p>

      <p className="para">
        It is also why none of these fails review. Every one works on the happy path, on a
        fast connection, on the first visit to the screen. They need a second visit, a slow
        response, or a long session to show themselves, and those are exactly the three
        things a manual click-through does not do. The{' '}
        <Link to="/review">overview</Link> calls these the easy versions; here the easy
        version is simply the one that stops at the point the feature starts working.
      </p>
    </>
  )
}
