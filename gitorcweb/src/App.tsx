import React, { useEffect, useState } from 'react';

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
  type SignupRequestRecord,
} from './api';
import { PublicFooter } from './components/PublicFooter';
import { PublicHeader } from './components/PublicHeader';
import { DashboardPage } from './pages/DashboardPage';
import { CommunityPage } from './pages/CommunityPage';
import { DeveloperPage } from './pages/DeveloperPage';
import { DocsPage } from './pages/DocsPage';
import { HomePage } from './pages/HomePage';
import { type AuthMode, type DashboardState, emptyDashboardState, type PublicRoute } from './types';

const authTokenStorageKey = 'gitorc.auth.token';

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

function readPublicRoute(): PublicRoute {
  if (typeof window === 'undefined') {
    return 'home';
  }

  const value = window.location.hash.replace('#', '');
  if (value === 'docs' || value === 'developer' || value === 'community') {
    return value;
  }

  return 'home';
}

export function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [publicRoute, setPublicRoute] = useState<PublicRoute>(() => readPublicRoute());
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleHashChange = () => setPublicRoute(readPublicRoute());
    window.addEventListener('hashchange', handleHashChange);

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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

  function navigatePublic(route: PublicRoute) {
    setPublicRoute(route);

    if (typeof window === 'undefined') {
      return;
    }

    const nextHash = route === 'home' ? '' : `#${route}`;
    window.history.pushState(null, '', `${window.location.pathname}${window.location.search}${nextHash}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openAuthPanel(mode: AuthMode) {
    setAuthMode(mode);

    if (publicRoute !== 'home') {
      navigatePublic('home');
    }

    if (typeof window === 'undefined') {
      return;
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById('access-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  if (authToken && authChecking && !authSession) {
    return (
      <main className="public-shell public-shell--loading">
        <section className="loading-card">
          <span className="eyebrow">GITORC</span>
          <h1>Restoring your platform session</h1>
          <p>Checking access and loading your workspace.</p>
        </section>
      </main>
    );
  }

  if (!authToken || !authSession) {
    const publicPage =
      publicRoute === 'docs' ? <DocsPage onLogin={() => openAuthPanel('login')} onSignup={() => openAuthPanel('signup')} /> :
      publicRoute === 'developer' ? <DeveloperPage onLogin={() => openAuthPanel('login')} onSignup={() => openAuthPanel('signup')} /> :
      publicRoute === 'community' ? <CommunityPage onLogin={() => openAuthPanel('login')} onSignup={() => openAuthPanel('signup')} /> :
      <HomePage
        authChecking={authChecking}
        authMode={authMode}
        error={error}
        loading={loading}
        loginForm={loginForm}
        notice={notice}
        onAuthModeChange={setAuthMode}
        onLogin={() => openAuthPanel('login')}
        onLoginFieldChange={(field, value) => setLoginForm((current) => ({ ...current, [field]: value }))}
        onLoginSubmit={handleLogin}
        onSignup={() => openAuthPanel('signup')}
        onSignupFieldChange={(field, value) => setSignupForm((current) => ({ ...current, [field]: value }))}
        onSignupSubmit={handleSignup}
        signupForm={signupForm}
      />;

    return (
      <main className="public-shell">
        <PublicHeader currentPage={publicRoute} onLogin={() => openAuthPanel('login')} onNavigate={navigatePublic} onSignup={() => openAuthPanel('signup')} />
        {publicPage}
        <PublicFooter />
      </main>
    );
  }

  return <DashboardPage authSession={authSession} dashboard={dashboard} error={error} isPlatformAdmin={isPlatformAdmin} loading={loading} onLogout={handleLogout} onRefresh={() => window.location.reload()} onReview={handleReview} reviewBusyId={reviewBusyId} />;
}