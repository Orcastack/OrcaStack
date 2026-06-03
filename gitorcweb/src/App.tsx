import React, { useEffect, useMemo, useState } from 'react';

import {
  createRepository,
  fetchSession,
  fetchSignupRequests,
  fetchOverview,
  getGatewayBase,
  importRepository,
  isStaticOverviewMode,
  login,
  logout,
  reviewSignupRequest,
  signup,
  type AuthSession,
  type CloneOperation,
  type Container,
  type CreateRepositoryInput,
  type Deployment,
  type EventEntry,
  type ImportRepositoryInput,
  type Overview,
  type Pipeline,
  type Repository,
  type RepositoryMutationResult,
  type Review,
  type SecurityState,
  type SignupRequestRecord,
} from './api';

type LandingPageId =
  | 'landing-overview'
  | 'download-center'
  | 'getting-started-overview'
  | 'clone-run-locally'
  | 'first-pipeline-10-minutes'
  | 'platform-overview'
  | 'ci-cd-engine'
  | 'platform-pipelines-workflows'
  | 'device-node-integration'
  | 'location-intelligence'
  | 'private-cloud-hpc'
  | 'security-model'
  | 'workflow-system'
  | 'workflow-states-delivery'
  | 'runtime-strategies'
  | 'signed-artifacts-policy'
  | 'repository-role'
  | 'monorepo-layout'
  | 'bootstrap-locally'
  | 'changelog-releases'
  | 'docs-inventory'
  | 'api-reference'
  | 'architecture-docs'
  | 'local-development-guide'
  | 'developer-community'
  | 'discord-channels'
  | 'contribution-guide'
  | 'issue-templates-rfcs';

type LandingIconName =
  | 'overview'
  | 'dashboard'
  | 'workflow'
  | 'automation'
  | 'pipelines'
  | 'devices'
  | 'location'
  | 'cloud'
  | 'security'
  | 'docs'
  | 'community'
  | 'channel'
  | 'repository'
  | 'control-panel'
  | 'download'
  | 'login'
  | 'github'
  | 'gitlab'
  | 'google'
  | 'gitorc'
  | 'search'
  | 'theme'
  | 'profile';

type LandingPageLink = {
  label: string;
  detail?: string;
  targetId?: LandingPageId;
  href?: string;
  external?: boolean;
};

type LandingPageSection = {
  title: string;
  description?: string;
  bullets?: string[];
  links?: LandingPageLink[];
};

type LandingPage = {
  id: LandingPageId;
  label: string;
  title: string;
  intro: string;
  sections: LandingPageSection[];
  searchTerms: string[];
};

type LandingSidebarItem = {
  id: LandingPageId;
  label: string;
  icon: LandingIconName;
};

type LandingSidebarGroup = {
  label: string;
  items: LandingSidebarItem[];
};

type LandingHeaderLink = {
  label: string;
  icon: LandingIconName;
  targetId?: LandingPageId;
  href?: string;
  external?: boolean;
  publicPage?: 'home' | 'platform' | 'signin' | 'signup';
};

const landingBootstrapCommands = [
  'git clone https://github.com/AtonixCorp/gitorc',
  'cd gitorc',
  'make up',
  'curl http://localhost:8080/healthz',
];

const landingPages: LandingPage[] = [
  {
    id: 'landing-overview',
    label: 'Platform overview',
    title: 'GITORC: Hardware-Software CI/CD Automation Platform',
    intro: 'GITORC is a hardware-software automation engine that unifies Git operations, code review, CI/CD pipelines, virtualization, identity governance, and secure orchestration into one integrated system for bare metal, virtual machines, containers, private cloud, OpenStack, and Kubernetes environments.',
    sections: [
      {
        title: 'What this page explains',
        bullets: [
          'What GITORC is.',
          'How hardware, software, and automation layers interact.',
          'How identity, CI/CD, and virtualization unify into one workflow.',
          'Why every clone, build, review, deploy, and provision action is identity-bound and cryptographically verifiable.',
        ],
      },
      {
        title: 'Core responsibilities',
        bullets: [
          'Hardware integration through device-aware builds, hardware-bound identities, and virtualization support.',
          'Software automation across Git, code review, CI, CD, pipelines, runners, and orchestration.',
          'Identity enforcement through LDAP, RBAC, cryptographic signing, and audit trails.',
          'Virtualization for VM provisioning, container orchestration, and isolated build environments.',
          'Secure execution where every process has a unique identity and lifecycle.',
        ],
      },
      {
        title: 'Platform areas',
        links: [
          { label: 'Platform overview', targetId: 'platform-overview', detail: 'See how hardware, software, identity, and automation fit together.' },
          { label: 'Repositories', targetId: 'repository-role', detail: 'Git operations, review, branch rules, identity, and traceability.' },
          { label: 'Pipelines (CI/CD)', targetId: 'platform-pipelines-workflows', detail: 'Isolated execution, artifact generation, and governed promotion.' },
          { label: 'Automation engine', targetId: 'ci-cd-engine', detail: 'Event-driven execution, runners, agents, retries, and policy enforcement.' },
          { label: 'Identity & security', targetId: 'security-model', detail: 'LDAP, RBAC, signing, audit logs, and token controls.' },
          { label: 'Virtualization', targetId: 'private-cloud-hpc', detail: 'Bare metal, VMs, containers, OpenStack, Kubernetes, and hypervisors.' },
          { label: 'Deployment', targetId: 'runtime-strategies', detail: 'Identity-verified rollout, rollback, and target environment control.' },
          { label: 'System operations', targetId: 'device-node-integration', detail: 'Telemetry, services, agents, storage, compute, and network visibility.' },
        ],
      },
      {
        title: 'Start here',
        links: [
          { label: 'Clone the repository', targetId: 'clone-run-locally', detail: 'Repository checkout and first local bootstrap path.' },
          { label: 'Bootstrap locally', targetId: 'bootstrap-locally', detail: 'Bring up the local stack and verify the main endpoints.' },
          { label: 'Open GitHub repository', href: 'https://github.com/AtonixCorp/gitorc', external: true, detail: 'The implementation base, release trail, and audit surface.' },
        ],
      },
      {
        title: 'Documentation and community',
        links: [
          { label: 'Docs inventory', targetId: 'docs-inventory' },
          { label: 'API reference', targetId: 'api-reference' },
          { label: 'Join Discord', targetId: 'discord-channels' },
          { label: 'Join Slack', targetId: 'discord-channels' },
        ],
      },
    ],
    searchTerms: ['gitorc', 'platform overview', 'hardware software automation', 'ci/cd automation'],
  },
  {
    id: 'download-center',
    label: 'Installation quick start',
    title: 'Installation quick start across packages, tarballs, containers, and Kubernetes',
    intro: 'Install GITORC through Debian, RPM, tarball, Docker, or Kubernetes deployment paths. Choose the model that matches your environment, then complete identity, runner, and security setup after the base installation is online.',
    sections: [
      {
        title: 'Debian / Ubuntu (.deb)',
        bullets: [
          'Install dependencies: Git, OpenSSL, systemd, and a supported database. PostgreSQL is recommended.',
          'Install package: sudo dpkg -i gitorc_<version>_amd64.deb',
          'Repair dependencies if needed: sudo apt-get -f install',
          'Enable and start service: sudo systemctl enable gitorc',
          'Start service: sudo systemctl start gitorc',
        ],
      },
      {
        title: 'RHEL-compatible (.rpm)',
        bullets: [
          'Install dependencies: Git, OpenSSL, and PostgreSQL client/server packages.',
          'Install package: sudo rpm -ivh gitorc-<version>-1.x86_64.rpm',
          'Enable and start service: sudo systemctl enable gitorc',
          'Start service: sudo systemctl start gitorc',
        ],
      },
      {
        title: 'Tarball (.tar.gz)',
        bullets: [
          'Extract archive: tar -xzf gitorc-<version>-linux-amd64.tar.gz -C /opt',
          'Create a system user and service if you want the process managed by the host.',
          'Run binary: /opt/gitorc/gitorc server --config /etc/gitorc/config.yaml',
        ],
      },
      {
        title: 'Download artifacts',
        links: [
          { label: 'Download .deb', href: 'https://github.com/AtonixCorp/gitorc/releases/latest/download/gitorc.deb', external: true, detail: 'Ubuntu and Debian package with systemd unit and packaged gateway runtime.' },
          { label: 'Download .rpm', href: 'https://github.com/AtonixCorp/gitorc/releases/latest/download/gitorc.rpm', external: true, detail: 'RHEL, CentOS, and Fedora package with service install path.' },
          { label: 'Download tar.gz', href: 'https://github.com/AtonixCorp/gitorc/releases/latest/download/gitorc.tar.gz', external: true, detail: 'Manual archive including launcher, gateway binary, README, LICENSE, and systemd service file.' },
        ],
      },
      {
        title: 'Docker',
        bullets: [
          'Pull image: docker pull registry.example.com/gitorc/platform:<version>',
          'Run container: docker run -d --name gitorc -p 8080:8080 -v /var/lib/gitorc:/var/lib/gitorc registry.example.com/gitorc/platform:<version>',
        ],
      },
      {
        title: 'Kubernetes',
        bullets: [
          'Deploy core components for web/API, workers or runners, database, cache, and object storage.',
          'Use Helm chart or Kustomize with environment-specific values.',
          'Set ingress and TLS values explicitly.',
          'Choose storage classes for repositories, artifacts, and runtime state.',
          'Define runner pools and external database and cache endpoints.',
        ],
      },
      {
        title: 'System requirements',
        bullets: [
          'CPU: 4 or more vCPUs recommended for production.',
          'Memory: 8 GB minimum, 16 GB recommended.',
          'Storage: reserve about 20 GB for the application and start repository and artifact storage at 200 GB or more depending on usage.',
          'Network: maintain stable connectivity between GITORC, runners, database, cache, and object storage.',
          'Use a load balancer for high-availability deployments when needed.',
        ],
      },
      {
        title: 'Post-installation steps',
        bullets: [
          'Access the web UI at http://<server>:8080 or your configured port.',
          'Create the first admin account.',
          'Configure LDAP, Active Directory, or internal users.',
          'Register CI/CD runners running on VMs, containers, or bare metal.',
          'Enable HTTPS with TLS termination at a reverse proxy or directly in GITORC.',
          'Configure backups for the database and repository storage.',
        ],
      },
      {
        title: 'Recommended GITORC installation solutions',
        bullets: [
          'Single-node installation: use the .deb or .rpm package for an operator-managed host with systemd service control.',
          'Air-gapped or custom-host installation: use the tarball when you need full control over paths, users, and service wrappers.',
          'Container pilot deployment: use Docker for evaluation, demos, or small isolated environments.',
          'Production platform deployment: use Kubernetes with Helm or Kustomize, external PostgreSQL, cache, object storage, ingress, TLS, and dedicated runner pools.',
        ],
      },
    ],
    searchTerms: ['installation', 'deb', 'rpm', 'tar.gz', 'docker', 'kubernetes', 'helm'],
  },
  {
    id: 'getting-started-overview',
    label: 'Getting started overview',
    title: 'Getting started: install, bootstrap, and run the first workflow',
    intro: 'Start with the installation model that fits your environment, then bootstrap the platform locally or on a managed host and run one workflow that proves repository, pipeline, and delivery state operate as one system.',
    sections: [
      { title: 'Fast path', bullets: ['Choose the installation path: .deb, .rpm, tarball, Docker, or Kubernetes.', 'Install dependencies and bring the service online.', 'Verify the gateway and UI.', 'Connect identity, register runners, and run the first workflow.'] },
      { title: 'Next', links: [{ label: 'Installation quick start', targetId: 'download-center' }, { label: 'Bootstrap locally', targetId: 'bootstrap-locally' }, { label: 'First pipeline in 10 minutes', targetId: 'first-pipeline-10-minutes' }] },
    ],
    searchTerms: ['getting started', 'install', 'bootstrap', 'quick start'],
  },
  {
    id: 'clone-run-locally',
    label: 'Clone & run locally',
    title: 'Clone the repository and run the platform locally',
    intro: 'The repository is the fastest way into the platform. Clone it, inspect the monorepo, and bring up the local runtime before making implementation changes.',
    sections: [
      { title: 'Bootstrap commands', bullets: landingBootstrapCommands },
      { title: 'Links', links: [{ label: 'Open GitHub repository', href: 'https://github.com/AtonixCorp/gitorc', external: true }, { label: 'Monorepo layout', targetId: 'monorepo-layout' }] },
    ],
    searchTerms: ['clone', 'run locally', 'bootstrap'],
  },
  {
    id: 'first-pipeline-10-minutes',
    label: 'First pipeline in 10 minutes',
    title: 'Run a first pipeline in 10 minutes',
    intro: 'The first workflow should show a governed path from repository input to pipeline execution and delivery evidence.',
    sections: [
      { title: 'Suggested flow', bullets: ['Verify the gateway and UI.', 'Open the control plane.', 'Run one pipeline path.', 'Inspect the resulting state and runtime evidence.'] },
      { title: 'Next', links: [{ label: 'CI/CD engine', targetId: 'ci-cd-engine' }, { label: 'Workflow states & delivery', targetId: 'workflow-states-delivery' }] },
    ],
    searchTerms: ['first pipeline', 'first workflow'],
  },
  {
    id: 'platform-overview',
    label: 'Platform overview',
    title: 'Platform overview across hardware, software, identity, and automation',
    intro: 'GITORC unifies hardware integration, software automation, identity enforcement, virtualization, and secure execution into one workflow so repository activity, build execution, provisioning, and deployment all stay traceable and policy-controlled.',
    sections: [
      {
        title: 'How the platform layers interact',
        bullets: [
          'Hardware integration keeps builds, runners, and execution environments aware of real devices, virtualization boundaries, and host capabilities.',
          'Software automation connects Git, code review, CI, CD, orchestration, and artifact flow into one delivery model.',
          'Identity enforcement keeps LDAP, RBAC, signing, and audit context attached to every action.',
          'Virtualization provides isolated environments across bare metal, VMs, containers, OpenStack, Kubernetes, and private cloud targets.',
          'Secure execution ensures each process has a unique identity and lifecycle from trigger to teardown.',
        ],
      },
      {
        title: 'Navigate the platform',
        links: [
          { label: 'Repositories', targetId: 'repository-role' },
          { label: 'Pipelines (CI/CD)', targetId: 'platform-pipelines-workflows' },
          { label: 'Automation engine', targetId: 'ci-cd-engine' },
          { label: 'Identity & security', targetId: 'security-model' },
          { label: 'Virtualization', targetId: 'private-cloud-hpc' },
          { label: 'Deployment', targetId: 'runtime-strategies' },
          { label: 'System operations', targetId: 'device-node-integration' },
        ],
      },
    ],
    searchTerms: ['platform structure', 'hardware software', 'identity', 'virtualization'],
  },
  {
    id: 'ci-cd-engine',
    label: 'Automation engine',
    title: 'Automation engine for builds, tests, deployments, and provisioning',
    intro: 'The automation engine connects Git events to CI/CD workflows, integrates with hardware and virtualization layers, and enforces identity and security policies across each action it executes.',
    sections: [
      {
        title: 'What it does',
        bullets: [
          'Automates builds, tests, deployments, and provisioning.',
          'Connects Git events to CI/CD workflows.',
          'Integrates with hardware and virtualization layers.',
          'Enforces identity and security policies throughout execution.',
        ],
      },
      {
        title: 'How it runs',
        bullets: [
          'Uses an event-driven architecture.',
          'Executes tasks through runners and agents.',
          'Logs every action with identity and timestamp.',
          'Supports self-healing and retries.',
        ],
      },
      {
        title: 'Related areas',
        links: [
          { label: 'Pipelines (CI/CD)', targetId: 'platform-pipelines-workflows' },
          { label: 'Identity & security', targetId: 'security-model' },
          { label: 'System operations', targetId: 'device-node-integration' },
        ],
      },
    ],
    searchTerms: ['automation engine', 'event driven', 'runners', 'agents'],
  },
  {
    id: 'platform-pipelines-workflows',
    label: 'Pipelines (CI/CD)',
    title: 'Pipelines (CI/CD) for isolated build, test, and delivery execution',
    intro: 'Pipelines execute CI/CD workloads in isolated environments, produce traceable artifacts, and connect build, test, packaging, and deployment into one governed path.',
    sections: [
      {
        title: 'What it does',
        bullets: [
          'Executes CI pipelines.',
          'Builds software in isolated environments.',
          'Runs tests, scans, linting, and packaging.',
          'Produces artifacts such as .deb, .tar.gz, containers, and binaries.',
          'Triggers downstream deployments.',
        ],
      },
      {
        title: 'How it runs',
        bullets: [
          'Each step runs in a virtualized or containerized runner.',
          'Every step has a process identity.',
          'Logs stream in real time.',
          'Artifacts are stored with fingerprints.',
          'Failures generate alerts and audit entries.',
        ],
      },
      {
        title: 'Related areas',
        links: [
          { label: 'Repositories', targetId: 'repository-role' },
          { label: 'Automation engine', targetId: 'ci-cd-engine' },
          { label: 'Deployment', targetId: 'runtime-strategies' },
        ],
      },
    ],
    searchTerms: ['pipelines', 'ci/cd', 'runners', 'artifacts'],
  },
  {
    id: 'device-node-integration',
    label: 'System operations',
    title: 'System operations across health, telemetry, services, and infrastructure state',
    intro: 'System operations surfaces the health of runners, agents, services, logs, metrics, storage, compute, and network resources so operators can manage the platform as a live system.',
    sections: [
      {
        title: 'What it does',
        bullets: [
          'Monitors system health.',
          'Tracks runners, agents, and services.',
          'Shows logs, metrics, and events.',
          'Manages storage, compute, and network resources.',
        ],
      },
      {
        title: 'How it runs',
        bullets: [
          'Uses an internal telemetry engine.',
          'Streams live data to the dashboard.',
          'Enforces identity on all operations.',
          'Supports multi-node setups.',
        ],
      },
    ],
    searchTerms: ['system operations', 'telemetry', 'services', 'health'],
  },
  {
    id: 'location-intelligence',
    label: 'Location intelligence',
    title: 'Location intelligence for site-aware orchestration',
    intro: 'Location awareness belongs in the platform as operational intelligence for where workloads execute and how environments are segmented.',
    sections: [{ title: 'Operational role', bullets: ['Use site and region context as part of delivery targeting.', 'Keep location awareness tied to infrastructure and runtime evidence.', 'Support deployments spanning multiple facilities or regions.'] }],
    searchTerms: ['location intelligence', 'regions', 'sites'],
  },
  {
    id: 'private-cloud-hpc',
    label: 'Virtualization',
    title: 'Virtualization across VMs, containers, bare metal, and private cloud',
    intro: 'GITORC creates isolated build and execution environments across virtual machines, containers, bare metal, OpenStack, Kubernetes, and hypervisor-backed targets while preserving identity and lifecycle traceability.',
    sections: [
      {
        title: 'What it does',
        bullets: [
          'Creates isolated build environments.',
          'Supports VMs, containers, and bare metal.',
          'Integrates with OpenStack, Kubernetes, and hypervisors.',
        ],
      },
      {
        title: 'How it runs',
        bullets: [
          'Pipelines choose the correct execution environment.',
          'Runners are provisioned dynamically.',
          'Environments are destroyed after use.',
          'Identity and logs follow the full lifecycle.',
        ],
      },
    ],
    searchTerms: ['virtualization', 'openstack', 'kubernetes', 'vm'],
  },
  {
    id: 'security-model',
    label: 'Identity & security',
    title: 'Identity and security across LDAP, RBAC, signing, and audit trails',
    intro: 'Identity and security are first-class runtime concerns in GITORC. Repositories, pipelines, deployments, and processes all carry unique identities and are validated through RBAC, cryptographic signing, audit logs, and policy enforcement.',
    sections: [
      {
        title: 'What it does',
        bullets: [
          'Provides LDAP identity.',
          'Enforces RBAC for all operations.',
          'Applies cryptographic signing.',
          'Records audit logs.',
          'Issues secure API tokens.',
        ],
      },
      {
        title: 'How it runs',
        bullets: [
          'Every repository, pipeline, deployment, and process has a unique identity.',
          'All actions are validated against RBAC.',
          'Logs are immutable.',
          'Security policies apply automatically.',
        ],
      },
    ],
    searchTerms: ['identity', 'security', 'ldap', 'rbac'],
  },
  {
    id: 'workflow-system',
    label: 'How workflows enable one cohesive system',
    title: 'How workflows enable one cohesive system',
    intro: 'Workflows are what make the platform feel unified instead of fragmented. They provide the shared operating model across repository states, pipeline stages, deployment actions, and runtime verification.',
    sections: [{ title: 'Cohesion through workflow', bullets: ['Repository changes move through one explicit control path.', 'Pipeline state, deployment state, and runtime state remain connected.', 'Operators can explain why a delivery action was allowed and what followed from it.'] }],
    searchTerms: ['workflow system', 'cohesive system'],
  },
  {
    id: 'workflow-states-delivery',
    label: 'Workflow states & delivery',
    title: 'Workflow states and delivery progression',
    intro: 'Delivery state should be legible. Workflows make build, test, promotion, deploy, rollback, and runtime observation visible as explicit transitions.',
    sections: [{ title: 'State model', bullets: ['Build, test, promote, and deploy are explicit transitions.', 'Rollback and retry belong to the same workflow context.', 'Operators should see gate decisions and outcomes in one place.'] }],
    searchTerms: ['workflow states', 'delivery states'],
  },
  {
    id: 'runtime-strategies',
    label: 'Runtime strategies',
    title: 'Runtime strategies for governed execution',
    intro: 'Runtime strategy explains how built artifacts become running systems across nodes, environments, and controlled infrastructure boundaries.',
    sections: [{ title: 'Runtime posture', bullets: ['Support staged and environment-aware execution strategies.', 'Track host, node, and process context as part of rollout understanding.', 'Keep runtime observability close to the pipeline and deployment path.'] }],
    searchTerms: ['runtime strategies'],
  },
  {
    id: 'signed-artifacts-policy',
    label: 'Signed artifacts & policy',
    title: 'Signed artifacts and policy enforcement',
    intro: 'Artifacts should carry trust context with them. Signed outputs, attestation, and policy checks create a delivery path that is explainable and enforceable.',
    sections: [{ title: 'Policy path', bullets: ['Treat artifact signing as a first-class delivery requirement.', 'Attach policy checks to promotion and deployment stages.', 'Use identity and evidence to support runtime enforcement decisions.'] }],
    searchTerms: ['signed artifacts', 'policy', 'attestation'],
  },
  {
    id: 'repository-role',
    label: 'Repositories',
    title: 'Repositories for Git operations, review, policies, and pipeline triggers',
    intro: 'Repositories are the core source-control surface in GITORC. They host Git data, branch and tag rules, code review workflows, CI triggers, and identity-bound repository state.',
    sections: [
      {
        title: 'What it does',
        bullets: [
          'Hosts Git repositories.',
          'Manages branches, tags, and protected rules.',
          'Provides code review workflows.',
          'Triggers CI pipelines.',
          'Tracks repository identity and signatures.',
        ],
      },
      {
        title: 'How it runs',
        bullets: [
          'Uses an internal Git RPC engine.',
          'Stores repository metadata in the platform database.',
          'Registers repository identity in LDAP.',
          'Applies RBAC for clone, push, merge, and delete operations.',
          'Integrates directly with pipelines and deployments.',
        ],
      },
    ],
    searchTerms: ['repositories', 'git', 'code review', 'branch rules'],
  },
  {
    id: 'monorepo-layout',
    label: 'Monorepo layout',
    title: 'Monorepo layout across services, UI, infra, docs, and SDKs',
    intro: 'The monorepo layout gives developers the structural map of the platform.',
    sections: [{ title: 'Repository map', bullets: ['gitorcapi contains Go services and shared runtime code.', 'gitorcweb contains the React control plane UI.', 'infra holds local runtime assets and deployment seed material.', 'docs and README surfaces provide architecture, API, and local development guidance.'] }],
    searchTerms: ['monorepo layout', 'repo structure'],
  },
  {
    id: 'bootstrap-locally',
    label: 'Bootstrap locally',
    title: 'Bootstrap the platform locally',
    intro: 'Local bootstrap should be direct and repeatable. Start the local stack, then verify the gateway and UI before moving into feature work.',
    sections: [
      { title: 'Bootstrap path', bullets: landingBootstrapCommands },
      { title: 'Expected endpoints', bullets: ['UI: http://localhost:5050', 'Gateway HTTP: http://localhost:8080', 'Gateway health: http://localhost:8080/healthz'] },
    ],
    searchTerms: ['bootstrap locally', 'make up', 'local stack'],
  },
  {
    id: 'runtime-strategies',
    label: 'Deployment',
    title: 'Deployment across Kubernetes, OpenStack, Docker, and bare metal',
    intro: 'Deployment in GITORC moves identity-verified artifacts into live environments through CD pipelines with full rollout history, policy-controlled authentication, and governed rollback paths.',
    sections: [
      {
        title: 'What it does',
        bullets: [
          'Deploys artifacts to Kubernetes, OpenStack, Docker, and bare metal.',
          'Supports rolling, blue-green, and canary strategies.',
          'Tracks deployment identity and history.',
        ],
      },
      {
        title: 'How it runs',
        bullets: [
          'CD pipelines trigger deployments.',
          'Deployment agents authenticate through RBAC.',
          'Logs stream in real time.',
          'Rollbacks are identity-verified.',
        ],
      },
    ],
    searchTerms: ['deployment', 'rollout', 'canary', 'rollback'],
  },
  {
    id: 'changelog-releases',
    label: 'Changelog & releases',
    title: 'Changelog and releases as operator-facing change history',
    intro: 'Release movement should be visible as an engineering artifact before rollout, support, or debugging decisions.',
    sections: [{ title: 'Why it matters', bullets: ['Track release deltas before rollout decisions.', 'Keep documentation, code, and runtime movement in one historical thread.', 'Treat releases as part of operational readiness.'] }],
    searchTerms: ['changelog', 'releases'],
  },
  {
    id: 'docs-inventory',
    label: 'Documentation',
    title: 'Documentation for the hardware-software CI/CD automation platform',
    intro: 'Documentation explains how GITORC operates as a hardware-software CI/CD automation platform across repositories, pipelines, identity enforcement, virtualization, deployment, and system operations.',
    sections: [
      {
        title: 'Documentation surfaces',
        links: [
          { label: 'API reference', targetId: 'api-reference', detail: 'Control-plane and service integration contracts.' },
          { label: 'Architecture docs', targetId: 'architecture-docs', detail: 'Service topology, workflow relationships, and runtime boundaries.' },
          { label: 'Local development guide', targetId: 'local-development-guide', detail: 'Bootstrap, build, verification, and local operating steps.' },
        ],
      },
      {
        title: 'What the docs cover',
        bullets: [
          'Platform overview across repositories, pipelines, automation, security, virtualization, deployment, and operations.',
          'API contracts and control-plane integration points.',
          'Local bootstrap, build, and runtime verification paths.',
          'Operational guidance for identity-bound and traceable execution.',
        ],
      },
    ],
    searchTerms: ['documentation', 'platform docs', 'automation docs', 'gitorc docs'],
  },
  {
    id: 'api-reference',
    label: 'API reference',
    title: 'API reference and contract surfaces',
    intro: 'The API surface defines how the platform is integrated, automated, and extended.',
    sections: [{ title: 'API focus', bullets: ['Gateway contracts define the main control plane surface.', 'Service APIs expose health, metadata, and runtime integration points.', 'Contracts should be read together with architecture and local development docs.'] }],
    searchTerms: ['api reference', 'contracts'],
  },
  {
    id: 'architecture-docs',
    label: 'Architecture docs',
    title: 'Architecture docs for the integrated hardware-software automation system',
    intro: 'Architecture documentation explains how GITORC unifies Git operations, code review, CI/CD pipelines, identity enforcement, virtualization, deployment, and system telemetry into one integrated operating model.',
    sections: [
      {
        title: 'Architecture focus',
        bullets: [
          'Explain the control plane, service topology, and execution boundaries.',
          'Describe how repository, pipeline, deployment, and process identities interact.',
          'Show how hardware-aware execution, virtualization, and secure orchestration fit together.',
          'Connect system operations, logs, metrics, and audit evidence back to the platform workflow.',
        ],
      },
    ],
    searchTerms: ['architecture docs', 'platform architecture', 'service topology', 'integrated system'],
  },
  {
    id: 'local-development-guide',
    label: 'Local development guide',
    title: 'Local development guide for build, run, and verification',
    intro: 'Local development docs should give a reliable path through prerequisites, builds, startup, and health verification.',
    sections: [
      { title: 'Guide contents', bullets: ['Prerequisites for Go, Node, Docker, and Make.', 'Backend and frontend build commands.', 'Docker Compose startup and health verification steps.'] },
      { title: 'Related pages', links: [{ label: 'Bootstrap locally', targetId: 'bootstrap-locally' }, { label: 'Monorepo layout', targetId: 'monorepo-layout' }] },
    ],
    searchTerms: ['local development', 'local dev guide'],
  },
  {
    id: 'developer-community',
    label: 'Community & support',
    title: 'Community and support for operators, contributors, and platform teams',
    intro: 'Community channels support the operators, developers, and platform teams using GITORC as a hardware-software CI/CD automation platform, with direct paths for implementation questions, coordination, and contributor onboarding.',
    sections: [
      {
        title: 'Community role',
        bullets: [
          'Provide a discussion space for repositories, pipelines, deployment flows, and runtime operations.',
          'Support contributors and adopters with visible channels for questions and feedback.',
          'Keep community conversation connected to documentation, repository history, and structured change flow.',
        ],
      },
      {
        title: 'Related pages',
        links: [
          { label: 'Discord & channels', targetId: 'discord-channels' },
          { label: 'Contribution guide', targetId: 'contribution-guide' },
          { label: 'Issue templates & RFCs', targetId: 'issue-templates-rfcs' },
        ],
      },
    ],
    searchTerms: ['community', 'support', 'operators', 'contributors'],
  },
  {
    id: 'discord-channels',
    label: 'Discord & channels',
    title: 'Discord and discussion channels',
    intro: 'Community access should give operators and contributors a direct path into GitHub, GitLab, Discord, and Slack for discussion, coordination, and platform feedback.',
    sections: [
      {
        title: 'Join community',
        links: [
          {
            label: 'Join GitHub community',
            href: 'https://github.com/AtonixCorp/gitorc',
            external: true,
            detail: 'Follow the repository, discussions, issues, and release activity.',
          },
          {
            label: 'Join GitLab community',
            href: 'https://gitlab.com',
            external: true,
            detail: 'Use GitLab as an additional collaboration and delivery touchpoint.',
          },
          {
            label: 'Join Discord community',
            href: 'https://discord.com',
            external: true,
            detail: 'Route implementation questions and operator discussion into live channels.',
          },
          {
            label: 'Join Slack community',
            href: 'https://slack.com',
            external: true,
            detail: 'Coordinate platform updates, support threads, and team operations.',
          },
        ],
      },
      {
        title: 'Channel purpose',
        bullets: [
          'Direct implementation questions to live discussion where helpful.',
          'Use channels for operations feedback and contributor coordination.',
          'Keep discussion aligned with documentation and repository workflows.',
        ],
      },
    ],
    searchTerms: ['discord', 'channels'],
  },
  {
    id: 'contribution-guide',
    label: 'Contribution guide',
    title: 'Contribution guide for structured platform changes',
    intro: 'Contribution guidance should help developers change the platform without losing structure, documentation discipline, or release rigor.',
    sections: [{ title: 'Contribution path', bullets: ['Start with the repository and documentation surfaces.', 'Use clear issue, RFC, and review patterns for meaningful platform changes.', 'Treat contribution flow as part of long-term lifecycle support.'] }],
    searchTerms: ['contribution guide', 'contributing'],
  },
  {
    id: 'issue-templates-rfcs',
    label: 'Issue templates & RFCs',
    title: 'Issue templates and RFCs for structured platform evolution',
    intro: 'Issue templates and RFCs provide a structured path for bug reports, feature discussion, and design change proposals.',
    sections: [{ title: 'Structured change flow', bullets: ['Use issues for concrete bugs and gaps.', 'Use RFCs for architectural or workflow-level changes.', 'Keep discussions linked back to repository history and documentation.'] }],
    searchTerms: ['issue templates', 'rfcs', 'rfc'],
  },
];

const landingSidebarGroups: LandingSidebarGroup[] = [
  {
    label: 'Start here',
    items: [
      { id: 'landing-overview', label: 'Overview', icon: 'overview' },
      { id: 'platform-overview', label: 'Platform overview', icon: 'overview' },
      { id: 'repository-role', label: 'Repositories', icon: 'repository' },
      { id: 'platform-pipelines-workflows', label: 'Pipelines (CI/CD)', icon: 'pipelines' },
    ],
  },
  {
    label: 'Core systems',
    items: [
      { id: 'ci-cd-engine', label: 'Automation engine', icon: 'automation' },
      { id: 'security-model', label: 'Identity & security', icon: 'security' },
      { id: 'private-cloud-hpc', label: 'Virtualization', icon: 'cloud' },
      { id: 'runtime-strategies', label: 'Deployment', icon: 'workflow' },
    ],
  },
  {
    label: 'Operations and docs',
    items: [
      { id: 'device-node-integration', label: 'System operations', icon: 'devices' },
      { id: 'docs-inventory', label: 'Documentation', icon: 'docs' },
      { id: 'bootstrap-locally', label: 'Bootstrap locally', icon: 'automation' },
      { id: 'api-reference', label: 'API reference', icon: 'docs' },
      { id: 'discord-channels', label: 'Join community', icon: 'channel' },
    ],
  },
];

const landingHeaderLinks: LandingHeaderLink[] = [
  { label: 'Platform', icon: 'control-panel', publicPage: 'platform', targetId: 'platform-overview' },
  { label: 'Repository', icon: 'repository', targetId: 'repository-role', publicPage: 'platform' },
  { label: 'Docs', icon: 'docs', targetId: 'docs-inventory', publicPage: 'platform' },
  { label: 'Community', icon: 'community', targetId: 'developer-community', publicPage: 'platform' },
];

function isLandingPageId(value: string): value is LandingPageId {
  return landingPages.some((page) => page.id === value);
}

function LandingSystemMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect x="4" y="6" width="16" height="12" rx="2" fill="currentColor" />
      <rect x="28" y="6" width="16" height="12" rx="2" fill="currentColor" />
      <rect x="16" y="30" width="16" height="12" rx="2" fill="currentColor" />
      <path d="M12 18v7h24v5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LandingIcon({ icon }: { icon: LandingIconName }) {
  switch (icon) {
    case 'workflow':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 6h7M5 12h14M12 18h7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="4" cy="6" r="1.5" />
          <circle cx="20" cy="12" r="1.5" />
          <circle cx="11" cy="18" r="1.5" />
        </svg>
      );
    case 'automation':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3v4M12 17v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M3 12h4M17 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case 'pipelines':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="5" width="5" height="5" rx="1" />
          <rect x="10" y="9.5" width="5" height="5" rx="1" />
          <rect x="17" y="14" width="4" height="5" rx="1" />
          <path d="M8 7.5h3M15 12h2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'devices':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="6" width="10" height="8" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <rect x="15.5" y="4" width="5.5" height="12" rx="1.3" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path d="M8 18h8M10 14v4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'location':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 20s5-4.8 5-9a5 5 0 1 0-10 0c0 4.2 5 9 5 9Z" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="12" cy="11" r="1.7" />
        </svg>
      );
    case 'cloud':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7.5 18h9.5a3 3 0 0 0 .2-6 4.7 4.7 0 0 0-8.9-1.5A3.7 3.7 0 0 0 7.5 18Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
      );
    case 'download':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4v10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="m8 10 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 19h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'security':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3 5 6v5c0 4.3 2.8 8.1 7 10 4.2-1.9 7-5.7 7-10V6l-7-3Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="m9.4 12.3 1.8 1.8 3.5-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'docs':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 4.5h9a3 3 0 0 1 3 3V19H9a3 3 0 0 0-3 3V4.5Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M9 8h6M9 11.5h6M9 15h4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'community':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="8" cy="9" r="2" />
          <circle cx="16" cy="8" r="2" />
          <path d="M4.5 18a3.5 3.5 0 0 1 7 0M12.5 18a3.5 3.5 0 0 1 7 0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'channel':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 7.5A2.5 2.5 0 0 1 7.5 5h9A2.5 2.5 0 0 1 19 7.5v6A2.5 2.5 0 0 1 16.5 16H11l-3.8 3.2V16H7.5A2.5 2.5 0 0 1 5 13.5Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M8.5 9.5h7M8.5 12.5h4.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'repository':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 5.5h11a2 2 0 0 1 2 2v11H8a2 2 0 0 0-2 2Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M9 9h6M9 12.5h6M9 16h4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'control-panel':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="5" width="6" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <rect x="14" y="5" width="6" height="10" rx="1" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <rect x="4" y="15" width="6" height="4" rx="1" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path d="M14 18h6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'login':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M13 8l4 4-4 4M9 12h8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'github':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3.6a8.6 8.6 0 0 0-2.7 16.8v-2.8c-3.1.7-3.8-1.3-3.8-1.3-.5-1.2-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1 1.6.7 2 1.4.3-.8.8-1.3 1.3-1.6-2.5-.3-5.1-1.2-5.1-5.5 0-1.2.4-2.2 1.1-3-.1-.3-.5-1.4.1-2.9 0 0 .9-.3 3 .9a10.2 10.2 0 0 1 5.5 0c2.1-1.2 3-.9 3-.9.6 1.5.2 2.6.1 2.9.7.8 1.1 1.8 1.1 3 0 4.3-2.6 5.2-5.1 5.5.4.4.8 1.1.8 2.2v3.3A8.6 8.6 0 0 0 12 3.6Z" fill="currentColor" />
        </svg>
      );
    case 'gitlab':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m12 20.2 3.8-11.7h-7.6L12 20.2Z" fill="currentColor" />
          <path d="M12 20.2 4.8 12.4h3.6L12 20.2ZM12 20.2l7.2-7.8h-3.6L12 20.2ZM8.4 8.5l-3.6 3.9-1-3.2a.7.7 0 0 1 .5-.9l2-.5 2.1.7ZM15.6 8.5l3.6 3.9 1-3.2a.7.7 0 0 0-.5-.9l-2-.5-2.1.7ZM8.4 8.5 10.2 3a.6.6 0 0 1 1.1 0l1.7 5.5H8.4ZM12.9 8.5 14.6 3a.6.6 0 0 1 1.1 0l1.8 5.5h-4.6ZM6.5 8.5 8.2 3a.6.6 0 0 1 1.1 0L11 8.5H6.5Z" fill="currentColor" />
        </svg>
      );
    case 'google':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21.8 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.5a4.8 4.8 0 0 1-2 3.1v2.6h3.2c1.9-1.8 3.1-4.3 3.1-7.4Z" fill="#4285F4" />
          <path d="M12 22c2.7 0 4.9-.9 6.6-2.4l-3.2-2.6c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.7A10 10 0 0 0 12 22Z" fill="#34A853" />
          <path d="M6.4 13.9a6 6 0 0 1 0-3.8V7.4H3.1a10 10 0 0 0 0 9.1l3.3-2.6Z" fill="#FBBC04" />
          <path d="M12 6a5.4 5.4 0 0 1 3.8 1.5l2.8-2.8A9.6 9.6 0 0 0 12 2 10 10 0 0 0 3.1 7.4l3.3 2.6C7.2 7.8 9.4 6 12 6Z" fill="#EA4335" />
        </svg>
      );
    case 'gitorc':
      return <LandingSystemMark />;
    case 'search':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="5" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path d="m20 20-4.2-4.2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'theme':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M13 3.2A8.8 8.8 0 1 0 20.8 15 7 7 0 1 1 13 3.2Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
      );
    case 'profile':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="3.3" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path d="M5.5 19a6.5 6.5 0 0 1 13 0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'dashboard':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path d="M8 9h8M8 12.5h4M8 16h6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'overview':
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="5" width="7" height="6" rx="1" />
          <rect x="13" y="5" width="7" height="6" rx="1" />
          <rect x="4" y="13" width="16" height="6" rx="1" />
        </svg>
      );
  }
}

const routeTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'repositories', label: 'Repositories' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'pipelines', label: 'Pipelines' },
  { id: 'deployments', label: 'Deployments' },
  { id: 'containers', label: 'Containers' },
  { id: 'access', label: 'Access requests' },
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

type ProjectFormMode = 'closed' | 'create' | 'import';

type ProjectDraft = {
  name: string;
  summary: string;
  defaultBranch: string;
  sourceUrl: string;
};

type PublicPage = 'home' | 'platform' | 'signin' | 'signup';

type AuthProvider = 'github' | 'gitlab' | 'google' | 'gitorc';

const authTokenStorageKey = 'gitorc.auth.token';

const emptyProjectDraft: ProjectDraft = {
  name: '',
  summary: '',
  defaultBranch: 'main',
  sourceUrl: '',
};

function readStoredAuthToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(authTokenStorageKey);
}

function storeAuthToken(token: string | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (token) {
    window.localStorage.setItem(authTokenStorageKey, token);
    return;
  }

  window.localStorage.removeItem(authTokenStorageKey);
}

function readPublicPage(): PublicPage {
  if (typeof window === 'undefined') {
    return 'home';
  }

  const hash = window.location.hash.replace(/^#/, '');
  if (hash.startsWith('/signup')) {
    return 'signup';
  }
  if (hash.startsWith('/signin')) {
    return 'signin';
  }
  if (hash.startsWith('/platform')) {
    return 'platform';
  }
  return 'home';
}

function readLandingPageFromHash(): LandingPageId {
  if (typeof window === 'undefined') {
    return 'platform-overview';
  }

  const hash = window.location.hash.replace(/^#/, '');
  const parts = hash.split('/').filter(Boolean);
  const candidate = parts[1];

  return candidate && isLandingPageId(candidate) ? candidate : 'platform-overview';
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

function formatTime(value: string) {
  return new Date(value).toLocaleString();
}

function statusClass(status: string) {
  if (['running', 'passed', 'completed', 'connected', 'primary', 'success', 'verified', 'approved'].includes(status)) {
    return 'tone-success';
  }
  if (['pending', 'pending_review', 'queued', 'ready', 'review-gated', 'standby'].includes(status)) {
    return 'tone-warn';
  }
  if (['failed', 'crashed', 'blocked', 'rolling-back', 'changes-requested', 'stopped', 'rejected'].includes(status)) {
    return 'tone-danger';
  }
  return 'tone-neutral';
}

function securityLabel(security: SecurityState) {
  return security.verified ? 'verified' : 'attention required';
}

function hasWorkspaceData(overview: Overview | null) {
  if (!overview) {
    return false;
  }

  return [
    overview.providers.length,
    overview.repositories.length,
    overview.reviews.length,
    overview.pipelines.length,
    overview.deployments.length,
    overview.containers.length,
    overview.events.length,
  ].some((count) => count > 0);
}

export function App() {
  const publicLandingMode = isStaticOverviewMode();
  const [route, setRoute] = useState<RouteState>(() => readRoute());
  const [publicPage, setPublicPage] = useState<PublicPage>(() => readPublicPage());
  const [authToken, setAuthToken] = useState<string | null>(() => readStoredAuthToken());
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authChecking, setAuthChecking] = useState(() => !publicLandingMode && readStoredAuthToken() !== null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [signupForm, setSignupForm] = useState({ username: '', email: '', password: '' });
  const [signupSubmitting, setSignupSubmitting] = useState(false);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [isLoading, setIsLoading] = useState(() => !publicLandingMode);
  const [error, setError] = useState<string | null>(null);
  const [focus, setFocus] = useState<FocusState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [eventKindFilter, setEventKindFilter] = useState<'all' | 'repository' | 'pipeline' | 'deployment' | 'process'>('all');
  const [eventRepositoryFilter, setEventRepositoryFilter] = useState<string>('all');
  const [activeGatewayBase, setActiveGatewayBase] = useState(getGatewayBase());
  const [projectFormMode, setProjectFormMode] = useState<ProjectFormMode>('closed');
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>(emptyProjectDraft);
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  const [landingTheme, setLandingTheme] = useState<'graphite' | 'paper'>('graphite');
  const [landingHeroPointer, setLandingHeroPointer] = useState({ x: 50, y: 50 });
  const [activeLandingPage, setActiveLandingPage] = useState<LandingPageId>('landing-overview');
  const [signupRequests, setSignupRequests] = useState<SignupRequestRecord[]>([]);
  const [signupRequestsLoading, setSignupRequestsLoading] = useState(false);
  const [signupRequestsError, setSignupRequestsError] = useState<string | null>(null);
  const [reviewingSignupRequestId, setReviewingSignupRequestId] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const workspaceHasData = hasWorkspaceData(overview);
  const isPlatformAdmin = authSession?.user.role === 'platform-admin' || authSession?.user.permissions.includes('control-panel:admin') || false;
  const availableRouteTabs = useMemo(
    () => routeTabs.filter((tab) => tab.id !== 'access' || isPlatformAdmin),
    [isPlatformAdmin],
  );

  const loadOverview = async (signal?: AbortSignal) => {
    const payload = await fetchOverview(signal, authSession?.token ?? authToken);
    setOverview(payload);
    setActiveGatewayBase(getGatewayBase());
    setError(null);
    return payload;
  };

  useEffect(() => {
    const onHashChange = () => {
      setRoute(readRoute());
      setPublicPage(readPublicPage());
      setActiveLandingPage(readLandingPageFromHash());
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    let active = true;

    if (publicLandingMode) {
      storeAuthToken(null);
      setAuthToken(null);
      setAuthSession(null);
      setAuthChecking(false);
      setIsLoading(false);
      setError(null);
      return () => {
        active = false;
      };
    }

    if (!authToken) {
      setAuthSession(null);
      setAuthChecking(false);
      return () => {
        active = false;
      };
    }

    setAuthChecking(true);

    void fetchSession(authToken)
      .then((session) => {
        if (!active) {
          return;
        }
        setAuthSession({ ...session, token: authToken });
        setAuthError(null);
      })
      .catch((sessionError) => {
        if (!active) {
          return;
        }
        storeAuthToken(null);
        setAuthToken(null);
        setAuthSession(null);
        setAuthError(sessionError instanceof Error ? sessionError.message : 'Session validation failed');
      })
      .finally(() => {
        if (active) {
          setAuthChecking(false);
        }
      });

    let interval: number | undefined;

    if (publicLandingMode) {
      setIsLoading(false);
      setError(null);
      return () => {
        active = false;
      };
    }

    if (!authSession?.token) {
      setIsLoading(false);
      setOverview(null);
      setError(null);
      return () => {
        active = false;
      };
    }

    const refresh = async () => {
      try {
        const payload = await fetchOverview(undefined, authSession.token);
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
        const message = fetchError instanceof Error ? fetchError.message : 'Unknown gateway error';
        if (message.toLowerCase().includes('session') || message.toLowerCase().includes('missing bearer token')) {
          storeAuthToken(null);
          setAuthToken(null);
          setAuthSession(null);
          setAuthError('Your session expired. Sign in again to access the dashboard.');
          setOverview(null);
          setError(null);
          return;
        }
        setError(message);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void refresh();
    interval = window.setInterval(() => {
      void refresh();
    }, 8000);

    return () => {
      active = false;
      if (interval) {
        window.clearInterval(interval);
      }
    };
  }, [authSession?.token, publicLandingMode]);

  useEffect(() => {
    let active = true;

    if (publicLandingMode || !authSession?.token || !isPlatformAdmin) {
      setSignupRequests([]);
      setSignupRequestsError(null);
      setSignupRequestsLoading(false);
      return () => {
        active = false;
      };
    }

    setSignupRequestsLoading(true);
    setSignupRequestsError(null);

    void fetchSignupRequests(authSession.token)
      .then((requests) => {
        if (!active) {
          return;
        }
        setSignupRequests(requests);
      })
      .catch((requestError) => {
        if (!active) {
          return;
        }
        setSignupRequestsError(requestError instanceof Error ? requestError.message : 'Failed to load signup requests.');
      })
      .finally(() => {
        if (active) {
          setSignupRequestsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [authSession?.token, isPlatformAdmin, publicLandingMode]);

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

  const handleSignupRequestReview = async (request: SignupRequestRecord, status: 'approved' | 'rejected') => {
    if (!authSession?.token) {
      return;
    }

    const note = status === 'rejected'
      ? window.prompt(`Add a rejection note for ${request.username}`, request.review_note || '') ?? ''
      : window.prompt(`Optional approval note for ${request.username}`, request.review_note || '') ?? '';

    setReviewingSignupRequestId(request.id);
    try {
      const updated = await reviewSignupRequest(request.id, status, note.trim(), authSession.token);
      setSignupRequests((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
      setToast(`${request.username} request ${status}.`);
    } catch (reviewError) {
      setToast(reviewError instanceof Error ? reviewError.message : 'Signup request review failed.');
    } finally {
      setReviewingSignupRequestId(null);
    }
  };

  const navigatePublic = (page: PublicPage, pageId?: LandingPageId) => {
    const targetPageId = pageId ?? activeLandingPage;
    if (page === 'signin') {
      window.location.hash = '#/signin';
    } else if (page === 'signup') {
      window.location.hash = '#/signup';
    } else if (page === 'platform') {
      window.location.hash = `#/platform/${targetPageId}`;
      setActiveLandingPage(targetPageId);
    } else {
      window.location.hash = '#/';
    }
    setPublicPage(page);
  };

  const selectLandingPage = (pageId: LandingPageId) => {
    if (publicLandingMode) {
      navigatePublic('platform', pageId);
      return;
    }

    setActiveLandingPage(pageId);
  };

  const activeLandingPageDefinition = useMemo(
    () => landingPages.find((page) => page.id === activeLandingPage) ?? landingPages[0],
    [activeLandingPage],
  );

  const activeLandingGroup = useMemo(
    () => landingSidebarGroups.find((group) => group.items.some((item) => item.id === activeLandingPageDefinition.id)) ?? null,
    [activeLandingPageDefinition.id],
  );

  const dashboardShortcutCards = useMemo(
    () => [
      {
        title: 'Open Control Panel',
        description: 'Open the main operator surface for projects, delivery state, runtime trust, and infrastructure automation.',
        icon: 'dashboard' as LandingIconName,
        actionLabel: 'Open control panel',
        onClick: () => navigateTo('overview', selectedRepository?.id),
      },
      {
        title: 'Open Repository',
        description: 'Inspect connected repositories, clone paths, review flow, and source inventory.',
        icon: 'repository' as LandingIconName,
        actionLabel: 'Open repository',
        onClick: () => navigateTo('repositories', selectedRepository?.id),
      },
      {
        title: 'Pipelines',
        description: 'Run CI, inspect stage health, promote artifacts, and manage governed delivery flow.',
        icon: 'pipelines' as LandingIconName,
        actionLabel: 'Open pipelines',
        onClick: () => navigateTo('pipelines', selectedRepository?.id),
      },
      {
        title: 'Clusters (Rancher)',
        description: 'Surface cluster operations and Rancher-managed deployment lanes from the automation workspace.',
        icon: 'control-panel' as LandingIconName,
        actionLabel: 'Open clusters',
        onClick: () => {
          navigateTo('deployments', selectedRepository?.id);
          setToast('Cluster and Rancher integration surfaces map through deployment operations.');
        },
      },
      {
        title: 'Monitoring',
        description: 'Open observability-aligned deployment and runtime views for Prometheus and Grafana-operated environments.',
        icon: 'overview' as LandingIconName,
        actionLabel: 'Open monitoring',
        onClick: () => {
          navigateTo('containers', selectedRepository?.id);
          setToast('Monitoring surfaces are represented through runtime and event visibility.');
        },
      },
      {
        title: 'Cloud Deployment Tools',
        description: 'Track automation lanes that deploy Proxmox, OpenStack, Kubernetes, Rancher, networking, and observability stacks.',
        icon: 'automation' as LandingIconName,
        actionLabel: 'Open deployment docs',
        onClick: () => window.open('https://github.com/AtonixCorp/gitorc/tree/main/infra', '_blank', 'noreferrer'),
      },
      {
        title: 'Docs & API reference',
        description: 'Keep architecture, quickstarts, platform deployment docs, and API contracts one click away.',
        icon: 'docs' as LandingIconName,
        actionLabel: 'Open docs',
        onClick: () => window.open('https://github.com/AtonixCorp/gitorc/tree/main/docs', '_blank', 'noreferrer'),
      },
      {
        title: 'Community & Support',
        description: 'Route operators and contributors to community channels, onboarding guidance, and support surfaces.',
        icon: 'community' as LandingIconName,
        actionLabel: 'Open community',
        onClick: () => window.open('https://github.com/AtonixCorp/gitorc', '_blank', 'noreferrer'),
      },
    ],
    [selectedRepository?.id],
  );

  const renderLandingLink = (link: LandingPageLink, className: string, buttonClassName = className) => {
    if (link.external && link.href) {
      return (
        <a key={link.label} className={className} href={link.href} rel="noreferrer" target="_blank">
          <strong>{link.label}</strong>
          {link.detail ? <span>{link.detail}</span> : null}
        </a>
      );
    }

    if (link.targetId) {
      return (
        <button key={link.label} className={buttonClassName} onClick={() => selectLandingPage(link.targetId!)} type="button">
          <strong>{link.label}</strong>
          {link.detail ? <span>{link.detail}</span> : null}
        </button>
      );
    }

    return null;
  };

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthSubmitting(true);
    setAuthError(null);

    try {
      const session = await login(loginForm.username.trim(), loginForm.password);
      if (!session.token) {
        throw new Error('Gateway did not return a session token');
      }

      storeAuthToken(session.token);
      setAuthToken(session.token);
      setAuthSession(session);
      setToast(`Welcome back, ${session.user.full_name}.`);

      if (publicLandingMode) {
        navigateTo('overview');
      } else {
        window.location.hash = toHash('overview');
        setRoute({ name: 'overview' });
      }
    } catch (loginError) {
      setAuthError(loginError instanceof Error ? loginError.message : 'Login failed');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleProviderAuth = (provider: Exclude<AuthProvider, 'gitorc'>, mode: 'login' | 'signup') => {
    const providerLabel = provider === 'github' ? 'GitHub' : provider === 'gitlab' ? 'GitLab' : 'Google';
    setToast(`${providerLabel} ${mode} will connect through your external identity provider configuration.`);
  };

  const handleSignupSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSignupSubmitting(true);
    setAuthError(null);

    try {
      const username = signupForm.username.trim();
      const email = signupForm.email.trim();
      const password = signupForm.password.trim();

      if (!username || !email || !password) {
        throw new Error('Provide username, email, and password to request access.');
      }

      const result = await signup({ username, email, password });
      setToast(`${result.message} Request ID: ${result.request_id.slice(0, 8)}.`);
      setSignupForm({ username: '', email: '', password: '' });
      navigatePublic('signin');
    } catch (signupError) {
      const message = signupError instanceof Error ? signupError.message : 'Account request could not be submitted.';
      setAuthError(message);
      setToast(message);
    } finally {
      setSignupSubmitting(false);
    }
  };

  const handleLogout = async () => {
    const currentToken = authToken;
    try {
      if (currentToken) {
        await logout(currentToken);
      }
    } catch {
      // Ignore logout transport errors and clear local session anyway.
    }

    storeAuthToken(null);
    setAuthToken(null);
    setAuthSession(null);
    setOverview(null);
    setFocus(null);
    setToast('Signed out of the control plane.');
    setPublicPage(publicLandingMode ? 'signin' : 'home');
    window.location.hash = publicLandingMode ? '#/signin' : '#/signin';
  };

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setToast(`${label} copied to clipboard.`);
    } catch {
      setToast(`${label}: ${value}`);
    }
  };

  const pushCommandForRepository = (repository: Repository, operation: CloneOperation | null) => {
    const remote = operation?.clone_url || repository.clone_url;
    return `git remote add origin ${remote} && git push -u origin ${repository.default_branch}`;
  };

  const openProjectForm = (mode: ProjectFormMode) => {
    setProjectFormMode(mode);
    setProjectDraft(emptyProjectDraft);
  };

  const closeProjectForm = () => {
    setProjectFormMode('closed');
    setProjectDraft(emptyProjectDraft);
  };

  const handleProjectFieldChange = (field: keyof ProjectDraft, value: string) => {
    setProjectDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleProjectSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (projectFormMode === 'closed') {
      return;
    }

    setIsSubmittingProject(true);
    try {
      let result: RepositoryMutationResult;
      if (projectFormMode === 'create') {
        const payload: CreateRepositoryInput = {
          name: projectDraft.name,
          summary: projectDraft.summary,
          defaultBranch: projectDraft.defaultBranch,
        };
        result = await createRepository(payload, authSession?.token ?? authToken);
      } else {
        const payload: ImportRepositoryInput = {
          name: projectDraft.name,
          summary: projectDraft.summary,
          defaultBranch: projectDraft.defaultBranch,
          sourceUrl: projectDraft.sourceUrl,
        };
        result = await importRepository(payload, authSession?.token ?? authToken);
      }

      await loadOverview();
      setFocus({ kind: 'repository', id: result.repository.id });
      navigateTo('repositories', result.repository.id);
      closeProjectForm();
      setToast(projectFormMode === 'create' ? `Project ${result.repository.name} created.` : `Repository ${result.repository.name} imported.`);
    } catch (submitError) {
      setToast(submitError instanceof Error ? submitError.message : 'Project operation failed.');
    } finally {
      setIsSubmittingProject(false);
    }
  };

  const handleRepositoryAction = async (repository: Repository, operation: CloneOperation | null, action: 'clone' | 'push' | 'review') => {
    setFocus({ kind: 'repository', id: repository.id });
    navigateTo('repositories', repository.id);

    if (action === 'clone') {
      await copyText(`git clone ${operation?.clone_url || repository.clone_url}`, 'Clone command');
      return;
    }

    if (action === 'push') {
      await copyText(pushCommandForRepository(repository, operation), 'Push command');
      return;
    }

    if (action === 'review') {
      setToast(`Opening review board for ${repository.name}.`);
      navigateTo('reviews', repository.id);
    }
  };

  const handlePipelineAction = (pipeline: Pipeline, action: 'overview' | 'history' | 'logs') => {
    setFocus({ kind: 'pipeline', id: pipeline.id });
    navigateTo('pipelines', pipeline.repository_id);
    setToast(
      action === 'overview'
        ? `Showing pipeline summary for ${pipeline.name}.`
        : action === 'history'
          ? `Showing run history for ${pipeline.name}.`
          : `Log channel: ${pipeline.log_channel}`,
    );
  };

  const handleDeploymentAction = (deployment: Deployment, action: 'details' | 'history' | 'logs') => {
    setFocus({ kind: 'deployment', id: deployment.id });
    navigateTo('deployments', deployment.repository_id);
    setToast(
      action === 'details'
        ? `Showing release details for ${deployment.service_name}.`
        : action === 'history'
          ? `Showing release history for ${deployment.service_name}.`
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
                    <button className="button button-ghost" onClick={() => void handleRepositoryAction(repository, operation, 'push')} type="button">Push</button>
                    <button className="button button-ghost" onClick={() => void handleRepositoryAction(repository, operation, 'review')} type="button">Open review</button>
                  </div>
                </article>
              );
            })}
          </div>

          <article className="trace-card detail-card">
            <p className="section-kicker">Selected repository remote</p>
            <h3>{selectedRepository.name}</h3>
            <ul>
              <li>Clone URL: {selectedClone?.clone_url || selectedRepository.clone_url}</li>
              <li>Clone command: {selectedClone?.command || `git clone ${selectedRepository.clone_url}`}</li>
              <li>Push command: {pushCommandForRepository(selectedRepository, selectedClone)}</li>
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
            <p className="section-kicker">Workspace sections</p>
            {availableRouteTabs.map((tab) => (
              <button
                key={tab.id}
                className={`button ${route.name === tab.id ? 'button-primary' : 'button-ghost'} sidebar-button`}
                onClick={() => navigateTo(tab.id, tab.id === 'access' ? undefined : selectedRepository.id)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="sidebar-group">
            <p className="section-kicker">Tracked projects</p>
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
              <button className="button button-primary" onClick={() => openProjectForm('create')} type="button">
                Create project
              </button>
              <button className="button button-ghost" onClick={() => openProjectForm('import')} type="button">
                Import Git repository
              </button>
              <button className="button button-primary" onClick={() => navigateTo('repositories', selectedRepository.id)} type="button">
                Repositories
              </button>
              <button className="button button-ghost" onClick={() => navigateTo('pipelines', selectedRepository.id)} type="button">
                Pipelines
              </button>
              <button className="button button-ghost" onClick={() => navigateTo('deployments', selectedRepository.id)} type="button">
                Deployments
              </button>
              {authSession ? (
                <button className="button button-ghost" onClick={() => void handleLogout()} type="button">
                  Sign out
                </button>
              ) : null}
            </div>
          </section>

          <section className="dashboard-shortcut-grid">
            {dashboardShortcutCards.map((card) => (
              <article key={card.title} className="panel dashboard-shortcut-card">
                <span className="dashboard-shortcut-icon"><LandingIcon icon={card.icon} /></span>
                <div>
                  <p className="section-kicker">Dashboard access</p>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </div>
                <button className="button button-ghost" onClick={card.onClick} type="button">
                  {card.actionLabel}
                </button>
              </article>
            ))}
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
                <h2>Repositories and gateway actions</h2>
              </div>
              <span className="status-badge status-primary">Updated {formatTime(overview.updated_at)}</span>
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
                      <button className="button button-ghost" onClick={() => void handleRepositoryAction(repository, operation, 'push')} type="button">Push</button>
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
                      <button className="button button-ghost" onClick={() => handleDeploymentAction(deployment, 'details')} type="button">Details</button>
                      <button className="button button-ghost" onClick={() => handleDeploymentAction(deployment, 'logs')} type="button">Logs</button>
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
                      <button className="button button-ghost" onClick={() => handlePipelineAction(pipeline, 'overview')} type="button">Summary</button>
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

  const renderAccessReviewScreen = () => {
    const repositoryForNavigation = selectedRepository?.id ?? overview?.repositories[0]?.id;

    return (
      <section className="gitlab-shell">
        <aside className="gitlab-sidebar panel">
          <div className="sidebar-group">
            <p className="section-kicker">Workspace sections</p>
            {availableRouteTabs.map((tab) => (
              <button
                key={tab.id}
                className={`button ${route.name === tab.id ? 'button-primary' : 'button-ghost'} sidebar-button`}
                onClick={() => navigateTo(tab.id, tab.id === 'access' ? undefined : repositoryForNavigation)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
          {overview?.repositories.length ? (
            <div className="sidebar-group">
              <p className="section-kicker">Tracked projects</p>
              <div className="project-nav-list">
                {overview.repositories.map((repository) => (
                  <button
                    key={repository.id}
                    className={`project-nav-item ${selectedRepository?.id === repository.id ? 'project-nav-item-active' : ''}`}
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
          ) : null}
        </aside>

        <div className="gitlab-main">
          <section className="gitlab-header panel">
            <div>
              <p className="eyebrow">gitorc dashboard</p>
              <h2>Access requests and administrator approvals</h2>
              <p className="lede">Review pending signup requests, approve access for operators, or reject requests with an audit note.</p>
            </div>
            <div className="header-actions">
              {authSession ? (
                <button className="button button-ghost" onClick={() => void handleLogout()} type="button">
                  Sign out
                </button>
              ) : null}
            </div>
          </section>

          {renderSignupRequestsPanel()}
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
                  <button className="button button-primary" onClick={() => handleDeploymentAction(deployment, 'details')} type="button">Release details</button>
                  <button className="button button-ghost" onClick={() => handleDeploymentAction(deployment, 'history')} type="button">Release history</button>
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
                  <button className="button button-primary" onClick={() => handlePipelineAction(pipeline, 'overview')} type="button">Pipeline summary</button>
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
              <li>Repository identity: {overview.security.repository_identity || 'Not reported yet'}</li>
              <li>UI process identity: {overview.security.ui_process_identity || 'Not reported yet'}</li>
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
            <h2>Recent platform activity</h2>
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

  const renderEmptyWorkspace = () => {
    if (!overview) {
      return null;
    }

    const setupMetrics = [
      { label: 'Providers', value: String(overview.providers.length), hint: 'Connected' },
      { label: 'Projects', value: String(overview.repositories.length), hint: 'Available' },
      { label: 'Pipelines', value: String(overview.pipelines.length), hint: 'Tracked' },
      { label: 'Events', value: String(overview.events.length), hint: 'Recorded' },
    ];

    return (
      <section className="gitlab-shell">
        <aside className="gitlab-sidebar panel">
          <div className="sidebar-group">
            <p className="section-kicker">Workspace</p>
            <span className="status-badge status-primary">Gateway connected</span>
            <button className="button button-primary sidebar-button" onClick={() => openProjectForm('create')} type="button">
              Create project
            </button>
            <button className="button button-ghost sidebar-button" onClick={() => openProjectForm('import')} type="button">
              Import Git repository
            </button>
          </div>
        </aside>

        <div className="gitlab-main">
          <section className="gitlab-header panel">
            <div>
              <p className="eyebrow">operator workspace</p>
              <h2>Start with a project</h2>
            </div>
            <div className="header-actions">
              <button className="button button-primary" onClick={() => openProjectForm('create')} type="button">
                Create project
              </button>
              <button className="button button-ghost" onClick={() => openProjectForm('import')} type="button">
                Import Git repository
              </button>
              <span className="status-badge status-primary">Updated {formatTime(overview.updated_at)}</span>
            </div>
          </section>

          <section className="metrics-grid metrics-grid-compact">
            {setupMetrics.map((metric) => (
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
                <p className="section-kicker">First use</p>
                <h2>No projects yet</h2>
              </div>
            </div>
            <div className="trace-grid">
              <article className="trace-card">
                <h3>Import</h3>
                <p>Bring in an existing Git repository.</p>
              </article>
              <article className="trace-card">
                <h3>Create</h3>
                <p>Create a new remote and push your code.</p>
              </article>
              <article className="trace-card">
                <h3>Operate</h3>
                <p>Repositories and activity appear here after setup.</p>
              </article>
            </div>
          </section>
        </div>
      </section>
    );
  };

  const renderProjectForm = () => {
    if (publicLandingMode || projectFormMode === 'closed') {
      return null;
    }

    const title = projectFormMode === 'create' ? 'Create project' : 'Import Git repository';
    const description = projectFormMode === 'create'
      ? 'Create a new bare Git repository in the local gitorc store. After creation you can clone it and push your project into it.'
      : 'Mirror an existing Git remote into the local gitorc store so the dashboard can manage clone and push access locally.';

    return (
      <section className="panel stack-panel form-panel">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Project control</p>
            <h2>{title}</h2>
          </div>
          <span className="status-badge status-primary">Gateway: {activeGatewayBase}</span>
        </div>
        <p>{description}</p>
        <form className="project-form" onSubmit={handleProjectSubmit}>
          <div className="form-grid">
            <label className="form-field">
              <span>Project name</span>
              <input
                onChange={(event) => handleProjectFieldChange('name', event.target.value)}
                placeholder={projectFormMode === 'import' ? 'Optional, inferred from remote if empty' : 'example-project'}
                required={projectFormMode === 'create'}
                type="text"
                value={projectDraft.name}
              />
            </label>
            <label className="form-field">
              <span>Default branch</span>
              <input
                onChange={(event) => handleProjectFieldChange('defaultBranch', event.target.value)}
                placeholder="main"
                type="text"
                value={projectDraft.defaultBranch}
              />
            </label>
            {projectFormMode === 'import' ? (
              <label className="form-field form-field-wide">
                <span>Source Git URL</span>
                <input
                  onChange={(event) => handleProjectFieldChange('sourceUrl', event.target.value)}
                  placeholder="https://github.com/owner/repository.git"
                  required
                  type="text"
                  value={projectDraft.sourceUrl}
                />
              </label>
            ) : null}
            <label className="form-field form-field-wide">
              <span>Summary</span>
              <textarea
                onChange={(event) => handleProjectFieldChange('summary', event.target.value)}
                placeholder="Short description for the dashboard"
                rows={3}
                value={projectDraft.summary}
              />
            </label>
          </div>
          <div className="project-form-actions">
            <button className="button button-primary" disabled={isSubmittingProject} type="submit">
              {isSubmittingProject ? 'Working…' : title}
            </button>
            <button className="button button-ghost" onClick={closeProjectForm} type="button">
              Cancel
            </button>
          </div>
        </form>
      </section>
    );
  };

  const renderLandingPage = () => {
    const heroBackgroundStyle = {
      '--landing-hero-pointer-x': `${landingHeroPointer.x}%`,
      '--landing-hero-pointer-y': `${landingHeroPointer.y}%`,
      '--landing-hero-drift-x': `${(landingHeroPointer.x - 50) * 0.18}px`,
      '--landing-hero-drift-y': `${(landingHeroPointer.y - 50) * 0.16}px`,
      '--landing-hero-tilt-x': `${(50 - landingHeroPointer.y) * 0.05}deg`,
      '--landing-hero-tilt-y': `${(landingHeroPointer.x - 50) * 0.05}deg`,
    } as React.CSSProperties;

    const handleLandingHeroPointerMove = (event: React.PointerEvent<HTMLElement>) => {
      const bounds = event.currentTarget.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width) * 100;
      const y = ((event.clientY - bounds.top) / bounds.height) * 100;
      setLandingHeroPointer({
        x: Math.min(100, Math.max(0, x)),
        y: Math.min(100, Math.max(0, y)),
      });
    };

    const resetLandingHeroPointer = () => {
      setLandingHeroPointer({ x: 50, y: 50 });
    };

    return (
      <div className={`landing-shell landing-theme-${landingTheme}`}>
        <header className="landing-header">
          <button className="landing-brand" onClick={() => navigatePublic('home')} type="button">
            <span className="landing-brand-mark"><LandingSystemMark /></span>
            <span className="landing-brand-copy">
              <strong>GITORC</strong>
              <span>Hardware-Software CI/CD Automation Platform</span>
            </span>
          </button>

          <nav className="landing-header-nav" aria-label="Landing page navigation">
            {landingHeaderLinks.map((link) => {
              return (
                <button
                  key={link.label}
                  className="landing-nav-link"
                  onClick={() => navigatePublic(link.publicPage || 'platform', link.targetId)}
                  type="button"
                >
                  <span className="landing-nav-icon"><LandingIcon icon={link.icon} /></span>
                  {link.label}
                </button>
              );
            })}
          </nav>

          <div className="landing-header-controls">
            <button
              aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
              className="landing-icon-button landing-hamburger"
              onClick={() => setMobileNavOpen((s) => !s)}
              type="button"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <a
              aria-label="Open AtonixCorp on GitHub"
              className="landing-icon-button"
              href="https://github.com/AtonixCorp"
              rel="noreferrer"
              target="_blank"
            >
              <LandingIcon icon="github" />
            </a>

            <button
              aria-label="Toggle landing theme"
              className="landing-icon-button"
              onClick={() => setLandingTheme((current) => (current === 'graphite' ? 'paper' : 'graphite'))}
              type="button"
            >
              <LandingIcon icon="theme" />
            </button>

            <button aria-label="Login to dashboard" className="landing-icon-button" onClick={() => navigatePublic('signin')} type="button">
              <LandingIcon icon="login" />
            </button>
          </div>
        </header>

        {mobileNavOpen && (
          <>
            <div className="landing-mobile-backdrop" onClick={() => setMobileNavOpen(false)} />
            <aside className={`landing-mobile-nav ${mobileNavOpen ? 'open' : ''}`} role="dialog" aria-modal="true">
              <div className="landing-mobile-nav-header">
                <button className="landing-icon-button" aria-label="Close menu" onClick={() => setMobileNavOpen(false)} type="button">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                </button>
              </div>
              <nav aria-label="Mobile navigation">
                <div className="landing-mobile-links">
                  {landingHeaderLinks.map((link) => (
                    <button
                      key={link.label}
                      className="landing-nav-link"
                      onClick={() => { setMobileNavOpen(false); navigatePublic(link.publicPage || 'platform', link.targetId); }}
                      type="button"
                    >
                      <span className="landing-nav-icon"><LandingIcon icon={link.icon} /></span>
                      {link.label}
                    </button>
                  ))}

                  {landingSidebarGroups.map((group) => (
                    <div key={group.label} className="landing-mobile-group">
                      <div className="landing-mobile-group-title">{group.label}</div>
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          className="landing-nav-link"
                          onClick={() => { setMobileNavOpen(false); navigatePublic('platform', item.id); selectLandingPage(item.id); }}
                          type="button"
                        >
                          <span className="landing-nav-icon"><LandingIcon icon={item.icon} /></span>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </nav>
            </aside>
          </>
        )}

        {mobileNavOpen && (
          <>
            <div className="landing-mobile-backdrop" onClick={() => setMobileNavOpen(false)} />
            <aside className={`landing-mobile-nav ${mobileNavOpen ? 'open' : ''}`} role="dialog" aria-modal="true">
              <div className="landing-mobile-nav-header">
                <button className="landing-icon-button" aria-label="Close menu" onClick={() => setMobileNavOpen(false)} type="button">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                </button>
              </div>
              <nav aria-label="Mobile navigation">
                <div className="landing-mobile-links">
                  {landingHeaderLinks.map((link) => (
                    <button
                      key={link.label}
                      className="landing-nav-link"
                      onClick={() => { setMobileNavOpen(false); navigatePublic(link.publicPage || 'platform', link.targetId); }}
                      type="button"
                    >
                      <span className="landing-nav-icon"><LandingIcon icon={link.icon} /></span>
                      {link.label}
                    </button>
                  ))}

                  {landingSidebarGroups.map((group) => (
                    <div key={group.label} className="landing-mobile-group">
                      <div className="landing-mobile-group-title">{group.label}</div>
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          className="landing-nav-link"
                          onClick={() => { setMobileNavOpen(false); navigatePublic('platform', item.id); selectLandingPage(item.id); }}
                          type="button"
                        >
                          <span className="landing-nav-icon"><LandingIcon icon={item.icon} /></span>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </nav>
            </aside>
          </>
        )}

        <section className="landing-hero-shell" onPointerLeave={resetLandingHeroPointer} onPointerMove={handleLandingHeroPointerMove}>
          <div aria-hidden="true" className="landing-hero-background" style={heroBackgroundStyle}>
            <div className="landing-hero-orb landing-hero-orb-primary" />
            <div className="landing-hero-orb landing-hero-orb-secondary" />
            <div className="landing-hero-grid-plane" />
            <div className="landing-hero-grid-plane landing-hero-grid-plane-secondary" />
            <div className="landing-hero-beam landing-hero-beam-left" />
            <div className="landing-hero-beam landing-hero-beam-right" />
            <div className="landing-hero-cube-cluster">
              <span className="landing-hero-cube landing-hero-cube-large" />
              <span className="landing-hero-cube landing-hero-cube-mid" />
              <span className="landing-hero-cube landing-hero-cube-small" />
            </div>
            <div className="landing-hero-node-ring">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
          <article className="landing-hero-panel">
            <p className="eyebrow">Hardware-Software CI/CD Automation Platform</p>
            <h1>GITORC</h1>
            <p className="landing-hero-tagline">Integrated Git, CI/CD, virtualization, identity, and secure orchestration.</p>
            <div className="landing-hero-actions">
              <a className="button button-ghost" href="https://discord.com" rel="noreferrer" target="_blank">Join Discord</a>
              <a className="button button-ghost" href="https://slack.com" rel="noreferrer" target="_blank">Join Slack</a>
              <a className="button button-ghost" href="https://github.com/AtonixCorp/gitorc" rel="noreferrer" target="_blank">Open repository</a>
            </div>
          </article>
        </section>
      </div>
    );
  };

  const renderPlatformPage = () => {
    const pageEyebrow = activeLandingGroup?.label || 'Documentation overview';

    return (
      <div className={`landing-shell landing-theme-${landingTheme}`}>
        <header className="landing-header">
          <button className="landing-brand" onClick={() => navigatePublic('home')} type="button">
            <span className="landing-brand-mark"><LandingSystemMark /></span>
            <span className="landing-brand-copy">
              <strong>GITORC</strong>
              <span>Standard platform</span>
            </span>
          </button>

          <nav className="landing-header-nav" aria-label="Platform navigation">
            {landingHeaderLinks.map((link) => (
              <button
                key={link.label}
                className="landing-nav-link"
                onClick={() => navigatePublic(link.publicPage || 'platform', link.targetId)}
                type="button"
              >
                <span className="landing-nav-icon"><LandingIcon icon={link.icon} /></span>
                {link.label}
              </button>
            ))}
          </nav>

          <div className="landing-header-controls">
            <a
              aria-label="Open AtonixCorp on GitHub"
              className="landing-icon-button"
              href="https://github.com/AtonixCorp"
              rel="noreferrer"
              target="_blank"
            >
              <LandingIcon icon="github" />
            </a>

            <button
              aria-label="Toggle landing theme"
              className="landing-icon-button"
              onClick={() => setLandingTheme((current) => (current === 'graphite' ? 'paper' : 'graphite'))}
              type="button"
            >
              <LandingIcon icon="theme" />
            </button>

            <button aria-label="Login to dashboard" className="landing-icon-button" onClick={() => navigatePublic('signin')} type="button">
              <LandingIcon icon="login" />
            </button>
          </div>
        </header>

        <div className="landing-workbench">
          <aside className="landing-sidebar" aria-label="Documentation sidebar">
            {landingSidebarGroups.map((group) => (
              <div key={group.label} className="landing-sidebar-group">
                <p className="landing-sidebar-kicker">{group.label}</p>
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    aria-pressed={activeLandingPageDefinition.id === item.id}
                    className={`landing-sidebar-link ${activeLandingPageDefinition.id === item.id ? 'landing-sidebar-link-active' : ''}`}
                    onClick={() => selectLandingPage(item.id)}
                    type="button"
                  >
                    <span className="landing-sidebar-icon"><LandingIcon icon={item.icon} /></span>
                    <span className="landing-sidebar-copy">
                      <strong>{item.label}</strong>
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </aside>

          <div className="landing-main">
            <section className="landing-page">
              <div className="landing-page-hero">
                <div>
                  <p className="eyebrow">{pageEyebrow}</p>
                  <h1>{activeLandingPageDefinition.title}</h1>
                  <p className="lede">{activeLandingPageDefinition.intro}</p>
                </div>
              </div>
              <div className="landing-page-sections">
                {activeLandingPageDefinition.sections.map((section) => (
                  <article key={section.title} className="landing-page-section">
                    <div className="landing-section-head">
                      <div className="landing-section-title-row">
                        <span className="landing-section-icon"><LandingIcon icon="overview" /></span>
                        <div>
                          <p className="section-kicker">{activeLandingPageDefinition.label}</p>
                          <h2>{section.title}</h2>
                        </div>
                      </div>
                    </div>

                    {section.description ? <p className="landing-page-copy">{section.description}</p> : null}

                    {section.bullets?.length ? (
                      <ul className="landing-bullet-list">
                        {section.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    ) : null}

                    {section.links?.length ? (
                      <div className="landing-link-grid">
                        {section.links.map((link) => renderLandingLink(link, 'landing-link-card'))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  };

  const renderAuthProviderButton = (provider: Exclude<AuthProvider, 'gitorc'>, mode: 'login' | 'signup') => {
    const providerLabel = provider === 'github' ? 'GitHub' : provider === 'gitlab' ? 'GitLab' : 'Google';
    return (
      <button
        aria-label={mode === 'login' ? `Login with ${providerLabel}` : `Sign up with ${providerLabel}`}
        key={`${mode}-${provider}`}
        className={`auth-provider-button auth-provider-${provider}`}
        onClick={() => handleProviderAuth(provider, mode)}
        title={mode === 'login' ? `Login with ${providerLabel}` : `Sign up with ${providerLabel}`}
        type="button"
      >
        <span className="auth-provider-icon"><LandingIcon icon={provider} /></span>
      </button>
    );
  };

  const renderAuthPage = (mode: 'signin' | 'signup') => {
    const isSignup = mode === 'signup';

    return (
      <section className="auth-shell">
        <article className="panel auth-card">
          <div className="auth-card-header">
            <span className="auth-card-mark"><LandingIcon icon={isSignup ? 'gitorc' : 'login'} /></span>
            <div className="auth-card-copy">
              <p className="auth-card-kicker">Secure operator access</p>
              <h1>{isSignup ? 'Create your GITORC account' : 'Login to GITORC'}</h1>
              <p className="auth-card-subtitle">
                {isSignup ? 'Create secure access to automation, pipelines, and control-plane operations.' : 'Secure access to automation, pipelines, and control-plane operations.'}
              </p>
            </div>
          </div>

          <div className="auth-provider-list">
            {renderAuthProviderButton('github', isSignup ? 'signup' : 'login')}
            {renderAuthProviderButton('gitlab', isSignup ? 'signup' : 'login')}
            {renderAuthProviderButton('google', isSignup ? 'signup' : 'login')}
          </div>

          <div className="auth-divider">
            <span>{isSignup ? 'or create a GITORC account' : 'or login with GITORC account'}</span>
          </div>

          {isSignup ? (
            <form className="signin-form auth-form" onSubmit={handleSignupSubmit}>
              <label>
                Username
                <input
                  autoComplete="username"
                  onChange={(event) => setSignupForm((current) => ({ ...current, username: event.target.value }))}
                  placeholder="your-username"
                  type="text"
                  value={signupForm.username}
                />
              </label>
              <label>
                Email
                <input
                  autoComplete="email"
                  onChange={(event) => setSignupForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="you@company.com"
                  type="email"
                  value={signupForm.email}
                />
              </label>
              <label>
                Password
                <input
                  autoComplete="new-password"
                  onChange={(event) => setSignupForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Create a password"
                  type="password"
                  value={signupForm.password}
                />
              </label>
              <button className="button button-primary auth-submit-button" disabled={signupSubmitting} type="submit">
                {signupSubmitting ? 'Creating account…' : 'Create GITORC account'}
              </button>
            </form>
          ) : (
            <form className="signin-form auth-form" onSubmit={handleLoginSubmit}>
              <label>
                Username or email
                <input
                  autoComplete="username"
                  onChange={(event) => setLoginForm((current) => ({ ...current, username: event.target.value }))}
                  placeholder="you@company.com"
                  type="text"
                  value={loginForm.username}
                />
              </label>
              <label>
                Password
                <input
                  autoComplete="current-password"
                  onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Enter your password"
                  type="password"
                  value={loginForm.password}
                />
              </label>
              {authError ? <p className="signin-error">{authError}</p> : null}
              <button className="button button-primary auth-submit-button" disabled={authSubmitting || authChecking} type="submit">
                {authSubmitting ? 'Signing in…' : 'Sign in to dashboard'}
              </button>
            </form>
          )}

          <p className="auth-security-line">Access is restricted and governed by RBAC and project policies.</p>

          <div className="auth-footer-row">
            {isSignup ? (
              <button className="auth-footer-link" onClick={() => navigatePublic('signin')} type="button">Already have access? Login</button>
            ) : (
              <button className="auth-footer-link" onClick={() => setToast('Password reset flows should be routed through your identity administrator.')} type="button">Forgot password</button>
            )}
            <button className="auth-footer-link" onClick={() => setToast('Need access? Contact your GITORC administrator.')} type="button">Need access? Contact admin</button>
          </div>

          <div className="auth-footer-row auth-footer-row-secondary">
            {isSignup ? null : <button className="auth-footer-link" onClick={() => navigatePublic('signup')} type="button">Sign up</button>}
            <button className="auth-footer-link" onClick={() => navigatePublic('home')} type="button">Back to landing page</button>
          </div>
        </article>
      </section>
    );
  };

  const renderSignInPage = () => renderAuthPage('signin');

  const renderSignUpPage = () => renderAuthPage('signup');

  const renderSignupRequestsPanel = () => {
    const pendingCount = signupRequests.filter((request) => request.status === 'pending_review').length;
    const approvedCount = signupRequests.filter((request) => request.status === 'approved').length;
    const rejectedCount = signupRequests.filter((request) => request.status === 'rejected').length;

    return (
      <>
        <section className="metrics-grid metrics-grid-compact">
          <article className="metric-card metric-card-compact">
            <p>Pending requests</p>
            <strong>{pendingCount}</strong>
            <span>Awaiting administrator review</span>
          </article>
          <article className="metric-card metric-card-compact">
            <p>Approved</p>
            <strong>{approvedCount}</strong>
            <span>Access requests approved</span>
          </article>
          <article className="metric-card metric-card-compact">
            <p>Rejected</p>
            <strong>{rejectedCount}</strong>
            <span>Access requests declined</span>
          </article>
        </section>

        <section className="panel stack-panel dashboard-block">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Administrator review</p>
              <h2>Signup requests</h2>
            </div>
            <span className="status-badge status-primary">{signupRequests.length} total</span>
          </div>

          {signupRequestsLoading ? <p>Loading signup requests…</p> : null}
          {signupRequestsError ? <p>{signupRequestsError}</p> : null}
          {!signupRequestsLoading && !signupRequestsError && signupRequests.length === 0 ? <p>No signup requests are waiting for review.</p> : null}

          {!signupRequestsLoading && !signupRequestsError && signupRequests.length > 0 ? (
            <div className="table-shell">
              <div className="table-head table-projects">
                <span>Requester</span>
                <span>Email</span>
                <span>Status</span>
                <span>Submitted</span>
                <span>Reviewed</span>
                <span>Actions</span>
              </div>
              {signupRequests.map((request) => (
                <div key={request.id} className="table-row table-projects">
                  <div>
                    <strong>{request.username}</strong>
                    <p>{request.review_note || 'Awaiting review note.'}</p>
                  </div>
                  <span>{request.email}</span>
                  <span className={`mini-badge ${statusClass(request.status)}`}>{formatStatus(request.status)}</span>
                  <span>{formatTime(request.created_at)}</span>
                  <span>{request.reviewed_at ? `${formatTime(request.reviewed_at)}${request.reviewed_by ? ` by ${request.reviewed_by}` : ''}` : 'Pending'}</span>
                  <div className="table-actions">
                    <button
                      className="button button-primary"
                      disabled={reviewingSignupRequestId === request.id || request.status === 'approved'}
                      onClick={() => void handleSignupRequestReview(request, 'approved')}
                      type="button"
                    >
                      {reviewingSignupRequestId === request.id ? 'Saving…' : 'Approve'}
                    </button>
                    <button
                      className="button button-ghost"
                      disabled={reviewingSignupRequestId === request.id || request.status === 'rejected'}
                      onClick={() => void handleSignupRequestReview(request, 'rejected')}
                      type="button"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </>
    );
  };

  const renderScreen = () => {
    if (route.name === 'access') {
      return isPlatformAdmin ? renderAccessReviewScreen() : null;
    }

    if (!overview) {
      return null;
    }

    if (!workspaceHasData || !selectedRepository) {
      return renderEmptyWorkspace();
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
      {renderProjectForm()}

      {isLoading ? <section className="panel loading-panel">Loading gateway data…</section> : null}
      {!isLoading && authChecking ? <section className="panel loading-panel">Restoring secure session…</section> : null}
      {error ? (
        <section className="panel loading-panel">
          <h2>Gateway connection failed</h2>
          <p>{error}</p>
          <p>The operator workspace could not retrieve overview data from the configured gateway.</p>
        </section>
      ) : null}

      {!isLoading && !error && publicLandingMode && publicPage === 'home' ? renderLandingPage() : null}
      {!isLoading && !error && publicLandingMode && publicPage === 'platform' ? renderPlatformPage() : null}
      {!isLoading && !error && (publicLandingMode ? publicPage === 'signin' : !authSession && !authChecking) ? renderSignInPage() : null}
      {!isLoading && !error && publicLandingMode && publicPage === 'signup' ? renderSignUpPage() : null}
      {!isLoading && !error && !publicLandingMode && authSession ? renderScreen() : null}
    </main>
  );
}
