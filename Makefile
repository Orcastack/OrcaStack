API_DIR := gitorcapi
WEB_DIR := gitorcweb

.PHONY: api-build api-run gateway git review ci cd analytics web-install web-build up down

api-build:
	cd $(API_DIR) && go build ./...

gateway:
	cd $(API_DIR) && go run ./cmd/gitorc-gateway

git:
	cd $(API_DIR) && go run ./cmd/gitorc-git-service

review:
	cd $(API_DIR) && go run ./cmd/gitorc-review-service

ci:
	cd $(API_DIR) && go run ./cmd/gitorc-ci-service

cd:
	cd $(API_DIR) && go run ./cmd/gitorc-cd-service

analytics:
	cd $(API_DIR) && go run ./cmd/gitorc-analytics-service

web-install:
	cd $(WEB_DIR) && npm install

web-build:
	cd $(WEB_DIR) && npm run build

up:
	docker compose up --build

down:
	docker compose down
