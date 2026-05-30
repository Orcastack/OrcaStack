import React, { useEffect, useMemo, useState } from 'react';

import {
  fetchOverview,
  getGatewayBase,
  type CloneOperation,
  type Container,
  type Deployment,
  type EventEntry,
  type Overview,
  type Pipeline,
  type Repository,
  type Review,
  type SecurityState,
} from './api';

const serviceMap = [
  { name: 'Gateway', role: 'UI and control-plane entrypoint', endpoint: 'http://localhost:8080 or http://localhost:18080' },
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

type FocusState =
  | { kind: 'repository'; id: string }
  | { kind: 'pipeline'; id: string }
  | { kind: 'deployment'; id: string }
  | { kind: 'process'; id: string };

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

function formatTime(value: string) {
  return new Date(value).toLocaleString();
}

function statusClass(status: string) {
  if (['running', 'passed', 'completed', 'connected', 'primary', 'success', 'verified'].includes(status)) {
    return 'tone-success';
  }
  if (['pending', 'queued', 'ready', 'review-gated', 'standby'].includes(status)) {
    return 'tone-warn';
  }
  if (['failed', 'crashed', 'blocked', 'rolling-back', 'changes-requested', 'stopped'].includes(status)) {
    return 'tone-danger';
  }
  return 'tone-neutral';
}

function securityLabel(security: SecurityState) {
  return security.verified ? 'verified' : 'attention required';
}

export function App() {
  const [route, setRoute] = useState<RouteState>(() => readRoute());
  const [overview, setOverview] = useState<Overview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focus, setFocus] = useState<FocusState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [eventKindFilter, setEventKindFilter] = useState<'all' | 'repository' | 'pipeline' | 'deployment' | 'process'>('all');
  const [eventRepositoryFilter, setEventRepositoryFilter] = useState<string>('all');
  const [activeGatewayBase, setActiveGatewayBase] = useState(getGatewayBase());

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    let active = true;

    const loadOverview = async () => {
      try {
        const payload = await fetchOverview();
        if (!active) {
          return;
        }
        setOverview(payload);
        setActiveGatewayBase(getGatewayBase());
        setError(null);
      } catch (fetchError) {
        if (!active) {
          return;
        }
        setError(fetchError instanceof Error ? fetchError.message : 'Unknown gateway error');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadOverview();
    const interval = window.setInterval(() => {
      void loadOverview();
    }, 8000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

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

  const selectedClone = useMemo(() => {
    if (!overview || !selectedRepository) {
      return null;
    }

    return overview.clone_operations.find((operation) => operation.repository_id === selectedRepository.id) ?? null;
  }, [overview, selectedRepository]);

  const selectedContainer = useMemo(() => {
    if (!overview) {
      return null;
    }

    if (focus?.kind === 'process') {
      return overview.containers.find((container) => container.name === focus.id) ?? overview.containers[0] ?? null;
    }

    return overview.containers[0] ?? null;
  }, [focus, overview]);

  const focusedSecurity = useMemo(() => {
    if (!overview || !selectedRepository) {
      return null;
    }

    if (focus?.kind === 'deployment') {
      const deployment = overview.deployments.find((item) => item.id === focus.id);
      if (deployment) {
        return {
          label: `${deployment.service_name} deployment`,
          upi: deployment.upi,
          security: deployment.security,
          detail: `${deployment.environment} • ${deployment.version}`,
        };
      }
    }

    if (focus?.kind === 'pipeline') {
      const pipeline = overview.pipelines.find((item) => item.id === focus.id);
      if (pipeline) {
        return {
          label: `${pipeline.name} pipeline`,
          upi: pipeline.upi,
          security: pipeline.security,
          detail: `${pipeline.branch} • ${formatStatus(pipeline.status)}`,
        };
      }
    }

    if (focus?.kind === 'process') {
      const container = overview.containers.find((item) => item.name === focus.id);
      if (container) {
        return {
          label: `${container.name} process`,
          upi: container.upi,
          security: container.security,
          detail: `${container.host} • ${formatStatus(container.state)}`,
        };
      }
    }

    return {
      label: `${selectedRepository.name} repository`,
      upi: selectedRepository.identity,
      security: selectedRepository.security,
      detail: `${selectedRepository.provider_id} • ${selectedRepository.default_branch}`,
    };
  }, [focus, overview, selectedRepository]);

  const filteredEvents = useMemo(() => {
    if (!overview) {
      return [];
    }

    return overview.events.filter((event) => {
      const matchesKind = eventKindFilter === 'all' || event.kind === eventKindFilter;
      const matchesRepository = eventRepositoryFilter === 'all' || event.repository_id === eventRepositoryFilter;
      return matchesKind && matchesRepository;
    });
  }, [eventKindFilter, eventRepositoryFilter, overview]);

  const navigateTo = (name: RouteName, repositoryId?: string) => {
    window.location.hash = toHash(name, repositoryId);
    setRoute({ name, repositoryId });
  };

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setToast(`${label} copied to clipboard.`);
    } catch {
      setToast(`${label}: ${value}`);
    }
  };

  const handleRepositoryAction = async (repository: Repository, operation: CloneOperation | null, action: 'clone' | 'rycli' | 'review') => {
    setFocus({ kind: 'repository', id: repository.id });
    navigateTo('repositories', repository.id);

    if (action === 'clone' && operation) {
      await copyText(operation.clone_url, 'Clone URL');
      return;
    }

    if (action === 'rycli' && operation) {
      await copyText(operation.command, 'RYCLI command');
      return;
    }

    if (action === 'review') {
      setToast(`Opening review board for ${repository.name}.`);
      navigateTo('reviews', repository.id);
    }
  };

  const handlePipelineAction = (pipeline: Pipeline, action: 'run' | 'history' | 'logs') => {
    setFocus({ kind: 'pipeline', id: pipeline.id });
    navigateTo('pipelines', pipeline.repository_id);
    setToast(
      action === 'run'
        ? `Pipeline ${pipeline.name} armed for manual run.`
        : action === 'history'
          ? `Showing run history for ${pipeline.name}.`
          : `Log channel: ${pipeline.log_channel}`,
    );
  };

  const handleDeploymentAction = (deployment: Deployment, action: 'deploy' | 'rollback' | 'details') => {
    setFocus({ kind: 'deployment', id: deployment.id });
    navigateTo('deployments', deployment.repository_id);
    setToast(
      action === 'deploy'
        ? `Deploy target ${deployment.target_commit} selected for ${deployment.environment}.`
        : action === 'rollback'
          ? `Rollback target ${deployment.previous_version} selected for ${deployment.service_name}.`
          : `Deployment channel: ${deployment.log_channel}`,
    );
  };

  const handleContainerAction = (container: Container, action: string) => {
    setFocus({ kind: 'process', id: container.name });
    navigateTo('containers', selectedRepository?.id);
    setToast(`${container.name}: ${action} selected.`);
  };

  const renderRepositoriesPanel = () => {
    if (!overview || !selectedRepository) {
      return null;
    }

    return (
      <section className="panel stack-panel dashboard-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Repositories & clone panel</p>
            <h2>Connected source inventory and clone intents</h2>
          </div>
          <span className="status-badge status-primary">Live from gateway</span>
        </div>

        <div className="provider-grid">
          {overview.providers.map((provider) => (
            <article key={provider.id} className="provider-card">
              <div className="provider-row">
                <strong>{provider.name}</strong>
                <span className={`mini-badge ${statusClass(provider.status)}`}>{formatStatus(provider.status)}</span>
              </div>
              <span>{provider.repos} repositories</span>
              <span>{provider.latency} latency</span>
              <span className="identity-chip">{provider.identity}</span>
            </article>
          ))}
        </div>

        <div className="entity-grid entity-grid-wide">
          <div className="repo-list">
            {overview.repositories.map((repository) => {
              const operation = overview.clone_operations.find((item) => item.repository_id === repository.id) ?? null;

              return (
                <article key={repository.id} className={`repo-card ${selectedRepository.id === repository.id ? 'repo-card-active' : ''}`}>
                  <div className="provider-row">
                    <strong>{repository.name}</strong>
                    <span className={`mini-badge ${statusClass(operation?.status || 'pending')}`}>{formatStatus(operation?.status || 'pending')}</span>
                  </div>
                  <p>{repository.summary}</p>
                  <div className="repo-meta">
                    <span>{repository.provider_id}</span>
                    <span>{repository.default_branch}</span>
                    <span>{repository.commit}</span>
                    <span>{formatTime(repository.last_commit_at)}</span>
                  </div>
                  <div className="action-row">
                    <button className="button button-primary" onClick={() => void handleRepositoryAction(repository, operation, 'clone')} type="button">Clone</button>
                    <button className="button button-ghost" onClick={() => void handleRepositoryAction(repository, operation, 'rycli')} type="button">Open in RYCLI</button>
                    <button className="button button-ghost" onClick={() => void handleRepositoryAction(repository, operation, 'review')} type="button">Open review</button>
                  </div>
                </article>
              );
            })}
          </div>

          <article className="trace-card detail-card">
            <p className="section-kicker">Selected clone intent</p>
            <h3>{selectedRepository.name}</h3>
            <ul>
              <li>Clone URL: {selectedClone?.clone_url || selectedRepository.clone_url}</li>
              <li>RYCLI command: {selectedClone?.command || `rycli clone ${selectedRepository.id}`}</li>
              <li>Status: {formatStatus(selectedClone?.status || 'pending')}</li>
              <li>UPI: {selectedClone?.upi || selectedRepository.identity}</li>
              <li>Default branch: {selectedRepository.default_branch}</li>
            </ul>
          </article>
        </div>
      </section>
    );
  };

  const renderGitlabOverview = () => {
    if (!overview || !selectedRepository) {
      return null;
    }

    return (
      <section className="gitlab-shell">
        <aside className="gitlab-sidebar panel">
          <div className="sidebar-group">
            <p className="section-kicker">Projects</p>
            <button className="button button-primary sidebar-button" onClick={() => setToast('Create project flow staged through the gateway control plane.')} type="button">
              Create project
            </button>
            <button className="button button-ghost sidebar-button" onClick={() => navigateTo('repositories', selectedRepository.id)} type="button">
              Import repository
            </button>
            <button className="button button-ghost sidebar-button" onClick={() => navigateTo('reviews', selectedRepository.id)} type="button">
              Open review queue
            </button>
          </div>
          <div className="sidebar-group">
            <p className="section-kicker">Your projects</p>
            <div className="project-nav-list">
              {overview.repositories.map((repository) => (
                <button
                  key={repository.id}
                  className={`project-nav-item ${selectedRepository.id === repository.id ? 'project-nav-item-active' : ''}`}
                  onClick={() => {
                    setFocus({ kind: 'repository', id: repository.id });
                    navigateTo('overview', repository.id);
                  }}
                  type="button"
                >
                  <strong>{repository.name}</strong>
                  <span>{repository.provider_id}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="gitlab-main">
          <section className="gitlab-header panel">
            <div>
              <p className="eyebrow">gitorc dashboard</p>
              <h2>Projects, delivery, runtime, and trust in one control plane</h2>
              <p className="lede">The overview now behaves like a project operations home: create projects, inspect repositories, run CI, deploy builds, and trace every action through its signed identity chain.</p>
            </div>
            <div className="header-actions">
              <button className="button button-primary" onClick={() => setToast('Create project requests will be sent through the gateway when mutation endpoints are enabled.')} type="button">
                New project
              </button>
              <button className="button button-ghost" onClick={() => navigateTo('pipelines', selectedRepository.id)} type="button">
                Run pipeline
              </button>
              <button className="button button-ghost" onClick={() => navigateTo('deployments', selectedRepository.id)} type="button">
                Deploy build
              </button>
            </div>
          </section>

          <section className="metrics-grid metrics-grid-compact">
            {overview.metrics.map((metric) => (
              <article key={metric.label} className="metric-card metric-card-compact">
                <p>{metric.label}</p>
                <strong>{metric.value}</strong>
                <span>{metric.hint}</span>
              </article>
            ))}
          </section>

          <section className="panel stack-panel dashboard-block">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Project inventory</p>
                <h2>Repositories & clone operations</h2>
              </div>
              <span className="status-badge status-primary">Gateway source: {activeGatewayBase}</span>
            </div>

            <div className="table-shell">
              <div className="table-head table-projects">
                <span>Project</span>
                <span>Provider</span>
                <span>Default branch</span>
                <span>Last commit</span>
                <span>Clone</span>
                <span>Actions</span>
              </div>
              {overview.repositories.map((repository) => {
                const operation = overview.clone_operations.find((item) => item.repository_id === repository.id) ?? null;

                return (
                  <div key={repository.id} className={`table-row table-projects ${selectedRepository.id === repository.id ? 'table-row-active' : ''}`}>
                    <div>
                      <strong>{repository.name}</strong>
                      <p>{repository.summary}</p>
                    </div>
                    <span>{repository.provider_id}</span>
                    <span>{repository.default_branch}</span>
                    <span>{repository.commit}</span>
                    <span className={`mini-badge ${statusClass(operation?.status || 'pending')}`}>{formatStatus(operation?.status || 'pending')}</span>
                    <div className="table-actions">
                      <button className="button button-primary" onClick={() => void handleRepositoryAction(repository, operation, 'clone')} type="button">Clone</button>
                      <button className="button button-ghost" onClick={() => void handleRepositoryAction(repository, operation, 'rycli')} type="button">RYCLI</button>
                      <button className="button button-ghost" onClick={() => void handleRepositoryAction(repository, operation, 'review')} type="button">Review</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="gitlab-grid-two">
            <section className="panel stack-panel dashboard-block">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">Deployments</p>
                  <h2>Environment rollout status</h2>
                </div>
              </div>
              <div className="table-shell">
                <div className="table-head table-deployments">
                  <span>Service</span>
                  <span>Version</span>
                  <span>Environment</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>
                {overview.deployments.map((deployment) => (
                  <div key={deployment.id} className={`table-row table-deployments ${selectedDeployment?.id === deployment.id ? 'table-row-active' : ''}`}>
                    <span>{deployment.service_name}</span>
                    <span>{deployment.version}</span>
                    <span>{deployment.environment}</span>
                    <span className={`mini-badge ${statusClass(deployment.status)}`}>{formatStatus(deployment.status)}</span>
                    <div className="table-actions">
                      <button className="button button-ghost" onClick={() => handleDeploymentAction(deployment, 'deploy')} type="button">Deploy</button>
                      <button className="button button-ghost" onClick={() => handleDeploymentAction(deployment, 'rollback')} type="button">Rollback</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel stack-panel dashboard-block">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">Pipelines / CI</p>
                  <h2>Recent pipeline health</h2>
                </div>
              </div>
              <div className="table-shell">
                <div className="table-head table-pipelines">
                  <span>Pipeline</span>
                  <span>Branch</span>
                  <span>Last run</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>
                {overview.pipelines.map((pipeline) => (
                  <div key={pipeline.id} className={`table-row table-pipelines ${selectedPipeline?.id === pipeline.id ? 'table-row-active' : ''}`}>
                    <div>
                      <strong>{pipeline.name}</strong>
                      <p>{pipeline.repository_id}</p>
                    </div>
                    <span>{pipeline.branch}</span>
                    <span>{formatTime(pipeline.last_run)}</span>
                    <span className={`mini-badge ${statusClass(pipeline.status)}`}>{formatStatus(pipeline.status)}</span>
                    <div className="table-actions">
                      <button className="button button-ghost" onClick={() => handlePipelineAction(pipeline, 'run')} type="button">Run</button>
                      <button className="button button-ghost" onClick={() => handlePipelineAction(pipeline, 'logs')} type="button">Logs</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </section>

          <section className="gitlab-grid-two">
            <section className="panel stack-panel dashboard-block">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">Live processes & containers</p>
                  <h2>Runtime monitor</h2>
                </div>
              </div>
              <div className="table-shell">
                <div className="table-head table-processes">
                  <span>Process</span>
                  <span>UPI</span>
                  <span>Host</span>
                  <span>Status</span>
                  <span>Metrics</span>
                </div>
                {overview.containers.map((container) => (
                  <div key={container.name} className={`table-row table-processes ${selectedContainer?.name === container.name ? 'table-row-active' : ''}`}>
                    <span>{container.name}</span>
                    <span className="table-code">{container.upi}</span>
                    <span>{container.host}</span>
                    <span className={`mini-badge ${statusClass(container.state)}`}>{formatStatus(container.state)}</span>
                    <button className="button button-ghost" onClick={() => handleContainerAction(container, 'metrics')} type="button">Open metrics</button>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel stack-panel dashboard-block">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">Identity & security</p>
                  <h2>Trust chain for the selected subject</h2>
                </div>
              </div>
              <div className="security-panel-list">
                <article className="trace-card detail-card">
                  <h3>{focusedSecurity?.label || 'Selected subject'}</h3>
                  <ul>
                    <li>UPI: {focusedSecurity?.upi || 'Unavailable'}</li>
                    <li>Repository identity: {overview.security.repository_identity}</li>
                    <li>UI process: {overview.security.ui_process_identity}</li>
                    <li>LDAP: {focusedSecurity?.security.ldap_registered ? 'registered' : 'pending'}</li>
                    <li>RBAC: {focusedSecurity?.security.rbac_verified ? 'verified' : 'pending'}</li>
                    <li>Attestation: {focusedSecurity?.security.attestation_signed ? 'signed' : 'pending'}</li>
                  </ul>
                </article>
              </div>
            </section>
          </section>

          <section className="panel stack-panel dashboard-block">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Logs / events stream</p>
                <h2>Recent system activity</h2>
              </div>
            </div>
            <div className="filter-row">
              <label>
                Kind
                <select value={eventKindFilter} onChange={(event) => setEventKindFilter(event.target.value as typeof eventKindFilter)}>
                  <option value="all">All</option>
                  <option value="repository">Repository</option>
                  <option value="pipeline">Pipeline</option>
                  <option value="deployment">Deployment</option>
                  <option value="process">Process</option>
                </select>
              </label>
              <label>
                Repository
                <select value={eventRepositoryFilter} onChange={(event) => setEventRepositoryFilter(event.target.value)}>
                  <option value="all">All</option>
                  {overview.repositories.map((repository) => (
                    <option key={repository.id} value={repository.id}>{repository.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="events-list events-list-compact">
              {filteredEvents.map((event) => (
                <article key={event.id} className="event-row">
                  <div className="event-grid">
                    <span>{formatTime(event.time)}</span>
                    <strong>{event.component}</strong>
                    <span>{event.action}</span>
                    <span className={`mini-badge ${statusClass(event.result)}`}>{formatStatus(event.result)}</span>
                    <span className="table-code">{event.upi}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    );
  };

  const renderReviewsPanel = () => {
    if (!overview || !selectedRepository) {
      return null;
    }

    return (
      <section className="panel stack-panel dashboard-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Code review gate</p>
            <h2>Review state decides whether pipelines can move</h2>
          </div>
          <span className={`status-badge ${statusClass(selectedReview?.status || 'pending')}`}>{selectedReview ? formatStatus(selectedReview.status) : 'No review'}</span>
        </div>
        <div className="entity-grid">
          {overview.reviews.map((review: Review) => (
            <article key={review.id} className={`trace-card ${selectedReview?.id === review.id ? 'repo-card-active' : ''}`}>
              <div className="provider-row">
                <strong>{review.title}</strong>
                <span className={`mini-badge ${statusClass(review.status)}`}>{formatStatus(review.status)}</span>
              </div>
              <p>{review.approvals}/{review.required_approvals} approvals</p>
              <ul>
                <li>Repository: {review.repository_id}</li>
                <li>Updated: {formatTime(review.last_updated)}</li>
                <li>Reviewers: {review.reviewers.join(', ')}</li>
              </ul>
              <div className="action-row">
                <button className="button button-ghost" onClick={() => navigateTo('pipelines', review.repository_id)} type="button">Open pipeline</button>
                <button className="button button-ghost" onClick={() => setFocus({ kind: 'repository', id: review.repository_id })} type="button">Trace identity</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  };

  const renderDeploymentsPanel = () => {
    if (!overview || !selectedRepository) {
      return null;
    }

    return (
      <section className="panel stack-panel dashboard-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Deployments panel</p>
            <h2>Live deployment lanes across environments</h2>
          </div>
          <span className={`status-badge ${statusClass(selectedDeployment?.status || 'pending')}`}>{selectedDeployment ? formatStatus(selectedDeployment.status) : 'No deployment'}</span>
        </div>

        <div className="entity-grid entity-grid-wide">
          <div className="repo-list">
            {overview.deployments.map((deployment) => (
              <article key={deployment.id} className={`repo-card ${selectedDeployment?.id === deployment.id ? 'repo-card-active' : ''}`}>
                <div className="provider-row">
                  <strong>{deployment.service_name}</strong>
                  <span className={`mini-badge ${statusClass(deployment.status)}`}>{formatStatus(deployment.status)}</span>
                </div>
                <p>{deployment.version} → {deployment.environment}</p>
                <div className="repo-meta">
                  <span>{deployment.cluster}</span>
                  <span>{deployment.artifact}</span>
                </div>
                <div className="action-row">
                  <button className="button button-primary" onClick={() => handleDeploymentAction(deployment, 'deploy')} type="button">Deploy new version</button>
                  <button className="button button-ghost" onClick={() => handleDeploymentAction(deployment, 'rollback')} type="button">Rollback</button>
                  <button className="button button-ghost" onClick={() => handleDeploymentAction(deployment, 'details')} type="button">Details</button>
                </div>
              </article>
            ))}
          </div>

          <article className="trace-card detail-card">
            <p className="section-kicker">Selected deployment</p>
            <h3>{selectedDeployment?.service_name || selectedRepository.name}</h3>
            <ul>
              <li>Environment: {selectedDeployment?.environment || 'Unavailable'}</li>
              <li>Status: {selectedDeployment ? formatStatus(selectedDeployment.status) : 'Unavailable'}</li>
              <li>Target commit: {selectedDeployment?.target_commit || selectedRepository.commit}</li>
              <li>Previous version: {selectedDeployment?.previous_version || 'Unavailable'}</li>
              <li>Identity: {selectedDeployment?.upi || selectedRepository.identity}</li>
              <li>Log channel: {selectedDeployment?.log_channel || 'Unavailable'}</li>
            </ul>
          </article>
        </div>
      </section>
    );
  };

  const renderPipelinesPanel = () => {
    if (!overview || !selectedRepository) {
      return null;
    }

    return (
      <section className="panel stack-panel dashboard-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Pipelines / CI panel</p>
            <h2>Transform CI and downstream stages</h2>
          </div>
          <span className={`status-badge ${statusClass(selectedPipeline?.status || 'queued')}`}>{selectedPipeline ? formatStatus(selectedPipeline.status) : 'No pipeline'}</span>
        </div>

        <div className="entity-grid entity-grid-wide">
          <div className="repo-list">
            {overview.pipelines.map((pipeline) => (
              <article key={pipeline.id} className={`repo-card ${selectedPipeline?.id === pipeline.id ? 'repo-card-active' : ''}`}>
                <div className="provider-row">
                  <strong>{pipeline.name}</strong>
                  <span className={`mini-badge ${statusClass(pipeline.status)}`}>{formatStatus(pipeline.status)}</span>
                </div>
                <p>{pipeline.repository_id} • {pipeline.branch} • last run {formatTime(pipeline.last_run)}</p>
                <div className="stage-strip">
                  {pipeline.stages.map((stage) => (
                    <span key={stage.name} className={`stage-pill ${statusClass(stage.status)}`}>{stage.name}: {formatStatus(stage.status)}</span>
                  ))}
                </div>
                <div className="action-row">
                  <button className="button button-primary" onClick={() => handlePipelineAction(pipeline, 'run')} type="button">Run pipeline</button>
                  <button className="button button-ghost" onClick={() => handlePipelineAction(pipeline, 'history')} type="button">Run history</button>
                  <button className="button button-ghost" onClick={() => handlePipelineAction(pipeline, 'logs')} type="button">Logs</button>
                </div>
              </article>
            ))}
          </div>

          <article className="trace-card detail-card">
            <p className="section-kicker">Selected pipeline</p>
            <h3>{selectedPipeline?.name || 'Unavailable'}</h3>
            <ul>
              <li>Repository: {selectedPipeline?.repository_id || selectedRepository.id}</li>
              <li>UPI: {selectedPipeline?.upi || 'Unavailable'}</li>
              <li>Log channel: {selectedPipeline?.log_channel || 'Unavailable'}</li>
              <li>Status: {selectedPipeline ? formatStatus(selectedPipeline.status) : 'Unavailable'}</li>
            </ul>
            <div className="history-list">
              {(selectedPipeline?.run_history || []).map((run) => (
                <div key={run.id} className="history-row">
                  <strong>{run.id}</strong>
                  <span>{run.trigger}</span>
                  <span className={`mini-badge ${statusClass(run.status)}`}>{formatStatus(run.status)}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    );
  };

  const renderProcessesPanel = () => {
    if (!overview || !selectedContainer) {
      return null;
    }

    return (
      <section className="panel stack-panel dashboard-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Live processes & containers</p>
            <h2>Runtime state, host placement, and controls</h2>
          </div>
          <span className={`status-badge ${statusClass(selectedContainer.state)}`}>{formatStatus(selectedContainer.state)}</span>
        </div>

        <div className="entity-grid entity-grid-wide">
          <div className="repo-list">
            {overview.containers.map((container) => (
              <article key={container.name} className={`repo-card ${selectedContainer.name === container.name ? 'repo-card-active' : ''}`}>
                <div className="provider-row">
                  <strong>{container.name}</strong>
                  <span className={`mini-badge ${statusClass(container.state)}`}>{formatStatus(container.state)}</span>
                </div>
                <div className="repo-meta">
                  <span>{container.upi}</span>
                  <span>{container.host}</span>
                </div>
                <p>CPU {container.cpu} • Memory {container.memory} • Restarts {container.restarts}</p>
                <div className="action-row">
                  {container.actions.map((action) => (
                    <button key={action} className="button button-ghost" onClick={() => handleContainerAction(container, action)} type="button">
                      {formatStatus(action)}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <article className="trace-card detail-card">
            <p className="section-kicker">Selected process</p>
            <h3>{selectedContainer.name}</h3>
            <ul>
              <li>UPI: {selectedContainer.upi}</li>
              <li>Host: {selectedContainer.host}</li>
              <li>Log channel: {selectedContainer.log_channel}</li>
              <li>Metrics: {selectedContainer.metrics_url}</li>
              <li>Restarts: {selectedContainer.restarts}</li>
            </ul>
          </article>
        </div>
      </section>
    );
  };

  const renderSecurityPanel = () => {
    if (!overview || !focusedSecurity) {
      return null;
    }

    return (
      <section className="panel stack-panel dashboard-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Identity chain & security</p>
            <h2>Known, authorized, and signed runtime subjects</h2>
          </div>
          <span className={`status-badge ${statusClass(securityLabel(focusedSecurity.security))}`}>{securityLabel(focusedSecurity.security)}</span>
        </div>

        <div className="trace-grid security-grid">
          <article className="trace-card">
            <h3>Global identities</h3>
            <ul>
              <li>Repository identity: {overview.security.repository_identity}</li>
              <li>UI process identity: {overview.security.ui_process_identity}</li>
              <li>Gateway source: {activeGatewayBase}</li>
              <li>Updated at: {formatTime(overview.updated_at)}</li>
            </ul>
          </article>
          <article className="trace-card">
            <h3>Directory status</h3>
            <div className="security-checks">
              <span className={`stage-pill ${overview.security.directory.ldap_registered ? 'tone-success' : 'tone-danger'}`}>LDAP registered</span>
              <span className={`stage-pill ${overview.security.directory.rbac_verified ? 'tone-success' : 'tone-danger'}`}>RBAC verified</span>
              <span className={`stage-pill ${overview.security.directory.attestation_signed ? 'tone-success' : 'tone-danger'}`}>Attestation signed</span>
            </div>
          </article>
          <article className="trace-card detail-card">
            <h3>{focusedSecurity.label}</h3>
            <ul>
              <li>UPI: {focusedSecurity.upi}</li>
              <li>Context: {focusedSecurity.detail}</li>
              <li>LDAP: {focusedSecurity.security.ldap_registered ? 'registered' : 'missing'}</li>
              <li>RBAC: {focusedSecurity.security.rbac_verified ? 'verified' : 'not verified'}</li>
              <li>Signature: {focusedSecurity.security.attestation_signed ? 'signed' : 'unsigned'}</li>
            </ul>
          </article>
        </div>
      </section>
    );
  };

  const renderEventsPanel = () => {
    if (!overview) {
      return null;
    }

    return (
      <section className="panel stack-panel dashboard-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Logs / events stream</p>
            <h2>System breathing in real time</h2>
          </div>
          <span className="status-badge status-primary">Polling every 8s</span>
        </div>

        <div className="filter-row">
          <label>
            Kind
            <select value={eventKindFilter} onChange={(event) => setEventKindFilter(event.target.value as typeof eventKindFilter)}>
              <option value="all">All</option>
              <option value="repository">Repository</option>
              <option value="pipeline">Pipeline</option>
              <option value="deployment">Deployment</option>
              <option value="process">Process</option>
            </select>
          </label>
          <label>
            Repository
            <select value={eventRepositoryFilter} onChange={(event) => setEventRepositoryFilter(event.target.value)}>
              <option value="all">All</option>
              {overview.repositories.map((repository) => (
                <option key={repository.id} value={repository.id}>{repository.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="events-list">
          {filteredEvents.map((event: EventEntry) => (
            <article key={event.id} className="event-row">
              <div className="event-meta">
                <strong>{event.component}</strong>
                <span>{formatTime(event.time)}</span>
                <span className="identity-chip">{event.upi}</span>
              </div>
              <div className="event-body">
                <span className={`mini-badge ${statusClass(event.kind)}`}>{event.kind}</span>
                <span>{event.action}</span>
                <span className={`mini-badge ${statusClass(event.result)}`}>{formatStatus(event.result)}</span>
              </div>
              <p>{event.summary}</p>
            </article>
          ))}
        </div>
      </section>
    );
  };

  const renderScreen = () => {
    if (!overview || !selectedRepository) {
      return null;
    }

    switch (route.name) {
      case 'repositories':
        return <>{renderRepositoriesPanel()}{renderSecurityPanel()}{renderEventsPanel()}</>;
      case 'reviews':
        return <>{renderReviewsPanel()}{renderSecurityPanel()}{renderEventsPanel()}</>;
      case 'pipelines':
        return <>{renderPipelinesPanel()}{renderSecurityPanel()}{renderEventsPanel()}</>;
      case 'deployments':
        return <>{renderDeploymentsPanel()}{renderSecurityPanel()}{renderEventsPanel()}</>;
      case 'containers':
        return <>{renderProcessesPanel()}{renderSecurityPanel()}{renderEventsPanel()}</>;
      case 'overview':
      default:
        return (
          <>
            {renderGitlabOverview()}
          </>
        );
    }
  };

  return (
    <main className="shell">
      {toast ? <section className="panel toast-panel">{toast}</section> : null}

      {isLoading ? <section className="panel loading-panel">Loading gateway data…</section> : null}
      {error ? (
        <section className="panel loading-panel">
          <h2>Gateway connection failed</h2>
          <p>{error}</p>
          <p>Expected source: {activeGatewayBase}/api/overview</p>
        </section>
      ) : null}

      {!isLoading && !error ? renderScreen() : null}
    </main>
  );
}
