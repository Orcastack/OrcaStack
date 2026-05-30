import React, { useEffect, useMemo, useState } from 'react';

import { fetchOverview, gatewayBase, type Overview } from './api';

const stages = [
  { id: 'review', title: 'Code Review', detail: 'Approve, request changes, and lock merge rules.' },
  { id: 'transform', title: 'Transform CI', detail: 'Normalize inputs, attach signed context, and prepare the build.' },
  { id: 'build', title: 'Build', detail: 'Compile, verify, and attest release artifacts.' },
  { id: 'deploy', title: 'Deploy', detail: 'Promote signed outputs into target environments.' },
  { id: 'automate', title: 'Automate', detail: 'Apply operational flows, runbooks, and post-deploy hooks.' },
  { id: 'containerize', title: 'Containerize', detail: 'Control container rollout, logs, health, and restart intent.' },
];

const rycliActions = [
  'rycli clone core-platform',
  'rycli review core-platform --branch main',
  'rycli build core-platform --commit 9b3f8e2',
  'rycli deploy core-platform --env staging',
];

const serviceMap = [
  { name: 'Gateway', role: 'UI and control-plane entrypoint', endpoint: 'http://localhost:8080' },
  { name: 'Git Service', role: 'Provider sync, clone intents, refs, and commit inspection', endpoint: 'http://localhost:8081' },
  { name: 'Review Service', role: 'Approvals, review queues, and merge policy', endpoint: 'http://localhost:8086' },
  { name: 'CI Engine', role: 'Transform, build, and artifact execution lanes', endpoint: 'http://localhost:8083' },
  { name: 'CD Engine', role: 'Release promotion and automation dispatch', endpoint: 'http://localhost:8084' },
  { name: 'Analytics', role: 'Metrics, traceability, and identity chain views', endpoint: 'http://localhost:8085' },
];

const routeTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'repositories', label: 'Repositories' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'pipelines', label: 'Pipelines' },
  { id: 'deployments', label: 'Deployments' },
  { id: 'containers', label: 'Containers' },
] as const;

type RouteName = (typeof routeTabs)[number]['id'];

type RouteState = {
  name: RouteName;
  repositoryId?: string;
};

const statusMap = {
  blocked: 'Blocked',
  ready: 'Ready',
  active: 'Active',
  done: 'Done',
} as const;

function buildStageState(reviewStatus: string) {
  if (reviewStatus === 'approved') {
    return {
      review: 'done',
      transform: 'active',
      build: 'ready',
      deploy: 'ready',
      automate: 'ready',
      containerize: 'ready',
    } as const;
  }

  if (reviewStatus === 'changes-requested') {
    return {
      review: 'active',
      transform: 'blocked',
      build: 'blocked',
      deploy: 'blocked',
      automate: 'blocked',
      containerize: 'blocked',
    } as const;
  }

  return {
    review: 'active',
    transform: 'ready',
    build: 'blocked',
    deploy: 'blocked',
    automate: 'blocked',
    containerize: 'blocked',
  } as const;
}

function readRoute(): RouteState {
  const hash = window.location.hash.replace(/^#/, '') || '/overview';
  const [pathPart, queryPart] = hash.split('?');
  const route = pathPart.replace(/^\//, '') as RouteName;
  const params = new URLSearchParams(queryPart || '');

  return {
    name: routeTabs.some((item) => item.id === route) ? route : 'overview',
    repositoryId: params.get('repo') || undefined,
  };
}

function toHash(name: RouteName, repositoryId?: string) {
  if (!repositoryId) {
    return `#/${name}`;
  }

  const params = new URLSearchParams({ repo: repositoryId });
  return `#/${name}?${params.toString()}`;
}

function formatStatus(status: string) {
  return status.replace(/-/g, ' ');
}

export function App() {
  const [route, setRoute] = useState<RouteState>(() => readRoute());
  const [overview, setOverview] = useState<Overview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    setIsLoading(true);
    setError(null);

    fetchOverview(controller.signal)
      .then((payload) => {
        setOverview(payload);
      })
      .catch((fetchError: Error) => {
        if (controller.signal.aborted) {
          return;
        }
        setError(fetchError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  const selectedRepository = useMemo(() => {
    if (!overview) {
      return null;
    }

    return (
      overview.repositories.find((repository) => repository.id === route.repositoryId) ?? overview.repositories[0] ?? null
    );
  }, [overview, route.repositoryId]);

  const selectedReview = useMemo(() => {
    if (!overview || !selectedRepository) {
      return null;
    }

    return overview.reviews.find((review) => review.repository_id === selectedRepository.id) ?? null;
  }, [overview, selectedRepository]);

  const selectedPipeline = useMemo(() => {
    if (!overview || !selectedRepository) {
      return null;
    }

    return overview.pipelines.find((pipeline) => pipeline.repository_id === selectedRepository.id) ?? null;
  }, [overview, selectedRepository]);

  const selectedDeployment = useMemo(() => {
    if (!overview || !selectedRepository) {
      return null;
    }

    return overview.deployments.find((deployment) => deployment.repository_id === selectedRepository.id) ?? null;
  }, [overview, selectedRepository]);

  const stageState = buildStageState(selectedReview?.status || 'pending');

  const reviewLabel = selectedReview ? formatStatus(selectedReview.status) : 'No review';

  const filteredRepositories = selectedRepository
    ? overview?.repositories.filter((repository) => repository.provider_id === selectedRepository.provider_id) ?? []
    : overview?.repositories ?? [];

  const renderScreen = () => {
    if (!overview || !selectedRepository) {
      return null;
    }

    switch (route.name) {
      case 'repositories':
        return (
          <section className="layout-grid">
            <article className="panel stack-panel">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">Repositories</p>
                  <h2>Repository selection through the gateway</h2>
                </div>
              </div>
              <div className="repo-list">
                {overview.repositories.map((repository) => (
                  <a key={repository.id} className={`repo-card ${selectedRepository.id === repository.id ? 'repo-card-active' : ''}`} href={toHash('repositories', repository.id)}>
                    <div className="provider-row">
                      <strong>{repository.name}</strong>
                      <span>{repository.branch}</span>
                    </div>
                    <p>{repository.summary}</p>
                    <div className="repo-meta">
                      <span>{repository.provider_id}</span>
                      <span>{repository.identity}</span>
                    </div>
                  </a>
                ))}
              </div>
            </article>
            <article className="panel stack-panel">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">Repository details</p>
                  <h2>{selectedRepository.name}</h2>
                </div>
                <span className="status-badge status-primary">Clone_Repository</span>
              </div>
              <div className="trace-grid">
                <article className="trace-card">
                  <h3>Source</h3>
                  <ul>
                    <li>Provider: {selectedRepository.provider_id}</li>
                    <li>Branch: {selectedRepository.branch}</li>
                    <li>Commit: {selectedRepository.commit}</li>
                    <li>Reviewer: {selectedRepository.reviewer}</li>
                  </ul>
                </article>
                <article className="trace-card">
                  <h3>Identity</h3>
                  <ul>
                    <li>Repository identity: {selectedRepository.identity}</li>
                    <li>Gateway API: {gatewayBase}</li>
                    <li>Tracked at: {overview.updated_at}</li>
                  </ul>
                </article>
              </div>
            </article>
          </section>
        );
      case 'reviews':
        return (
          <section className="layout-grid">
            <article className="panel stack-panel">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">Review board</p>
                  <h2>Open_Code_Review is the gate to CI/CD</h2>
                </div>
                <span className="status-badge status-warn">{reviewLabel}</span>
              </div>
              <div className="repo-list">
                {overview.reviews.map((review) => (
                  <a key={review.id} className={`repo-card ${selectedReview?.id === review.id ? 'repo-card-active' : ''}`} href={toHash('reviews', review.repository_id)}>
                    <div className="provider-row">
                      <strong>{review.title}</strong>
                      <span>{formatStatus(review.status)}</span>
                    </div>
                    <p>{review.approvals}/{review.required_approvals} approvals collected</p>
                    <div className="repo-meta">
                      <span>{review.id}</span>
                      <span>{review.last_updated}</span>
                    </div>
                  </a>
                ))}
              </div>
            </article>
            <article className="panel stack-panel">
              <div className="trace-grid">
                <article className="trace-card">
                  <h3>{selectedReview?.title || 'No review selected'}</h3>
                  <ul>
                    <li>Status: {reviewLabel}</li>
                    <li>Approvals: {selectedReview?.approvals || 0}/{selectedReview?.required_approvals || 0}</li>
                    <li>Repository: {selectedRepository.name}</li>
                  </ul>
                </article>
                <article className="trace-card">
                  <h3>Reviewers</h3>
                  <ul>
                    {(selectedReview?.reviewers || []).map((reviewer) => (
                      <li key={reviewer}>{reviewer}</li>
                    ))}
                  </ul>
                </article>
              </div>
            </article>
          </section>
        );
      case 'pipelines':
        return (
          <section className="panel stack-panel">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Pipeline visualization</p>
                <h2>Transform CI through container orchestration</h2>
              </div>
              <span className="status-badge status-success">{selectedPipeline ? formatStatus(selectedPipeline.status) : 'No pipeline'}</span>
            </div>
            <div className="pipeline-grid">
              {stages.map((stage) => (
                <article key={stage.id} className={`pipeline-card pipeline-${stageState[stage.id as keyof typeof stageState]}`}>
                  <div className="pipeline-head">
                    <span className="step-index">{stage.title.slice(0, 2).toUpperCase()}</span>
                    <span className="mini-badge mini-badge-dark">{stage.id === 'review' ? formatStatus(selectedReview?.status || 'pending') : selectedPipeline ? formatStatus(selectedPipeline[stage.id as keyof typeof selectedPipeline] as string) : 'blocked'}</span>
                  </div>
                  <h3>{stage.title}</h3>
                  <p>{stage.detail}</p>
                </article>
              ))}
            </div>
          </section>
        );
      case 'deployments':
        return (
          <section className="layout-grid">
            <article className="panel stack-panel">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">Deployments</p>
                  <h2>Promotion and automation visibility</h2>
                </div>
              </div>
              <div className="repo-list">
                {overview.deployments.map((deployment) => (
                  <a key={deployment.id} className={`repo-card ${selectedDeployment?.id === deployment.id ? 'repo-card-active' : ''}`} href={toHash('deployments', deployment.repository_id)}>
                    <div className="provider-row">
                      <strong>{deployment.environment}</strong>
                      <span>{formatStatus(deployment.status)}</span>
                    </div>
                    <p>{deployment.artifact}</p>
                    <div className="repo-meta">
                      <span>{deployment.cluster}</span>
                      <span>{deployment.id}</span>
                    </div>
                  </a>
                ))}
              </div>
            </article>
            <article className="panel stack-panel">
              <article className="trace-card">
                <h3>{selectedDeployment?.environment || 'No deployment selected'}</h3>
                <ul>
                  <li>Repository: {selectedRepository.name}</li>
                  <li>Status: {selectedDeployment ? formatStatus(selectedDeployment.status) : 'Unavailable'}</li>
                  <li>Cluster: {selectedDeployment?.cluster || 'Unavailable'}</li>
                  <li>Artifact: {selectedDeployment?.artifact || 'Unavailable'}</li>
                </ul>
              </article>
            </article>
          </section>
        );
      case 'containers':
        return (
          <section className="layout-grid lower-grid">
            <article className="panel stack-panel">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">Container control</p>
                  <h2>Start, stop, restart, logs, and metrics</h2>
                </div>
              </div>
              <div className="control-list">
                {overview.containers.map((container) => (
                  <div key={container.name} className="control-row">
                    <div>
                      <strong>{container.name}</strong>
                      <p>{formatStatus(container.state)} · CPU {container.cpu} · Memory {container.memory}</p>
                    </div>
                    <span className="button button-ghost">{container.action}</span>
                  </div>
                ))}
              </div>
            </article>
            <article className="panel stack-panel">
              <article className="trace-card">
                <h3>Log channels</h3>
                <ul>
                  {overview.containers.map((container) => (
                    <li key={container.name}>{container.name}: {container.log_channel}</li>
                  ))}
                </ul>
              </article>
            </article>
          </section>
        );
      case 'overview':
      default:
        return (
          <>
            <section className="metrics-grid">
              {overview.metrics.map((metric) => (
                <article key={metric.label} className="metric-card">
                  <p>{metric.label}</p>
                  <strong>{metric.value}</strong>
                  <span>{metric.hint}</span>
                </article>
              ))}
            </section>

            <section className="layout-grid">
              <article className="panel stack-panel">
                <div className="section-heading">
                  <div>
                    <p className="section-kicker">Git providers</p>
                    <h2>Connect_Git_Provider</h2>
                  </div>
                  <span className="status-badge status-primary">Gateway-backed</span>
                </div>
                <div className="provider-grid">
                  {overview.providers.map((provider) => (
                    <a key={provider.id} className={`provider-card ${selectedRepository.provider_id === provider.id ? 'provider-card-active' : ''}`} href={toHash('repositories', overview.repositories.find((repository) => repository.provider_id === provider.id)?.id)}>
                      <div className="provider-row">
                        <strong>{provider.name}</strong>
                        <span className={`mini-badge mini-badge-${provider.status}`}>{provider.status}</span>
                      </div>
                      <span>{provider.repos} repositories</span>
                      <span>{provider.latency} control-plane latency</span>
                    </a>
                  ))}
                </div>

                <div className="section-heading compact-heading">
                  <div>
                    <p className="section-kicker">Repository selection</p>
                    <h2>Gateway repository inventory</h2>
                  </div>
                </div>

                <div className="repo-list">
                  {filteredRepositories.map((repository) => (
                    <a key={repository.id} className={`repo-card ${selectedRepository.id === repository.id ? 'repo-card-active' : ''}`} href={toHash('overview', repository.id)}>
                      <div className="provider-row">
                        <strong>{repository.name}</strong>
                        <span>{repository.branch}</span>
                      </div>
                      <p>{repository.summary}</p>
                      <div className="repo-meta">
                        <span>Commit {repository.commit}</span>
                        <span>{repository.reviewer}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </article>

              <article className="panel stack-panel wide-panel">
                <div className="section-heading">
                  <div>
                    <p className="section-kicker">Pipeline control</p>
                    <h2>Review → Transform → Build → Deploy → Automate → Containerize</h2>
                  </div>
                  <span className="status-badge status-success">{reviewLabel}</span>
                </div>

                <div className="pipeline-grid">
                  {stages.map((stage, index) => (
                    <article key={stage.id} className={`pipeline-card pipeline-${stageState[stage.id as keyof typeof stageState]}`}>
                      <div className="pipeline-head">
                        <span className="step-index">0{index + 1}</span>
                        <span className="mini-badge mini-badge-dark">
                          {stage.id === 'review'
                            ? reviewLabel
                            : selectedPipeline
                              ? formatStatus(selectedPipeline[stage.id as keyof typeof selectedPipeline] as string)
                              : 'Blocked'}
                        </span>
                      </div>
                      <h3>{stage.title}</h3>
                      <p>{stage.detail}</p>
                    </article>
                  ))}
                </div>

                <div className="trace-grid">
                  <article className="trace-card">
                    <p className="section-kicker">Selected repository</p>
                    <h3>{selectedRepository.name}</h3>
                    <ul>
                      <li>Provider: {selectedRepository.provider_id}</li>
                      <li>Branch: {selectedRepository.branch}</li>
                      <li>Commit: {selectedRepository.commit}</li>
                      <li>Reviewer: {selectedRepository.reviewer}</li>
                    </ul>
                  </article>
                  <article className="trace-card">
                    <p className="section-kicker">Traceability</p>
                    <ul>
                      <li>Gateway source: {gatewayBase}</li>
                      <li>Review state: {reviewLabel}</li>
                      <li>Pipeline status: {selectedPipeline ? formatStatus(selectedPipeline.status) : 'Unavailable'}</li>
                      <li>Deployment status: {selectedDeployment ? formatStatus(selectedDeployment.status) : 'Unavailable'}</li>
                    </ul>
                  </article>
                </div>
              </article>
            </section>

            <section className="layout-grid lower-grid">
              <article className="panel stack-panel">
                <div className="section-heading">
                  <div>
                    <p className="section-kicker">Automation and containers</p>
                    <h2>Central control panel</h2>
                  </div>
                </div>
                <div className="control-list">
                  {overview.containers.map((container) => (
                    <div key={container.name} className="control-row">
                      <div>
                        <strong>{container.name}</strong>
                        <p>{formatStatus(container.state)} · CPU {container.cpu} · Memory {container.memory}</p>
                      </div>
                      <a className="button button-ghost" href={toHash('containers', selectedRepository.id)}>
                        {container.action}
                      </a>
                    </div>
                  ))}
                </div>

                <div className="service-grid">
                  {serviceMap.map((service) => (
                    <article key={service.name} className="service-card">
                      <h3>{service.name}</h3>
                      <p>{service.role}</p>
                      <span>{service.endpoint}</span>
                    </article>
                  ))}
                </div>
              </article>

              <article className="panel stack-panel">
                <div className="section-heading">
                  <div>
                    <p className="section-kicker">RYCLI companion</p>
                    <h2>Terminal actions resolve into UI flows</h2>
                  </div>
                </div>
                <div className="command-list">
                  {rycliActions.map((command) => (
                    <code key={command}>{command} → opens http://localhost:5050</code>
                  ))}
                </div>

                <div className="section-heading compact-heading">
                  <div>
                    <p className="section-kicker">Activity stream</p>
                    <h2>Logs and metrics remain visible</h2>
                  </div>
                </div>
                <ul className="feed-list">
                  {overview.activity.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </section>
          </>
        );
    }
  };

  return (
    <main className="shell">
      <section className="hero panel hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">gitorc ui directive</p>
          <h1>Local UI on localhost:5050 is now the mandatory entry point.</h1>
          <p className="lede">
            Repository access, code review, transform CI, build, deployment, automation, and
            container orchestration all route through one signed control plane before anything runs.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="http://localhost:5050">
              Open GITORC UI
            </a>
            <span className="button button-muted">Gateway API: {gatewayBase}</span>
            <a className="button button-ghost" href={window.location.hash || '#/overview'} onClick={(event) => {
              event.preventDefault();
              window.location.hash = window.location.hash || '#/overview';
              setRoute(readRoute());
            }}>
              Refresh route
            </a>
          </div>
        </div>
        <div className="hero-side">
          <nav className="route-nav" aria-label="Primary screens">
            {routeTabs.map((tab) => (
              <a key={tab.id} className={`route-link ${route.name === tab.id ? 'route-link-active' : ''}`} href={toHash(tab.id, route.repositoryId)}>
                {tab.label}
              </a>
            ))}
          </nav>
          <div className="badge-stack">
            <span className="status-badge status-primary">Official port 5050</span>
            <span className="status-badge status-success">Gateway-backed data</span>
            <span className="status-badge status-warn">Review gates before CI/CD</span>
          </div>
          <div className="identity-card">
            <h2>Identity chain</h2>
            <dl>
              <div>
                <dt>Repository</dt>
                <dd>orca:repo:3f6d8c3e-6c96-4d8c-a2d3-6f4a8f4b7f2a</dd>
              </div>
              <div>
                <dt>UI process</dt>
                <dd>orca:process:3561f437-25f1-4f4b-87ed-89bc1b0932f0</dd>
              </div>
              <div>
                <dt>Directory</dt>
                <dd>LDAP registered, RBAC verified, attestation signed</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {isLoading ? <section className="panel loading-panel">Loading gateway data…</section> : null}
      {error ? (
        <section className="panel loading-panel">
          <h2>Gateway connection failed</h2>
          <p>{error}</p>
          <p>Expected source: {gatewayBase}/api/overview</p>
        </section>
      ) : null}

      {!isLoading && !error ? renderScreen() : null}
    </main>
  );
}
