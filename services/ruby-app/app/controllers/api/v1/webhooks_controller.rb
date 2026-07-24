module OrcaStack
  module RubyApp
    module Api
      module V1
        class WebhooksController < BaseController
          def create(request)
            json(202, Store.queue_webhook(parse_json(request)))
          end
        end
      end
    end
  end
end
