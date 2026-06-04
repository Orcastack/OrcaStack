import type React from 'react';

import { NavLink } from 'react-router-dom';

import type { AuthSession } from '../api';
import type { DashboardState } from '../types';

type WorkspaceLayoutProps = {
  authSession: AuthSession;
  dashboard: DashboardState;
  title: string;
  summary: string;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onLogout: () => void;
  children: React.ReactNode;
};

const workspaceNav = [
  { to: '/app/dashboard', label: 'Dashboard', meta: 'Platform overview' },
  { to: '/app/repositories', label: 'Repositories', meta: 'Projects and reviews' },
  { to: '/app/pipelines', label: 'Pipelines', meta: 'CI/CD execution' },
  { to: '/app/devices', label: 'Devices', meta: 'Labs and targets' },
  { to: '/app/automation', label: 'Automation', meta: 'Hardware and software flows' },
  { to: '/app/settings', label: 'Settings', meta: 'Access and platform posture' },
];

export function WorkspaceLayout({
  authSession,
  dashboard,
  title,
  summary,
  loading,
  error,
  onRefresh,
  onLogout,
  children,
}: WorkspaceLayoutProps) {
  const displayName = authSession.user.full_name || authSession.user.username;
  const pendingApprovals = dashboard.signupRequests.filter((request) => request.status === 'pending').length;
  const overview = dashboard.overview;
  const navCounts: Record<string, string> = {
    Dashboard: String(overview?.metrics.length ?? 0),
    Repositories: String(overview?.repositories.length ?? 0),
    Pipelines: String(overview?.pipelines.length ?? 0),
    Devices: String(dashboard.devices?.devices.length ?? 0),
    Automation: String(dashboard.hardwareWorkflows.length + dashboard.softwareWorkflows.length),
    Settings: String(authSession.user.permissions.length),
  };

  return (
    <main className="dashboard-shell">
      <div className="workspace-shell">
        <aside className="workspace-sidebar" aria-label="Workspace navigation">
          <div className="workspace-sidebar__brand">
            <div>
              <span className="eyebrow">GITORC</span>
              <strong>Operations Workspace</strong>
            </div>
            <span className="workspace-badge">Enterprise</span>
          </div>

          <div className="workspace-sidebar__section">
            <span className="workspace-sidebar__label">Navigate</span>
            <nav className="workspace-nav-list" aria-label="Workspace sections">
              {workspaceNav.map((item) => (
                <NavLink
                  className={({ isActive }) => (isActive ? 'workspace-nav-link workspace-nav-link--active' : 'workspace-nav-link')}
                  end={item.to === '/app/dashboard'}
                  key={item.to}
                  to={item.to}
                >
                  <div>
                    <strong>{item.label}</strong>
                    <span>{item.meta}</span>
                  </div>
                  <em>{navCounts[item.label]}</em>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="workspace-sidebar__section workspace-sidebar__section--meta">
            <span className="workspace-sidebar__label">Workspace posture</span>
            <div className="workspace-meta-card">
              <span>Role</span>
              <strong>{authSession.user.role}</strong>
            </div>
            <div className="workspace-meta-card">
              <span>Repository identity</span>
              <strong>{overview?.security.repository_identity ?? 'Unavailable'}</strong>
            </div>
            <div className="workspace-meta-card">
              <span>Session expires</span>
              <strong>{authSession.expires_at}</strong>
            </div>
          </div>
        </aside>

        <div className="workspace-main">
          <header className="topbar topbar--workspace">
            <div>
              <span className="eyebrow">Control center</span>
              <h1>{title}</h1>
              <p className="topbar__summary">{summary}</p>
            </div>
            <div className="topbar__actions">
              <div className="identity-chip">
                <strong>{displayName}</strong>
                <span>{authSession.user.role}</span>
              </div>
              <button className="secondary-button" onClick={onRefresh} type="button">Refresh</button>
              <button className="secondary-button" onClick={onLogout} type="button">Sign out</button>
            </div>
          </header>

          <section className="workspace-banner">
            <div className="workspace-banner__copy">
              <span className="eyebrow">Workspace overview</span>
              <h3>{displayName}, your engineering control plane is synchronized and production-ready.</h3>
              <p>The workspace now uses dedicated routes, shared visual tokens, and consistent enterprise surfaces across repositories, pipelines, devices, automation, and settings.</p>
            </div>
            <div className="workspace-banner__status">
              <div>
                <span>Platform status</span>
                <strong>Healthy</strong>
              </div>
              <div>
                <span>Pending approvals</span>
                <strong>{pendingApprovals}</strong>
              </div>
              <div>
                <span>Queued jobs</span>
                <strong>{dashboard.runner?.summary.queued_jobs ?? 0}</strong>
              </div>
            </div>
          </section>

          {error ? <div className="banner banner--error">{error}</div> : null}
          {children}
          {loading ? <div className="banner banner--info">Loading live platform data...</div> : null}
        </div>
      </div>
    </main>
  );
}