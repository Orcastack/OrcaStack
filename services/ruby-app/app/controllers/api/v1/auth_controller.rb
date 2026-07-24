module OrcaStack
  module RubyApp
    module Api
      module V1
        class AuthController < BaseController
          def login(request)
            params = parse_json(request)
            user = Store.authenticate_local_user(params['username'])
            raise 'invalid credentials' unless user

            json(200, Store.create_session(user))
          end

          def signup(request)
            params = parse_json(request)
            record = {
              id: SecureRandom.uuid,
              username: params['username'],
              email: params['email'],
              status: 'pending_review',
              created_at: Time.now.utc.iso8601
            }
            Database.query('insert into signup_requests (id, username, email, status, reviewed_by, review_note) values ($1, $2, $3, $4, $5, $6)', [record[:id], record[:username], record[:email], record[:status], '', ''])
            Store.queue_webhook(event: 'signup_request.created', target_url: 'internal://signup-review', payload: record)
            json(202, record.merge(message: 'Signup request submitted for review.', request_id: record[:id]))
          end
        end
      end
    end
  end
end
