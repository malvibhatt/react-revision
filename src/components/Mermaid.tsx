import { useEffect, useId, useState } from 'react'
import mermaid from 'mermaid'

// dark palette to match the app shell, so diagrams don't burn a white hole in the page
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    background: '#1e293b',
    primaryColor: '#1e293b',
    primaryBorderColor: '#6366f1',
    primaryTextColor: '#e2e8f0',
    secondaryColor: '#0d1117',
    tertiaryColor: '#0d1117',
    lineColor: '#94a3b8',
    textColor: '#e2e8f0',
    mainBkg: '#1e293b',
    nodeBorder: '#6366f1',
    clusterBkg: '#0d1117',
    edgeLabelBackground: '#0f172a',
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    fontSize: '14px',
  },
  // useMaxWidth:false keeps labels at full size on wide charts; the host scrolls instead of shrinking them
  flowchart: { curve: 'basis', htmlLabels: true, useMaxWidth: false },
})

interface Props {
  chart: string
}

export default function Mermaid({ chart }: Props) {
  const id = useId().replace(/:/g, '_')       // mermaid ids must be CSS-selector safe
  const [svg, setSvg] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    mermaid
      .render(`m-${id}`, chart.trim())
      .then(({ svg }) => alive && setSvg(svg))
      .catch((e) => alive && setError(String(e?.message ?? e)))
    return () => { alive = false }
  }, [chart, id])

  if (error) return <pre className="code">Diagram failed to render: {error}</pre>

  return <div className="mermaid-host" dangerouslySetInnerHTML={{ __html: svg }} />
}
