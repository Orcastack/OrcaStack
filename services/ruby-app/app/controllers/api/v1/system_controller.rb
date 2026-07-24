module OrcaStack
  module RubyApp
    module Api
      module V1
        class SystemController < BaseController
          def health(_request)
            Database.connection
            Cache.connection.ping
            json(200, { status: 'ok', service: 'ruby-app', framework: 'ruby-api', persistence: 'postgres+redis' })
          end

          def ready(_request)
            json(200, { status: 'ready', service: 'ruby-app' })
          end

          def metrics(_request)
            metrics = Store.metrics_snapshot
            uptime = Time.now.utc.to_i - metrics[:started_at].to_i
            payload = <<~METRICS
              # HELP orcastack_ruby_app_info Static information about the Ruby application layer.
              # TYPE orcastack_ruby_app_info gauge
              orcastack_ruby_app_info{service="ruby-app",runtime="ruby"} 1
              # HELP orcastack_ruby_app_requests_total Total handled HTTP requests.
              # TYPE orcastack_ruby_app_requests_total counter
              orcastack_ruby_app_requests_total #{metrics[:request_count]}
              # HELP orcastack_ruby_app_uptime_seconds Uptime of the Ruby application process.
              # TYPE orcastack_ruby_app_uptime_seconds gauge
              orcastack_ruby_app_uptime_seconds #{uptime}
            METRICS
            [200, payload, { 'Content-Type' => 'text/plain; version=0.0.4' }]
          end
        end
      end
    end
  end
end
