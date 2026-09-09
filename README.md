# React Revision Deck

**A revision tool for people who already know React.**

Not a tutorial. Not a course. A deck you open the night before an interview, the morning you
start a new feature, or the moment you think *"I know there's a right way to do this. What was
it again?"*

Every concept lives on exactly one page: the rule you need to remember, the code that proves it,
and a live demo you can poke at. No scrolling through forty minutes of video to find the one
paragraph you actually forgot.

---

## Why this works when tutorials don't

Re-learning is slow because tutorials optimise for the *first* time you see something. Revision
needs the opposite: **maximum signal, zero setup, instant recall.**

| Tutorials give you | This deck gives you |
| --- | --- |
| Long explanations of what a hook *is* | One line on **when to reach for it**, and when not to |
| Code you type along with | Code you **read in five seconds** and recognise |
| Happy-path examples | The **trap**, and the reason it bites |
| "It depends" | A decision table that picks for you |

Every hook entry answers the only two questions that matter under pressure: **when do I use
this**, and **when does it hurt me**. Every gotcha ships with the *reason* behind it, because a
rule you understand is a rule you keep.

---

## What's inside

### 📘 Concept pages: one idea, one page

Eight concepts, each with a live interactive demo you can break:

`Components + Props` · `useState` · `useMemo` · `useEffect` · `Context API` ·
`React Router` · `Conditional Rendering` · `Async data & APIs`

Plus two reference pages: an **Angular → React mental model** (direct translation table for
anyone arriving from Angular) and **Common Mistakes**: mutation, stale state, hook rules.

### ⚛ The Cheatsheet: eight tabs, everything a real app needs

The centrepiece. Tabbed, deep-linkable, and built around the workflows you actually ship.

| Tab | What it covers |
| --- | --- |
| **Hooks** | All **18 hooks**, searchable by name *or by the problem you have* ("expensive", "listener", "form"), filterable by category, each with signature, when-to-use, when-to-avoid and runnable code |
| **Tips & Traps** | Cleanup, memory leaks, stale closures, each with the reasoning, not just the rule |
| **Performance** | `memo` done right, the memoized context value, and why **colocation beats memoization** |
| **Structure** | Folder layouts that scale, a feature's public surface, path aliases, composing providers |
| **Routing** | Nested route trees, layout routes, lazy-loading checklist, scroll restoration & 404s |
| **Auth & RBAC** | The full production auth stack, plus **workflow diagrams** (see below) |
| **API Calls** | A reusable fetch hook with loading/error/abort, all four render states, POST with field errors and no double-submit, and the same thing in React Query |
| **Reference** | An "I need to… → use this" decision table, custom hooks worth owning, and a pre-ship checklist |

### 🔐 Auth & RBAC, drawn out properly

The tab that goes deepest, covering the parts most cheatsheets skip:

- The **axios instance**, request interceptor, and a response interceptor that **refreshes once
  and replays the queue** instead of firing five refresh calls for five simultaneous 401s
- `AuthContext` with a `loading` status, so a page refresh doesn't flash the login screen
- Route guards vs. UI guards: `<ProtectedRoute>`, `<RoleRoute>`, and a `<Can>` component
- Roles mapped to permissions in one file, so adding a role is a one-line change
- **Five mermaid workflow diagrams**: the master auth + RBAC + interceptor architecture, then a
  worked example each for login, an allowed admin route, a permission-denied route, and an
  unauthenticated one
- A blunt reminder that **client-side RBAC is UX, not security**. The API enforces the rules

---

## Highlights

- **Zero-friction recall**: search a hook by the problem, not the name
- **Live demos**, not screenshots: state, effects, memoization and routing running in front of you
- **Syntax-highlighted code** with a hand-rolled highlighter, so no 200 KB library for a revision app
- **Deep-linkable tabs**: `#auth` in the URL, so you can bookmark the section you keep forgetting
- **Dark by default**, tuned for long reading sessions
- **React 19 current**: `use`, `useActionState`, `useOptimistic` and `useFormStatus` included

---

## Tech stack

React 19 · TypeScript · Vite · React Router 7 · Mermaid · Oxlint

No UI framework, no CSS library. Hand-written CSS with design tokens, so the whole thing stays
readable and fast.

---

## Run it locally

```bash
npm install
npm run dev
```

| Script | Does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) and build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Oxlint |

## Deploy

Deploys to Vercel as-is, and the Vite preset is detected automatically (build `npm run build`,
output `dist`). [`vercel.json`](vercel.json) adds the SPA rewrite that `BrowserRouter` needs, so
deep links like `/cheatsheet#auth` survive a hard refresh instead of 404ing.

---

## Project structure

```
src/
├── components/
│   ├── Code.tsx           # syntax highlighter
│   └── Mermaid.tsx        # dark-themed diagram renderer
├── pages/
│   ├── Home.tsx           # the overview deck
│   ├── Cheatsheet.tsx     # tab shell + hash sync
│   ├── cheatsheet/        # one file per tab
│   │   ├── hooksData.ts       # all 18 hooks
│   │   └── authDiagrams.ts    # the workflow diagrams
│   └── …                  # one file per concept page
└── index.css              # tokens + every component style
```

---

*Built while revising the React concepts behind TrackWise, kept around because it turned out to
be the fastest way back into any of them.*
