create table if not exists user_preferences (
    username varchar(80) primary key,
    theme varchar(32) not null default 'system',
    notification_channels jsonb not null default '["email"]'::jsonb,
    timezone varchar(64) not null default 'UTC',
    bio text not null default '',
    avatar_url text not null default '',
    updated_at timestamptz not null default now()
);

create table if not exists ssh_keys (
    id uuid primary key,
    username varchar(80) not null,
    title varchar(255) not null,
    fingerprint varchar(255) not null unique,
    public_key text not null,
    created_at timestamptz not null default now()
);

create index if not exists ssh_keys_username_idx
    on ssh_keys (username);

create table if not exists billing_plans (
    id varchar(64) primary key,
    name varchar(255) not null,
    price_monthly bigint not null,
    quotas jsonb not null default '{}'::jsonb,
    active boolean not null default true,
    created_at timestamptz not null default now()
);

create table if not exists billing_usage (
    username varchar(80) primary key,
    active_plan varchar(64) not null references billing_plans(id),
    build_minutes integer not null default 0,
    storage_gb integer not null default 0,
    managed_devices integer not null default 0,
    webhook_deliveries integer not null default 0,
    updated_at timestamptz not null default now()
);

create table if not exists wiki_pages (
    id uuid primary key,
    project_slug varchar(120) not null,
    slug varchar(120) not null,
    title varchar(255) not null,
    markdown text not null default '',
    updated_at timestamptz not null default now(),
    unique(project_slug, slug)
);

create table if not exists outbound_webhooks (
    id uuid primary key,
    event varchar(120) not null,
    target_url text not null,
    payload jsonb not null default '{}'::jsonb,
    status varchar(32) not null default 'queued',
    created_at timestamptz not null default now(),
    delivered_at timestamptz
);