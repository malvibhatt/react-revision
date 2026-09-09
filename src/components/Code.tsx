import { useMemo } from 'react'

const KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
  'import', 'from', 'export', 'default', 'interface', 'type', 'class', 'new',
  'throw', 'try', 'catch', 'true', 'false', 'null', 'undefined', 'as',
  'string', 'number', 'boolean', 'void', 'async', 'await',
])

function escapeHtml(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' } as Record<string, string>)[c])
}

function highlight(src: string): string {
  const parts: string[] = []
  let i = 0
  while (i < src.length) {
    const ch = src[i]

    // line comment
    if (ch === '/' && src[i + 1] === '/') {
      const end = src.indexOf('\n', i)
      const stop = end === -1 ? src.length : end
      parts.push(`<span class="c-comment">${escapeHtml(src.slice(i, stop))}</span>`)
      i = stop
      continue
    }
    // string ' " `
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch
      let j = i + 1
      while (j < src.length && src[j] !== quote) {
        if (src[j] === '\\') j++
        j++
      }
      j = Math.min(j + 1, src.length)
      parts.push(`<span class="c-str">${escapeHtml(src.slice(i, j))}</span>`)
      i = j
      continue
    }
    // number
    if (/\d/.test(ch)) {
      let j = i
      while (j < src.length && /[\d.]/.test(src[j])) j++
      parts.push(`<span class="c-num">${escapeHtml(src.slice(i, j))}</span>`)
      i = j
      continue
    }
    // identifier / keyword / function-call
    if (/[A-Za-z_$]/.test(ch)) {
      let j = i
      while (j < src.length && /[\w$]/.test(src[j])) j++
      const word = src.slice(i, j)
      if (KEYWORDS.has(word)) {
        parts.push(`<span class="c-kw">${escapeHtml(word)}</span>`)
      } else if (src[j] === '(') {
        parts.push(`<span class="c-fn">${escapeHtml(word)}</span>`)
      } else {
        parts.push(escapeHtml(word))
      }
      i = j
      continue
    }
    parts.push(escapeHtml(ch))
    i++
  }
  return parts.join('')
}

interface Props {
  children: string
}

export default function Code({ children }: Props) {
  const html = useMemo(() => highlight(children.replace(/^\n/, '').replace(/\n$/, '')), [children])
  return <pre className="code" dangerouslySetInnerHTML={{ __html: html }} />
}
