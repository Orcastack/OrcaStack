import { AccessPanel } from '../components/AccessPanel';
import { HeroSection } from '../components/HeroSection';
import type { AuthMode } from '../types';

const landingStats = [
  { label: 'Projects under governance', value: '2.4K+' },
  { label: 'Daily pipeline jobs', value: '18K' },
  { label: 'Connected device targets', value: '320' },
  { label: 'Median approval time', value: '< 4 min' },
];

const landingFeatureCards = [
  {
    title: 'A navigation model that feels product-grade',
    description: 'The home page now leads with platform positioning, module navigation, and a clear entry path instead of collapsing immediately into an auth form.',
  },
  {
    title: 'Delivery signals visible at the front door',
    description: 'Repositories, pipeline pressure, device capacity, and governance signals are presented the way an enterprise DevSecOps suite would introduce itself.',
  },
  {
    title: 'Hardware and software automation in the same story',
    description: 'The landing experience now reflects what makes ORCASTACK distinct: software delivery controls combined with physical lab and orchestration capability.',
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
          <span className="eyebrow">Why it now reads like a platform</span>
          <h2>Designed to feel closer to a GitLab-style enterprise landing screen.</h2>
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
          <span className="eyebrow">Enterprise entry point</span>
          <h2>A front page for engineers, approvers, and platform operators.</h2>
          <p>
            The copy and layout now lead with suite positioning, product modules, and operational credibility. Authentication remains available below, but it no longer replaces the homepage itself.
          </p>
        </div>
        <div className="proof-card">
          <div>
            <span>Governance</span>
            <strong>Review flows, policy checks, and controlled approvals</strong>
          </div>
          <div>
            <span>Operations</span>
            <strong>Runner capacity, queue pressure, deployments, and target health</strong>
          </div>
          <div>
            <span>Automation</span>
            <strong>Hardware and software workflows coordinated from one control layer</strong>
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