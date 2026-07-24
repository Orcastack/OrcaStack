#!/usr/bin/env ruby

require 'json'
require 'net/http'
require 'uri'

def post_json(url, payload)
  uri = URI(url)
  request = Net::HTTP::Post.new(uri)
  request['Content-Type'] = 'application/json'
  request.body = JSON.generate(payload)

  Net::HTTP.start(uri.host, uri.port) do |http|
    http.request(request)
  end
end

command = ENV['SSH_ORIGINAL_COMMAND'].to_s
fingerprint = ENV['ORCASTACK_SSH_KEY_FINGERPRINT'].to_s
username = ENV['ORCASTACK_SSH_USERNAME'].to_s

abort('SSH_ORIGINAL_COMMAND is required') if command.empty?
abort('ORCASTACK_SSH_KEY_FINGERPRINT is required') if fingerprint.empty?

ruby_app_url = ENV.fetch('ORCASTACK_RUBY_APP_URL', 'http://127.0.0.1:3000')
git_service_url = ENV.fetch('ORCASTACK_GIT_ENGINE_URL', 'http://127.0.0.1:8081')

authorize_response = post_json("#{ruby_app_url}/api/v1/ssh/authorize", {
  username: username,
  key_fingerprint: fingerprint,
  command: command
})

abort("SSH authorization failed: #{authorize_response.body}") unless authorize_response.code.to_i == 200

authorization = JSON.parse(authorize_response.body)
abort("SSH authorization denied: #{authorization['error']}") unless authorization['allowed']

verify_response = post_json("#{git_service_url}/auth/verify", {
  token: authorization.fetch('token'),
  command: authorization.fetch('command')
})

abort("Git engine token verification failed: #{verify_response.body}") unless verify_response.code.to_i == 200

exec(authorization.fetch('command'))