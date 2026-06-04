import React, { useEffect, useMemo, useState } from 'react';

import {
  fetchDevices,
  fetchHardwareWorkflows,
  fetchOverview,
  fetchRunnerPipelines,
  fetchSession,
  fetchSignupRequests,
  fetchSoftwareWorkflows,
  login,
  logout,
  reviewSignupRequest,
  signup,
  type AuthSession,
  type AutomationWorkflow,
  type DeviceListResponse,
  type Overview,
  type RunnerPipeline,
  type RunnerSummary,
  type SignupRequestRecord,
} from './api';

const authTokenStorageKey = 'gitorc.auth.token';

type RunnerData = {
  pipelines: RunnerPipeline[];
  summary: RunnerSummary;
};

type DashboardState = {
  overview: Overview | null;
  runner: RunnerData | null;
  devices: DeviceListResponse | null;
  hardwareWorkflows: AutomationWorkflow[];
  softwareWorkflows: AutomationWorkflow[];
  signupRequests: SignupRequestRecord[];
};

type AuthMode = 'login' | 'signup';

const emptyDashboardState: DashboardState = {
  overview: null,
  runner: null,
  devices: null,
  hardwareWorkflows: [],
  softwareWorkflows: [],
  signupRequests: [],
};

function readStoredAuthToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(authTokenStorageKey);
}

function storeAuthToken(token: string | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (token) {
    window.localStorage.setItem(authTokenStorageKey, token);
    return;
  }

  window.localStorage.removeItem(authTokenStorageKey);
}

function formatDateTime(value?: string) {
  if (!value) {
    return 'Unavailable';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
}

function StatusPill({ value }: { value: string }) {
  const tone = value.toLowerCase();
  const className =
    tone.includes('success') || tone.includes('healthy') || tone.includes('ready') || tone.includes('approved') || tone.includes('connected')
      ? 'status-pill status-pill--good'
      : tone.includes('running') || tone.includes('busy') || tone.includes('queued')
        ? 'status-pill status-pill--warn'
        : tone.includes('degraded') || tone.includes('offline') || tone.includes('rejected')
          ? 'status-pill status-pill--bad'
          : 'status-pill';

  return <span className={className}>{value}</span>;
}

function Section({ title, children, compact = false }: { title: string; children: React.ReactNode; compact?: boolean }) {
  return (
    <section className={compact ? 'panel panel--compact' : 'panel'}>
      <div className="panel__header">
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function DataTable({ children }: { children: React.ReactNode }) {
  return <div className="table-wrap">{children}</div>;
}

export function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authToken, setAuthToken] = useState<string | null>(() => readStoredAuthToken());
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [dashboard, setDashboard] = useState<DashboardState>(emptyDashboardState);
  const [loading, setLoading] = useState(() => readStoredAuthToken() !== null);
  const [authChecking, setAuthChecking] = useState(() => readStoredAuthToken() !== null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'admin12345' });
  const [signupForm, setSignupForm] = useState({ username: '', email: '', password: '' });
  const [reviewBusyId, setReviewBusyId] = useState<string | null>(null);

  const isPlatformAdmin = authSession?.user.role === 'platform-admin';

  const summaryCards = useMemo(() => {
    const overview = dashboard.overview;
    const deviceSummary = dashboard.devices?.summary ?? {};

    return [
      { label: 'Repositories', value: String(overview?.repositories.length ?? 0) },
      { label: 'Pipelines', value: String(overview?.pipelines.length ?? 0) },
      { label: 'Devices', value: String(deviceSummary.total ?? dashboard.devices?.devices.length ?? 0) },
      { label: 'Deployments', value: String(overview?.deployments.length ?? 0) },
    ];
  }, [dashboard.devices, dashboard.overview]);

  const automationRows = useMemo(() => {
    return [
      ...dashboard.hardwareWorkflows.map((workflow) => ({
        id: workflow.id,
        name: workflow.name,
        scope: workflow.target_pool ?? 'hardware',
        status: workflow.status,
        updatedAt: workflow.last_run,
      })),
      ...dashboard.softwareWorkflows.map((workflow) => ({
        id: workflow.id,
        name: workflow.name,
        scope: workflow.target ?? 'software',
        status: workflow.status,
        updatedAt: workflow.last_run,
      })),
    ];
  }, [dashboard.hardwareWorkflows, dashboard.softwareWorkflows]);

  useEffect(() => {
    if (!authToken) {
      setAuthChecking(false);
      setAuthSession(null);
      setDashboard(emptyDashboardState);
      return;
    }

    const controller = new AbortController();
    setAuthChecking(true);

    void fetchSession(authToken, controller.signal)
      .then((session) => {
        setAuthSession({ ...session, token: authToken });
        setError(null);
      })
      .catch((sessionError) => {
        const message = sessionError instanceof Error ? sessionError.message : 'Session check failed';
        setError(message);
        setAuthSession(null);
        setAuthToken(null);
        storeAuthToken(null);
        setDashboard(emptyDashboardState);
      })
      .finally(() => setAuthChecking(false));

    return () => controller.abort();
  }, [authToken]);

  useEffect(() => {
    if (!authSession?.token) {
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const signupRequestsPromise = isPlatformAdmin
      ? fetchSignupRequests(authSession.token, controller.signal)
      : Promise.resolve<SignupRequestRecord[]>([]);

    void Promise.all([
      fetchOverview(controller.signal, authSession.token),
      fetchRunnerPipelines(controller.signal),
      fetchDevices(controller.signal),
      fetchHardwareWorkflows(controller.signal),
      fetchSoftwareWorkflows(controller.signal),
      signupRequestsPromise,
    ])
      .then(([overview, runner, devices, hardwareWorkflows, softwareWorkflows, signupRequests]) => {
        setDashboard({
          overview,
          runner,
          devices,
          hardwareWorkflows,
          softwareWorkflows,
          signupRequests,
        });
        setError(null);
      })
      .catch((loadError) => {
        const message = loadError instanceof Error ? loadError.message : 'Dashboard load failed';
        setError(message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [authSession, isPlatformAdmin]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      const session = await login(loginForm.username.trim(), loginForm.password, undefined);
      if (!session.token) {
        throw new Error('Missing session token');
      }

      storeAuthToken(session.token);
      setAuthToken(session.token);
      setAuthSession(session);
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    try {
      const result = await signup(signupForm, undefined);
      setNotice(result.message);
      setAuthMode('login');
      setSignupForm({ username: '', email: '', password: '' });
    } catch (signupError) {
      const message = signupError instanceof Error ? signupError.message : 'Signup failed';
      setError(message);
    }
  }

  async function handleLogout() {
    const token = authSession?.token ?? authToken;

    try {
      if (token) {
        await logout(token);
      }
    } catch {
      // Ignore logout transport failures and clear local state.
    }

    storeAuthToken(null);
    setAuthToken(null);
    setAuthSession(null);
    setDashboard(emptyDashboardState);
    setNotice(null);
  }

  async function handleReview(id: string, status: 'approved' | 'rejected') {
    if (!authSession?.token) {
      return;
    }

    setReviewBusyId(id);
    setError(null);

    try {
      const updated = await reviewSignupRequest(id, status, '', authSession.token);
      setDashboard((current) => ({
        ...current,
        signupRequests: current.signupRequests.map((request) => (request.id === id ? updated : request)),
      }));
    } catch (reviewError) {
      const message = reviewError instanceof Error ? reviewError.message : 'Review update failed';
      setError(message);
    } finally {
      setReviewBusyId(null);
    }
  }

  if (!authToken || !authSession) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <div className="auth-card__header">
            <span className="eyebrow">GITORC</span>
            <h1>Platform Dashboard</h1>
          </div>
          <div className="auth-toggle">
            <button className={authMode === 'login' ? 'auth-toggle__button auth-toggle__button--active' : 'auth-toggle__button'} onClick={() => setAuthMode('login')} type="button">
              Sign in
            </button>
            <button className={authMode === 'signup' ? 'auth-toggle__button auth-toggle__button--active' : 'auth-toggle__button'} onClick={() => setAuthMode('signup')} type="button">
              Request access
            </button>
          </div>
          {error ? <div className="banner banner--error">{error}</div> : null}
          {notice ? <div className="banner banner--info">{notice}</div> : null}
          {authMode === 'login' ? (
            <form className="auth-form" onSubmit={handleLogin}>
              <label>
                <span>Username</span>
                <input value={loginForm.username} onChange={(event) => setLoginForm((current) => ({ ...current, username: event.target.value }))} />
              </label>
              <label>
                <span>Password</span>
                <input type="password" value={loginForm.password} onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))} />
              </label>
              <button className="primary-button" disabled={loading || authChecking} type="submit">
                {loading || authChecking ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleSignup}>
              <label>
                <span>Username</span>
                <input value={signupForm.username} onChange={(event) => setSignupForm((current) => ({ ...current, username: event.target.value }))} />
              </label>
              <label>
                <span>Email</span>
                <input type="email" value={signupForm.email} onChange={(event) => setSignupForm((current) => ({ ...current, email: event.target.value }))} />
              </label>
              <label>
                <span>Password</span>
                <input type="password" value={signupForm.password} onChange={(event) => setSignupForm((current) => ({ ...current, password: event.target.value }))} />
              </label>
              <button className="primary-button" type="submit">Submit</button>
            </form>
          )}
        </section>
      </main>
    );
  }

  const overview = dashboard.overview;

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">GITORC</span>
          <h1>Platform Dashboard</h1>
        </div>
        <div className="topbar__actions">
          <div className="identity-chip">
            <strong>{authSession.user.full_name || authSession.user.username}</strong>
            <span>{authSession.user.role}</span>
          </div>
          <button className="secondary-button" onClick={() => window.location.reload()} type="button">Refresh</button>
          <button className="secondary-button" onClick={handleLogout} type="button">Sign out</button>
        </div>
      </header>

      {error ? <div className="banner banner--error">{error}</div> : null}

      <section className="stats-grid">
        {summaryCards.map((card) => (
          <article className="stat-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <Section title="Overview" compact>
          <div className="overview-meta">
            <div>
              <span>Updated</span>
              <strong>{formatDateTime(overview?.updated_at)}</strong>
            </div>
            <div>
              <span>Identity</span>
              <strong>{overview?.security.repository_identity ?? 'Unavailable'}</strong>
            </div>
          </div>
          <div className="metric-list">
            {(overview?.metrics ?? []).slice(0, 4).map((metric) => (
              <div className="metric-list__item" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Repositories">
          <DataTable>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Branch</th>
                  <th>Reviewer</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(overview?.repositories ?? []).map((repository) => (
                  <tr key={repository.id}>
                    <td>{repository.name}</td>
                    <td>{repository.default_branch}</td>
                    <td>{repository.reviewer}</td>
                    <td><StatusPill value={repository.security.verified ? 'verified' : 'pending'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </Section>

        <Section title="Pipelines">
          <DataTable>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Branch</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {(overview?.pipelines ?? []).map((pipeline) => (
                  <tr key={pipeline.id}>
                    <td>{pipeline.name}</td>
                    <td>{pipeline.branch}</td>
                    <td><StatusPill value={pipeline.status} /></td>
                    <td>{formatDateTime(pipeline.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </Section>

        <Section title="Deployments">
          <DataTable>
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Environment</th>
                  <th>Status</th>
                  <th>Cluster</th>
                </tr>
              </thead>
              <tbody>
                {(overview?.deployments ?? []).map((deployment) => (
                  <tr key={deployment.id}>
                    <td>{deployment.service_name}</td>
                    <td>{deployment.environment}</td>
                    <td><StatusPill value={deployment.status} /></td>
                    <td>{deployment.cluster}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </Section>

        <Section title="Runner">
          <div className="runner-summary">
            <div>
              <span>Capacity</span>
              <strong>{dashboard.runner?.summary.capacity ?? 0}</strong>
            </div>
            <div>
              <span>Busy</span>
              <strong>{dashboard.runner?.summary.busy_executors ?? 0}</strong>
            </div>
            <div>
              <span>Queued</span>
              <strong>{dashboard.runner?.summary.queued_jobs ?? 0}</strong>
            </div>
          </div>
          <ul className="stack-list">
            {(dashboard.runner?.pipelines ?? []).map((pipeline) => (
              <li key={pipeline.id}>
                <div>
                  <strong>{pipeline.project}</strong>
                  <span>{pipeline.ref}</span>
                </div>
                <StatusPill value={pipeline.status} />
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Devices">
          <ul className="stack-list">
            {(dashboard.devices?.devices ?? []).map((device) => (
              <li key={device.id}>
                <div>
                  <strong>{device.name}</strong>
                  <span>{device.location}</span>
                </div>
                <StatusPill value={device.status} />
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Automation">
          <ul className="stack-list">
            {automationRows.map((workflow) => (
              <li key={workflow.id}>
                <div>
                  <strong>{workflow.name}</strong>
                  <span>{workflow.scope}</span>
                </div>
                <StatusPill value={workflow.status} />
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Activity">
          <ul className="event-list">
            {(overview?.events ?? []).slice(0, 6).map((event) => (
              <li key={event.id}>
                <div>
                  <strong>{event.action}</strong>
                  <span>{event.component}</span>
                </div>
                <div>
                  <StatusPill value={event.result} />
                  <time>{formatDateTime(event.time)}</time>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        {isPlatformAdmin ? (
          <Section title="Access Requests">
            <DataTable>
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.signupRequests.map((request) => (
                    <tr key={request.id}>
                      <td>{request.username}</td>
                      <td>{request.email}</td>
                      <td><StatusPill value={request.status} /></td>
                      <td>
                        <div className="table-actions">
                          <button className="table-button" disabled={reviewBusyId === request.id || request.status !== 'pending'} onClick={() => void handleReview(request.id, 'approved')} type="button">
                            Approve
                          </button>
                          <button className="table-button" disabled={reviewBusyId === request.id || request.status !== 'pending'} onClick={() => void handleReview(request.id, 'rejected')} type="button">
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataTable>
          </Section>
        ) : null}
      </section>

      {loading ? <div className="banner banner--info">Loading live platform data...</div> : null}
    </main>
  );
}