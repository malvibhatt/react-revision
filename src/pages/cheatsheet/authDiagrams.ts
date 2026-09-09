export type DiagramTag = 'info' | 'ok' | 'deny' | 'auth'

export interface AuthDiagram {
  id: string
  title: string
  tag: string
  tagKind: DiagramTag
  scenario: string
  chart: string
}

export const AUTH_DIAGRAMS: AuthDiagram[] = [
  {
    id: 'master',
    title: 'Master auth + RBAC + API interceptor flow',
    tag: 'Architecture',
    tagKind: 'info',
    scenario:
      'The general-purpose flow every protected route runs through: AuthContext and TokenStore as data stores (cylinders), decisions as diamonds, and the 401 refresh loop closed back to the request interceptor.',
    chart: `
flowchart TD
    Start(["User navigates to a protected route"]) --> Routing["Routing config declares<br/>required permissions e.g. ['read','write']"]
    Routing --> Guard["AuthGuard component"]
    Guard -.reads.-> AuthCtx[("AuthContext<br/>userSessionData, authStatus,<br/>isAuthenticated, hasAllPermissions,<br/>hasAnyPermission, hasAnyRole")]
    Guard --> D1{"isAuthenticated?"}
    D1 -->|No| Redirect["Redirect to Login Page"]
    D1 -->|Yes| D2{"canAccess?<br/>hasAllPermissions / hasAnyPermission / hasAnyRole"}
    D2 -->|No| Deny["403 Forbidden:<br/>stay on previous page"]
    D2 -->|Yes| Render["Render protected route"]
    Render --> API["API call to fetch data"]
    API --> ReqInt["Request Interceptor:<br/>attach token"]
    ReqInt -.reads.-> Token[("TokenStore<br/>setAccess / getAccess")]
    ReqInt --> Server[["Server"]]
    Server --> ResInt{"Response Interceptor:<br/>status code"}
    ResInt -->|200 / 201| Success["Update UI with data"]
    ResInt -->|401| Refresh["Refresh token once,<br/>queue pending requests"]
    Refresh -.writes.-> Token
    Refresh -->|retry all queued| ReqInt
    ResInt -->|403| Forbidden2["Show 'Forbidden' message"]
    ResInt -->|5xx| Unknown["Show generic error"]
    Success --> UIUpdate["UI Update"]
    Forbidden2 --> UIUpdate
    Unknown --> UIUpdate
    Redirect --> UIUpdate
    Deny --> UIUpdate
    UIUpdate --> End(["Client sees final state"])

    classDef decision fill:#312e81,stroke:#818cf8,stroke-width:1px,color:#e0e7ff;
    classDef bad fill:#450a0a,stroke:#ef4444,stroke-width:1px,color:#fecaca;
    classDef good fill:#052e16,stroke:#22c55e,stroke-width:1px,color:#bbf7d0;
    classDef store fill:#422006,stroke:#f59e0b,stroke-width:1px,color:#fde68a;
    class D1,D2,ResInt decision;
    class Redirect,Deny,Forbidden2,Unknown bad;
    class Success,Render good;
    class AuthCtx,Token store;
`,
  },
  {
    id: 'uc1',
    title: 'Use case: user logs in & app loads the dashboard',
    tag: 'Success path',
    tagKind: 'ok',
    scenario:
      'A user submits valid credentials. The server issues a token, the client stores it and populates AuthContext, then the dashboard route (which has no special permission requirement) renders and fetches its data.',
    chart: `
flowchart TD
    A(["User opens the app"]) --> B["Login form: enter credentials"]
    B --> C["POST /login to Server"]
    C --> D{"Credentials valid?"}
    D -->|No| E["Show login error"] --> B
    D -->|Yes| F["Server returns access token + user profile"]
    F --> G["TokenStore.setAccess(token)"]
    G --> H["AuthContext updates:<br/>isAuthenticated = true,<br/>userSessionData, roles & permissions"]
    H --> I["Navigate to /Dashboard"]
    I --> J{"AuthGuard: isAuthenticated?"}
    J -->|Yes| K{"canAccess dashboard?<br/>(no special permission required)"}
    K -->|Yes| L["Render Dashboard"]
    L --> M["API call to fetch dashboard data<br/>via Request/Response Interceptors"]
    M --> N(["Dashboard rendered with data"])

    classDef decision fill:#312e81,stroke:#818cf8,stroke-width:1px,color:#e0e7ff;
    classDef good fill:#052e16,stroke:#22c55e,stroke-width:1px,color:#bbf7d0;
    classDef bad fill:#450a0a,stroke:#ef4444,stroke-width:1px,color:#fecaca;
    class D,J,K decision;
    class F,G,H,L,N good;
    class E bad;
`,
  },
  {
    id: 'uc2',
    title: 'Use case: admin opens /EmployeesPage',
    tag: 'Access allowed',
    tagKind: 'ok',
    scenario:
      "role = admin, permissions = ['read','write']. The route requires ['read','write']. Admin passes both the authentication check and the permission check, so the page renders and fetches data.",
    chart: `
flowchart TD
    A(["Admin clicks 'Employees' nav link"]) --> B["Navigate to /EmployeesPage"]
    B --> C["Routing: route requires ['read','write']"]
    C --> D["AuthGuard"]
    D --> E{"isAuthenticated?"}
    E -->|"Yes: admin session active"| F{"canAccess:<br/>hasAllPermissions(['read','write'])?"}
    F -->|"Yes: admin has read + write"| G["Access granted"]
    G --> H["Render /EmployeesPage"]
    H --> I["API call: fetch employees list"]
    I --> J["Request Interceptor attaches token"]
    J --> K[["Server"]]
    K --> L{"Response status"}
    L -->|200 OK| M["UI Update: employees table rendered"]

    classDef decision fill:#312e81,stroke:#818cf8,stroke-width:1px,color:#e0e7ff;
    classDef good fill:#052e16,stroke:#22c55e,stroke-width:1px,color:#bbf7d0;
    class E,F,L decision;
    class G,H,M good;
`,
  },
  {
    id: 'uc3',
    title: 'Use case: employee opens /EmployeesPage directly via URL',
    tag: 'Denied: RBAC',
    tagKind: 'deny',
    scenario:
      "role = employee, permissions = ['read'] only. The route requires ['read','write']. The employee is authenticated (passes step 1) but fails the permission check, so the guard blocks the render and keeps them on their current page, with no redirect to login, since they are logged in.",
    chart: `
flowchart TD
    A(["Employee pastes /EmployeesPage into the URL bar"]) --> B["Routing: route requires ['read','write']"]
    B --> C["AuthGuard"]
    C --> D{"isAuthenticated?"}
    D -->|"Yes: employee session active"| E{"canAccess:<br/>hasAllPermissions(['read','write'])?"}
    E -->|"No: employee only has ['read']"| F["Access denied (403 Forbidden)"]
    F --> G["Stay on current / previous page"]
    G --> H["Show 'You don't have permission' toast"]

    classDef decision fill:#312e81,stroke:#818cf8,stroke-width:1px,color:#e0e7ff;
    classDef bad fill:#450a0a,stroke:#ef4444,stroke-width:1px,color:#fecaca;
    class D,E decision;
    class F,G,H bad;
`,
  },
  {
    id: 'uc4',
    title: 'Use case: guest opens /EmployeesPage directly via URL',
    tag: 'Denied: unauthenticated',
    tagKind: 'auth',
    scenario:
      'No active session / no token in TokenStore. The very first guard check (isAuthenticated) fails, so the permission check never even runs. The guest is redirected straight to the login page.',
    chart: `
flowchart TD
    A(["Guest (not logged in) pastes /EmployeesPage into the URL bar"]) --> B["Routing: route requires ['read','write']"]
    B --> C["AuthGuard"]
    C --> D{"isAuthenticated?"}
    D -->|"No: no token in TokenStore / no session"| E["Redirect to /Login"]
    E --> F["Stay on Login Page"]
    F --> G["Show 'Please log in to continue' message"]

    classDef decision fill:#312e81,stroke:#818cf8,stroke-width:1px,color:#e0e7ff;
    classDef bad fill:#450a0a,stroke:#ef4444,stroke-width:1px,color:#fecaca;
    class D decision;
    class E,F,G bad;
`,
  },
]
