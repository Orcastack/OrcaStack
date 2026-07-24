module OrcaStack
  module RubyApp
    module Api
      module V1
        class GitController < BaseController
          def access_token(request)
            params = parse_json(request)
            username = params['username'] || Store.profile[:username]
            repo = params['repo'] || 'orcastack-platform'
            action = params['action'] || 'read'
            token = Store.issue_git_access_token(username: username, repo: repo, action: action, source: 'api', command: params['command'])

            json(200, { token: token, repo: repo, action: action, expires_in: 300 })
          end

          def ssh_authorize(request)
            params = parse_json(request)
            json(200, Store.authorize_ssh(username: params['username'], key_fingerprint: params['key_fingerprint'], command: params['command']))
          rescue StandardError => e
            json(403, { allowed: false, error: e.message })
          end
        end
      end
    end
  end
end