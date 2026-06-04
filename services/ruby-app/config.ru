require_relative './server'

run proc { |env| Gitorc::RubyApp::Server.rack_call(env) }
