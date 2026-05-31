export type Provider = {
  id: string;
  name: string;
  status: string;
  repos: number;
  latency: string;
  identity: string;
  connected: boolean;
};

export type Repository = {
  id: string;
  provider_id: string;
  name: string;
  branch: string;
  default_branch: string;
  commit: string;
  last_commit_at: string;
  reviewer: string;
  summary: string;
  clone_url: string;
  identity: string;
  security: SecurityState;
};

export type SecurityState = {
  ldap_registered: boolean;
  rbac_verified: boolean;
  attestation_signed: boolean;
  verified: boolean;
};

export type CloneOperation = {
  repository_id: string;
  status: string;
  clone_url: string;
  command: string;
  upi: string;
  updated_at: string;
};

export type Review = {
  id: string;
  repository_id: string;
  title: string;
  status: string;
  required_approvals: number;
  approvals: number;
  reviewers: string[];
  last_updated: string;
};

export type Pipeline = {
  id: string;
  repository_id: string;
  name: string;
  branch: string;
  last_run: string;
  status: string;
  stages: PipelineStage[];
  run_history: PipelineRun[];
  log_channel: string;
  upi: string;
  security: SecurityState;
  updated_at: string;
};

export type PipelineStage = {
  name: string;
  status: string;
};

export type PipelineRun = {
  id: string;
  started_at: string;
  status: string;
  trigger: string;
};

export type Deployment = {
  id: string;
  repository_id: string;
  service_name: string;
  version: string;
  environment: string;
  status: string;
  cluster: string;
  artifact: string;
  target_commit: string;
  previous_version: string;
  log_channel: string;
  upi: string;
  security: SecurityState;
};

export type Container = {
  name: string;
  upi: string;
  state: string;
  host: string;
  actions: string[];
  cpu: string;
  memory: string;
  restarts: number;
  metrics_url: string;
  log_channel: string;
  security: SecurityState;
};

export type DashboardSecurity = {
  repository_identity: string;
  ui_process_identity: string;
  directory: SecurityState;
};

export type EventEntry = {
  id: string;
  time: string;
  component: string;
  kind: string;
  repository_id: string;
  action: string;
  result: string;
  upi: string;
  summary: string;
};

export type Metric = {
  label: string;
  value: string;
  hint: string;
};

export type Overview = {
  providers: Provider[];
  repositories: Repository[];
  clone_operations: CloneOperation[];
  reviews: Review[];
  pipelines: Pipeline[];
  deployments: Deployment[];
  containers: Container[];
  security: DashboardSecurity;
  events: EventEntry[];
  updated_at: string;
  metrics: Metric[];
  activity: string[];
};

const configuredGatewayBase = import.meta.env.VITE_GITORC_GATEWAY_URL;

function createStaticOverview(): Overview {
  const now = new Date().toISOString();

  return {
    providers: [
      { id: 'github', name: 'GitHub', status: 'connected', repos: 24, latency: '42 ms', identity: 'orca:service:24d3a597-df6a-4ca0-97b8-f1b41f16af2f', connected: true },
      { id: 'gitlab', name: 'GitLab', status: 'connected', repos: 12, latency: '55 ms', identity: 'orca:service:ce2d4468-4f59-433e-9ab6-7585185ef9d1', connected: true },
      { id: 'gitea', name: 'Gitea', status: 'standby', repos: 4, latency: '91 ms', identity: 'orca:service:8a2d734d-fb74-4828-b8fd-68d1a40604ea', connected: false },
      { id: 'bitbucket', name: 'Bitbucket', status: 'standby', repos: 9, latency: '73 ms', identity: 'orca:service:94b2ac82-b786-4eb1-a673-3eb4254a8ddc', connected: false },
      { id: 'gitorc', name: 'GITORC Host', status: 'primary', repos: 18, latency: '14 ms', identity: 'orca:service:4c3f7ef4-bf28-4dc0-903c-b3cfd4fdd9b4', connected: true },
    ],
    repositories: [
      { id: 'core-platform', provider_id: 'gitorc', name: 'core-platform', branch: 'main', default_branch: 'main', commit: '9b3f8e2', last_commit_at: now, reviewer: 'orca:agent:1b4e28ba-2fa1-41d2-883f-0016d3cca427', summary: 'Gateway hardening, policy routing, signed deployments', clone_url: 'ssh://git@gitorc.local/core-platform.git', identity: 'orca:repo:3f6d8c3e-6c96-4d8c-a2d3-6f4a8f4b7f2a', security: { ldap_registered: true, rbac_verified: true, attestation_signed: true, verified: true } },
      { id: 'review-automation', provider_id: 'gitlab', name: 'review-automation', branch: 'feature/transform-lane', default_branch: 'main', commit: '4ad09d1', last_commit_at: now, reviewer: 'orca:agent:550e8400-e29b-41d4-a716-446655440000', summary: 'Review policy templates and transform pipeline orchestration', clone_url: 'ssh://git@gitlab.local/review-automation.git', identity: 'orca:repo:cb234836-95bd-4d49-bd3a-4504227a8a3a', security: { ldap_registered: true, rbac_verified: true, attestation_signed: true, verified: true } },
      { id: 'container-fabric', provider_id: 'github', name: 'container-fabric', branch: 'release/0.4', default_branch: 'main', commit: '2c4b6a7', last_commit_at: now, reviewer: 'orca:service:9c858901-8a57-4791-81fe-4c455b099bc9', summary: 'Runtime graphs, signed manifests, cluster rollout controls', clone_url: 'ssh://git@github.com/gitorc/container-fabric.git', identity: 'orca:repo:1d74523b-4d56-4442-90d4-5256d0f8777a', security: { ldap_registered: true, rbac_verified: false, attestation_signed: true, verified: false } },
    ],
    clone_operations: [
      { repository_id: 'core-platform', status: 'completed', clone_url: 'ssh://git@gitorc.local/core-platform.git', command: 'rycli clone core-platform', upi: 'orca:process:0ecf2d45-6be6-4c3d-b6d7-2f0831e8c101', updated_at: now },
      { repository_id: 'review-automation', status: 'running', clone_url: 'ssh://git@gitlab.local/review-automation.git', command: 'rycli clone review-automation', upi: 'orca:process:e346f61c-40c6-4434-94ef-b2410890b8ef', updated_at: now },
      { repository_id: 'container-fabric', status: 'failed', clone_url: 'ssh://git@github.com/gitorc/container-fabric.git', command: 'rycli clone container-fabric', upi: 'orca:process:3eb6ddc8-a829-4b8d-b791-9cf0d1d4c43a', updated_at: now },
    ],
    reviews: [
      { id: 'rvw-100', repository_id: 'core-platform', title: 'Harden gateway security policy', status: 'approved', required_approvals: 2, approvals: 2, reviewers: ['orca:agent:1b4e28ba-2fa1-41d2-883f-0016d3cca427', 'orca:agent:6dd7a71b-9772-4d9b-8a4c-8607904dd6b0'], last_updated: now },
      { id: 'rvw-101', repository_id: 'review-automation', title: 'Transform stage normalization', status: 'pending', required_approvals: 2, approvals: 1, reviewers: ['orca:agent:550e8400-e29b-41d4-a716-446655440000'], last_updated: now },
      { id: 'rvw-102', repository_id: 'container-fabric', title: 'Container rollout policy', status: 'changes-requested', required_approvals: 3, approvals: 1, reviewers: ['orca:service:9c858901-8a57-4791-81fe-4c455b099bc9'], last_updated: now },
    ],
    pipelines: [
      { id: 'pipe-800', repository_id: 'core-platform', name: 'transform-main', branch: 'main', last_run: now, status: 'running', stages: [{ name: 'lint', status: 'passed' }, { name: 'test', status: 'passed' }, { name: 'build', status: 'running' }, { name: 'package', status: 'queued' }, { name: 'deploy', status: 'queued' }], run_history: [{ id: 'run-8001', started_at: now, status: 'running', trigger: 'manual' }, { id: 'run-8000', started_at: now, status: 'passed', trigger: 'push' }], log_channel: 'ci/core-platform', upi: 'orca:process:99537633-a279-4f29-a787-5d62907e4f2c', security: { ldap_registered: true, rbac_verified: true, attestation_signed: true, verified: true }, updated_at: now },
      { id: 'pipe-801', repository_id: 'review-automation', name: 'transform-review', branch: 'feature/transform-lane', last_run: now, status: 'queued', stages: [{ name: 'lint', status: 'passed' }, { name: 'test', status: 'queued' }, { name: 'build', status: 'blocked' }, { name: 'package', status: 'blocked' }, { name: 'deploy', status: 'blocked' }], run_history: [{ id: 'run-8010', started_at: now, status: 'queued', trigger: 'review-approved' }, { id: 'run-8009', started_at: now, status: 'failed', trigger: 'manual' }], log_channel: 'ci/review-automation', upi: 'orca:process:4d3250d6-9b7e-4b17-8343-41564b0f0da8', security: { ldap_registered: true, rbac_verified: true, attestation_signed: true, verified: true }, updated_at: now },
      { id: 'pipe-802', repository_id: 'container-fabric', name: 'release-canary', branch: 'release/0.4', last_run: now, status: 'failed', stages: [{ name: 'lint', status: 'passed' }, { name: 'test', status: 'failed' }, { name: 'build', status: 'blocked' }, { name: 'package', status: 'blocked' }, { name: 'deploy', status: 'blocked' }], run_history: [{ id: 'run-8020', started_at: now, status: 'failed', trigger: 'push' }, { id: 'run-8019', started_at: now, status: 'passed', trigger: 'manual' }], log_channel: 'ci/container-fabric', upi: 'orca:process:2d93aa22-185d-4a20-8f4c-49f2ff8559a7', security: { ldap_registered: true, rbac_verified: false, attestation_signed: true, verified: false }, updated_at: now },
    ],
    deployments: [
      { id: 'dep-210', repository_id: 'core-platform', service_name: 'gateway', version: '9b3f8e2', environment: 'staging', status: 'running', cluster: 'cluster-west-1', artifact: 'gitorc-gateway:9b3f8e2', target_commit: '9b3f8e2', previous_version: '9b3f7d1', log_channel: 'deploy/gateway', upi: 'orca:process:9d94b79f-f6b4-43f3-b338-aa8f6a125a67', security: { ldap_registered: true, rbac_verified: true, attestation_signed: true, verified: true } },
      { id: 'dep-211', repository_id: 'review-automation', service_name: 'review-automation', version: '4ad09d1', environment: 'staging', status: 'pending', cluster: 'cluster-lab-2', artifact: 'review-automation:4ad09d1', target_commit: '4ad09d1', previous_version: '4ad08f0', log_channel: 'deploy/review-automation', upi: 'orca:process:004cf814-0325-4dbc-b718-fc61e0e087fa', security: { ldap_registered: true, rbac_verified: true, attestation_signed: true, verified: true } },
      { id: 'dep-212', repository_id: 'container-fabric', service_name: 'container-fabric', version: '2c4b6a7', environment: 'prod', status: 'rolling-back', cluster: 'cluster-edge-4', artifact: 'container-fabric:2c4b6a7', target_commit: '2c4b6a7', previous_version: '2c4b690', log_channel: 'deploy/container-fabric', upi: 'orca:process:883b4440-23d8-4de5-b0dc-c64d57867a5d', security: { ldap_registered: true, rbac_verified: false, attestation_signed: true, verified: false } },
    ],
    containers: [
      { name: 'gateway', upi: 'orca:process:6dc35594-5a72-4a22-b6b0-3d7d3c492da2', state: 'running', host: 'node-a1', actions: ['restart', 'logs', 'metrics'], cpu: '0.12', memory: '128 MiB', restarts: 0, metrics_url: 'http://localhost:8085/metrics/gateway', log_channel: 'gateway/live', security: { ldap_registered: true, rbac_verified: true, attestation_signed: true, verified: true } },
      { name: 'review-service', upi: 'orca:process:2bf0ec03-a770-462a-a0dd-b117eb729b5a', state: 'stopped', host: 'node-b4', actions: ['start', 'logs'], cpu: '0.00', memory: '0 MiB', restarts: 2, metrics_url: 'http://localhost:8085/metrics/review-service', log_channel: 'review/live', security: { ldap_registered: true, rbac_verified: true, attestation_signed: true, verified: true } },
      { name: 'ci-service', upi: 'orca:process:16f1e918-56c0-4b3d-bded-e0cd7f1d8498', state: 'running', host: 'node-ci2', actions: ['stop', 'restart', 'logs', 'metrics'], cpu: '0.31', memory: '208 MiB', restarts: 1, metrics_url: 'http://localhost:8085/metrics/ci-service', log_channel: 'ci/live', security: { ldap_registered: true, rbac_verified: true, attestation_signed: true, verified: true } },
      { name: 'analytics-service', upi: 'orca:process:ec5ac6ce-c1a9-4c99-a9d8-263fc6c27419', state: 'crashed', host: 'node-ana1', actions: ['start', 'logs', 'metrics'], cpu: '0.27', memory: '312 MiB', restarts: 4, metrics_url: 'http://localhost:8085/metrics/analytics-service', log_channel: 'analytics/live', security: { ldap_registered: true, rbac_verified: false, attestation_signed: true, verified: false } },
    ],
    security: {
      repository_identity: 'orca:repo:3f6d8c3e-6c96-4d8c-a2d3-6f4a8f4b7f2a',
      ui_process_identity: 'orca:process:3561f437-25f1-4f4b-87ed-89bc1b0932f0',
      directory: { ldap_registered: true, rbac_verified: true, attestation_signed: true, verified: true },
    },
    events: [
      { id: 'evt-1', time: now, component: 'core-platform', kind: 'repository', repository_id: 'core-platform', action: 'cloned', result: 'success', upi: 'orca:process:0ecf2d45-6be6-4c3d-b6d7-2f0831e8c101', summary: 'Repository cloned through RYCLI using signed gateway intent.' },
      { id: 'evt-2', time: now, component: 'transform-main', kind: 'pipeline', repository_id: 'core-platform', action: 'build', result: 'running', upi: 'orca:process:99537633-a279-4f29-a787-5d62907e4f2c', summary: 'Build stage is executing on node-ci2.' },
      { id: 'evt-3', time: now, component: 'gateway', kind: 'deployment', repository_id: 'core-platform', action: 'deployed', result: 'success', upi: 'orca:process:9d94b79f-f6b4-43f3-b338-aa8f6a125a67', summary: 'Gateway promoted to staging with verified attestation.' },
      { id: 'evt-4', time: now, component: 'analytics-service', kind: 'process', repository_id: 'container-fabric', action: 'restarted', result: 'failure', upi: 'orca:process:ec5ac6ce-c1a9-4c99-a9d8-263fc6c27419', summary: 'Analytics service restart failed after crash loop detection.' },
      { id: 'evt-5', time: now, component: 'review-automation', kind: 'repository', repository_id: 'review-automation', action: 'review-opened', result: 'pending', upi: 'orca:process:ab32757b-a403-41e7-b07a-4b80fd4cb550', summary: 'Code review opened for transform lane before CI release.' },
    ],
    updated_at: now,
    metrics: [
      { label: 'Repositories tracked', value: '67', hint: 'Across GitHub, GitLab, Gitea, Bitbucket, and GITORC' },
      { label: 'Signed actions today', value: '214', hint: 'Every UI action issues a process identity and attestation' },
      { label: 'Deploy success rate', value: '98.4%', hint: 'Last 30 signed deployment lanes' },
      { label: 'Containers under control', value: '32', hint: 'Running, pending, or gated by review' },
    ],
    activity: [
      'Connect_Git_Provider accepted for GitLab with ORCA identity enforcement.',
      'Open_Code_Review on core-platform/main waiting for two approvals.',
      'Trigger_CI_Pipeline gated until review state changes to approved.',
      'Deploy lane linked to signed attestation and repository identity.',
      'Container orchestration flow attached to automation policy pack 07.',
    ],
  };
}

function isLocalHostname(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function shouldUseStaticOverview() {
  if (configuredGatewayBase) {
    return false;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  return !isLocalHostname(window.location.hostname);
}

function resolveGatewayCandidates() {
  if (configuredGatewayBase) {
    return [configuredGatewayBase];
  }

  if (typeof window === 'undefined') {
    return ['http://localhost:8080', 'http://localhost:18080'];
  }

  if (isLocalHostname(window.location.hostname)) {
    return ['http://localhost:8080', 'http://localhost:18080'];
  }

  return [];
}

const gatewayCandidates = resolveGatewayCandidates();

let lastResolvedGatewayBase = shouldUseStaticOverview() ? 'static overview' : gatewayCandidates[0];

export async function fetchOverview(signal?: AbortSignal): Promise<Overview> {
  if (shouldUseStaticOverview()) {
    lastResolvedGatewayBase = 'static overview';
    return createStaticOverview();
  }

  let lastError: Error | null = null;

  for (const base of gatewayCandidates) {
    try {
      const response = await fetch(`${base}/api/overview`, { signal });
      if (!response.ok) {
        throw new Error(`Gateway returned ${response.status}`);
      }

      lastResolvedGatewayBase = base;
      return response.json() as Promise<Overview>;
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
      lastError = error instanceof Error ? error : new Error('Unknown gateway error');
    }
  }

  throw lastError ?? new Error('Failed to reach any configured gateway endpoint');
}

export function getGatewayBase() {
  return lastResolvedGatewayBase;
}

export function isStaticOverviewMode() {
  return shouldUseStaticOverview();
}

export { configuredGatewayBase as gatewayBase, gatewayCandidates };