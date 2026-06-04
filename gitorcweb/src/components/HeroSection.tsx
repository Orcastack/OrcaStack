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
          <span className="eyebrow">Source control, delivery, automation</span>
          <h1>Operate your engineering estate like a premium internal GitLab.</h1>
          <p>
            GITORC gives platform teams a single front door for repository governance, CI/CD, device orchestration, and runtime policy.
            The public home page leads with product value first, while sign-in stays available when users are ready.
          </p>
        </div>
        <div className="hero-actions">
          <button className="primary-button primary-button--warm" onClick={onSignup} type="button">
            Start with controlled access
          </button>
          <button className="secondary-button secondary-button--ghost" onClick={onLogin} type="button">
            Open operator login
          </button>
        </div>
        <ul className="hero-pillars">
          {landingPillars.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <aside className="hero-console" aria-label="Platform summary">
        <div className="hero-console__header">
          <span>Platform status</span>
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
            <span>Control surfaces</span>
            <strong>Repos, runners, labs, policies</strong>
          </div>
          <div>
            <span>Operator model</span>
            <strong>Approval-driven access</strong>
          </div>
        </div>
      </aside>
    </section>
  );
}