type CommunityPageProps = {
  onLogin: () => void;
  onSignup: () => void;
};

const communityCards = [
  {
    title: 'Platform working groups',
    description: 'Align release managers, developers, and operators around shared standards for source control, security review, and delivery approvals.',
  },
  {
    title: 'Operational knowledge sharing',
    description: 'Capture environment lessons, incident patterns, and automation improvements in one place instead of scattering them across tools.',
  },
  {
    title: 'Visible contribution paths',
    description: 'Make onboarding, access requests, documentation contributions, and product feedback feel like part of one coherent platform.',
  },
];

export function CommunityPage({ onLogin, onSignup }: CommunityPageProps) {
  return (
    <>
      <section className="page-hero">
        <span className="eyebrow">Community</span>
        <h1>Community is part of the product surface, not an afterthought.</h1>
        <p>
          The community page gives GITORC a stronger front-of-house presence for contributors, platform adopters, and operational stakeholders who need a shared understanding of how the system evolves.
        </p>
      </section>

      <section className="page-grid">
        {communityCards.map((card) => (
          <article className="page-card" key={card.title}>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </article>
        ))}
      </section>

      <section className="cta-band">
        <div>
          <span className="eyebrow">Get involved</span>
          <h2>Request access or return to your operator workspace.</h2>
        </div>
        <div className="hero-actions">
          <button className="secondary-button" onClick={onLogin} type="button">Sign in</button>
          <button className="primary-button primary-button--warm" onClick={onSignup} type="button">Request access</button>
        </div>
      </section>
    </>
  );
}