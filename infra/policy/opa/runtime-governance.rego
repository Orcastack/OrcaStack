package gitorc.runtime

default allow := false

approved_environments := {"dev", "stage", "prod"}
approved_actions := {"build", "test", "sign", "deploy", "rollback"}

unsigned_artifact_deny := [msg |
  not input.artifact.signed
  msg := "unsigned artifact cannot enter the deployment plane"
]

production_approval_deny := [msg |
  input.action == "deploy"
  input.environment == "prod"
  not input.pipeline.approval.granted
  msg := "production deployment requires explicit governance approval"
]

allow if {
  input.repository.identity != ""
  input.actor.identity != ""
  input.action in approved_actions
  input.environment in approved_environments
  input.artifact.signed == true
  input.pipeline.approval.required == false
}

allow if {
  input.repository.identity != ""
  input.actor.identity != ""
  input.action in approved_actions
  input.environment in approved_environments
  input.artifact.signed == true
  input.pipeline.approval.required == true
  input.pipeline.approval.granted == true
}

deny := messages if {
  messages := array.concat(unsigned_artifact_deny, production_approval_deny)
  count(messages) > 0
}