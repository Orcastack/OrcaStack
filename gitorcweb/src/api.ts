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

export type AuthUser = {
  username: string;
  full_name: string;
  email: string;
  role: string;
  identity: string;
  rbac_realm: string;
  permissions: string[];
};

export type AuthSession = {
  token?: string;
  user: AuthUser;
  expires_at: string;
};

export type SignupRequestInput = {
  username: string;
  email: string;
  password: string;
};

export type SignupRequestResult = {
  request_id: string;
  status: string;
  message: string;
};

export type RepositoryMutationResult = {
  repository: Repository;
  clone_operation: CloneOperation;
};

export type CreateRepositoryInput = {
  name: string;
  summary: string;
  defaultBranch: string;
};

export type ImportRepositoryInput = {
  name: string;
  summary: string;
  defaultBranch: string;
  sourceUrl: string;
};

type RequestOptions = {
  signal?: AbortSignal;
  token?: string | null;
  method?: 'GET' | 'POST';
  body?: unknown;
};

const configuredGatewayBase = import.meta.env.VITE_GITORC_GATEWAY_URL;

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

let lastResolvedGatewayBase = gatewayCandidates[0] ?? 'gateway unavailable';

async function requestGateway<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let lastError: Error | null = null;

  for (const base of gatewayCandidates) {
    try {
      const headers = new Headers();
      if (options.body !== undefined) {
        headers.set('Content-Type', 'application/json');
      }
      if (options.token) {
        headers.set('Authorization', `Bearer ${options.token}`);
      }

      const response = await fetch(`${base}${path}`, {
        signal: options.signal,
        method: options.method || 'GET',
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      });

      if (!response.ok) {
        let message = `Gateway returned ${response.status}`;
        try {
          const errorPayload = (await response.json()) as { error?: string };
          if (errorPayload.error) {
            message = errorPayload.error;
          }
        } catch {
          // fall through to the default status message
        }
        throw new Error(message);
      }

      lastResolvedGatewayBase = base;
      if (response.status === 204) {
        return undefined as T;
      }
      return response.json() as Promise<T>;
    } catch (error) {
      if (options.signal?.aborted) {
        throw error;
      }
      lastError = error instanceof Error ? error : new Error('Unknown gateway error');
    }
  }

  throw lastError ?? new Error('Failed to reach any configured gateway endpoint');
}

export async function fetchOverview(signal?: AbortSignal, token?: string | null): Promise<Overview> {
  return requestGateway<Overview>('/api/overview', { signal, token });
}

export async function login(username: string, password: string, signal?: AbortSignal): Promise<AuthSession> {
  return requestGateway<AuthSession>('/api/auth/login', {
    signal,
    method: 'POST',
    body: { username, password },
  });
}

export async function signup(input: SignupRequestInput, signal?: AbortSignal): Promise<SignupRequestResult> {
  return requestGateway<SignupRequestResult>('/api/auth/signup', {
    signal,
    method: 'POST',
    body: {
      username: input.username,
      email: input.email,
      password: input.password,
    },
  });
}

export async function fetchSession(token: string, signal?: AbortSignal): Promise<AuthSession> {
  return requestGateway<AuthSession>('/api/auth/session', { signal, token });
}

export async function logout(token: string, signal?: AbortSignal): Promise<void> {
  await requestGateway<void>('/api/auth/logout', {
    signal,
    token,
    method: 'POST',
  });
}

export async function createRepository(input: CreateRepositoryInput, token?: string | null): Promise<RepositoryMutationResult> {
  return requestGateway<RepositoryMutationResult>('/api/repositories', {
    token,
    method: 'POST',
    body: {
      name: input.name,
      summary: input.summary,
      default_branch: input.defaultBranch,
    },
  });
}

export async function importRepository(input: ImportRepositoryInput, token?: string | null): Promise<RepositoryMutationResult> {
  return requestGateway<RepositoryMutationResult>('/api/repositories/import', {
    token,
    method: 'POST',
    body: {
      name: input.name,
      summary: input.summary,
      default_branch: input.defaultBranch,
      source_url: input.sourceUrl,
    },
  });
}

export function getGatewayBase() {
  return lastResolvedGatewayBase;
}

export function isStaticOverviewMode() {
  return shouldUseStaticOverview();
}

export { configuredGatewayBase as gatewayBase, gatewayCandidates };