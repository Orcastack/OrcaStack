variable "region" {
  type        = string
  description = "OpenStack region hosting the sovereign platform."
}

variable "auth_url" {
  type        = string
  description = "Keystone authentication endpoint."
}

variable "application_credential_id" {
  type        = string
  description = "OpenStack application credential ID for Terraform automation."
}

variable "application_credential_secret" {
  type        = string
  description = "OpenStack application credential secret for Terraform automation."
  sensitive   = true
}

variable "tenant_name" {
  type        = string
  description = "Keystone project used for the ORCASTACK platform."
}

variable "user_name" {
  type        = string
  description = "Automation user name for Terraform actions."
}

variable "kube_host" {
  type        = string
  description = "Private Kubernetes API endpoint."
}

variable "kube_token" {
  type        = string
  description = "Kubernetes service account or automation token."
  sensitive   = true
}

variable "kube_cluster_ca_certificate" {
  type        = string
  description = "PEM-encoded cluster CA certificate."
  sensitive   = true
}

variable "external_network_id" {
  type        = string
  description = "Public or routed external network ID used for floating IPs and ingress."
}

variable "image_name" {
  type        = string
  description = "Base image for runner nodes."
}

variable "runner_flavor_name" {
  type        = string
  description = "OpenStack flavor used for CI/CD runners."
}

variable "runner_keypair" {
  type        = string
  description = "SSH keypair injected into runner nodes."
}

variable "runner_instance_count" {
  type        = number
  description = "Number of CI/CD runner instances to provision."
  default     = 3
}

variable "floating_ip_pool" {
  type        = string
  description = "Floating IP pool used for ingress and operational access."
}

variable "barbican_secret_payload" {
  type        = string
  description = "Bootstrap secret payload placeholder for platform sync validation."
  sensitive   = true
}

variable "storage_ceph_monitors" {
  type        = list(string)
  description = "Ceph monitor endpoints exposed to the Kubernetes cluster."
}