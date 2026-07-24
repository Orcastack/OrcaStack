module OrcaStack
  module RubyApp
    module Api
      module V1
        class UsersController < BaseController
          def profile(_request)
            json(200, Store.profile)
          end

          def preferences(request)
            json(200, Store.update_preferences(parse_json(request)))
          end
        end
      end
    end
  end
end
