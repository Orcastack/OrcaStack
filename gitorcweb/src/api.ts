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
const gatewayCandidates = configuredGatewayBase
  ? [configuredGatewayBase]
  : ['http://localhost:8080', 'http://localhost:18080'];

let lastResolvedGatewayBase = gatewayCandidates[0];

export async function fetchOverview(signal?: AbortSignal): Promise<Overview> {
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

export { configuredGatewayBase as gatewayBase, gatewayCandidates };