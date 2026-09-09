import { useEffect, useState } from 'react'
import HooksSection from './cheatsheet/HooksSection'
import GotchasSection from './cheatsheet/GotchasSection'
import PerfSection from './cheatsheet/PerfSection'
import StructureSection from './cheatsheet/StructureSection'
import RoutingSection from './cheatsheet/RoutingSection'
import AuthSection from './cheatsheet/AuthSection'
import ApiSection from './cheatsheet/ApiSection'
import ReferenceSection from './cheatsheet/ReferenceSection'

const TABS = [
  { id: 'hooks',     label: 'Hooks',        blurb: 'All 18 hooks, when to use which' },
  { id: 'gotchas',   label: 'Tips & Traps', blurb: 'Cleanup, leaks, stale closures' },
  { id: 'perf',      label: 'Performance',  blurb: 'memo, useMemo, transitions' },
  { id: 'structure', label: 'Structure',    blurb: 'Folders that scale' },
  { id: 'routing',   label: 'Routing',      blurb: 'Nested routes + lazy loading' },
  { id: 'auth',      label: 'Auth & RBAC',  blurb: 'Interceptors, context, guards' },
  { id: 'api',       label: 'API Calls',    blurb: 'GET/POST + error handling' },
  { id: 'reference', label: 'Reference',    blurb: 'Decision table + checklist' },
] as const

type TabId = (typeof TABS)[number]['id']

const SECTIONS: Record<TabId, () => React.JSX.Element> = {
  hooks: HooksSection,
  gotchas: GotchasSection,
  perf: PerfSection,
  structure: StructureSection,
  routing: RoutingSection,
  auth: AuthSection,
  api: ApiSection,
  reference: ReferenceSection,
}

function readHash(): TabId {
  const h = window.location.hash.replace('#', '')
  return (TABS.some((t) => t.id === h) ? h : 'hooks') as TabId
}

export default function Cheatsheet() {
  const [tab, setTab] = useState<TabId>(readHash)

  // keep the hash in sync so a tab is linkable and survives a refresh
  useEffect(() => {
    window.history.replaceState(null, '', `#${tab}`)
  }, [tab])

  function select(id: TabId) {
    setTab(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const Section = SECTIONS[tab]
  const active = TABS.find((t) => t.id === tab)!

  return (
    <div className="cheatsheet">
      <h1 className="lesson-title">React Cheatsheet</h1>
      <p className="lesson-sub">
        Every hook, the traps that cause real bugs, and the workflows almost every app needs: structure, routing,
        auth, RBAC and API calls.
      </p>

      <nav className="cs-tabs" aria-label="Cheatsheet sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`cs-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => select(t.id)}
            aria-current={tab === t.id}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <p className="cs-blurb">{active.blurb}</p>

      <Section />
    </div>
  )
}
