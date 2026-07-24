API_DIR := orcastackapi
WEB_DIR := orcastackweb
TF_ENV_DIR := infra/terraform/environments/private-cloud

.PHONY: api-build api-run gateway git review ci cd analytics runner hw-automation sw-automation device-orch ruby-app web-install web-build up down infra-fmt infra-validate bootstrap-local deploy-private-cloud cloud-bootstrap proxmox-bootstrap openstack-bootstrap network-fabric kubernetes-bootstrap rancher-register gpu-bootstrap observability-bootstrap release-build apt-repo-update

api-build:
	cd $(API_DIR) && go build ./...

gateway:
	cd $(API_DIR) && go run ./cmd/orcastack-gateway

git:
	cd $(API_DIR) && go run ./cmd/orcastack-git-service

review:
	cd $(API_DIR) && go run ./cmd/orcastack-review-service

ci:
	cd $(API_DIR) && go run ./cmd/orcastack-ci-service

cd:
	cd $(API_DIR) && go run ./cmd/orcastack-cd-service

analytics:
	cd $(API_DIR) && go run ./cmd/orcastack-analytics-service

runner:
	cd $(API_DIR) && go run ./cmd/orcastack-runner

hw-automation:
	cd $(API_DIR) && go run ./cmd/orcastack-hw-automation

sw-automation:
	cd $(API_DIR) && go run ./cmd/orcastack-sw-automation

device-orch:
	cd $(API_DIR) && go run ./cmd/orcastack-device-orch

ruby-app:
	cd services/ruby-app && ruby server.rb

web-install:
	cd $(WEB_DIR) && npm install

web-build:
	cd $(WEB_DIR) && npm run build

up:
	docker compose up --build

down:
	docker compose down

infra-fmt:
	terraform fmt -recursive infra/terraform

infra-validate:
	terraform -chdir=$(TF_ENV_DIR) init -backend=false
	terraform -chdir=$(TF_ENV_DIR) validate
	terraform fmt -check -recursive infra/terraform

bootstrap-local:
	docker compose up -d postgres redis minio redpanda namenode datanode hbase gateway git-service review-service ci-service cd-service analytics-service runner hw-automation sw-automation device-orch ruby-app web prometheus grafana nginx

deploy-private-cloud:
	kubectl apply -f infra/kubernetes/base/namespace.yaml
	kubectl apply -k infra/kubernetes/platform

cloud-bootstrap: infra-validate
	ansible-playbook -i infra/ansible/inventories/private-cloud/hosts.yml infra/ansible/playbooks/proxmox-bootstrap.yml
	ansible-playbook -i infra/ansible/inventories/private-cloud/hosts.yml infra/ansible/playbooks/openstack-control-plane.yml
	ansible-playbook -i infra/ansible/inventories/private-cloud/hosts.yml infra/ansible/playbooks/network-fabric.yml
	ansible-playbook -i infra/ansible/inventories/private-cloud/hosts.yml infra/ansible/playbooks/kubernetes-cluster.yml
	ansible-playbook -i infra/ansible/inventories/private-cloud/hosts.yml infra/ansible/playbooks/rancher-register.yml
	ansible-playbook -i infra/ansible/inventories/private-cloud/hosts.yml infra/ansible/playbooks/gpu-workers.yml
	kubectl apply -f infra/kubernetes/platform/observability-stack.yaml

proxmox-bootstrap:
	ansible-playbook -i infra/ansible/inventories/private-cloud/hosts.yml infra/ansible/playbooks/proxmox-bootstrap.yml

openstack-bootstrap:
	ansible-playbook -i infra/ansible/inventories/private-cloud/hosts.yml infra/ansible/playbooks/openstack-control-plane.yml

network-fabric:
	ansible-playbook -i infra/ansible/inventories/private-cloud/hosts.yml infra/ansible/playbooks/network-fabric.yml

kubernetes-bootstrap:
	ansible-playbook -i infra/ansible/inventories/private-cloud/hosts.yml infra/ansible/playbooks/kubernetes-cluster.yml

rancher-register:
	ansible-playbook -i infra/ansible/inventories/private-cloud/hosts.yml infra/ansible/playbooks/rancher-register.yml

gpu-bootstrap:
	ansible-playbook -i infra/ansible/inventories/private-cloud/hosts.yml infra/ansible/playbooks/gpu-workers.yml

observability-bootstrap:
	kubectl apply -f infra/kubernetes/platform/observability-stack.yaml

release-build:
	bash ./scripts/release/build-release.sh "$(VERSION)"

apt-repo-update:
	bash ./scripts/release/update-apt-repo.sh "$(VERSION)"
