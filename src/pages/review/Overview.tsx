import { Link } from 'react-router-dom'
import Code from '../../components/Code'
import Callout from '../../components/Callout'
import Table from '../../components/Table'
import { reviewPages } from './reviewPages'

const beats = [
  ['The setup', 'Why a competent person writes this.'],
  ['The code', 'Eight to fourteen realistic lines.'],
  ['The cost', 'Numbered consequences, worst last.'],
  ['The tell', 'What you can spot while editing.'],
  ['The fix', 'Often split, because the split is the lesson.'],
  ['The rule', 'One line you can still recall at 5pm.'],
]

export default function ReviewOverview() {
  return (
    <>
      <h1 className="lesson-title">React Code Review</h1>
      <p className="lesson-sub">
        Twenty-five mistakes that pass review, each shown as the code that causes it,
        what it costs you later, and the version that avoids it.
      </p>

      <div className="highlight">
        Every finding here is the <strong>easy</strong> version of something: fewer
        keystrokes, fewer files, and the data arriving right where it is used. That is
        why they are worth writing down rather than trusting to judgement. None of them
        looks like a mistake at the moment you make it.
      </div>

      <h2 className="section" id="how">
        How a finding is put together
      </h2>

      <p className="para">
        Six beats, always in this order. The order is the whole point: a rule you are
        told is a rule you forget, and a rule you have watched break is one you keep.
      </p>

      <div className="flow flow--beats">
        {beats.map(([name, note], i) => (
          <div className="flow-step" key={name}>
            <span className="flow-n">{i + 1}</span>
            <div>
              <strong>{name}</strong>
              <p>{note}</p>
            </div>
          </div>
        ))}
      </div>

      <Callout kind="why" title="Why the setup comes first">
        <p>
          If the bad code looks stupid, the finding is worthless. Nobody recognises
          themselves in obviously bad code, so nothing gets caught in review. Each
          finding opens by naming the instinct the mistake satisfies, and most of those
          instincts are good ones: don't repeat yourself, keep data near where it is
          used, don't add a file you don't need yet.
        </p>
      </Callout>

      <h2 className="section" id="example">
        The format, on a bug you already know
      </h2>

      <p className="para">
        Read this one for the shape rather than the content. The dashboard refetches its
        totals whenever the selected month changes, so the month goes in the dependency
        array.
      </p>

      <Code kind="bad" caption="features/dashboard/Totals.tsx">{`export function Totals({ month, year }) {
  const [totals, setTotals] = useState(null);

  useEffect(() => {
    fetchTotals({ month, year }).then(setTotals);
  }, [{ month, year }]);   // a fresh object on every render

  return <TotalsGrid totals={totals} />;
}`}</Code>

      <Callout kind="trap" title="What this does on a slow connection">
        <p>
          <strong>First, the effect runs on every render.</strong> React compares
          dependencies by identity, and an object literal is a new value each time, so
          the array never matches the previous one. The effect is now a render loop:
          fetch, set state, render, fetch.
        </p>
        <p>
          <strong>Second, it is invisible in development.</strong> On localhost the
          request takes four milliseconds and the dashboard looks fine. The bug shows up
          as a network tab nobody opened, and as a bill nobody attributed to this
          component.
        </p>
        <p>
          <strong>Third, the responses arrive out of order.</strong> Twelve requests are
          now in flight for the same panel, and whichever one resolves last wins. Change
          the month while the earlier ones are still running and the totals you end up
          looking at belong to a month you are no longer on.
        </p>
      </Callout>

      <Callout kind="warn" title="The tell">
        <p>
          A dependency array containing <code>{'{'}</code>, <code>[</code> or an arrow.
          Anything constructed inline is a new reference, and a new reference means the
          dependency always differs. The same tell applies to props handed to a
          memoized child.
        </p>
      </Callout>

      <Code kind="good" caption="features/dashboard/Totals.tsx">{`useEffect(() => {
  fetchTotals({ month, year }).then(setTotals);
}, [month, year]);   // two primitives, compared by value`}</Code>

      <Callout kind="good" title="The rule, in one line">
        <p>
          A dependency array holds <strong>primitives, or values you own the identity
          of</strong>. If you cannot point at where a dependency's reference is kept
          stable, it is not stable.
        </p>
      </Callout>

      <p className="para">
        That is the shape of all twenty-five. The dependency array one is the easiest to
        believe because most people have shipped it; the rest are the same thing with a
        longer fuse. Its full treatment, along with the cleanup version, is on{' '}
        <Link to="/review/effects-and-leaks">Effects &amp; leaks</Link>.
      </p>

      <h2 className="section" id="app">
        The codebase these examples live in
      </h2>

      <p className="para">
        Consequences stop landing when they are hypothetical, so every finding is set in
        one app: <strong>TrackWise</strong>, a personal finance tracker. Same folders and
        same tickets throughout, so the findings accumulate into one codebase instead of
        twenty-five unrelated snippets.
      </p>

      <Table
        caption="The cast, reused on every page"
        head={['Where', 'What is in it']}
        rows={[
          ['features/transactions/', 'The list, the filters, the add form. The busiest screen and the longest list.'],
          ['features/dashboard/', 'Monthly totals and charts. Heavy to render, cheap to get wrong.'],
          ['features/auth/', 'Login, the token refresh, the route guards.'],
          ['data/', 'Every call to the API, one module per call. Nothing else imports the HTTP client.'],
          ['lib/', 'Generic helpers. Must be copyable into a different product unchanged.'],
        ]}
      />

      <h2 className="section" id="scope">
        What this is, and what it is not
      </h2>

      <Table
        caption="Scope"
        head={['This section', 'Elsewhere in the deck']}
        rows={[
          [
            'Why a mistake costs you, three months out',
            <>
              What a hook <em>is</em>, and its signature: the{' '}
              <Link to="/cheatsheet">cheatsheet</Link>.
            </>,
          ],
          [
            'Findings long enough to argue with',
            <>
              The same traps in one-line recall form:{' '}
              <Link to="/common-mistakes">Common mistakes</Link>.
            </>,
          ],
          [
            'Patterns you can look for in a diff',
            <>
              Concept-by-concept explanation: the eight{' '}
              <Link to="/">concept pages</Link>.
            </>,
          ],
        ]}
      />

      <Callout kind="note" title="The overlap with Common mistakes is deliberate">
        <p>
          Mutation, hook order and <code>key={'{i}'}</code> appear on both. That page is
          the version you skim before an interview. This one is the version you read when
          a reviewer has asked you to justify a change, or when something is broken and
          the code looks fine.
        </p>
      </Callout>

      <h2 className="section" id="pages">
        The five pages
      </h2>

      <div className="grid">
        {reviewPages.map((p, i) => (
          <Link key={p.slug} to={`/review/${p.slug}`} className={`card${p.Page ? '' : ' pending'}`}>
            <div className="num">
              Page {String(i + 1).padStart(2, '0')}
              {!p.Page && <span className="card-flag">Not written yet</span>}
            </div>
            <h3>{p.nav}</h3>
            <p>{p.blurb}</p>
          </Link>
        ))}
      </div>
    </>
  )
}
