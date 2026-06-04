import { AccessPanel } from '../components/AccessPanel';
import { HeroSection } from '../components/HeroSection';
import type { AuthMode } from '../types';

const landingStats = [
  { label: 'Protected repositories', value: '2.4K+' },
  { label: 'Pipeline runs per day', value: '18K' },
  { label: 'Managed device labs', value: '320' },
  { label: 'Mean approval latency', value: '< 4 min' },
];

const landingFeatureCards = [
  {
    title: 'One control plane for source to release',
    description: 'Coordinate review, CI, CD, fleet automation, and policy from a single operating surface tuned for regulated engineering teams.',
  },
  {
    title: 'Git, runners, hardware, and automation in one graph',
    description: 'Track repositories, execution capacity, physical devices, and workflow health without context switching across separate products.',
  },
  {
    title: 'Built for platform operators, not demo screenshots',
    description: 'Surface approvals, queues, security posture, and live activity in a layout that supports operational decisions under load.',
  },
];

type HomePageProps = {
  authMode: AuthMode;
  error: string | null;
  notice: string | null;
  loading: boolean;
  authChecking: boolean;
  loginForm: { username: string; password: string };
  signupForm: { username: string; email: string; password: string };
  onAuthModeChange: (mode: AuthMode) => void;
  onLoginFieldChange: (field: 'username' | 'password', value: string) => void;
  onSignupFieldChange: (field: 'username' | 'email' | 'password', value: string) => void;
  onLogin: () => void;
  onSignup: () => void;
  onLoginSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onSignupSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function HomePage(props: HomePageProps) {
  return (
    <>
      <HeroSection onLogin={props.onLogin} onSignup={props.onSignup} />

      <section className="landing-stats" aria-label="Platform metrics">
        {landingStats.map((stat) => (
          <article className="landing-stat" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>

      <section className="landing-section" id="operations">
        <div className="section-heading">
          <span className="eyebrow">Operational view</span>
          <h2>Built to make the front page feel like a platform, not a form.</h2>
        </div>
        <div className="feature-grid">
          {landingFeatureCards.map((card) => (
            <article className="feature-card" key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-section--split">
        <div className="section-heading">
          <span className="eyebrow">Why this surface works</span>
          <h2>A structured entry point for engineers, approvers, and platform operators.</h2>
          <p>
            The home page establishes product context first. Authentication remains embedded below, so first-time visitors see the platform header, positioning, and footer before any credential prompt.
          </p>
        </div>
        <div className="proof-card">
          <div>
            <span>Repository governance</span>
            <strong>Verified review flows and controlled approvals</strong>
          </div>
          <div>
            <span>Runtime operations</span>
            <strong>Runner capacity, queue pressure, deployments, and device health</strong>
          </div>
          <div>
            <span>Automation reach</span>
            <strong>Hardware and software workflows tracked from one control layer</strong>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--access" id="access-panel">
        <div className="section-heading">
          <span className="eyebrow">Access</span>
          <h2>Operator access stays available without replacing the landing page.</h2>
        </div>
        <AccessPanel
          authChecking={props.authChecking}
          authMode={props.authMode}
          error={props.error}
          loading={props.loading}
          loginForm={props.loginForm}
          notice={props.notice}
          onAuthModeChange={props.onAuthModeChange}
          onLoginFieldChange={props.onLoginFieldChange}
          onLoginSubmit={props.onLoginSubmit}
          onSignupFieldChange={props.onSignupFieldChange}
          onSignupSubmit={props.onSignupSubmit}
          signupForm={props.signupForm}
        />
      </section>
    </>
  );
}