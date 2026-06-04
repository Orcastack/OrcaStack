# Security Directive

## Objective

gitorc now centralizes identity and cryptographic runtime policy in one shared backend module so services do not invent their own formats or signing flows.

## Unified identity pattern

All shared runtime identities follow this format:

`orca:<component-type>:<uuidv4>`

Examples:

- `orca:service:550e8400-e29b-41d4-a716-446655440000`
- `orca:process:1b4e28ba-2fa1-41d2-883f-0016d3cca427`
- `orca:repo:3f6d8c3e-6c96-4d8c-a2d3-6f4a8f4b7f2a`

The shared implementation lives in `gitorcapi/internal/platform/security/identity.go`.

## Shared cryptography pattern

The shared cryptography implementation lives in `gitorcapi/internal/platform/security/crypto.go`.

Current enforced primitives:

- signing: Ed25519
- verification: Ed25519
- hashing: SHA-256
- attestation format: repository identity, component identity, process identity, build hash, binary hash, signed timestamp, signature

Keys are loaded from files, not embedded in code. The runtime supports a signed attestation chain that links:

Repository -> Component -> Binary -> Process

## Runtime policy surface

The backend runtime now builds a unified security policy for every Go service in `gitorcapi/internal/platform/app/service.go`.

Each service now exposes:

- `/healthz` with service identity
- `/metadata` with component, repository, and process identities
- `/security/runtime` with the resolved runtime policy and attestation payload

## LDAP and RBAC configuration

The runtime policy includes LDAP and RBAC configuration fields so one shared registration and authorization model can be enforced instead of per-service logic.

Configured fields include:

- LDAP address
- LDAP service account DN
- LDAP service account password file
- component base DN
- repository base DN
- audit base DN
- LDAP auto-registration switch
- RBAC realm
- RBAC role base DN
- RBAC required role

When directory enforcement is enabled, the runtime requires those fields and performs a live LDAP bind, identity registration lookup, optional auto-registration, and RBAC membership search before startup.

## Python directory dependencies

The repository now includes the required dependency manifest at:

`sdk/python/orca_security_requirements.txt`

Install it with:

```bash
pip install -r sdk/python/orca_security_requirements.txt
```

This manifest contains:

- `ldap3`
- `py-fortress`

## Current enforcement boundaries

What is implemented now:

- one identity format
- one shared signing and verification module
- one shared hashing pattern
- one shared runtime attestation structure
- one stable repository identity default
- one LDAP and RBAC configuration model for all Go services
- live LDAP bind, registration lookup, and RBAC membership enforcement through the shared runtime
- a repository-owned signing tool for CI and Pages artifacts

What still requires deeper platform work:

- build pipeline signing for released binaries
- stricter repository policy enforcement for non-Go components
- deeper Fortress-specific role synchronization beyond the generic LDAP-backed RBAC search

## Configuration knobs

Common environment variables used by the shared runtime:

- `GITORC_REPOSITORY_IDENTITY`
- `GITORC_BUILD_HASH`
- `GITORC_SIGNING_PRIVATE_KEY_PATH`
- `GITORC_SIGNING_PUBLIC_KEY_PATH`
- `GITORC_ENFORCE_SIGNING`
- `GITORC_ENFORCE_DIRECTORY`
- `GITORC_LDAP_ADDRESS`
- `GITORC_LDAP_SERVICE_ACCOUNT_DN`
- `GITORC_LDAP_SERVICE_ACCOUNT_PASSWORD_FILE`
- `GITORC_LDAP_COMPONENT_BASE_DN`
- `GITORC_LDAP_REPOSITORY_BASE_DN`
- `GITORC_LDAP_AUDIT_BASE_DN`
- `GITORC_LDAP_AUTO_REGISTER`
- `GITORC_RBAC_REALM`
- `GITORC_RBAC_ROLE_BASE_DN`
- `GITORC_RBAC_REQUIRED_ROLE`

## Developer rule

Do not add per-service identity generators, per-service signing routines, or repository-specific cryptographic exceptions. Extend the shared module instead.