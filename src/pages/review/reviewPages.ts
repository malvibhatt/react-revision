import { lazy } from 'react'
import type { ComponentType } from 'react'

/**
 * ONE list drives the router, the sidebar group and the overview index.
 * Adding a page means adding `Page` to an entry here and nothing else.
 *
 * Entries without a `Page` are planned but not written, and render the shared
 * Pending placeholder instead.
 *
 * `lazy` is called here at module scope and never inside a component: calling
 * it during render makes a new component type every render and remounts the
 * subtree. That is finding 4 on the "Loading only what's needed" page, so this
 * file had better not commit it.
 */
export interface ReviewPage {
  slug: string
  /** Sidebar wording, kept short. */
  nav: string
  /** Page heading. A claim where possible, not a topic. */
  title: string
  blurb: string
  /** What the page's findings are, for the overview cards. */
  covers: string[]
  Page?: ComponentType
}

export const reviewPages: ReviewPage[] = [
  {
    slug: 'effects-and-leaks',
    Page: lazy(() => import('./EffectsAndLeaks')),
    nav: 'Effects & leaks',
    title: 'The effect that never cleaned up',
    blurb:
      'Timers, listeners and subscriptions that outlive the component that made them, and the requests that resolve into a component nobody is looking at.',
    covers: [
      'An interval with no clearInterval, twice over in StrictMode',
      'Listeners that accumulate one per navigation',
      'A subscription with no unsubscribe',
      'The fetch race where the slow answer wins',
      'The effect that should not have been an effect',
    ],
  },
  {
    slug: 'rerenders',
    Page: lazy(() => import('./Rerenders')),
    nav: 'Re-renders & memoization',
    title: 'Work that happens for no reason',
    blurb:
      'Why the profiler shows a hundred renders of a row that did not change, and why most fixes are a deletion rather than another useMemo.',
    covers: [
      'The context value rebuilt on every render',
      'React.memo defeated by an inline prop',
      'key={i} on a list that reorders',
      'useMemo where it pays, and where it costs',
      'Colocation instead of memoization',
    ],
  },
  {
    slug: 'load-only-whats-needed',
    Page: lazy(() => import('./LoadOnlyWhatsNeeded')),
    nav: "Loading only what's needed",
    title: 'Everything, downloaded on the login screen',
    blurb:
      'What ends up in the first bundle when every import sits at the top of a file, and the four ways code splitting gets added and then quietly undone.',
    covers: [
      'Routes imported eagerly at the app root',
      'A heavy library at module top level (this repo does it with mermaid)',
      'The barrel file that drags in a whole feature',
      'lazy() called inside a component body',
      'The Suspense boundary placed too high',
    ],
  },
  {
    slug: 'boundaries',
    Page: lazy(() => import('./Boundaries')),
    nav: 'Boundaries & structure',
    title: 'Where the code went, and what it cost',
    blurb:
      'The imports that fuse two features together, and the files that end up impossible to reuse or test because of where they live.',
    covers: [
      'The fetch client imported straight into a component',
      'A sideways import between features, and the prop that gives it away',
      'The route file that became the app',
      'Business logic living in JSX',
      'lib/ importing from features/',
    ],
  },
  {
    slug: 'state-correctness',
    Page: lazy(() => import('./StateCorrectness')),
    nav: 'State correctness',
    title: 'State that is wrong, not just slow',
    blurb:
      'The bugs that survive review because the code reads correctly: stale values, duplicated truth, and failures that render as emptiness.',
    covers: [
      'Mutation, and why React sees nothing',
      'The stale closure in a callback registered once',
      'Server data copied into useState with no invalidation',
      'Six useState calls that are one state machine',
      'The failed request that renders as "no transactions"',
    ],
  },
]

export const findReviewPage = (slug: string | undefined) =>
  reviewPages.find((p) => p.slug === slug)
