require 'base64'
require 'json'
require 'openssl'
require 'securerandom'
require 'thread'
require 'time'

module OrcaStack
  module RubyApp
    module Database
      module_function

      def connection
        @mutex ||= Mutex.new
        @mutex.synchronize do
          return @connection if defined?(@connection) && @connection

          require 'pg'
          @connection = PG.connect(database_url)
        end
      end

      def database_url
        ENV.fetch('DATABASE_URL') do
          host = ENV.fetch('ORCASTACK_POSTGRES_HOST', 'postgres')
          port = ENV.fetch('ORCASTACK_POSTGRES_PORT', '5432')
          user = ENV.fetch('ORCASTACK_POSTGRES_USER', ENV.fetch('POSTGRES_USER', 'orcastack'))
          password = ENV.fetch('ORCASTACK_POSTGRES_PASSWORD', ENV.fetch('POSTGRES_PASSWORD', 'orcastack'))
          database = ENV.fetch('ORCASTACK_POSTGRES_DB', ENV.fetch('POSTGRES_DB', 'orcastack'))
          "postgres://#{user}:#{password}@#{host}:#{port}/#{database}"
        end
      end

      def query(sql, params = [])
        connection.exec_params(sql, params)
      end

      def first(sql, params = [])
        result = query(sql, params)
        result.ntuples.zero? ? nil : result[0]
      end
    end

    module Cache
      module_function

      def connection
        @mutex ||= Mutex.new
        @mutex.synchronize do
          return @connection if defined?(@connection) && @connection

          require 'redis'
          @connection = Redis.new(url: ENV.fetch('REDIS_URL', 'redis://127.0.0.1:6379/0'))
        end
      end
    end

    module GitTokens
      module_function

      def secret
        ENV.fetch('ORCASTACK_GIT_TOKEN_SECRET', 'orcastack-dev-secret')
      end

      def issue(payload)
        body = Base64.urlsafe_encode64(JSON.generate(payload), padding: false)
        signature = OpenSSL::HMAC.hexdigest('SHA256', secret, body)
        "#{body}.#{signature}"
      end
    end

    module Store
      module_function

      STARTED_AT = Time.now.utc
      REQUEST_COUNTER_KEY = 'orcastack:ruby-app:requests_total'
      SESSION_PREFIX = 'orcastack:ruby-app:sessions:'

      def bootstrap!
        ensure_schema!
        seed_defaults!
      end

      def increment_requests!
        Cache.connection.incr(REQUEST_COUNTER_KEY)
      rescue StandardError
        @request_count = (@request_count || 0) + 1
      end

      def request_count
        Integer(Cache.connection.get(REQUEST_COUNTER_KEY) || 0)
      rescue StandardError
        @request_count || 0
      end

      def started_at
        STARTED_AT
      end

      def authenticate_local_user(username)
        row = Database.first(<<~SQL, [username])
          select username, email, display_name, role, identity, status
          from local_auth_accounts
          where lower(username) = lower($1) or lower(email) = lower($1)
          limit 1
        SQL
        return nil unless row
        return nil unless row['status'] == 'approved'

        build_user(row)
      end

      def create_session(user)
        token = SecureRandom.hex(24)
        expires_at = Time.now.utc + 43_200
        Cache.connection.setex("#{SESSION_PREFIX}#{token}", 43_200, JSON.generate(user: user, expires_at: expires_at.iso8601))
        { token: token, expires_at: expires_at.iso8601, user: user }
      end

      def profile(username = nil)
        row = if username
          Database.first(<<~SQL, [username])
            select username, email, display_name, role, identity, status
            from local_auth_accounts
            where lower(username) = lower($1) or lower(email) = lower($1)
            limit 1
          SQL
        else
          Database.first(<<~SQL)
            select username, email, display_name, role, identity, status
            from local_auth_accounts
            where status = 'approved'
            order by created_at asc
            limit 1
          SQL
        end

        row ? build_user(row) : fallback_user
      end

      def update_preferences(attributes)
        user = profile
        channels = Array(attributes['notifications'] || attributes[:notifications] || ['email'])
        Database.query(<<~SQL, [user[:username], attributes['theme'] || attributes[:theme] || 'system', JSON.generate(channels), attributes['timezone'] || attributes[:timezone] || 'UTC', attributes['bio'] || attributes[:bio] || '', attributes['avatar'] || attributes[:avatar] || ''])
          insert into user_preferences (username, theme, notification_channels, timezone, bio, avatar_url, updated_at)
          values ($1, $2, $3::jsonb, $4, $5, $6, now())
          on conflict (username) do update set
            theme = excluded.theme,
            notification_channels = excluded.notification_channels,
            timezone = excluded.timezone,
            bio = excluded.bio,
            avatar_url = excluded.avatar_url,
            updated_at = now()
        SQL
        profile(user[:username])
      end

      def list_projects
        Database.query(<<~SQL).map do |row|
          select p.id, p.slug, p.name, p.visibility, r.default_branch, r.storage_path
          from projects p
          left join repositories r on r.project_id = p.id
          order by p.created_at asc
        SQL
          {
            id: row['id'],
            name: row['name'],
            slug: row['slug'],
            visibility: row['visibility'],
            default_branch: row['default_branch'] || 'main',
            repo_path: row['storage_path'] || "/srv/git/#{row['slug']}.git"
          }
        end
      end

      def create_project(attributes)
        id = SecureRandom.uuid
        slug = slugify(attributes['name'] || attributes[:name] || "project-#{id[0, 8]}")
        name = attributes['name'] || attributes[:name] || slug
        visibility = attributes['visibility'] || attributes[:visibility] || 'private'
        default_branch = attributes['default_branch'] || attributes[:default_branch] || 'main'
        repo_path = "/srv/git/#{slug}.git"
        Database.query('insert into projects (id, slug, name, visibility) values ($1, $2, $3, $4)', [id, slug, name, visibility])
        Database.query('insert into repositories (id, project_id, name, default_branch, storage_path) values ($1, $2, $3, $4, $5)', [SecureRandom.uuid, id, name, default_branch, repo_path])
        { id: id, name: name, slug: slug, visibility: visibility, default_branch: default_branch, repo_path: repo_path }
      end

      def billing_plans
        Database.query('select id, name, price_monthly, quotas from billing_plans where active = true order by price_monthly asc').map do |row|
          { id: row['id'], name: row['name'], price_monthly: row['price_monthly'].to_i, quotas: JSON.parse(row['quotas']) }
        end
      end

      def billing_usage(username = nil)
        user = profile(username)
        row = Database.first('select active_plan, build_minutes, storage_gb, managed_devices, webhook_deliveries from billing_usage where username = $1', [user[:username]])
        if row
          {
            active_plan: row['active_plan'],
            metrics: {
              build_minutes: row['build_minutes'].to_i,
              storage_gb: row['storage_gb'].to_i,
              managed_devices: row['managed_devices'].to_i,
              webhook_deliveries: row['webhook_deliveries'].to_i
            }
          }
        else
          { active_plan: 'plan-team', metrics: { build_minutes: 0, storage_gb: 0, managed_devices: 0, webhook_deliveries: 0 } }
        end
      end

      def list_wiki_pages(project_slug = nil)
        sql = 'select id, project_slug, slug, title, markdown, updated_at from wiki_pages'
        params = []
        if project_slug && !project_slug.empty?
          sql += ' where project_slug = $1'
          params << project_slug
        end
        sql += ' order by updated_at desc'
        Database.query(sql, params).map do |row|
          {
            id: row['id'],
            project_id: row['project_slug'],
            slug: row['slug'],
            title: row['title'],
            markdown: row['markdown'],
            updated_at: Time.parse(row['updated_at']).utc.iso8601
          }
        end
      end

      def create_wiki_page(attributes)
        id = SecureRandom.uuid
        project_slug = attributes['project_id'] || attributes[:project_id] || 'orcastack-platform'
        title = attributes['title'] || attributes[:title] || 'Untitled'
        slug = attributes['slug'] || attributes[:slug] || slugify(title)
        markdown = attributes['markdown'] || attributes[:markdown] || ''
        Database.query(<<~SQL, [id, project_slug, slug, title, markdown])
          insert into wiki_pages (id, project_slug, slug, title, markdown, updated_at)
          values ($1, $2, $3, $4, $5, now())
          on conflict (project_slug, slug) do update set
            title = excluded.title,
            markdown = excluded.markdown,
            updated_at = now()
        SQL
        list_wiki_pages(project_slug).find { |page| page[:id] == id } || list_wiki_pages(project_slug).find { |page| page[:slug] == slug }
      end

      def queue_webhook(attributes)
        webhook = {
          id: SecureRandom.uuid,
          event: attributes['event'] || attributes[:event] || 'unknown',
          target_url: attributes['target_url'] || attributes[:target_url],
          payload: attributes['payload'] || attributes[:payload] || {},
          status: 'queued',
          created_at: Time.now.utc.iso8601
        }
        Database.query('insert into outbound_webhooks (id, event, target_url, payload, status) values ($1, $2, $3, $4::jsonb, $5)', [webhook[:id], webhook[:event], webhook[:target_url], JSON.generate(webhook[:payload]), webhook[:status]])
        enqueue_webhook_delivery(webhook[:id])
        webhook
      end

      def mark_webhook_delivered(id)
        Database.query('update outbound_webhooks set status = $2, delivered_at = now() where id = $1', [id, 'delivered'])
      end

      def admin_summary
        users = Database.first('select count(*) as count from local_auth_accounts')
        projects = Database.first('select count(*) as count from projects')
        pending = Database.first("select count(*) as count from outbound_webhooks where status = 'queued'")
        {
          users: users['count'].to_i,
          projects: projects['count'].to_i,
          pending_notifications: pending['count'].to_i,
          feature_flags: {
            billing: true,
            wiki: true,
            device_registry: true,
            sso: false
          }
        }
      end

      def issue_git_access_token(username:, repo:, action:, source:, key_fingerprint: nil, command: nil)
        payload = {
          iss: 'orcastack-ruby-app',
          sub: username,
          repo: repo,
          action: action,
          source: source,
          key_fingerprint: key_fingerprint,
          command: command,
          exp: (Time.now.utc + 300).to_i
        }
        GitTokens.issue(payload)
      end

      def authorize_ssh(username:, key_fingerprint:, command:)
        normalized = parse_git_command(command)
        raise 'unsupported SSH command' unless normalized

        key = Database.first('select username, fingerprint from ssh_keys where fingerprint = $1', [key_fingerprint])
        raise 'SSH key not recognized' unless key

        actor = username.to_s.strip.empty? ? key['username'] : username
        raise 'SSH key does not match requested user' unless actor.casecmp?(key['username'])

        project_slug = repo_slug_from_command(normalized[:repo])
        repo = Database.first(<<~SQL, [project_slug])
          select p.slug, r.storage_path
          from projects p
          join repositories r on r.project_id = p.id
          where p.slug = $1
          limit 1
        SQL
        raise 'repository not found' unless repo

        signed = issue_git_access_token(
          username: actor,
          repo: repo['slug'],
          action: normalized[:action],
          source: 'ssh',
          key_fingerprint: key_fingerprint,
          command: normalized[:command]
        )

        {
          allowed: true,
          username: actor,
          repo: repo['slug'],
          action: normalized[:action],
          command: normalized[:command],
          repo_path: repo['storage_path'],
          token: signed
        }
      end

      def parse_git_command(command)
        return nil if command.to_s.strip.empty?

        allowed = {
          'git-upload-pack' => 'read',
          'git-upload-archive' => 'archive',
          'git-receive-pack' => 'write'
        }
        match = command.strip.match(/\A(git-upload-pack|git-upload-archive|git-receive-pack)\s+'?([^'\s]+)'?\z/)
        return nil unless match

        verb = match[1]
        repo = match[2].sub(%r{\A/+}, '')
        {
          action: allowed.fetch(verb),
          repo: repo,
          command: "#{verb} '#{repo}'"
        }
      end

      def repo_slug_from_command(repo)
        repo.to_s.sub(%r{\.git\z}, '').tr('/', '-')
      end

      def metrics_snapshot
        {
          started_at: started_at,
          request_count: request_count
        }
      end

      def fallback_user
        {
          id: 'local-admin',
          username: 'admin',
          email: 'admin@orcastack.local',
          full_name: 'Local Administrator',
          role: 'platform-admin',
          identity: 'local:user:admin',
          rbac_realm: 'orcastack-platform',
          preferences: {
            theme: 'system',
            notifications: ['email'],
            timezone: 'UTC',
            bio: '',
            avatar: ''
          },
          ssh_keys: [],
          permissions: ['repositories:read', 'pipelines:write', 'deployments:write', 'control-panel:admin', 'community:read']
        }
      end

      def build_user(row)
        preferences = Database.first('select theme, notification_channels, timezone, bio, avatar_url from user_preferences where username = $1', [row['username']])
        ssh_keys = Database.query('select id, title, fingerprint from ssh_keys where username = $1 order by created_at asc', [row['username']]).map do |key|
          { id: key['id'], title: key['title'], fingerprint: key['fingerprint'] }
        end

        {
          id: row['username'],
          username: row['username'],
          email: row['email'],
          full_name: row['display_name'],
          role: row['role'],
          identity: row['identity'],
          rbac_realm: ENV.fetch('ORCASTACK_RBAC_REALM', 'orcastack-platform'),
          preferences: {
            theme: preferences ? preferences['theme'] : 'system',
            notifications: preferences ? JSON.parse(preferences['notification_channels']) : ['email'],
            timezone: preferences ? preferences['timezone'] : 'UTC',
            bio: preferences ? preferences['bio'] : '',
            avatar: preferences ? preferences['avatar_url'] : ''
          },
          ssh_keys: ssh_keys,
          permissions: row['role'] == 'platform-admin' ? ['repositories:read', 'pipelines:write', 'deployments:write', 'control-panel:admin', 'community:read'] : ['repositories:read', 'pipelines:write', 'deployments:write', 'control-panel:read', 'community:read']
        }
      end

      def ensure_schema!
        statements = [
          <<~SQL,
            create table if not exists user_preferences (
              username varchar(80) primary key,
              theme varchar(32) not null default 'system',
              notification_channels jsonb not null default '["email"]'::jsonb,
              timezone varchar(64) not null default 'UTC',
              bio text not null default '',
              avatar_url text not null default '',
              updated_at timestamptz not null default now()
            )
          SQL
          <<~SQL,
            create table if not exists ssh_keys (
              id uuid primary key,
              username varchar(80) not null,
              title varchar(255) not null,
              fingerprint varchar(255) not null unique,
              public_key text not null,
              created_at timestamptz not null default now()
            )
          SQL
          <<~SQL,
            create table if not exists billing_plans (
              id varchar(64) primary key,
              name varchar(255) not null,
              price_monthly bigint not null,
              quotas jsonb not null default '{}'::jsonb,
              active boolean not null default true,
              created_at timestamptz not null default now()
            )
          SQL
          <<~SQL,
            create table if not exists billing_usage (
              username varchar(80) primary key,
              active_plan varchar(64) not null references billing_plans(id),
              build_minutes integer not null default 0,
              storage_gb integer not null default 0,
              managed_devices integer not null default 0,
              webhook_deliveries integer not null default 0,
              updated_at timestamptz not null default now()
            )
          SQL
          <<~SQL,
            create table if not exists wiki_pages (
              id uuid primary key,
              project_slug varchar(120) not null,
              slug varchar(120) not null,
              title varchar(255) not null,
              markdown text not null default '',
              updated_at timestamptz not null default now(),
              unique(project_slug, slug)
            )
          SQL
          <<~SQL
            create table if not exists outbound_webhooks (
              id uuid primary key,
              event varchar(120) not null,
              target_url text not null,
              payload jsonb not null default '{}'::jsonb,
              status varchar(32) not null default 'queued',
              created_at timestamptz not null default now(),
              delivered_at timestamptz
            )
          SQL
        ]
        statements.each { |statement| Database.query(statement) }
      end

      def seed_defaults!
        seed_projects!
        seed_preferences!
        seed_billing!
        seed_wiki!
        seed_ssh_key!
      end

      def seed_projects!
        return if Database.first('select id from projects limit 1')

        project_id = SecureRandom.uuid
        Database.query('insert into projects (id, slug, name, description, visibility) values ($1, $2, $3, $4, $5)', [project_id, 'orcastack-platform', 'orcastack/platform', 'ORCASTACK control-plane project', 'private'])
        Database.query('insert into repositories (id, project_id, name, default_branch, storage_path) values ($1, $2, $3, $4, $5)', [SecureRandom.uuid, project_id, 'orcastack/platform', 'main', '/srv/git/orcastack-platform.git'])
      rescue StandardError
        nil
      end

      def seed_preferences!
        row = Database.first("select username from local_auth_accounts where status = 'approved' order by created_at asc limit 1")
        username = row ? row['username'] : 'admin'
        Database.query(<<~SQL, [username])
          insert into user_preferences (username, theme, notification_channels, timezone, bio, avatar_url)
          values ($1, 'system', '["email","slack"]'::jsonb, 'UTC', 'Platform operator responsible for repositories, automation, and private-cloud governance.', '')
          on conflict (username) do nothing
        SQL
      end

      def seed_billing!
        [
          ['plan-free', 'Developer', 0, { projects: 5, pipelines: 250, devices: 2 }],
          ['plan-team', 'Team', 24_900, { projects: 100, pipelines: 10_000, devices: 25 }],
          ['plan-enterprise', 'Enterprise', 199_000, { projects: -1, pipelines: -1, devices: -1 }]
        ].each do |id, name, price, quotas|
          Database.query('insert into billing_plans (id, name, price_monthly, quotas, active) values ($1, $2, $3, $4::jsonb, true) on conflict (id) do nothing', [id, name, price, JSON.generate(quotas)])
        end
        username = profile[:username]
        Database.query(<<~SQL, [username])
          insert into billing_usage (username, active_plan, build_minutes, storage_gb, managed_devices, webhook_deliveries)
          values ($1, 'plan-team', 824, 118, 14, 2910)
          on conflict (username) do nothing
        SQL
      end

      def seed_wiki!
        return if Database.first("select id from wiki_pages where project_slug = 'orcastack-platform' and slug = 'home' limit 1")

        Database.query(
          'insert into wiki_pages (id, project_slug, slug, title, markdown, updated_at) values ($1, $2, $3, $4, $5, now())',
          [SecureRandom.uuid, 'orcastack-platform', 'home', 'Home', "# ORCASTACK\n\nPlatform operations wiki home."]
        )
      end

      def seed_ssh_key!
        username = profile[:username]
        Database.query(<<~SQL, [SecureRandom.uuid, username])
          insert into ssh_keys (id, username, title, fingerprint, public_key)
          values ($1, $2, 'admin-laptop', 'SHA256:qY1YVv8WQn9tT1jM2Y+M4i2oK7ZtX1F4M7f2nK9m4nQ', 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOrcaStackExampleAdminKey admin@orcastack.local')
          on conflict (fingerprint) do nothing
        SQL
      end

      def enqueue_webhook_delivery(webhook_id)
        if defined?(Jobs::WebhookDeliveryJob) && Jobs::WebhookDeliveryJob.respond_to?(:enqueue)
          Jobs::WebhookDeliveryJob.enqueue(webhook_id)
        else
          Cache.connection.lpush('orcastack:ruby-app:webhook-fallback', webhook_id)
        end
      rescue StandardError
        nil
      end

      def slugify(value)
        value.to_s.downcase.gsub(/[^a-z0-9]+/, '-').gsub(/^-|-$/, '')
      end
    end
  end
end
