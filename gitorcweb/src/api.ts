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
  commit: string;
  reviewer: string;
  summary: string;
  identity: string;
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
  status: string;
  transform: string;
  build: string;
  deploy: string;
  automate: string;
  containerize: string;
  updated_at: string;
};

export type Deployment = {
  id: string;
  repository_id: string;
  environment: string;
  status: string;
  cluster: string;
  artifact: string;
};

export type Container = {
  name: string;
  state: string;
  action: string;
  cpu: string;
  memory: string;
  log_channel: string;
};

export type Metric = {
  label: string;
  value: string;
  hint: string;
};

export type Overview = {
  providers: Provider[];
  repositories: Repository[];
  reviews: Review[];
  pipelines: Pipeline[];
  deployments: Deployment[];
  containers: Container[];
  updated_at: string;
  metrics: Metric[];
  activity: string[];
};

const gatewayBase = import.meta.env.VITE_GITORC_GATEWAY_URL || 'http://localhost:8080';

export async function fetchOverview(signal?: AbortSignal): Promise<Overview> {
  const response = await fetch(`${gatewayBase}/api/overview`, { signal });
  if (!response.ok) {
    throw new Error(`Gateway returned ${response.status}`);
  }

  return response.json() as Promise<Overview>;
}

export { gatewayBase };