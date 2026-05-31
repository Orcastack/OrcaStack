import React, { useEffect, useMemo, useState } from 'react';

import {
  fetchOverview,
  getGatewayBase,
  isStaticOverviewMode,
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

type LandingSectionId =
  | 'overview'
  | 'how-it-works'
  | 'ci-cd-automation'
  | 'pipelines-workflows'
  | 'device-node-integration'
  | 'location-intelligence'
  | 'private-cloud-hpc'
  | 'security-model'
  | 'developer-documentation'
  | 'community-discord'
  | 'github-repository';

type LandingIconName =
  | 'overview'
  | 'workflow'
  | 'automation'
  | 'pipelines'
  | 'devices'
  | 'location'
  | 'cloud'
  | 'security'
  | 'docs'
  | 'community'
  | 'github'
  | 'search'
  | 'theme'
  | 'profile';

type LandingSection = {
  id: LandingSectionId;
  label: string;
  icon: LandingIconName;
  title: string;
  summary: string;
  bullets: string[];
  evidenceTitle: string;
  evidence: string[];
  searchTerms: string[];
};

type LandingHeaderLink = {
  label: string;
  targetId?: string;
  href?: string;
  external?: boolean;
};

const landingSidebarSections: LandingSection[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: 'overview',
    title: 'A Git-centric CI/CD engine for private infrastructure and governed delivery.',
    summary: 'gitorc presents itself as a platform interface from the first screen: repository control, review discipline, pipeline automation, deployment routing, and operational evidence in one system surface.',
    bullets: [
      'Treat the public landing page as an operator-facing briefing, not a marketing homepage.',
      'Explain what the stack does before users authenticate into the control plane.',
      'Expose a concrete bootstrap path so teams can clone and run the platform before deeper implementation work.',
    ],
    evidenceTitle: 'Platform signal',
    evidence: [
      'Self-hosted stack with a React control plane and Go service mesh.',
      'Operator workflows stay behind authenticated access boundaries.',
      'Default local endpoints: UI 5050, gateway 8080, service health via /healthz.',
    ],
    searchTerms: ['intro', 'platform', 'download', 'bootstrap', 'landing'],
  },
  {
    id: 'how-it-works',
    label: 'How It Works',
    icon: 'workflow',
    title: 'Source change enters one controlled flow from repository to runtime evidence.',
    summary: 'The platform aligns repository events, review policy, CI execution, deployment lanes, and signed operational traces so release decisions are made inside one operational model.',
    bullets: [
      'Capture repository and review intent at the same boundary where policy is enforced.',
      'Promote builds through explicit lanes instead of disconnected tool handoffs.',
      'Preserve runtime context and identity evidence after delivery completes.',
    ],
    evidenceTitle: 'Execution path',
    evidence: [
      'Commit and branch context enter governed review.',
      'CI and CD stages emit state, artifact, and environment signals.',
      'Runtime services remain linked to operator identity and audit posture.',
    ],
    searchTerms: ['flow', 'process', 'path', 'architecture'],
  },
  {
    id: 'ci-cd-automation',
    label: 'CI/CD Automation',
    icon: 'automation',
    title: 'Continuous integration and delivery are first-class operating functions.',
    summary: 'This interface describes a self-automated CI/CD engine, not a standalone SCM or marketing shell. Pipelines, promotions, and delivery gates are core platform behavior.',
    bullets: [
      'Coordinate CI execution, deployment control, and rollback posture from one interface.',
      'Keep automation state visible to developers, platform engineers, and release leadership.',
      'Treat governance and delivery policy as runtime controls instead of external process documents.',
    ],
    evidenceTitle: 'Automation posture',
    evidence: [
      'CI service, CD service, analytics service, and gateway ship with the local stack.',
      'Docker Compose exposes a runnable environment for end-to-end automation validation.',
      'The UI is already structured to separate public briefing from authenticated operations.',
    ],
    searchTerms: ['ci', 'cd', 'delivery', 'automation', 'runner'],
  },
  {
    id: 'pipelines-workflows',
    label: 'Pipelines & Workflows',
    icon: 'pipelines',
    title: 'Pipelines and workflows exist as governed lanes with operational accountability.',
    summary: 'The platform describes delivery as a sequence of controlled lanes, stage state, promotion readiness, and rollback discipline rather than a simple build badge.',
    bullets: [
      'Surface run history, gate conditions, and promotion decisions in a way operators can defend.',
      'Model workflows as release infrastructure, not generic automation cards.',
      'Keep artifact traceability and environment state close to the workflow view.',
    ],
    evidenceTitle: 'Workflow outcomes',
    evidence: [
      'Build, test, promote, and deploy operate as explicit stages.',
      'Release status remains understandable without leaving the platform context.',
      'Rollback readiness is part of the workflow definition, not an afterthought.',
    ],
    searchTerms: ['pipeline', 'workflow', 'release', 'stages'],
  },
  {
    id: 'device-node-integration',
    label: 'Device & Node Integration',
    icon: 'devices',
    title: 'Execution nodes and runtime devices are modeled as managed delivery surfaces.',
    summary: 'The landing page should communicate that orchestration can extend beyond source and builds to the nodes, services, and connected environments that execute workloads.',
    bullets: [
      'Tie process identity and runtime state back to deployment decisions.',
      'Present nodes as operator-managed infrastructure rather than decorative infrastructure icons.',
      'Support platform narratives where edge devices, services, or compute nodes participate in orchestration.',
    ],
    evidenceTitle: 'Node visibility',
    evidence: [
      'Container and process state already exist in the control-plane model.',
      'Deployment lanes can be described in terms of where workloads actually execute.',
      'Operational views remain useful to teams managing device-aware automation.',
    ],
    searchTerms: ['nodes', 'devices', 'agents', 'runtime'],
  },
  {
    id: 'location-intelligence',
    label: 'Location Intelligence',
    icon: 'location',
    title: 'Operational context can stay aware of where compute and delivery surfaces live.',
    summary: 'Location awareness belongs here as an intelligence layer for deployments, field infrastructure, private sites, and regional execution boundaries.',
    bullets: [
      'Describe the platform as capable of routing work across environments with geographic context.',
      'Keep this framed as operational intelligence, not consumer mapping.',
      'Use the landing page to explain why delivery state and location context matter together.',
    ],
    evidenceTitle: 'Location-aware operations',
    evidence: [
      'Environment targeting can be explained as site-aware orchestration.',
      'Private deployments often span multiple facilities or regions.',
      'Runtime evidence stays meaningful when tied to where execution occurred.',
    ],
    searchTerms: ['location', 'sites', 'regions', 'intelligence'],
  },
  {
    id: 'private-cloud-hpc',
    label: 'Private Cloud & HPC',
    icon: 'cloud',
    title: 'Built for private cloud footprints, internal clusters, and high-compute environments.',
    summary: 'The platform briefing should read naturally to teams running inside private infrastructure, controlled networks, and compute-heavy environments where operational maturity matters.',
    bullets: [
      'Explain that the stack is self-hosted and can be staged inside private deployment boundaries.',
      'Frame HPC and cluster readiness as an orchestration capability, not a theme choice.',
      'Keep the interface tone consistent with enterprise infrastructure operations.',
    ],
    evidenceTitle: 'Infrastructure fit',
    evidence: [
      'Local topology includes gateway, Git, review, CI, CD, analytics, data, and storage services.',
      'Docker Compose provides a full-stack bootstrap for isolated environments.',
      'The control plane is positioned as infrastructure software, not a SaaS brochure.',
    ],
    searchTerms: ['private cloud', 'hpc', 'cluster', 'infrastructure'],
  },
  {
    id: 'security-model',
    label: 'Security Model',
    icon: 'security',
    title: 'Security is expressed as signed identity, RBAC context, and runtime evidence.',
    summary: 'The landing page needs to describe a serious security model: service identity, signed actions, directory integration, attestation posture, and auditable operator boundaries.',
    bullets: [
      'Expose security as a platform operating model rather than a compliance slogan.',
      'Link repository, review, pipeline, and service actions to verifiable identity.',
      'Make it clear that sensitive control stays inside authenticated infrastructure boundaries.',
    ],
    evidenceTitle: 'Trust controls',
    evidence: [
      'LDAP, signing, RBAC, and component identity are already part of the local runtime environment.',
      'Go services expose health and metadata endpoints for operational verification.',
      'The control plane narrative includes attestation and evidence as core concepts.',
    ],
    searchTerms: ['security', 'identity', 'rbac', 'attestation'],
  },
  {
    id: 'developer-documentation',
    label: 'Developer Documentation',
    icon: 'docs',
    title: 'Documentation and API surfaces are part of the platform entry point.',
    summary: 'Developer docs, API reference, architecture notes, and local bootstrap guidance must appear as first-class navigation targets because they define how teams adopt and extend the stack.',
    bullets: [
      'Make documentation reachable from the header and represented directly inside the landing workflow.',
      'Explain how to run the stack before implementation work begins.',
      'Keep API and architecture access adjacent to the rest of the engineering surface.',
    ],
    evidenceTitle: 'Docs inventory',
    evidence: [
      'README, architecture docs, API documentation, and local development docs already exist in the repo.',
      'The frontend build and Go build are both validated from the monorepo.',
      'Bootstrap commands can be surfaced directly inside this landing page.',
    ],
    searchTerms: ['docs', 'api', 'reference', 'download', 'install'],
  },
  {
    id: 'community-discord',
    label: 'Community & Discord',
    icon: 'community',
    title: 'Community channels belong alongside docs because operators need both reference and discussion.',
    summary: 'Developer community, Discord access, and contribution paths should be visible as platform resources, not hidden in a footer or secondary marketing band.',
    bullets: [
      'Position community surfaces as extensions of the engineering workflow.',
      'Keep discoverability high for implementation questions, operations feedback, and contributor onboarding.',
      'Tie discussion channels back to documentation and repository access.',
    ],
    evidenceTitle: 'Community posture',
    evidence: [
      'Documentation, API guidance, GitHub access, and changelog context are treated as top-nav items.',
      'Discord and community space are included in the same structural frame as the platform sections.',
      'The landing page establishes documentation readiness before sign-in.',
    ],
    searchTerms: ['community', 'discord', 'support', 'contributors'],
  },
  {
    id: 'github-repository',
    label: 'GitHub Repository',
    icon: 'github',
    title: 'The repository is the download path, implementation base, and audit trail for the platform.',
    summary: 'The landing page should tell teams where to clone the code, how to boot the stack locally, and where to inspect delivery and architecture artifacts before extending the system.',
    bullets: [
      'Make the repository visible in the header and the sidebar narrative.',
      'Expose a download and local bootstrap path before teams start implementation work.',
      'Treat changelog and source access as engineering assets, not promotional afterthoughts.',
    ],
    evidenceTitle: 'Repository role',
    evidence: [
      'GitHub repository: github.com/AtonixCorp/gitorc.',
      'Local stack entrypoint: docker-compose.yml plus make up and make down.',
      'Monorepo contains Go services, React UI, infra assets, SDKs, and docs.',
    ],
    searchTerms: ['github', 'repository', 'clone', 'source'],
  },
];

const landingHeaderLinks: LandingHeaderLink[] = [
  { label: 'Docs', targetId: 'developer-documentation' },
  { label: 'API Reference', targetId: 'api-reference' },
  { label: 'Toolbox', targetId: 'developer-community' },
  { label: 'Changelog', targetId: 'changelog' },
];

const landingRuntimeSignals = [
  { label: 'Control plane', value: 'Git, review, CI, CD, analytics' },
  { label: 'Local bootstrap', value: 'make up' },
  { label: 'Operator access', value: 'Authenticated boundary' },
];

const landingWorkflowStages = [
  'Source control and review entry are governed from the same operating boundary.',
  'CI and CD lanes carry artifacts through explicit gates, not disconnected tools.',
  'Runtime services emit identity-aware operational evidence after release execution.',
];

const landingDocumentationCards = [
  {
    label: 'Architecture',
    value: 'Platform structure, service shape, and deployment model.',
  },
  {
    label: 'API reference',
    value: 'Gateway contracts and API documentation for integration work.',
  },
  {
    label: 'Local development',
    value: 'Bootstrap, build, and endpoint guidance for local operation.',
  },
];

const landingBootstrapCommands = [
  'git clone https://github.com/AtonixCorp/gitorc',
  'cd gitorc',
  'make up',
  'curl http://localhost:8080/healthz',
];

const landingCommunityCards = [
  {
    label: 'Developer community',
    value: 'Operational questions, implementation feedback, and contributor onboarding.',
  },
  {
    label: 'Discord',
    value: 'Live engineering discussion channel for platform adoption and runtime issues.',
  },
  {
    label: 'Changelog',
    value: 'Release notes, platform deltas, and rollout awareness for operators.',
  },
];

function isLandingSectionId(value: string): value is LandingSectionId {
  return landingSidebarSections.some((section) => section.id === value);
}

function LandingSystemMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <rect x="28" y="6" width="16" height="12" rx="2" />
      <rect x="16" y="30" width="16" height="12" rx="2" />
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
    case 'github':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3.6a8.6 8.6 0 0 0-2.7 16.8v-2.8c-3.1.7-3.8-1.3-3.8-1.3-.5-1.2-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1 1.6.7 2 1.4.3-.8.8-1.3 1.3-1.6-2.5-.3-5.1-1.2-5.1-5.5 0-1.2.4-2.2 1.1-3-.1-.3-.5-1.4.1-2.9 0 0 .9-.3 3 .9a10.2 10.2 0 0 1 5.5 0c2.1-1.2 3-.9 3-.9.6 1.5.2 2.6.1 2.9.7.8 1.1 1.8 1.1 3 0 4.3-2.6 5.2-5.1 5.5.4.4.8 1.1.8 2.2v3.3A8.6 8.6 0 0 0 12 3.6Z" fill="currentColor" />
        </svg>
      );
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

type PublicPage = 'home' | 'signin';

function readPublicPage(): PublicPage {
  if (typeof window === 'undefined') {
    return 'home';
  }

  const hash = window.location.hash.replace(/^#/, '');
  return hash.startsWith('/signin') ? 'signin' : 'home';
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
  const publicLandingMode = isStaticOverviewMode();
  const [route, setRoute] = useState<RouteState>(() => readRoute());
  const [publicPage, setPublicPage] = useState<PublicPage>(() => readPublicPage());
  const [overview, setOverview] = useState<Overview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focus, setFocus] = useState<FocusState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [eventKindFilter, setEventKindFilter] = useState<'all' | 'repository' | 'pipeline' | 'deployment' | 'process'>('all');
  const [eventRepositoryFilter, setEventRepositoryFilter] = useState<string>('all');
  const [activeGatewayBase, setActiveGatewayBase] = useState(getGatewayBase());
  const [landingTheme, setLandingTheme] = useState<'graphite' | 'paper'>('graphite');
  const [landingQuery, setLandingQuery] = useState('');
  const [activeLandingSection, setActiveLandingSection] = useState<LandingSectionId>('overview');

  useEffect(() => {
    const onHashChange = () => {
      setRoute(readRoute());
      setPublicPage(readPublicPage());
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    let active = true;
    let interval: number | undefined;

    if (publicLandingMode) {
      setIsLoading(false);
      setError(null);
      return () => {
        active = false;
      };
    }

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
    interval = window.setInterval(() => {
      void loadOverview();
    }, 8000);

    return () => {
      active = false;
      if (interval) {
        window.clearInterval(interval);
      }
    };
  }, [publicLandingMode]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!publicLandingMode || publicPage !== 'home') {
      return;
    }

    const sections = landingSidebarSections
      .map((section) => document.getElementById(section.id))
      .filter((section): section is HTMLElement => Boolean(section));

    if (!sections.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (visibleEntry?.target.id && isLandingSectionId(visibleEntry.target.id)) {
          setActiveLandingSection(visibleEntry.target.id);
        }
      },
      {
        rootMargin: '-18% 0px -58% 0px',
        threshold: [0.15, 0.35, 0.6],
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [publicLandingMode, publicPage]);

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

  const navigatePublic = (page: PublicPage) => {
    window.location.hash = page === 'signin' ? '#/signin' : '#/';
    setPublicPage(page);
  };

  const scrollToLandingTarget = (targetId: string) => {
    const target = document.getElementById(targetId);
    if (!target) {
      return;
    }

    if (isLandingSectionId(targetId)) {
      setActiveLandingSection(targetId);
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleLandingSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = landingQuery.trim().toLowerCase();
    if (!query) {
      scrollToLandingTarget('overview');
      return;
    }

    const match = landingSidebarSections.find((section) => {
      const haystack = [section.label, section.title, ...section.searchTerms].join(' ').toLowerCase();
      return haystack.includes(query);
    });

    if (!match) {
      setToast(`No landing section matched "${landingQuery}".`);
      return;
    }

    scrollToLandingTarget(match.id);
    setToast(`Jumped to ${match.label}.`);
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

  const renderLandingPage = () => {
    const overviewSection = landingSidebarSections[0];

    return (
      <div className={`landing-shell landing-theme-${landingTheme}`}>
        <header className="landing-header">
          <button className="landing-brand" onClick={() => scrollToLandingTarget('overview')} type="button">
            <span className="landing-brand-mark"><LandingSystemMark /></span>
            <span className="landing-brand-copy">
              <strong>GITORC</strong>
              <span>CI/CD Engine</span>
            </span>
          </button>

          <nav className="landing-header-nav" aria-label="Landing page navigation">
            {landingHeaderLinks.map((link) => {
              if (link.external && link.href) {
                return (
                  <a key={link.label} className="landing-nav-link" href={link.href} rel="noreferrer" target="_blank">
                    {link.label}
                  </a>
                );
              }

              return (
                <button
                  key={link.label}
                  className="landing-nav-link"
                  onClick={() => link.targetId && scrollToLandingTarget(link.targetId)}
                  type="button"
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          <div className="landing-header-controls">
            <form className="landing-search" onSubmit={handleLandingSearch}>
              <span className="landing-search-icon"><LandingIcon icon="search" /></span>
              <input
                aria-label="Search landing sections"
                onChange={(event) => setLandingQuery(event.target.value)}
                placeholder="Search platform sections"
                type="search"
                value={landingQuery}
              />
              <button className="landing-control-button" type="submit">Search</button>
            </form>

            <button
              aria-label="Toggle landing theme"
              className="landing-icon-button"
              onClick={() => setLandingTheme((current) => (current === 'graphite' ? 'paper' : 'graphite'))}
              type="button"
            >
              <LandingIcon icon="theme" />
            </button>

            <button aria-label="Profile controls" className="landing-icon-button" type="button">
              <LandingIcon icon="profile" />
            </button>
          </div>
        </header>

        <div className="landing-workbench">
          <aside className="landing-sidebar" aria-label="Platform structure">
            <div className="landing-sidebar-group">
              <p className="landing-sidebar-kicker">Platform structure</p>
              {landingSidebarSections.map((section) => (
                <button
                  key={section.id}
                  aria-pressed={activeLandingSection === section.id}
                  className={`landing-sidebar-link ${activeLandingSection === section.id ? 'landing-sidebar-link-active' : ''}`}
                  onClick={() => scrollToLandingTarget(section.id)}
                  type="button"
                >
                  <span className="landing-sidebar-icon"><LandingIcon icon={section.icon} /></span>
                  <span className="landing-sidebar-copy">
                    <strong>{section.label}</strong>
                    <span>{section.title}</span>
                  </span>
                </button>
              ))}
            </div>

            <article className="landing-sidebar-callout">
              <p className="landing-sidebar-kicker">Bootstrap locally</p>
              <strong>Clone and run before implementation</strong>
              <code>make up</code>
              <span>UI 5050 · Gateway 8080 · Health checks on /healthz</span>
            </article>
          </aside>

          <div className="landing-main">
            <section id="overview" className="landing-section landing-section-overview">
              <div className="landing-section-intro">
                <div>
                  <p className="eyebrow">engineering platform interface</p>
                  <h1>{overviewSection.title}</h1>
                  <p className="lede">{overviewSection.summary}</p>
                </div>
                <span className="landing-section-chip">Private infrastructure ready</span>
              </div>

              <div className="landing-overview-grid">
                <article className="landing-panel">
                  <p className="section-kicker">Platform identity</p>
                  <h2>The front door of a serious delivery system</h2>
                  <p>
                    gitorc should read as a self-automated CI/CD platform from the first second: developer-first structure,
                    operational maturity, enterprise trust, and a clear path from repository events to governed delivery.
                  </p>
                  <div className="hero-actions">
                    <button className="button button-primary" onClick={() => navigatePublic('signin')} type="button">Open control plane</button>
                    <a className="button button-ghost" href="https://github.com/AtonixCorp/gitorc" rel="noreferrer" target="_blank">Download stack</a>
                    <button className="button button-ghost" onClick={() => scrollToLandingTarget('developer-documentation')} type="button">Read docs</button>
                  </div>
                  <ul className="landing-bullet-list">
                    {overviewSection.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </article>

                <article className="landing-panel landing-panel-strong">
                  <p className="section-kicker">Operational frame</p>
                  <div className="landing-signal-list">
                    {landingRuntimeSignals.map((signal) => (
                      <div key={signal.label} className="landing-signal-row">
                        <span>{signal.label}</span>
                        <strong>{signal.value}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="landing-evidence-card">
                    <p className="section-kicker">Platform signal</p>
                    <ul className="landing-bullet-list landing-bullet-list-compact">
                      {overviewSection.evidence.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              </div>
            </section>

            <section id="how-it-works" className="landing-section">
              <div className="landing-section-head">
                <div>
                  <p className="section-kicker">How it works</p>
                  <h2>One operational path from source to runtime evidence</h2>
                </div>
              </div>
              <div className="landing-flow-grid">
                {landingWorkflowStages.map((stage, index) => (
                  <article key={stage} className="landing-flow-card">
                    <span className="step-index">{index + 1}</span>
                    <p>{stage}</p>
                  </article>
                ))}
              </div>
            </section>

            {landingSidebarSections.slice(2).map((section) => (
              <section key={section.id} id={section.id} className="landing-section">
                <div className="landing-section-head">
                  <div className="landing-section-title-row">
                    <span className="landing-section-icon"><LandingIcon icon={section.icon} /></span>
                    <div>
                      <p className="section-kicker">{section.label}</p>
                      <h2>{section.title}</h2>
                    </div>
                  </div>
                </div>

                <div className="landing-section-layout">
                  <article className="landing-panel">
                    <p>{section.summary}</p>
                    <ul className="landing-bullet-list">
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </article>

                  <article className="landing-evidence-card">
                    <p className="section-kicker">{section.evidenceTitle}</p>
                    <ul className="landing-bullet-list landing-bullet-list-compact">
                      {section.evidence.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                </div>

                {section.id === 'developer-documentation' ? (
                  <div className="landing-subgrid">
                    <div id="api-reference" className="landing-card-grid">
                      {landingDocumentationCards.map((card) => (
                        <article key={card.label} className="landing-mini-card">
                          <p className="section-kicker">Documentation</p>
                          <strong>{card.label}</strong>
                          <span>{card.value}</span>
                        </article>
                      ))}
                    </div>
                    <article className="landing-command-panel">
                      <p className="section-kicker">Bootstrap before implementation</p>
                      <h3>Download the stack and stand it up locally</h3>
                      <div className="command-list">
                        {landingBootstrapCommands.map((command) => (
                          <code key={command}>{command}</code>
                        ))}
                      </div>
                    </article>
                  </div>
                ) : null}

                {section.id === 'community-discord' ? (
                  <div id="developer-community" className="landing-card-grid">
                    {landingCommunityCards.map((card) => (
                      <article key={card.label} className="landing-mini-card" id={card.label === 'Discord' ? 'discord-community' : undefined}>
                        <p className="section-kicker">Community</p>
                        <strong>{card.label}</strong>
                        <span>{card.value}</span>
                      </article>
                    ))}
                  </div>
                ) : null}

                {section.id === 'github-repository' ? (
                  <div className="landing-subgrid">
                    <article className="landing-command-panel">
                      <p className="section-kicker">Repository access</p>
                      <h3>Clone the platform and inspect the monorepo locally</h3>
                      <div className="landing-link-row">
                        <a className="button button-primary" href="https://github.com/AtonixCorp/gitorc" rel="noreferrer" target="_blank">Open GitHub repository</a>
                        <button className="button button-ghost" onClick={() => scrollToLandingTarget('changelog')} type="button">View changelog</button>
                      </div>
                    </article>
                    <article id="changelog" className="landing-mini-card landing-mini-card-strong">
                      <p className="section-kicker">Changelog</p>
                      <strong>Track platform movement as an operator artifact</strong>
                      <span>Use changelog visibility to follow release deltas, runtime topology changes, and documentation updates before rollout decisions.</span>
                    </article>
                  </div>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSignInPage = () => {
    return (
      <section className="signin-shell">
        <article className="panel signin-panel">
          <p className="eyebrow">control plane access</p>
          <h1 className="signin-title">Access the operator workspace through your authenticated deployment boundary.</h1>
          <p className="lede">
            The public site is intentionally informational. Repository actions, review policy, CI orchestration, release operations,
            and runtime oversight belong in the authenticated gitorc control plane provisioned inside your environment.
          </p>
          <div className="hero-actions">
            <button className="button button-primary" type="button">Private access required</button>
            <button className="button button-ghost" onClick={() => navigatePublic('home')} type="button">Back to landing page</button>
          </div>
        </article>

        <section className="signin-grid">
          <article className="panel stack-panel">
            <div className="section-heading compact-heading">
              <div>
                <p className="section-kicker">Expected operator flow</p>
                <h2>What opens after sign-in</h2>
              </div>
            </div>
            <div className="trace-grid">
              <article className="trace-card">
                <h3>Projects and repositories</h3>
                <p>Create projects, inspect connected providers, and start clone or review actions.</p>
              </article>
              <article className="trace-card">
                <h3>Pipelines and deployments</h3>
                <p>Run CI, inspect stage health, promote artifacts, and manage rollbacks.</p>
              </article>
              <article className="trace-card">
                <h3>Runtime and trust</h3>
                <p>Trace live processes, security posture, attestations, and signed operational events.</p>
              </article>
            </div>
          </article>

          <article className="panel stack-panel">
            <div className="section-heading compact-heading">
              <div>
                <p className="section-kicker">Local bootstrap</p>
                <h2>Before opening the workspace</h2>
              </div>
            </div>
            <div className="landing-steps signin-steps">
              <article className="trace-card">
                <span className="step-index">1</span>
                <h3>Provision access</h3>
                <p>Expose the operator surface only inside the approved deployment boundary for your team.</p>
              </article>
              <article className="trace-card">
                <span className="step-index">2</span>
                <h3>Enforce policy</h3>
                <p>Connect repository, review, CI/CD, and operational controls to the organization’s security model.</p>
              </article>
              <article className="trace-card">
                <span className="step-index">3</span>
                <h3>Operate with confidence</h3>
                <p>Use the authenticated workspace for governed delivery workflows and runtime decision making.</p>
              </article>
            </div>
          </article>
        </section>
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

      {!isLoading && !error && publicLandingMode && publicPage === 'home' ? renderLandingPage() : null}
      {!isLoading && !error && publicLandingMode && publicPage === 'signin' ? renderSignInPage() : null}
      {!isLoading && !error && !publicLandingMode ? renderScreen() : null}
    </main>
  );
}
