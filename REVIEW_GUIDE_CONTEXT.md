# React Code Review Guide — build context

A brief for a new section inside `react-revision`: a set of pages that teach React
code review the way `ArchitectureNotes.jsx` (MoneyHelm guide) teaches architecture
mistakes — **the code that causes it, what it costs you later, the version that avoids it.**

This file is the context, not the content. Read it before writing any page.

---

## 1. What this section is

Not a rules list. Not a lint config in prose. A set of **findings**, each one a mistake
that looks like reasonable code in review and only reveals itself later.

The reader is someone who already knows React (that is the whole premise of this repo)
and is about to review a pull request, or has just been told their page is slow and
doesn't know which of twelve things is wrong. They need to recognise a shape, not learn
a concept.

**Scope**: performance and re-renders, lifecycle and leaks, loading and bundle size,
architecture and boundaries, state correctness. Explicitly *not* a React tutorial —
the concept pages already exist and should be linked to rather than re-explained.

---

## 2. The unit of content: one finding

Every finding is written in this order. The order is the point — it is what separates
this from a tips list.

| Beat | What it does | Primitive |
| --- | --- | --- |
| **1. The setup** | One or two paragraphs on *why a competent person writes this*. Name the instinct it satisfies (avoiding duplication, keeping data near where it's used, fewer files). If the bad code looks stupid, the finding is worthless. | `<p className="para">` |
| **2. The bad code** | 8–14 lines. Realistic, runnable-looking, with a caption that is a **file path** (`features/dashboard/SpendChart.tsx`), not a label. | `<Code kind="bad" caption="…">` |
| **3. What it costs you** | The core beat. **Numbered, escalating** consequences — First / Second / Third — where the last is the one that actually traps you. Titled with a time horizon or a stake, never "Problems". | `<Callout kind="trap" title="…">` |
| **4. The tell** | The early-warning sign visible *while editing*, before the damage. A prop that only exists for one caller. A dependency array you keep silencing. A `key={i}`. | folded into beat 3, or its own `kind="warn"` |
| **5. The fix** | One to three `good` blocks. **Split them** when the fix is "this part goes here, that part goes there" — that split is usually the actual lesson. | `<Code kind="good" caption="…">` |
| **6. The rule in one line** | Closing callout. Short enough to remember at 5pm. | `<Callout kind="good" title="…">` |

### Rules that make the beats work

- **At least one consequence per page must be a bug *today*, not a future cost.**
  In `ArchitectureNotes`, the `Platform.OS === "web"` padding check is wrong on mobile
  web right now, and invisible in development because you're on a laptop. Those land
  hardest. Find the equivalent: the leak that only shows after twenty minutes on a
  tab, the race that only loses on a slow connection.
- **Anticipate the pushback in an H3.** When a reader's honest objection is "but then
  what about X?", answer it inside the finding (`### What if the list really is static?`).
  Half the credibility of the source page comes from that move.
- **Ground consequences in a real app.** `ArchitectureNotes` cites DASH-02 and GOAL-06,
  so "the dashboard and the goals list disagree" is a scenario, not a hypothetical.
  Use **TrackWise** (the app this repo was built alongside) as the standing example:
  transactions list, dashboard with charts, filters, auth. Invent stable feature names
  and reuse them across pages so the app feels like one codebase.
- **No "it depends" without a tiebreaker.** If the answer genuinely varies, give the
  question that decides it (`is this data, or presentation?` style).
- **Never show a fix you wouldn't ship.** No `// @ts-ignore`, no `eslint-disable`,
  no `useMemo` sprinkled to make a point.

---

## 3. Page shape

Each page is 4–6 findings, numbered `<h2>` with `id` anchors, then two closing sections:

- **The tells, in one table** — `If you see this | The problem | Where it should go`.
  One row per finding, written so it's scannable in a PR diff.
- **What these have in common** — the meta-point. For `ArchitectureNotes` it was
  "every one of them is the easy version, fewer keystrokes than the alternative".
  Each page needs its own version of that sentence; it's what makes the page a page
  and not a list.

Target length: comparable to `ArchitectureNotes.jsx` (~500 lines of JSX per page).
Better to cut a weak finding than to pad to five.

---

## 4. Candidate findings

Grouped into the five proposed pages. More here than will ship — pick the strongest
4–6 per page, drop the rest. Items marked **★** are the ones that carry a *bug today*.

### Page 1 — Effects & leaks
- ★ `setInterval` / `setTimeout` in an effect with no `clearInterval` — plus the
  compounding version: StrictMode double-mount means two timers, and the stale closure
  means `setN(n + 1)` freezes at 1.
- ★ `addEventListener` (resize, scroll, keydown) with no removal — the handler count
  grows per navigation, and the old handlers still call `setState` on dead components.
- Subscription with no unsubscribe. This repo has `src/eventBus.js` — use it, it's real.
- ★ `fetch` with no `AbortController`: the slow first response overwrites the fast
  second one, so switching tabs twice shows the wrong tab's data.
- An effect that shouldn't be an effect — syncing derived state into `useState`,
  which costs a double render and goes stale the moment someone adds a third input.

### Page 2 — Re-renders & memoization
- ★ Context value as an inline object: `value={{ user, setUser }}` re-renders every
  consumer in the tree on every provider render.
- `React.memo` defeated by an inline arrow or object prop — the memo is still there,
  still costing a comparison, and doing nothing.
- `key={i}` on a reorderable or filterable list: child state and inputs follow the
  index, not the row.
- `useMemo` on `a + b` (slower than computing it) next to the real case: a filter/sort
  chain over a long list, or a value feeding a memoized child.
- State lifted higher than it needs to be — colocation beats memoization. The fix is
  deleting a `useMemo`, not adding one.
- One context for everything, vs. splitting by change frequency (auth changes twice
  a session; filters change per keystroke).

### Page 3 — Loading only what's needed
- ★ Every route imported at the app root, so the login screen downloads the dashboard,
  the charts and the date-picker. `React.lazy` + `Suspense` per route is the example.
- ★ A heavy library at module top level. This repo imports **mermaid** (~800 KB) —
  `src/components/Mermaid.tsx` is a genuine case study in dynamic import.
- Barrel file (`features/x/index.ts`) dragging the whole feature in for one helper.
- `lazy()` called inside the component body — a new component type every render, so
  the subtree remounts and state is lost.
- Suspense boundary placed so high that the whole page blanks instead of one panel.
- `import _ from "lodash"` / a whole icon set for one icon.

### Page 4 — Boundaries & structure
- The fetch client / axios instance imported directly into a component (same finding
  as note 2 of the source page, translated to this stack).
- A sideways import between two features, and the prop that gives it away.
- The route file that became the app.
- Business logic living in JSX — conditionals that should be a named predicate.
- `lib/` importing from `features/` — the bottom depending on the top.
- Prop drilling through five levels where composition (`children`) solves it without
  context at all.

### Page 5 — State correctness
- Mutation: `arr.push(x); setArr(arr)`.
- ★ Stale closure in a callback registered once — the classic interval counter, and
  the functional-update fix.
- Server data copied into `useState` with no invalidation path.
- Six `useState` calls that are one state machine; when `useReducer` earns its keep.
- `useRef` vs `useState` — rendering off a ref, and mutating state that should be a ref.
- ★ Missing the empty and error states: a failed fetch rendering as "you have no
  transactions", which reads to the user as data loss.

---

## 5. What has to be built first

`react-revision` does **not** have the primitives the source pattern depends on.
`src/components/Code.tsx` takes a single `children: string` and nothing else — no
`kind`, no `caption`. There is no `Callout` and no `Table` component.

So step one is primitives, and the rule is **extend, don't duplicate**. `index.css`
already has `.col-bad`, `.col-good`, `.tag-bad`, `.tag-good`, `.danger-note`,
`.tip-card`, `.tip-head`, `.diagram-scenario`, `.highlight`, `.para`, `.section`,
`.lesson-title`, `.lesson-sub`. Reuse the tokens (`--danger`, `--success`, `--warn`,
`--accent`) and the existing class vocabulary rather than inventing a parallel one.

What to add:

| Component | Shape | Notes |
| --- | --- | --- |
| `Code` | add optional `kind?: 'bad' \| 'good' \| 'plain'` and `caption?: string` | **Keep the existing call signature working** — every current page calls `<Code>{...}</Code>` with no props. Default `kind` to `plain` and render exactly what it renders today. The header row is new markup only when `kind` or `caption` is passed. |
| `Callout` | `kind: 'trap' \| 'warn' \| 'good' \| 'why' \| 'note'`, `title?: string`, children | Label must carry a **word and a glyph**, not only colour (greyscale / colour blindness). Copy the `CALLOUT_LABELS` approach from `Doc.jsx`. |
| `Table` | `caption`, `head: string[]`, `rows: ReactNode[][]`, `strongFirst?` | First cell as `<th scope="row">`. The tells table is the main consumer. There is a `table.map` style in `index.css` already — check whether it's close enough to extend. |

Differences from the MoneyHelm guide to keep in mind:

- **TypeScript**, not JSX — these need real prop types.
- **Dark only.** No theme toggle in this repo, so no light-mode palette to maintain.
- **No `Reveal`.** The source wraps `Code`/`Table`/`Figure` in a scroll-reveal
  animation. This repo has nothing equivalent; don't port it.
- **Layout is a sidebar `<main>`**, not a `.prose` column. Pages return a bare
  fragment with `className="lesson-title"` / `"lesson-sub"` at the top. Match that.
- Long code lines must scroll **inside** the block, never the page.

---

## 6. Files and routing

```
src/pages/review/
├── Overview.tsx        # what the section is, how to read a finding, index of pages
├── EffectsAndLeaks.tsx
├── Rerenders.tsx
├── LoadOnlyWhatsNeeded.tsx
├── Boundaries.tsx
└── StateCorrectness.tsx
src/components/
├── Code.tsx            # extended in place
├── Callout.tsx         # new
└── Table.tsx           # new
```

Routes under `/review/*`, registered in `src/App.tsx`. The sidebar currently has three
`section-label` groups (Home / Concepts / Reference) built from the `lessons` and
`extras` arrays — add a fourth, **Code review**, built from a `review` array in the
same style.

Cross-link rather than re-explain: a finding about dependency arrays links to
[`/use-effect`](src/pages/UseEffect.tsx); one about memoization links to
[`/use-memo`](src/pages/UseMemo.tsx). The existing [`/common-mistakes`](src/pages/CommonMistakes.tsx)
page overlaps on mutation, `setState`-during-render and hook order — treat it as the
**quick-recall** version and this section as the **why-it-costs-you** version, and say
so on the overview page so the duplication is deliberate rather than confusing.

---

## 7. Writing voice

Match `ArchitectureNotes.jsx`, which is noticeably different from the rest of this repo:

- Second person, present tense. "You import it. It works, and it is the single most
  natural mistake on this list."
- Full sentences in the callouts, not bullet fragments.
- Concrete numbers over adjectives: "four decisions broken in nine lines", "six flags
  and nobody can change any of them safely" — not "this can cause issues".
- No hedging and no exclamation. The tone is a colleague who has debugged this one.
- Section titles are claims, not topics: "The route file that became the app",
  "What you cannot do once this exists".

---

## 8. Build order

One page per session, with a review gate after each — same cadence as the MoneyHelm guide.

1. ~~Primitives: `Code` extension + `Callout` + `Table`, with CSS.~~ **Done.**
   `Code` gained optional `kind` / `label` / `caption` and early-returns the original
   bare `<pre>` when none are passed. `Callout.tsx` and `Table.tsx` are new. CSS appended
   to `index.css` under a `CODE REVIEW PRIMITIVES` banner, reusing the existing palette.
   One deliberate change to existing pages: `<pre className="code">` now has `tabIndex={0}`
   plus a `:focus-visible` outline, because a horizontally scrolling region has to be
   reachable by keyboard.
2. ~~`review/Overview.tsx` + routing + sidebar group.~~ **Done.**
   `src/pages/review/reviewPages.ts` is the single list driving the router, the sidebar
   group and the overview index — an entry with no `Page` renders `Pending.tsx`, so all
   five pages are navigable now. `ReviewRoute.tsx` reads the slug and renders one thing.
   Overview teaches the six beats and introduces TrackWise as the standing example.
   Writing a page = add `Page: lazy(() => import('./X'))` to its entry, nothing else.
3. ~~One finding in full on Effects & leaks, then stop for review.~~ **Superseded** —
   on 2026-10-27 Malvi asked for the whole remaining scope in one pass, so the per-page
   review gate was dropped for this build.
4. ~~One page per session.~~ **Done.** All five pages written, 25 findings, each in the
   six-beat form, each with a pushback H3 where the objection was real.
5. ~~Tells tables last.~~ **Done.** Every page closes with a tells table and a
   "what these five have in common" section.

**Verification at the time of writing**: `npm run lint`, `tsc -b` and `npm run build`
clean. All six pages plus `Pending` were rendered through `renderToStaticMarkup` inside a
`MemoryRouter` as a smoke test (temporary entry, since deleted) — each content page came
out at ~30 KB of HTML with 5 bad blocks, 7–9 good blocks, 5+ trap callouts and its tells
table. **Not verified: how any of it looks.** Nobody has viewed these pages in a browser.

### Still worth doing

- **Read the five pages in a browser.** The five callout tints stacked on one page, and
  the 25-table/code-block rhythm, are the two things most likely to need adjusting by eye.
- **Fix the two findings this repo actually commits.** `LoadOnlyWhatsNeeded` findings 1
  and 2 are true of `react-revision` itself: `App.tsx` statically imports every page, and
  `App → Cheatsheet → AuthSection → Mermaid → mermaid` puts a diagram library in the
  510 KB entry chunk. The page cites its own `dist/` numbers, so fixing the repo means
  updating those numbers — and leaving it unfixed while the page describes it is a fair
  thing for a guide to do, as long as it is deliberate.
- **Live demos**, per the open decision below.

## 8a. Settled while building steps 1–2

- **Page titles are claims, not topics** — the five are named in `reviewPages.ts` and
  should not drift: "The effect that never cleaned up", "Work that happens for no
  reason", "Everything, downloaded on the login screen", "Where the code went, and what
  it cost", "State that is wrong, not just slow".
- **TrackWise folder cast is fixed** and published on the overview page:
  `features/transactions/`, `features/dashboard/`, `features/auth/`, `data/`, `lib/`.
  Every finding draws its file paths from these.
- **Headings**: `<h2 className="section" id="…">` per finding, `<h3 className="sub"
  id="…">` for the pushback sub-section. Both have `scroll-margin-top` set.
- **The overview spends one finding already** — the object-literal dependency array, used
  as the worked miniature. Its full treatment still belongs on Effects & leaks; write it
  there as the *cleanup* case so the two do not read as a repeat.

## 9. Decisions, resolved

- **Five pages, not one long one.** Settled; each is its own lazily-loaded chunk
  (~25 KB), so the whole section added nothing to first load.
- **`/common-mistakes` left alone and cross-linked.** The overview page states the
  overlap is deliberate: that page is the skim-before-an-interview version, this section
  is the read-it-when-something-is-broken version.
- **Live demos: still open, deliberately deferred.** The three findings where watching
  beats reading are the uncleaned interval (a visible timer count that climbs per
  navigation), the accumulating resize listener, and `lazy()` during render (state lost
  on every parent render). Everything else reads better than it demos.
