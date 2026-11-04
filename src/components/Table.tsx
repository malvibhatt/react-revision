import type { ReactNode } from 'react'

interface Props {
  /** Always rendered for screen readers; pass `hideCaption` to drop it visually. */
  caption?: string
  head: string[]
  rows: ReactNode[][]
  /** First cell of each row becomes a row header. True for every lookup table. */
  strongFirst?: boolean
  hideCaption?: boolean
}

/**
 * Lookup table. The main consumer is the "tells" table that closes each
 * code-review page: `If you see this | The problem | Where it should go`.
 *
 * Wide tables scroll inside the wrapper, never on the page.
 */
export default function Table({
  caption,
  head,
  rows,
  strongFirst = true,
  hideCaption = false,
}: Props) {
  return (
    <div className="table-wrap">
      <table className="map">
        {caption && <caption className={hideCaption ? 'sr-only' : undefined}>{caption}</caption>}
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Index keys are safe here: rows are static literals that never reorder. */}
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) =>
                j === 0 && strongFirst ? (
                  <th key={j} scope="row" className="row-head">
                    {cell}
                  </th>
                ) : (
                  <td key={j}>{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
