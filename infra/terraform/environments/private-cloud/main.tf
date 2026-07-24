provider "openstack" {
  auth_url                      = var.auth_url
  region                        = var.region
  tenant_name                   = var.tenant_name
  user_name                     = var.user_name
  application_credential_id     = var.application_credential_id
  application_credential_secret = var.application_credential_secret
}

provider "kubernetes" {
  host                   = var.kube_host
  token                  = var.kube_token
  cluster_ca_certificate = var.kube_cluster_ca_certificate
}

module "network" {
  source              = "../../modules/openstack-network"
  name_prefix         = "orcastack"
  external_network_id = var.external_network_id
  floating_ip_pool    = var.floating_ip_pool
}

module "identity" {
  source                  = "../../modules/openstack-identity"
  project_name            = "orcastack-platform"
  service_user_name       = "orcastack-svc"
  service_user_password   = var.application_credential_secret
  role_name               = "orcastack-operator"
  repository_auditor_role = "orcastack-repository-auditor"
}

module "storage" {
  source                  = "../../modules/openstack-storage"
  name_prefix             = "orcastack"
  barbican_secret_payload = var.barbican_secret_payload
  ceph_monitors           = var.storage_ceph_monitors
}

module "runners" {
  source            = "../../modules/ci-runner-pool"
  name_prefix       = "orcastack"
  image_name        = var.image_name
  flavor_name       = var.runner_flavor_name
  key_pair          = var.runner_keypair
  instance_count    = var.runner_instance_count
  network_id        = module.network.network_id
  security_group_id = module.network.runner_security_group_id
}

module "platform" {
  source                  = "../../modules/kubernetes-platform"
  namespace               = "orcastack-system"
  ingress_floating_ip     = module.network.ingress_floating_ip
  barbican_secret_id      = module.storage.barbican_secret_id
  ceph_storage_class_name = module.storage.storage_class_name
  runner_service_account  = "orcastack-runner"
}