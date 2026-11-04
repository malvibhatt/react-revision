import { Link } from 'react-router-dom'
import Code from '../../components/Code'
import Callout from '../../components/Callout'
import Table from '../../components/Table'

export default function Boundaries() {
  return (
    <>
      <h1 className="lesson-title">Where the code went, and what it cost</h1>
      <p className="lesson-sub">
        Five findings about placement: the imports that fuse two features together, and the
        files that end up impossible to reuse or test because of where they live.
      </p>

      <div className="highlight">
        Every finding here is an <strong>import pointing the wrong way</strong>. Features
        should import downwards — into <code>data/</code>, <code>domain/</code>,{' '}
        <code>ui/</code> and <code>lib/</code> — and never sideways into each other or
        upwards out of the bottom. All five are shorter to write than the alternative, which
        is the entire reason they happen.
      </div>

      <h2 className="section" id="one">
        1. The HTTP client, imported into a component
      </h2>

      <p className="para">
        This one is invited by the tooling. Importing the configured axios instance is one
        line, the request reads clearly, and the data arrives exactly where it is used.
        Every instinct says this is good code, and compared to the alternative it is also
        four files fewer.
      </p>

      <Code kind="bad" caption="features/transactions/TransactionList.tsx">{`import { api } from "../../lib/api";

export function TransactionList({ month }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get(\`/transactions?month=\${month}\`).then((res) => setRows(res.data));
  }, [month]);

  return rows.map((tx) => <TransactionRow key={tx.id} tx={tx} />);
}`}</Code>

      <Callout kind="trap" title="Count what is wrong in those three lines">
        <p>
          <strong>First, four separate decisions, none of them taken.</strong> There is no
          limit, so a user with four years of history gets every row. There is no{' '}
          <code>.catch</code>, so a 500 renders as an empty array — which reads to the user
          as <em>you have no transactions</em>, the worst possible way to report a server
          error. The query string is assembled by hand, so <code>2026-1</code> and{' '}
          <code>2026-01</code> are different URLs. And <code>res.data</code> means the wire
          format is now this component&apos;s problem; rename a field on the server and this
          file breaks.
        </p>
        <p>
          <strong>Second, it is not one component, it is thirty.</strong> None of the above
          is carelessness. It is what happens when a decision about <em>how calls are
          made</em> has nowhere to live, so "every list read carries a limit and handles its
          errors" stops being a rule and becomes something you remember thirty times, under
          deadline, correctly.
        </p>
        <p>
          <strong>Third, and this is the one that traps you: the next three things you want
          all become too expensive to do.</strong> Caching. A retry with backoff. A
          correlation-id header so support can trace a complaint. Moving to React Query.
          Every one of those is a one-file change if one file exists, and a thirty-file
          change if it does not. The cost of this finding is not that the code is untidy; it
          is that a quarter of the improvements you would want next get quoted as a week and
          therefore never happen.
        </p>
      </Callout>

      <Callout kind="warn" title="The tell">
        <p>
          An import of the HTTP client in any file under <code>features/</code>. It is the
          one grep that gives you an exact count of how many places can get a request wrong.
        </p>
      </Callout>

      <Code kind="good" caption="data/transactions.ts: the only file in the app that imports api">{`import { api } from "../lib/api";
import { toTransaction } from "../domain/transaction";

export async function readTransactions({ month, signal }: ReadArgs) {
  const res = await api.get("/transactions", {
    params: { month, limit: 200 },   // every list read carries a limit, in one place
    signal,                          // so the caller's effect can cancel it
  });
  return res.data.items.map(toTransaction);   // one place that knows the wire shape
}`}</Code>

      <Code kind="good" caption="features/transactions/TransactionList.tsx">{`import { readTransactions } from "../../data/transactions";

// No api import and no URL. This component cannot get the request shape
// wrong, because it does not have one.`}</Code>

      <Callout kind="good" title="What you get, beyond the tidiness">
        <p>
          The folder listing of <code>data/</code> becomes the complete API surface of the
          app — every call it can make, as a set of filenames you can read in one screen.
          "What does this app ask the server for?" stops being a research task.
        </p>
      </Callout>

      <h2 className="section" id="two">
        2. One feature reaching into another
      </h2>

      <p className="para">
        TW-62 puts recent activity on the dashboard. The transactions feature already draws
        exactly that row, so you import it. It works, it removes duplication, and it is the
        most natural mistake on this page — because avoiding duplication is a good habit and
        this is indistinguishable from it.
      </p>

      <Code kind="bad" caption="features/dashboard/RecentActivity.tsx">{`import { TransactionRow, sortByDate }
  from "../transactions/TransactionRow";   // reaching sideways

export function RecentActivity({ recent }) {
  return sortByDate(recent).map((tx) => (
    <TransactionRow key={tx.id} tx={tx} compact hideActions />
  ));
}`}</Code>

      <Callout kind="trap" title="What this costs in three months">
        <p>
          <strong>First, the transactions screen can no longer be changed on its own.</strong>{' '}
          TW-77 redesigns the row — the category chip moves left — and the dashboard changes
          with it, because it is rendering the same component. You find out when somebody
          opens the dashboard, which is not when you made the change and not in the pull
          request that made it.
        </p>
        <p>
          <strong>Second, look at the props.</strong> <code>compact</code> and{' '}
          <code>hideActions</code> exist for one reason: the dashboard needed them. A
          component in the transactions feature now has parameters whose entire purpose is
          to serve a different feature. The next one is <code>hideCategory</code>, then{' '}
          <code>dense</code>, then <code>showRunningTotal</code>. Six flags in and the row
          has sixty-four configurations, one of which anybody has looked at.
        </p>
        <p>
          <strong>Third, and this is what actually traps you: the circle.</strong> TW-81
          wants the row to say "largest expense this month", and that comparison is a
          dashboard calculation. So transactions needs something from dashboard, while
          dashboard already imports transactions. Vite cannot decide which to evaluate
          first, and you get an import that is <code>undefined</code> at runtime with a stack
          trace pointing at neither file. It also welds the two chunks together, so the
          route-level splitting from{' '}
          <Link to="/review/load-only-whats-needed">the previous page</Link> silently stops
          working: two features in a cycle cannot be in separate chunks.
        </p>
      </Callout>

      <Callout kind="warn" title="The tell, and it arrives before the damage">
        <p>
          <strong>A prop that exists only to serve one caller.</strong> You will see{' '}
          <code>compact</code> long before you see the cycle, and it is the same finding at
          an earlier stage. The test: if you would need a flag to make this work for the
          second caller, you have two components, not one with an option.
        </p>
      </Callout>

      <p className="para">
        The fix is not to duplicate the row. It is to notice that{' '}
        <strong>a shared need points downwards</strong>, and that two different things are
        being shared here, which belong in two different places.
      </p>

      <Code kind="good" caption="ui/Row.tsx: shared presentation goes down, with the domain stripped out">{`// Knows about a left side, a right side and a tone. Does not know what a
// transaction is, so it can never grow a dashboard-shaped prop.
export function Row({ title, subtitle, value, tone, action }: RowProps) {
  return (/* ... */);
}`}</Code>

      <Code kind="good" caption="features/dashboard/RecentActivity.tsx: now imports only downwards">{`import { Row } from "../../ui/Row";
import { formatAmount } from "../../lib/money";
import { sortByDate } from "../../domain/transaction";

// The dashboard composes its own row out of shared parts. The transactions
// screen can be redesigned tomorrow and nothing here moves.`}</Code>

      <Callout kind="good" title="The question that tells you which way to go">
        <p>
          When one feature wants something from another, ask:{' '}
          <strong>is this data, or is it presentation?</strong> Data goes to{' '}
          <code>data/</code>. Presentation goes to <code>ui/</code>, with every mention of
          the domain removed on the way down.
        </p>
        <p>
          If it is neither, and what you want is genuinely "that screen, but slightly
          different", you have found two screens that should be one. That is a product
          question, and answering it in code by adding a <code>compact</code> prop is how
          you end up with neither answer.
        </p>
      </Callout>

      <h2 className="section" id="three">
        3. The screen that can only exist at one URL
      </h2>

      <p className="para">
        The transaction detail screen needs the id from the address, and{' '}
        <code>useParams</code> is right there. Reading it in the component that needs it is
        one hook call; threading it down from a route wrapper is a whole extra component. The
        short version does not feel like a decision at the time.
      </p>

      <Code kind="bad" caption="features/transactions/TransactionDetail.tsx: and it will reach 380 lines">{`export function TransactionDetail() {
  const { id } = useParams();                 // reads the address itself
  const [tx, setTx] = useState(null);

  useEffect(() => {
    api.get(\`/transactions/\${id}\`).then((res) => setTx(res.data));
  }, [id]);

  return (
    <div>
      {/* 340 lines: header, split editor, receipt upload, delete flow */}
    </div>
  );
}`}</Code>

      <Callout kind="trap" title="Three things you cannot do once this exists">
        <p>
          <strong>First, render it anywhere else.</strong> TW-90 wants clicking a chart
          segment on the dashboard to open that transaction in a side panel. The natural
          thing to show is this screen, and it is unreachable: it gets its id from the
          browser&apos;s address, and the address says <code>/dashboard</code>.
        </p>
        <p>
          <strong>Second, test it without a router.</strong> Rendering it at all requires a{' '}
          <code>MemoryRouter</code> with the right path configured, so a test that only wants
          to ask "what does a transaction with no receipt look like?" has to stand up routing
          first. Which means that test usually does not get written.
        </p>
        <p>
          <strong>Third, and this is the real cost because it is the daily one: nothing in
          here can be found.</strong> The delete flow, the receipt upload, the split editor
          and the data fetching are one 380-line file, so any change means scrolling past
          three unrelated features. And it cannot be split later without unpicking the local
          state those four things have quietly started sharing.
        </p>
      </Callout>

      <Code kind="good" caption="app/routes.tsx: reads the address, renders one thing, stops">{`function TransactionDetailRoute() {
  const { id } = useParams();
  return <TransactionDetail transactionId={id} />;
}`}</Code>

      <Code kind="good" caption="features/transactions/TransactionDetail.tsx: a screen, not a route">{`// Takes an id as a prop, so it has no idea it is on a URL. The dashboard can
// render it in a panel. A test can render it with no router. It can move.
export function TransactionDetail({ transactionId }: { transactionId: string }) {
  /* ... */
}`}</Code>

      <Callout kind="good" title="The rule, in one line">
        <p>
          A route <strong>translates an address into props</strong> and renders one thing. If
          it fetches, lays out, or holds state, it has stopped being a route and become a
          screen that can only live in one place.
        </p>
      </Callout>

      <Callout kind="note" title="The review-pages in this section follow this rule">
        <p>
          <code>ReviewRoute.tsx</code> reads the slug, looks up the page and renders it. Each
          of these five pages is a plain component taking no router dependency at all, which
          is why the overview can link them, a test could render one, and the Pending
          placeholder can stand in for an unwritten one without touching the router.
        </p>
      </Callout>

      <h2 className="section" id="four">
        4. The business rule living inside JSX
      </h2>

      <p className="para">
        A transaction row shows a warning badge when the amount is unusually large. The
        condition decides whether the badge appears, the badge is here, so the condition goes
        here. It starts as one comparison and nobody ever decides to let it become this.
      </p>

      <Code kind="bad" caption="features/transactions/TransactionRow.tsx">{`{tx.amount > 0 &&
  tx.category !== "transfer" &&
  tx.date >= startOfMonth &&
  tx.amount > budgets[tx.category] * 0.5 &&
  !tx.dismissed && (
    <WarningBadge />
)}`}</Code>

      <Callout kind="trap" title="What a rule with no name costs">
        <p>
          <strong>First, it cannot be tested as what it is.</strong> This is a pure function
          of a transaction and a budget, and the only way to ask it a question is to render a
          React component and query the DOM. So "does a dismissed transfer show a warning?"
          becomes a rendering test, which is slow, brittle and three layers away from the
          logic it is checking.
        </p>
        <p>
          <strong>Second, it cannot be reused, so it gets retyped.</strong> The dashboard
          needs the same rule for its "3 transactions need attention" count. The rule is
          trapped inside a JSX expression, so somebody writes it again — and gets one clause
          slightly different. Now the count in the header disagrees with the number of badges
          in the list, and that bug report is going to be filed as a UI inconsistency rather
          than as two copies of a rule.
        </p>
        <p>
          <strong>Third, and this is the trap: nobody can tell whether a change is
          safe.</strong> Product decides transfers should count after all. The person making
          that change has to find every place those five clauses were retyped, in markup,
          across two features. They find two of the three. The third keeps the old behaviour
          for another nine months, and because both are "correct-looking" code, no review
          catches it.
        </p>
      </Callout>

      <Callout kind="warn" title="The tell">
        <p>
          A JSX conditional with <strong>more than one <code>&amp;&amp;</code></strong>, or
          any comparison in markup against a number that came from the business rather than
          from the layout. <code>0.5</code> is not a styling decision.
        </p>
      </Callout>

      <Code kind="good" caption="domain/transaction.ts: named, testable, and in one place">{`export function needsAttention(tx: Transaction, budgets: Budgets) {
  if (tx.dismissed) return false;
  if (tx.category === "transfer") return false;     // transfers are not spending
  if (tx.amount <= 0) return false;                 // income is never a warning
  if (tx.date < startOfMonth()) return false;       // only the current month
  return tx.amount > budgets[tx.category] * LARGE_EXPENSE_RATIO;
}`}</Code>

      <Code kind="good" caption="Both features now ask the same question">{`// features/transactions/TransactionRow.tsx
{needsAttention(tx, budgets) && <WarningBadge />}

// features/dashboard/AttentionCount.tsx
const count = transactions.filter((tx) => needsAttention(tx, budgets)).length;

// The badge and the count cannot disagree, because there is one rule.`}</Code>

      <Callout kind="good" title="And now the rule is reviewable">
        <p>
          The point is not that five clauses became six lines. It is that the diff now says{' '}
          <code>needsAttention</code>, with the clauses named and ordered, so a reviewer can
          argue about <em>the rule</em> instead of reading markup. When product changes their
          mind, the change is one function and one test.
        </p>
      </Callout>

      <Callout kind="good" title="The rule, in one line">
        <p>
          JSX decides <strong>what to show</strong>. It should never be the place the app
          decides <strong>what is true</strong>.
        </p>
      </Callout>

      <h2 className="section" id="five">
        5. The bottom of the stack, importing the top
      </h2>

      <p className="para">
        You need a category turned into a label. Formatting feels like a <code>lib</code>{' '}
        job, so it goes there. Then it needs the category list, and the category list lives
        with the transactions. One import, and the whole dependency graph inverts.
      </p>

      <Code kind="bad" caption="lib/format.ts">{`import { CATEGORIES } from "../features/transactions/constants";
//     ^ the bottom of the stack now imports the top

export function categoryLabel(key: string) {
  return CATEGORIES[key]?.label ?? "Uncategorised";
}

export function formatAmount(cents: number) { /* ... */ }`}</Code>

      <Callout kind="trap" title="One import, three consequences">
        <p>
          <strong>First, everything in the app now depends on the transactions
          feature.</strong> Auth, settings and the dashboard all import{' '}
          <code>lib/format</code> for money formatting, and every one of them has just
          acquired a dependency on transactions without anybody choosing it. The settings
          screen cannot be built without the transactions feature compiling.
        </p>
        <p>
          <strong>Second, the cycle is one import away.</strong> The moment anything in{' '}
          <code>features/transactions</code> imports <code>lib/format</code> — which it will,
          because it formats money on every row — the loop closes and you are back to the
          runtime <code>undefined</code> from finding 2.
        </p>
        <p>
          <strong>Third, and this is the trap: it quietly undoes the code
          splitting.</strong> A file at the bottom of the graph that everything imports lands
          in the chunk everything shares, so dragging a feature in behind it means the
          settings chunk — and the common bundle — now contain the transactions constants.
          You lazy-loaded four routes and then put a piece of one of them in the bundle
          everybody downloads. This is{' '}
          <Link to="/review/load-only-whats-needed">the barrel-file finding</Link> arriving
          from the opposite direction.
        </p>
      </Callout>

      <Callout kind="warn" title="The tell, and it takes five seconds">
        <p>
          <strong>Could this file be copied into a completely different product,
          unchanged?</strong>
        </p>
        <p>
          Money formatting: yes. Date arithmetic: yes. A function that knows what{' '}
          <code>"transfer"</code> means: no. That is a product function wearing a helpful
          name, and the fix is to move it <em>up</em>, not to make <code>lib</code> smarter.
        </p>
      </Callout>

      <Code kind="good" caption="Split by that test, and the arrows point down again">{`// lib/money.ts — copyable into any product, knows nothing
export const formatAmount = (cents: number) =>
  (cents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" });

// domain/category.ts — knows what a category is, knows nothing about any screen
import { CATEGORIES } from "./categories";
export function categoryLabel(key: string) { /* ... */ }`}</Code>

      <h3 className="sub" id="five-where">
        Where a file goes, in two questions
      </h3>

      <p className="para">
        Findings 2 and 5 pull against each other if you only have one rule. "Put it with the
        feature that uses it" produces the sideways import; "put shared things in lib" produces
        this one. Two questions, asked in order, resolve it.
      </p>

      <Table
        caption="Asked in this order, every time"
        head={['Does it name the domain?', 'Needed by more than one feature?', 'Where it goes']}
        rows={[
          ['No', 'Does not matter', 'lib/ for logic, ui/ for presentation.'],
          ['Yes', 'No', 'features/ , in the one feature that uses it.'],
          ['Yes', 'Yes', 'domain/ . This is the row people are usually missing.'],
          ['It is a network call', 'Does not matter', 'data/ , one module per call.'],
        ]}
      />

      <Callout kind="why" title="A feature is a screen area, not a concept">
        <p>
          <strong>
            <code>features/transactions/</code> means "the transactions screens". It does not
            mean "everything about the transaction concept".
          </strong>
        </p>
        <p>
          A transaction belongs to the whole app: the dashboard summarises them, the export
          screen writes them out, budgets are measured against them. So anything about the{' '}
          <em>concept</em> that more than one screen area needs was never a transactions-feature
          thing to begin with. It belongs below features, in <code>domain/</code> — which is
          exactly where <code>needsAttention</code> went in finding 4, and for this reason
          rather than by coincidence.
        </p>
      </Callout>

      <Callout kind="trap" title="Two places domain logic must not go">
        <p>
          <strong>Not <code>ui/</code>.</strong> A <code>Row</code> knows about a left side
          and a right side. The moment it knows what <code>"transfer"</code> means it has
          stopped being generic, and finding 2 has been recreated one floor down.
        </p>
        <p>
          <strong>Not <code>lib/</code>.</strong> It fails the five-second test: it could not
          be copied into a different product unchanged. That is the mistake this finding
          opened with.
        </p>
      </Callout>

      <h2 className="section" id="tells">
        The tells, in one table
      </h2>

      <Table
        caption="What to look for, and where it should have gone"
        head={['If you see this', 'The problem', 'Where it should go']}
        rows={[
          [
            'The HTTP client imported under features/',
            'Every rule about how calls are made becomes something you remember rather than something that holds. Caching, retries and a client swap all become thirty-file changes.',
            'One module per call in data/. Nothing else imports the client.',
          ],
          [
            'An import going sideways into another feature',
            'Two features have fused: neither can change alone, and a cycle is one ticket away. It also merges their chunks, undoing route-level splitting.',
            'Data down to data/. Presentation down to ui/, with the domain stripped out of it.',
          ],
          [
            'useParams (or useSearchParams) inside a screen component',
            'A screen that exists at exactly one URL: it cannot be rendered in a panel, cannot be tested without a router, and accretes unrelated features in one long file.',
            'The route reads the address and passes props. The screen takes an id and knows nothing about URLs.',
          ],
          [
            'A JSX conditional with several && clauses',
            'An unnamed business rule that can only be tested by rendering, gets retyped in the second feature that needs it, and then disagrees with its own copy.',
            'A named predicate in domain/, imported by every feature that asks the question.',
          ],
          [
            'Anything in lib/ importing from features/',
            'The bottom depends on the top, so everything depends on one feature, a cycle is one import away, and the shared chunk now carries feature code.',
            'Split it: the generic half stays in lib/, the half that names the domain goes to domain/ (or to the single feature that uses it).',
          ],
        ]}
      />

      <h3 className="sub" id="common">
        What these five have in common
      </h3>

      <p className="para">
        Every one is the version with <strong>fewer keystrokes and fewer files</strong>.
        Importing the client where you need the data. Importing the row that already exists.
        Reading the URL where you need the id. Writing the condition where the badge goes.
        Putting the helper in <code>lib</code>. In each case the alternative asks you to
        create a file first, and creating a file first always loses to typing one line — which
        is why none of these can be prevented by knowing better, and why they are worth
        having written down.
      </p>

      <p className="para">
        Three of the five also cost bundle size, which makes this page and{' '}
        <Link to="/review/load-only-whats-needed">Loading only what&apos;s needed</Link> the
        same page approached from two directions: what ships together is decided by who
        imports whom. A clean dependency graph is not an aesthetic preference — it is the
        thing that makes code splitting possible at all.
      </p>
    </>
  )
}
