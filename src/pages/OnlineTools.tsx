import Code from '../components/Code'
import Callout from '../components/Callout'
import Table from '../components/Table'

/**
 * Setup page, not a concept page. The reader is sitting in front of a blank
 * StackBlitz twenty minutes before an interview and nothing renders. The whole
 * page is ordered around that: why it is broken, the five files that fix it,
 * then the one-click route they should use every time after.
 */
export default function OnlineTools() {
  return (
    <>
      <h1 className="lesson-title">Guide with Online Coding Tools</h1>
      <p className="lesson-sub">
        Browser sandboxes for interview practice. A blank StackBlitz is five files away from a
        running React app — here is each file, and why it exists.
      </p>

      <div className="highlight">
        A fresh sandbox often ships with nothing but <code>react</code> and <code>react-dom</code>.
        That renders nothing. Those two are <em>libraries</em>, not a build step — and JSX is not
        JavaScript, so something has to compile <code>{'<h1>Hi</h1>'}</code> into a function call
        before a browser can run it. The missing piece is a bundler. Add Vite and you are done.
      </div>

      <h2 className="section">Why the blank project won't run</h2>
      <p className="para">
        This is the starting point StackBlitz gives you — one file, two dependencies, no way to
        execute a component:
      </p>

      <Code kind="bad" label="What you start with" caption="package.json">{`{
  "dependencies": {
    "react": "18.1.0",
    "react-dom": "18.1.0"
  }
}`}</Code>

      <Callout kind="why" title="Three separate things are missing, not one">
        <ul className="mistakes">
          <li>
            <strong>Nothing compiles JSX.</strong> <code>{'<App />'}</code> is syntax no browser
            understands. A bundler with the React plugin rewrites it to{' '}
            <code>jsx(App)</code> before it ships.
          </li>
          <li>
            <strong>There is no HTML page.</strong> React needs a real DOM node to mount into.
            No <code>index.html</code>, no <code>#root</code>, nowhere to render.
          </li>
          <li>
            <strong>There is no entry point and no start script.</strong> Even with the first two
            solved, nothing tells the sandbox which file to run first.
          </li>
        </ul>
      </Callout>

      <h2 className="section">The five files</h2>

      <div className="flow">
        <div className="flow-step">
          <span className="flow-n">1</span>
          <div>
            <strong>package.json</strong>
            <p>adds Vite + the React plugin, and a dev script</p>
          </div>
        </div>
        <span className="flow-arrow" aria-hidden="true">→</span>
        <div className="flow-step">
          <span className="flow-n">2</span>
          <div>
            <strong>vite.config.js</strong>
            <p>turns JSX compilation on</p>
          </div>
        </div>
        <span className="flow-arrow" aria-hidden="true">→</span>
        <div className="flow-step">
          <span className="flow-n">3</span>
          <div>
            <strong>index.html</strong>
            <p>the page, and the div React mounts into</p>
          </div>
        </div>
        <span className="flow-arrow" aria-hidden="true">→</span>
        <div className="flow-step">
          <span className="flow-n">4</span>
          <div>
            <strong>src/main.jsx</strong>
            <p>attaches your tree to that div</p>
          </div>
        </div>
        <span className="flow-arrow" aria-hidden="true">→</span>
        <div className="flow-step">
          <span className="flow-n">5</span>
          <div>
            <strong>src/App.jsx</strong>
            <p>the only file you touch during a problem</p>
          </div>
        </div>
      </div>

      <h3 className="sub">1. Replace package.json</h3>
      <Code kind="good" label="Replace with" caption="package.json">{`{
  "name": "react-practice",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "react": "18.1.0",
    "react-dom": "18.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.4.0"
  }
}`}</Code>
      <p className="para">
        Keep the pinned React versions the sandbox gave you, or bump both to{' '}
        <code>^19.0.0</code> together — they must always match. <code>vite</code> and the plugin
        go in <code>devDependencies</code> because they run at build time, never in the browser.
      </p>

      <h3 className="sub">2. Add vite.config.js (project root)</h3>
      <Code caption="vite.config.js">{`import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`}</Code>
      <p className="para">
        This one line of config is what makes <code>.jsx</code> files legal. Skip it and the first
        angle bracket in your code is a syntax error.
      </p>

      <h3 className="sub">3. Add index.html (project root)</h3>
      <Code caption="index.html">{`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>React Practice</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`}</Code>
      <p className="para">
        Root level, not inside <code>src</code> — Vite treats the root <code>index.html</code> as
        the entry to the whole app. The empty <code>{'<div id="root">'}</code> is the only piece of
        hand-written DOM in the project; everything else is rendered into it.
      </p>

      <h3 className="sub">4. Add src/main.jsx</h3>
      <Code caption="src/main.jsx">{`import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`}</Code>
      <p className="para">
        <code>react-dom/client</code> and <code>createRoot</code> are the React 18+ entry API. If
        you ever see <code>ReactDOM.render(...)</code> in an old snippet, that is the React 17
        version and it will warn.
      </p>

      <h3 className="sub">5. Add src/App.jsx</h3>
      <Code caption="src/App.jsx">{`export default function App() {
  return <h1>This is the react app!</h1>
}`}</Code>
      <p className="para">
        Typing <code>src/App.jsx</code> into the sandbox's new-file box creates the{' '}
        <code>src</code> folder for you — you do not make the folder first.
      </p>

      <h2 className="section">Order matters</h2>
      <Callout kind="good" title="Add the four new files first, save package.json last">
        <p className="para">
          Saving <code>package.json</code> triggers a reinstall. Do it last and you pay for one
          install instead of one per file, and the preview boots straight into a working app
          rather than crashing on a missing <code>index.html</code>.
        </p>
        <p className="para">
          If the preview does not come up on its own, open the terminal panel and run{' '}
          <code>npm install</code>, then <code>npm run dev</code>.
        </p>
      </Callout>

      <h2 className="section">What each file actually does</h2>
      <Table
        caption="The five files and their one job each"
        hideCaption
        head={['File', 'Its one job', 'How you know it is missing']}
        rows={[
          [
            'package.json',
            'Declares Vite + the React plugin, and the dev script',
            '"vite: command not found", or nothing installs at all',
          ],
          [
            'vite.config.js',
            'Switches JSX compilation on',
            '"Unexpected token <" on your first tag',
          ],
          [
            'index.html',
            'The page, plus the #root div to mount into',
            'Blank preview, or a 404 for the whole app',
          ],
          [
            'src/main.jsx',
            'Attaches the component tree to #root',
            'Page loads, stays empty, console is clean',
          ],
          [
            'src/App.jsx',
            'Your actual component',
            '"Failed to resolve import ./App"',
          ],
        ]}
      />

      <h2 className="section">The one-click shortcut</h2>
      <p className="para">
        Do the manual build once, so the error messages above mean something to you. After that,
        never do it again — these URLs hand you the same thing pre-wired:
      </p>
      <Code caption="Bookmark these">{`stackblitz.com/fork/react        // JS, Vite, instant
stackblitz.com/fork/react-ts     // same with TypeScript
react.new                         // CodeSandbox React starter`}</Code>
      <Callout kind="note" title="Fork a fresh one per problem">
        <p className="para">
          Leftover state from the last question is a real source of confusion mid-interview. A new
          fork costs one click and starts clean.
        </p>
      </Callout>

      <h2 className="section">Which tool for which kind of question</h2>
      <Table
        caption="Choosing a sandbox for the question in front of you"
        hideCaption
        head={['Tool', 'Best for', 'Why', 'Watch out']}
        rows={[
          [
            'StackBlitz',
            'Most React interviews',
            'Runs Node in the browser, so boot is near-instant and offline-tolerant',
            'A few native-dependency packages will not install',
          ],
          [
            'CodeSandbox',
            'Anything needing real npm packages',
            'Runs on a container, so almost any dependency works',
            'Slower cold start; needs a steady connection',
          ],
          [
            'CodePen',
            'A single UI snippet or CSS question',
            'Zero config, instant',
            'No real module system — multi-file and imports get awkward',
          ],
          [
            'The interviewer’s own editor',
            'Whatever they hand you',
            'No setup argument to have',
            'Often no autocomplete and no preview — practise reading your own code',
          ],
        ]}
      />

      <h2 className="section">The StrictMode question</h2>
      <Callout kind="warn" title="Your effect running twice is the starter kit working, not a bug">
        <p className="para">
          <code>{'<React.StrictMode>'}</code> deliberately mounts, unmounts and remounts every
          component in development. An effect without cleanup therefore fires twice — which is the
          point: it surfaces the missing cleanup now instead of in production.
        </p>
        <p className="para">
          Keep it on. Interviewers ask about this, and "it double-invokes in dev to expose effects
          that are not cleanup-safe" is a strong answer. Deleting the wrapper to make the symptom
          go away is the weak one.
        </p>
      </Callout>

      <h2 className="section">Before you start a timed problem</h2>
      <ul className="mistakes">
        <li>
          <strong>Preview is green before the question starts.</strong> Debugging setup on the
          clock is the worst possible use of the time.
        </li>
        <li>
          <strong>Know where the console is.</strong> Bottom panel in StackBlitz. You will need it
          within two minutes.
        </li>
        <li>
          <strong>Work in one file until it works.</strong> Splitting components into files is
          polish; a reviewer would rather see a working <code>App.jsx</code> than a tidy half-app.
        </li>
        <li>
          <strong>Say what you are doing while you type.</strong> The sandbox is a shared screen —
          silence reads as being stuck even when you are not.
        </li>
      </ul>
    </>
  )
}
