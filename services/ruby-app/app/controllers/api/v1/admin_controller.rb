module OrcaStack
  module RubyApp
    module Api
      module V1
        class AdminController < BaseController
          def summary(_request)
            json(200, Store.admin_summary)
          end
        end
      end
    end
  end
end
