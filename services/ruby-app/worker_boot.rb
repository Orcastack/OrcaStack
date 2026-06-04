require_relative './config/application'
require_relative './app/jobs/webhook_delivery_job'

Gitorc::RubyApp::Store.bootstrap!