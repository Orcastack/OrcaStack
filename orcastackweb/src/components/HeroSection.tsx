import { StatusPill } from './StatusPill';

const landingPillars = [
  'Review and repository governance',
  'Runner and deployment orchestration',
  'Hardware and software automation lanes',
  'Security, policy, and access controls',
];

const landingTimeline = [
  { label: 'Plan', value: 'Codify review, policy, and release contracts' },
  { label: 'Build', value: 'Scale runners, queues, and device-backed validation' },
  { label: 'Ship', value: 'Promote through controlled environments with traceability' },
];

type HeroSectionProps = {
  onLogin: () => void;
  onSignup: () => void;
};

export function HeroSection({ onLogin, onSignup }: HeroSectionProps) {
  return (
    <section className="hero-grid" id="platform">
      <div className="hero-copy">
        <div className="hero-copy__intro">
          <span className="eyebrow">The complete DevSecOps platform</span>
          <div className="hero-kicker">
            <span>Plan</span>
            <span>Code</span>
            <span>Secure</span>
            <span>Deploy</span>
            <span>Operate</span>
          </div>
          <h1>One control plane for source code, delivery pipelines, devices, and policy.</h1>
          <p>
            Built for internal engineering organizations that want a GitLab-style front door with stronger control over hardware labs,
            software automation, approval flows, and runtime operations.
          </p>
          <p className="hero-copy__supporting">
            Repositories, runners, deployments, access requests, and operational telemetry stay connected in one premium interface instead of being split across disconnected tools.
          </p>
        </div>
        <div className="hero-actions">
          <button className="primary-button primary-button--warm" onClick={onSignup} type="button">
            Start free evaluation
          </button>
          <button className="secondary-button secondary-button--ghost" onClick={onLogin} type="button">
            Sign in to workspace
          </button>
        </div>
        <div className="hero-proofstrip" aria-label="Product proof points">
          <div>
            <span>Single application</span>
            <strong>Source to production visibility</strong>
          </div>
          <div>
            <span>Built-in governance</span>
            <strong>Approvals, policies, auditability</strong>
          </div>
          <div>
            <span>Hybrid execution</span>
            <strong>Cloud runners and physical device labs</strong>
          </div>
        </div>
        <ul className="hero-pillars">
          {landingPillars.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <aside className="hero-console" aria-label="Platform summary">
        <div className="hero-console__header">
          <span>Platform overview</span>
          <StatusPill value="healthy" />
        </div>
        <div className="hero-console__body">
          {landingTimeline.map((item) => (
            <article className="hero-console__row" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
        <div className="hero-console__footer">
          <div>
            <span>Core modules</span>
            <strong>Repos, CI/CD, labs, governance</strong>
          </div>
          <div>
            <span>Operating model</span>
            <strong>Role-based access with approvals</strong>
          </div>
        </div>
      </aside>
    </section>
  );
}