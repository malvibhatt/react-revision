import type { ReactNode } from 'react'

/**
 * Coloured aside. The kind is always announced in words as well as colour, so
 * it survives greyscale and colour blindness (WCAG 1.4.1).
 *
 * `trap` is the workhorse of the code-review pages: it holds the numbered,
 * escalating "what this costs you" beat. `why` carries reasoning, `good` the
 * closing one-line rule.
 */
export type CalloutKind = 'trap' | 'warn' | 'good' | 'why' | 'note'

const CALLOUT_LABELS: Record<CalloutKind, [string, string]> = {
  trap: ['Common trap', '✕'],
  warn: ['Watch out', '▲'],
  good: ['Good practice', '✓'],
  why: ['Why this matters', '◆'],
  note: ['Note', 'i'],
}

interface Props {
  kind?: CalloutKind
  /** Replaces the default wording. Make it a claim, not a topic. */
  title?: string
  children: ReactNode
}

export default function Callout({ kind = 'note', title, children }: Props) {
  const [defaultTitle, glyph] = CALLOUT_LABELS[kind] ?? CALLOUT_LABELS.note
  return (
    <aside className={`callout callout--${kind}`}>
      <p className="callout__label">
        <span aria-hidden="true">{glyph}</span>
        {title ?? defaultTitle}
      </p>
      {children}
    </aside>
  )
}
