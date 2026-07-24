module OrcaStack
  module RubyApp
    class Routes
      def initialize(controllers)
        @controllers = controllers
      end

      def resolve(method, path)
        case [method, path]
        when ['GET', '/healthz']
          ->(request) { @controllers[:system].health(request) }
        when ['GET', '/readyz']
          ->(request) { @controllers[:system].ready(request) }
        when ['GET', '/metrics']
          ->(request) { @controllers[:system].metrics(request) }
        when ['POST', '/api/v1/auth/login']
          ->(request) { @controllers[:auth].login(request) }
        when ['POST', '/api/v1/auth/signup']
          ->(request) { @controllers[:auth].signup(request) }
        when ['GET', '/api/v1/users/profile']
          ->(request) { @controllers[:users].profile(request) }
        when ['PATCH', '/api/v1/users/preferences']
          ->(request) { @controllers[:users].preferences(request) }
        when ['GET', '/api/v1/projects']
          ->(request) { @controllers[:projects].index(request) }
        when ['POST', '/api/v1/projects']
          ->(request) { @controllers[:projects].create(request) }
        when ['GET', '/api/v1/billing/plans']
          ->(request) { @controllers[:billing].plans(request) }
        when ['GET', '/api/v1/billing/usage']
          ->(request) { @controllers[:billing].usage(request) }
        when ['GET', '/api/v1/wiki/pages']
          ->(request) { @controllers[:wiki].index(request) }
        when ['POST', '/api/v1/wiki/pages']
          ->(request) { @controllers[:wiki].create(request) }
        when ['GET', '/api/v1/admin/summary']
          ->(request) { @controllers[:admin].summary(request) }
        when ['POST', '/api/v1/webhooks']
          ->(request) { @controllers[:webhooks].create(request) }
        when ['POST', '/api/v1/git/access-token']
          ->(request) { @controllers[:git].access_token(request) }
        when ['POST', '/api/v1/ssh/authorize']
          ->(request) { @controllers[:git].ssh_authorize(request) }
        else
          nil
        end
      end
    end
  end
end
