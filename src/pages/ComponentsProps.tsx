import { useState } from 'react'
import Code from '../components/Code'

interface GreetingProps {
  name: string
  role?: string
}

function Greeting({ name, role = 'Guest' }: GreetingProps) {
  return (
    <div className="stat">
      Hello <strong>{name}</strong>, <em style={{ color: 'var(--text-dim)' }}>{role}</em>
    </div>
  )
}

export default function ComponentsProps() {
  const [name, setName] = useState('Malvi')
  const [role, setRole] = useState('Senior Dev')

  return (
    <>
      <h1 className="lesson-title">Components + Props</h1>
      <p className="lesson-sub">A React component is a function that returns JSX. Props are its inputs.</p>

      <div className="highlight">
        A component is just a <strong>function</strong>. Props are the <strong>function's arguments</strong>. Type them with a TS <code>interface</code>, destructure them in the signature, use them inside JSX.
      </div>

      <h2 className="section">The pattern</h2>
      <Code>{`interface GreetingProps {
  name: string;
  role?: string;   // optional prop
}

function Greeting({ name, role = 'Guest' }: GreetingProps) {
  return <div>Hello {name}, {role}</div>;
}

// Parent passes props like HTML attributes:
<Greeting name="Malvi" role="Senior Dev" />`}</Code>

      <h2 className="section">Live demo</h2>
      <div className="demo">
        <div className="demo-label">Type in the inputs and the child re-renders with new props</div>
        <input className="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="name" />
        <input className="text" value={role} onChange={(e) => setRole(e.target.value)} placeholder="role" />
        <div style={{ marginTop: '0.75rem' }}>
          <Greeting name={name} role={role} />
        </div>
      </div>

      <h2 className="section">Angular equivalent</h2>
      <p className="para">Props are equivalent to <code>@Input()</code> decorated fields on a component. Instead of <code>[name]="value"</code> in a template, you write <code>{'name={value}'}</code> in JSX.</p>

      <h2 className="section">Rules</h2>
      <ul className="mistakes">
        <li><strong>Props are read-only.</strong> Never assign to a prop inside the component. Mutate state in the parent and pass it down.</li>
        <li><strong>Component names must start with a capital letter.</strong> <code>{'<greeting />'}</code> is treated as an HTML tag; <code>{'<Greeting />'}</code> is a React component.</li>
        <li><strong>Children are just a special prop.</strong> Anything between <code>{'<X>...</X>'}</code> is available as <code>props.children</code>.</li>
      </ul>
    </>
  )
}
