require_relative './server'

run proc { |env| OrcaStack::RubyApp::Server.rack_call(env) }
