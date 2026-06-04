module Gitorc
  module RubyApp
    module Api
      module V1
        class ProjectsController < BaseController
          def index(_request)
            json(200, { projects: Store.list_projects })
          end

          def create(request)
            json(201, Store.create_project(parse_json(request)))
          end
        end
      end
    end
  end
end
