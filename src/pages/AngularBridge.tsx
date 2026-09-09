export default function AngularBridge() {
  return (
    <>
      <h1 className="lesson-title">Angular → React Mental Model</h1>
      <p className="lesson-sub">Direct translations for the Angular patterns you already know.</p>

      <div className="highlight">
        The biggest shift: React doesn't have a template language or DI framework built in. Everything is JS + function composition. What Angular gives you as a decorator or directive, React gives you as a plain value or hook call.
      </div>

      <h2 className="section">Data flow</h2>
      <table className="map">
        <thead><tr><th>Angular</th><th>React</th></tr></thead>
        <tbody>
          <tr><td><code>@Input() foo</code></td><td>Prop: <code>{'function C({ foo })'}</code></td></tr>
          <tr><td><code>@Output() onSave</code></td><td>Callback prop: <code>{'onSave: (v) => void'}</code></td></tr>
          <tr><td><code>[(ngModel)]="name"</code></td><td><code>{'value={name} onChange={(e) => setName(e.target.value)}'}</code></td></tr>
        </tbody>
      </table>

      <h2 className="section">Templates &amp; directives</h2>
      <table className="map">
        <thead><tr><th>Angular</th><th>React</th></tr></thead>
        <tbody>
          <tr><td><code>*ngFor="let x of arr"</code></td><td><code>{'{arr.map(x => <li key={x.id}>...)}'}</code></td></tr>
          <tr><td><code>*ngIf="cond"</code></td><td><code>{'{cond && <X />}'}</code></td></tr>
          <tr><td><code>*ngIf; else other</code></td><td><code>{'{cond ? <X /> : <Other />}'}</code></td></tr>
          <tr><td><code>[class.active]="isActive"</code></td><td><code>{'className={isActive ? "active" : ""}'}</code></td></tr>
          <tr><td><code>{'[ngStyle]="{color:red}"'}</code></td><td><code>{'style={{ color: "red" }}'}</code></td></tr>
        </tbody>
      </table>

      <h2 className="section">Lifecycle</h2>
      <table className="map">
        <thead><tr><th>Angular</th><th>React</th></tr></thead>
        <tbody>
          <tr><td><code>ngOnInit</code></td><td><code>{'useEffect(() => {}, [])'}</code></td></tr>
          <tr><td><code>ngOnChanges (single input)</code></td><td><code>{'useEffect(() => {}, [prop])'}</code></td></tr>
          <tr><td><code>ngOnDestroy</code></td><td>Cleanup function returned from <code>useEffect</code></td></tr>
          <tr><td><code>ngAfterViewInit</code></td><td><code>useEffect</code> + <code>useRef</code> for DOM access</td></tr>
        </tbody>
      </table>

      <h2 className="section">Services &amp; DI</h2>
      <table className="map">
        <thead><tr><th>Angular</th><th>React</th></tr></thead>
        <tbody>
          <tr><td><code>@Injectable() service</code></td><td><code>createContext</code> + <code>useContext</code></td></tr>
          <tr><td><code>inject(MyService)</code></td><td><code>useContext(MyContext)</code></td></tr>
          <tr><td>Providers in module</td><td><code>{'<Ctx.Provider value=...>'}</code></td></tr>
        </tbody>
      </table>

      <h2 className="section">Performance</h2>
      <table className="map">
        <thead><tr><th>Angular</th><th>React</th></tr></thead>
        <tbody>
          <tr><td>Pure pipe / getter</td><td><code>useMemo(fn, deps)</code></td></tr>
          <tr><td><code>ChangeDetectionStrategy.OnPush</code></td><td><code>React.memo(Component)</code></td></tr>
          <tr><td>trackBy in <code>*ngFor</code></td><td><code>key</code> prop on mapped elements</td></tr>
        </tbody>
      </table>

      <h2 className="section">Routing</h2>
      <table className="map">
        <thead><tr><th>Angular</th><th>React</th></tr></thead>
        <tbody>
          <tr><td><code>RouterModule.forRoot(routes)</code></td><td><code>{'<BrowserRouter>'}</code></td></tr>
          <tr><td><code>routerLink="/x"</code></td><td><code>{'<Link to="/x">'}</code></td></tr>
          <tr><td><code>{'<router-outlet>'}</code></td><td><code>{'<Routes><Route ... /></Routes>'}</code></td></tr>
          <tr><td><code>ActivatedRoute.params</code></td><td><code>useParams()</code></td></tr>
          <tr><td><code>Router.navigate([...])</code></td><td><code>useNavigate()</code></td></tr>
        </tbody>
      </table>
    </>
  )
}
