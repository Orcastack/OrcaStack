require_relative './config/application'
require_relative './app/jobs/webhook_delivery_job'

OrcaStack::RubyApp::Store.bootstrap!