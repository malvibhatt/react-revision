import { NavLink, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import ComponentsProps from "./pages/ComponentsProps";
import UseState from "./pages/UseState";
import UseMemo from "./pages/UseMemo";
import UseEffect from "./pages/UseEffect";
import ContextAPI from "./pages/ContextAPI";
import Router from "./pages/Router";
import ConditionalRendering from "./pages/ConditionalRendering";
import AsyncData from "./pages/AsyncData";
import AngularBridge from "./pages/AngularBridge";
import CommonMistakes from "./pages/CommonMistakes";
import Cheatsheet from "./pages/Cheatsheet";

const lessons = [
  { path: "/components-props", title: "1. Components + Props" },
  { path: "/use-state", title: "2. useState" },
  { path: "/use-memo", title: "3. useMemo" },
  { path: "/use-effect", title: "4. useEffect" },
  { path: "/context-api", title: "5. Context API" },
  { path: "/router", title: "6. React Router" },
  { path: "/conditional-rendering", title: "7. Conditional Rendering" },
  { path: "/async-data", title: "8. Async data & APIs" },
];

const extras = [
  { path: "/cheatsheet", title: "⚛ React Cheatsheet" },
  { path: "/angular-bridge", title: "Angular → React map" },
  { path: "/common-mistakes", title: "Common mistakes" },
];

function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <h1>React Revision</h1>
        <p className="subtitle">React concepts</p>

        <div className="section-label">Home</div>
        <nav>
          <NavLink to="/" end>
            Overview
          </NavLink>
        </nav>

        <div className="section-label">Concepts</div>
        <nav>
          {lessons.map((l) => (
            <NavLink key={l.path} to={l.path}>
              {l.title}
            </NavLink>
          ))}
        </nav>

        <div className="section-label">Reference</div>
        <nav>
          {extras.map((l) => (
            <NavLink key={l.path} to={l.path}>
              {l.title}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/components-props" element={<ComponentsProps />} />
          <Route path="/use-state" element={<UseState />} />
          <Route path="/use-memo" element={<UseMemo />} />
          <Route path="/use-effect" element={<UseEffect />} />
          <Route path="/context-api" element={<ContextAPI />} />
          <Route path="/router" element={<Router />} />
          <Route
            path="/conditional-rendering"
            element={<ConditionalRendering />}
          />
          <Route path="/async-data" element={<AsyncData />} />
          <Route path="/angular-bridge" element={<AngularBridge />} />
          <Route path="/common-mistakes" element={<CommonMistakes />} />
          <Route path="/cheatsheet" element={<Cheatsheet />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
