terraform {
  required_providers {
    openstack = {
      source = "terraform-provider-openstack/openstack"
    }
  }
}

variable "project_name" {
  type = string
}

variable "service_user_name" {
  type = string
}

variable "service_user_password" {
  type      = string
  sensitive = true
}

variable "role_name" {
  type = string
}

variable "repository_auditor_role" {
  type = string
}

resource "openstack_identity_project_v3" "platform" {
  name        = var.project_name
  description = "ORCASTACK sovereign automation platform"
  enabled     = true
}

resource "openstack_identity_user_v3" "service" {
  default_project_id = openstack_identity_project_v3.platform.id
  description        = "Service identity for ORCASTACK platform automation"
  enabled            = true
  name               = var.service_user_name
  password           = var.service_user_password
}

resource "openstack_identity_role_v3" "platform_operator" {
  name = var.role_name
}

resource "openstack_identity_role_v3" "repository_auditor" {
  name = var.repository_auditor_role
}

resource "openstack_identity_role_assignment_v3" "service_operator" {
  project_id = openstack_identity_project_v3.platform.id
  role_id    = openstack_identity_role_v3.platform_operator.id
  user_id    = openstack_identity_user_v3.service.id
}

output "project_id" {
  value = openstack_identity_project_v3.platform.id
}

output "service_user_id" {
  value = openstack_identity_user_v3.service.id
}