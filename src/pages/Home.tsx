import { Link } from "react-router-dom";

const cards = [
  {
    num: "Concept 01",
    to: "/components-props",
    title: "Components + Props",
    desc: "JSX-returning functions and how to pass typed props with TS interfaces.",
  },
  {
    num: "Concept 02",
    to: "/use-state",
    title: "useState",
    desc: "Local state hook, functional updates, and the never-mutate rule.",
  },
  {
    num: "Concept 03",
    to: "/use-memo",
    title: "useMemo",
    desc: "Cache derived values so they only re-run when dependencies change.",
  },
  {
    num: "Concept 04",
    to: "/use-effect",
    title: "useEffect",
    desc: "Side effects after render, dependency array control, cleanup functions.",
  },
  {
    num: "Concept 05",
    to: "/context-api",
    title: "Context API",
    desc: "Share state without prop drilling — the React answer to Angular services.",
  },
  {
    num: "Concept 06",
    to: "/router",
    title: "React Router",
    desc: "Client-side navigation with BrowserRouter, Routes, and Link.",
  },
  {
    num: "Concept 07",
    to: "/conditional-rendering",
    title: "Conditional Rendering",
    desc: "Early returns, &&, and ternaries — the JSX way of *ngIf.",
  },
  {
    num: "Reference",
    to: "/angular-bridge",
    title: "Angular → React Map",
    desc: "Direct table of Angular features and their React equivalents.",
  },
  {
    num: "Reference",
    to: "/common-mistakes",
    title: "Common Mistakes",
    desc: "Traps to remember: mutation, stale state, hook rules.",
  },
];

export default function Home() {
  return (
    <>
      <div className="hero">
        <h1>React — Revision Deck</h1>
      </div>
      <div className="grid">
        <Link to="/cheatsheet" className="card featured">
          <div className="num">Start here</div>
          <h3>⚛ React Cheatsheet</h3>
          <p>
            Every hook, the traps that cause real bugs, and the workflows almost
            every app needs — structure, routing, auth, RBAC and API calls, with
            the full auth workflow drawn out as diagrams.
          </p>
          <span className="card-cta">Open the cheatsheet →</span>
        </Link>

        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="card">
            <div className="num">{c.num}</div>
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
