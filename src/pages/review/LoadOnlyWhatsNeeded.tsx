import { Link } from 'react-router-dom'
import Code from '../../components/Code'
import Callout from '../../components/Callout'
import Table from '../../components/Table'

export default function LoadOnlyWhatsNeeded() {
  return (
    <>
      <h1 className="lesson-title">Everything, downloaded on the login screen</h1>
      <p className="lesson-sub">
        Five findings about what ends up in the first bundle, and the four ways code
        splitting gets added and then quietly undone.
      </p>

      <div className="highlight">
        A static <code>import</code> at the top of a file is an instruction to the bundler:
        <strong> put this in the same chunk as me</strong>. Every finding here is that
        instruction being given by accident, and the cost is paid by whoever opens the app
        on a phone on mobile data — which is nobody on the team, during development.
      </div>

      <Callout kind="note" title="Two of these five are live in this repo">
        <p>
          Findings 1 and 2 are not hypothetical here. This deck statically imports every
          page into <code>App.tsx</code>, and one of those pages reaches{' '}
          <code>mermaid</code> through three static imports, so opening the overview
          downloads a diagram library you may never look at. The numbers in finding 2 come
          from this project&apos;s own <code>dist/</code>.
        </p>
      </Callout>

      <h2 className="section" id="one">
        1. Every route, imported at the top of the router
      </h2>

      <p className="para">
        A router needs components to point its routes at, so the components get imported at
        the top of the file where the routes are declared. There is no other way to write
        this that does not involve learning a second concept, and every router example in
        every tutorial looks exactly like it.
      </p>

      <Code kind="bad" caption="app/App.tsx">{`import Login from "./features/auth/Login";
import Dashboard from "./features/dashboard/Dashboard";
import TransactionsScreen from "./features/transactions/TransactionsScreen";
import Settings from "./features/settings/Settings";
import ExportPanel from "./features/export/ExportPanel";

<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/" element={<Dashboard />} />
  <Route path="/transactions" element={<TransactionsScreen />} />
  <Route path="/settings" element={<Settings />} />
  <Route path="/export" element={<ExportPanel />} />
</Routes>`}</Code>

      <Callout kind="trap" title="What the login screen now costs">
        <p>
          <strong>First, a two-field form downloads the entire application.</strong> The
          first screen an unauthenticated user sees is <code>Login</code>, and to render it
          the browser must fetch the chunk <code>App.tsx</code> lives in — which, because of
          those five static imports, contains the dashboard&apos;s charting library, the
          export screen&apos;s spreadsheet writer and the settings date picker. None of it
          can run. All of it arrives first.
        </p>
        <p>
          <strong>Second, the cost is parse time, not download time.</strong> Bytes over the
          wire compress well and this is the number everyone quotes. JavaScript still has to
          be parsed and executed after it arrives, and that part does not compress: on a
          mid-range Android phone, a megabyte of JavaScript is roughly a second of
          main-thread work during which nothing paints and nothing responds to a tap. The
          login form becomes interactive after the dashboard has been parsed.
        </p>
        <p>
          <strong>Third, and this is the trap: the regression has no author.</strong> Every
          new feature adds one line to this file. The line is alphabetically sorted, it is
          obviously correct, and it is invisible in review. Twenty pull requests later the
          entry bundle has tripled and there is no single commit that did it, so there is
          nothing to revert and nobody to ask. Bundle size is the one regression that
          arrives entirely through changes that were each individually fine.
        </p>
      </Callout>

      <Callout kind="warn" title="The tell">
        <p>
          A <code>{'<Route element>'}</code> pointing at a component that arrived through a
          static import. Routes are the boundaries the user already understands, so a route
          whose component is not lazy is a split point you had for free and did not take.
        </p>
      </Callout>

      <Code kind="good" caption="app/App.tsx">{`// Login stays eager: it is what an unauthenticated visit renders, and making
// the first screen wait for a second round trip is a regression, not a fix.
import Login from "./features/auth/Login";

const Dashboard = lazy(() => import("./features/dashboard/Dashboard"));
const TransactionsScreen = lazy(() => import("./features/transactions/TransactionsScreen"));
const Settings = lazy(() => import("./features/settings/Settings"));
const ExportPanel = lazy(() => import("./features/export/ExportPanel"));`}</Code>

      <Callout kind="good" title="The rule, in one line">
        <p>
          A route is the natural place to split, because the user has clicked something and
          already accepted that a transition takes a moment. <strong>Eager-load the screen
          the first visit renders;
          lazy-load every screen that needs a navigation to reach.</strong>
        </p>
      </Callout>

      <h2 className="section" id="two">
        2. A heavy library at module scope
      </h2>

      <p className="para">
        This is the finding this repo commits, so the example is its own source. The Auth tab
        of the cheatsheet draws five workflow diagrams with <code>mermaid</code>, and the
        component that renders them imports it the only way an import can be written.
      </p>

      <Code kind="bad" caption="src/components/Mermaid.tsx (as it stands)">{`import mermaid from 'mermaid'

// A module-scope side effect, which matters for more than style — see finding 3.
mermaid.initialize({ startOnLoad: false, theme: 'base', themeVariables: { /* ... */ } })

export default function Mermaid({ chart }: Props) { /* ... */ }`}</Code>

      <Callout kind="trap" title="Follow the import chain and check the numbers">
        <p>
          <strong>First, the chain is four static imports long and ends in the entry
          chunk.</strong> <code>main.tsx</code> imports <code>App.tsx</code>, which imports{' '}
          <code>Cheatsheet.tsx</code>, which imports <code>AuthSection.tsx</code>, which
          imports <code>Mermaid.tsx</code>, which imports <code>mermaid</code>. Not one of
          those five lines is wrong on its own. Together they put a diagramming library in
          the bundle that loads before the overview page paints:{' '}
          <code>dist/assets/index-*.js</code> is <strong>510 KB</strong> and{' '}
          <code>grep mermaid</code> finds it in there.
        </p>
        <p>
          <strong>Second, almost nobody reaches the thing they paid for.</strong> The
          diagrams are on one tab of one page. Every visitor to this deck downloads and
          parses the library; the ones who open the Auth tab of the cheatsheet are the only
          ones who see a diagram. Compare the two numbers in <code>npm run build</code>: the
          deck&apos;s own code is a few tens of kilobytes, and the single largest thing
          shipped on first load is a dependency used by one component.
        </p>
        <p>
          <strong>Third, and this is the trap: the fix gets harder the longer it waits,
          because the chain grows a link at a time.</strong> Today it is four imports. The
          next person who wants a diagram on a different page adds a fifth, from a page that
          also has no reason to be eager. The structural problem — one component in the
          static graph of the entry point — is a one-line fix now and an audit later.
        </p>
      </Callout>

      <Callout kind="warn" title="The tell">
        <p>
          A top-level <code>import</code> of anything you would describe as "a library"
          rather than "a module": a chart renderer, a date library, a markdown parser, a PDF
          writer, an editor. Then ask the only question that matters:{' '}
          <strong>does the first screen render it?</strong> If not, it should not be in the
          first chunk.
        </p>
      </Callout>

      <Code kind="good" caption="src/pages/cheatsheet/AuthSection.tsx: the one-line version">{`// Enough on its own to get mermaid out of the entry chunk. It now arrives
// when the Auth tab renders, which is the first moment it can be seen.
const Mermaid = lazy(() => import('../../components/Mermaid'))`}</Code>

      <Code kind="good" caption="src/components/Mermaid.tsx: and the thorough version">{`// Module-scope promise, so the import resolves once and initialize() runs
// once, no matter how many diagrams mount. Without the cache, five diagrams
// on one tab would configure mermaid five times.
let loading: Promise<typeof import('mermaid')> | null = null

function loadMermaid() {
  loading ??= import('mermaid').then((m) => {
    m.default.initialize({ startOnLoad: false, theme: 'base' /* ... */ })
    return m
  })
  return loading
}

useEffect(() => {
  let alive = true
  loadMermaid()
    .then(({ default: mermaid }) => mermaid.render(\`m-\${id}\`, chart.trim()))
    .then(({ svg }) => alive && setSvg(svg))
    .catch((e) => alive && setError(String(e?.message ?? e)))
  return () => { alive = false }
}, [chart, id])`}</Code>

      <Callout kind="note" title="That alive flag is the fourth finding from the previous page">
        <p>
          It is already in this repo&apos;s <code>Mermaid.tsx</code>, and it is there for the
          reason{' '}
          <Link to="/review/effects-and-leaks">Effects &amp; leaks</Link> gives: a{' '}
          <code>.then</code> that writes state needs the cleanup to be able to stop it.
          Switching tabs quickly while a diagram renders would otherwise drop an SVG into a
          component nobody is looking at.
        </p>
      </Callout>

      <h2 className="section" id="three">
        3. The barrel file that brings its neighbours
      </h2>

      <p className="para">
        A folder with eight modules in it gets an <code>index.ts</code> so that callers can
        import from the feature rather than from its internals. It shortens every import
        path, it looks like encapsulation, and it is recommended widely enough that most
        codebases have one per folder.
      </p>

      <Code kind="bad" caption="features/transactions/index.ts">{`export * from "./TransactionList";
export * from "./TransactionRow";
export * from "./FilterBar";
export * from "./AddTransactionForm";
export * from "./useTransactions";
export * from "./exportToCsv";
export * from "./formatAmount";`}</Code>

      <Code kind="bad" caption="features/dashboard/Totals.tsx: and this is all it takes">{`import { formatAmount } from "../transactions";   // wanted: twelve lines of formatting`}</Code>

      <Callout kind="trap" title="One named import, seven modules">
        <p>
          <strong>First, importing anything from the barrel evaluates the
          barrel.</strong> To give you <code>formatAmount</code>, the bundler has to process{' '}
          <code>index.ts</code>, and <code>index.ts</code> imports all seven modules. The
          dashboard chunk now contains the add-transaction form and the CSV exporter, for
          one formatting helper.
        </p>
        <p>
          <strong>Second, tree-shaking is supposed to remove the rest, and it often
          cannot.</strong> If any module in that graph does something at module scope — a{' '}
          <code>mermaid.initialize()</code>, a CSS import, a polyfill, registering a
          validator — the bundler must assume removing it would change behaviour, so it keeps
          the chain. This is why finding 2&apos;s module-scope <code>initialize()</code> call
          matters beyond tidiness. And you cannot tell by reading the import whether shaking
          worked; you can only tell by reading the output.
        </p>
        <p>
          <strong>Third, and this is the trap: barrels manufacture import cycles and then
          hide them.</strong> The dashboard imports the transactions barrel, which imports{' '}
          <code>TransactionList</code>, which needs one thing from the dashboard and imports{' '}
          <em>its</em> barrel. The cycle now runs through two files nobody wrote
          intentionally, and the symptom is an import that is <code>undefined</code> at
          runtime with a stack trace pointing at neither end of the loop. Without the
          barrels, the same mistake would have been one obviously circular import.
        </p>
      </Callout>

      <Callout kind="warn" title="The tell">
        <p>
          An import whose path ends at a <strong>folder</strong> rather than a file, crossing
          out of that folder&apos;s own feature. Inside the feature it is harmless, because
          the code is in the chunk already.
        </p>
      </Callout>

      <Code kind="good" caption="features/dashboard/Totals.tsx">{`import { formatAmount } from "../../lib/formatAmount";
// Named the file, so the bundler brings the file. And note where it went:
// a formatter with no idea what a transaction is belongs in lib/, which is
// finding 5 on Boundaries & structure.`}</Code>

      <Callout kind="good" title="When a barrel is worth having">
        <p>
          When it is a <strong>deliberate public surface</strong> rather than a convenience:
          a hand-written list of the three things outside the feature may use, so the file
          doubles as documentation of what is shared. Three named re-exports, no{' '}
          <code>export *</code>, and deep paths used within the feature itself.
        </p>
        <p>
          <code>export *</code> from every file in the folder is the version with the costs
          and none of the benefit — it documents nothing, since it names everything.
        </p>
      </Callout>

      <h2 className="section" id="four">
        4. lazy() called during render
      </h2>

      <p className="para">
        The dashboard chart is heavy and only shown when a toggle is on, so it should be
        lazy. <code>lazy()</code> needs the component, the component is used here, so the
        call goes here. The logic is sound and the result is the worst bug on this page.
      </p>

      <Code kind="bad" caption="features/dashboard/Dashboard.tsx">{`export function Dashboard({ showChart }) {
  const SpendChart = lazy(() => import("./SpendChart"));

  return showChart ? (
    <Suspense fallback={<Spinner />}>
      <SpendChart />
    </Suspense>
  ) : null;
}`}</Code>

      <Callout kind="trap" title="This one is broken on the second render, not in three months">
        <p>
          <strong>First, every render creates a new component type.</strong>{' '}
          <code>lazy()</code> returns a new object each time it is called, and React decides
          whether to keep a subtree by comparing element types by identity. A new type means
          "different component", so React unmounts the chart and mounts a fresh one on{' '}
          <em>every render of the dashboard</em>. The chart loses its zoom, its hover state
          and its internal state, and re-runs every effect it has.
        </p>
        <p>
          <strong>Second, the fallback flashes every time.</strong> Each new lazy component
          starts with an unresolved promise of its own, so the Suspense boundary drops back
          to the spinner. The module is already in the browser cache and resolves almost
          instantly, which is why this reads as a flicker rather than a load — a spinner
          blinking over a chart that has been downloaded for ten minutes.
        </p>
        <p>
          <strong>Third, and this is the trap: if the chart fetches on mount, it now fetches
          on every parent render.</strong> Remounting re-runs the effects, so the change you
          made to reduce bundle size is issuing a network request per render of the parent.
          The report that comes back is "the dashboard hammers the API", which looks like a
          data-fetching bug and gets investigated in the data layer, nowhere near the line
          that caused it.
        </p>
      </Callout>

      <Callout kind="warn" title="The tell">
        <p>
          <code>lazy(</code> indented inside a function body. It belongs at module scope,
          with the imports — the same way you would not call{' '}
          <code>createContext()</code> inside a component. Both make a thing whose{' '}
          <strong>identity is the point</strong>.
        </p>
      </Callout>

      <Code kind="good" caption="features/dashboard/Dashboard.tsx">{`// Module scope: created once, so the type is stable and the subtree survives.
const SpendChart = lazy(() => import("./SpendChart"));

export function Dashboard({ showChart }) {
  return showChart ? (
    <Suspense fallback={<ChartSkeleton />}>
      <SpendChart />
    </Suspense>
  ) : null;
}`}</Code>

      <Code kind="good" caption="When which component to load really is dynamic">{`// A stable map at module scope, so each type is created exactly once and
// picking one is a lookup rather than a construction.
const CHARTS = {
  spend: lazy(() => import("./SpendChart")),
  category: lazy(() => import("./CategoryChart")),
  trend: lazy(() => import("./TrendChart")),
};

const Chart = CHARTS[kind];`}</Code>

      <Callout kind="good" title="The rule, in one line">
        <p>
          <code>lazy()</code> lives at <strong>module scope, always</strong>. It makes a
          component type, and a type created during render is a new type every render — which
          React reads as a different component.
        </p>
      </Callout>

      <h2 className="section" id="five">
        5. The Suspense boundary that blanks the app
      </h2>

      <p className="para">
        Lazy routes need a Suspense boundary somewhere above them. One boundary at the top
        covers every route at once, so it goes around the whole app and the job is done in
        one line.
      </p>

      <Code kind="bad" caption="app/App.tsx">{`<Suspense fallback={<FullPageSpinner />}>
  <AppShell>
    <Sidebar />
    <Header />
    <Routes>{/* every route lazy */}</Routes>
  </AppShell>
</Suspense>`}</Code>

      <Callout kind="trap" title="Everything inside a boundary disappears, and that includes the navigation">
        <p>
          <strong>First, clicking a nav item deletes the nav.</strong> The sidebar and header
          are inside the boundary, so while the next route&apos;s chunk downloads, React
          replaces all of it with the spinner — including the thing the user just clicked,
          which was already loaded and had no reason to move. Every navigation is a full-page
          white flash.
        </p>
        <p>
          <strong>Second, losing the sidebar loses the only feedback there was.</strong> With
          the nav gone there is no active-item highlight and no indication of where you are
          heading, so for the three hundred milliseconds of the fetch the user has no
          evidence their click registered. The reliable human response to that is to click
          again.
        </p>
        <p>
          <strong>Third, and this is the trap: one slow chunk sets the tone for all of
          them.</strong> Add a route whose chunk is 400 KB and <em>every</em> navigation
          starts feeling like that one, because they all produce the identical full-page
          spinner and the user generalises. The fix is not to shrink the chunk; it is to move
          the boundary four lines down, so the slow route costs a panel instead of the
          application.
        </p>
      </Callout>

      <Code kind="good" caption="app/App.tsx">{`<AppShell>
  <Sidebar />           {/* already loaded, so it stays on screen */}
  <Header />
  <Suspense fallback={<PanelSkeleton />}>
    <Routes>{/* every route lazy */}</Routes>
  </Suspense>
</AppShell>`}</Code>

      <Callout kind="good" title="And make the fallback the shape of what is coming">
        <p>
          A skeleton occupying the same space as the real content means the layout does not
          jump when the chunk lands. A centred spinner is a different height from every
          screen it stands in for, so it guarantees a reflow at the exact moment the user
          starts reading.
        </p>
      </Callout>

      <Callout kind="good" title="The rule, in one line">
        <p>
          A Suspense boundary should wrap the <strong>smallest region that is actually
          changing</strong>. Everything inside it vanishes while it waits, so put it exactly
          where the new content goes and not one level higher.
        </p>
      </Callout>

      <h3 className="sub" id="five-overdo">
        Can you split too much?
      </h3>

      <p className="para">
        Yes, and it is the failure mode of a team that has just read a page like this one.
        Splitting is not free: each chunk is a request, and a request has latency that does
        not shrink with the file.
      </p>

      <Table
        caption="Which split points pay"
        head={['Split point', 'Worth it?']}
        rows={[
          [
            'A route',
            'Almost always. The user has clicked and expects a transition, and the chunk boundary matches a boundary they already understand.',
          ],
          [
            'One large dependency',
            'Yes, when the first screen does not render it. This is where the big single wins are — finding 2 is 510 KB of one.',
          ],
          [
            'A modal, editor or chart behind an interaction',
            'Usually. It is not on screen at load, and the click that reveals it is a moment the user accepts a short wait.',
          ],
          [
            'A 4 KB presentational component',
            'No. You have traded a few kilobytes inside an existing request for a whole new round trip, which on a high-latency connection is a straight loss.',
          ],
        ]}
      />

      <h2 className="section" id="tells">
        The tells, in one table
      </h2>

      <Table
        caption="What to look for, and what it costs"
        head={['If you see this', 'The problem', 'What it should be']}
        rows={[
          [
            'A <Route element> whose component was statically imported',
            'Every screen ships in the chunk the router lives in, so the first screen pays for all of them. The regression arrives one invisible line per pull request.',
            'lazy() per route at module scope, with the first-paint screen left eager.',
          ],
          [
            'A top-level import of a large library',
            'It lands in whatever chunk its importer lands in, four static imports away from the entry point. Everyone downloads and parses it; a fraction reach the feature.',
            'lazy() the component that uses it, or a dynamic import inside the effect with a module-scope promise cache.',
          ],
          [
            'An import ending at a folder, from outside that folder',
            'The barrel is evaluated in full, so one named import brings every module it re-exports. A module-scope side effect anywhere in the chain stops tree-shaking from saving you.',
            'Import the file. Keep a barrel only as a hand-written public surface, never as export * per file.',
          ],
          [
            'lazy() inside a component body',
            'A new component type per render, so the subtree unmounts and remounts: state lost, fallback flashing, and every effect — including fetches — re-run on each parent render.',
            'lazy() at module scope. If the choice is dynamic, a stable map of lazy components at module scope.',
          ],
          [
            'One Suspense boundary wrapping the app shell',
            'The nav disappears during every navigation, removing the only feedback the click produced, and the slowest chunk defines how all navigation feels.',
            'The boundary around the route outlet only, with a skeleton shaped like the content that is arriving.',
          ],
        ]}
      />

      <h3 className="sub" id="common">
        What these five have in common
      </h3>

      <p className="para">
        Three of them are the same fact in different clothing: a static <code>import</code>{' '}
        is a decision about <strong>what ships together</strong>, made at the top of a file
        where it reads like a decision about what a module needs. The other two are the
        repair being applied wrongly — <code>lazy()</code> in the wrong scope and{' '}
        <code>Suspense</code> at the wrong height — which is worth noticing on its own,
        because both of those look like code splitting in review and both produce something
        worse than not splitting at all.
      </p>

      <p className="para">
        They are also the hardest group on this guide to catch by reading, because the
        evidence is not in the diff. The import looks correct, the component looks correct,
        and the cost only exists in the output. Two of these were sitting in this repo
        while every page of it was reviewed. The one habit that would have caught them is
        reading the chunk list that <code>npm run build</code> prints — and then asking of
        the biggest line: <strong>does the first screen need this?</strong>
      </p>
    </>
  )
}
