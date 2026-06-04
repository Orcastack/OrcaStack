module Gitorc
  module RubyApp
    module Api
      module V1
        class BillingController < BaseController
          def plans(_request)
            json(200, { plans: Store.billing_plans })
          end

          def usage(_request)
            json(200, Store.billing_usage)
          end
        end
      end
    end
  end
end
