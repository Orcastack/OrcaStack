create table if not exists users (
    id uuid primary key,
    username varchar(80) not null unique,
    email varchar(255) not null unique,
    display_name varchar(255) not null,
    created_at timestamptz not null default now()
);

create table if not exists projects (
    id uuid primary key,
    slug varchar(120) not null unique,
    name varchar(255) not null,
    description text not null default '',
    visibility varchar(32) not null default 'private',
    created_at timestamptz not null default now()
);

create table if not exists repositories (
    id uuid primary key,
    project_id uuid not null references projects(id) on delete cascade,
    name varchar(255) not null,
    default_branch varchar(255) not null default 'main',
    storage_path text not null,
    created_at timestamptz not null default now(),
    unique(project_id, name)
);

create table if not exists changes (
    id uuid primary key,
    repository_id uuid not null references repositories(id) on delete cascade,
    change_number bigint generated always as identity,
    source_branch varchar(255) not null,
    target_branch varchar(255) not null,
    head_commit_sha varchar(64) not null,
    status varchar(32) not null default 'open',
    created_by uuid references users(id),
    created_at timestamptz not null default now()
);

create table if not exists patchsets (
    id uuid primary key,
    change_id uuid not null references changes(id) on delete cascade,
    patchset_number integer not null,
    commit_sha varchar(64) not null,
    created_at timestamptz not null default now(),
    unique(change_id, patchset_number)
);

create table if not exists pipeline_runs (
    id uuid primary key,
    repository_id uuid not null references repositories(id) on delete cascade,
    commit_sha varchar(64) not null,
    trigger_source varchar(64) not null,
    status varchar(32) not null default 'pending',
    started_at timestamptz,
    finished_at timestamptz
);

create table if not exists deployments (
    id uuid primary key,
    pipeline_run_id uuid not null references pipeline_runs(id) on delete cascade,
    environment varchar(80) not null,
    target_kind varchar(80) not null,
    status varchar(32) not null default 'pending',
    created_at timestamptz not null default now()
);

create table if not exists approval_rules (
    id uuid primary key,
    project_id uuid not null references projects(id) on delete cascade,
    name varchar(255) not null,
    required_approvals integer not null default 1,
    required_group varchar(255),
    required_checks jsonb not null default '[]'::jsonb,
    enabled boolean not null default true
);
