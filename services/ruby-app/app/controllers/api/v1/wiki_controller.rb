module Gitorc
  module RubyApp
    module Api
      module V1
        class WikiController < BaseController
          def index(request)
            project_id = request.headers['x-project-id'] || request.headers['X-Project-Id']
            json(200, { pages: Store.list_wiki_pages(project_id) })
          end

          def create(request)
            json(201, Store.create_wiki_page(parse_json(request)))
          end
        end
      end
    end
  end
end
