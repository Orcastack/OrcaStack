module Gitorc
  module RubyApp
    module Api
      module V1
        class BaseController
          private

          def parse_json(request)
            body = request.body.to_s
            return {} if body.empty?

            JSON.parse(body)
          rescue JSON::ParserError
            {}
          end

          def json(status, payload)
            [status, payload]
          end
        end
      end
    end
  end
end
