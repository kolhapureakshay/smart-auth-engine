# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Fastify adapter and examples
- NestJS integration guide
- MFA authentication module
- OAuth / Social login support
- Additional storage adapters (PostgreSQL, MongoDB, DynamoDB)
- Plugin marketplace documentation

---

## [0.1.0] - 2026-02-10

### Added
- Initial release of **Smart Auth Engine**
- JWT-based authentication with stateful session intelligence
- Refresh token rotation with token family tracking
- Role-Based Access Control (RBAC) module
- Rate limiting module with configurable windows
- Advisory capability profiles for deployment guidance
- Pluggable storage architecture
- In-memory storage adapter
- Redis storage adapter
- Event bus for extensibility
- Express middleware integration
- Fully typed TypeScript public API
- Session management with device and IP tracking
- Session revocation ("logout all devices")
- Modular architecture with support for custom plugins

### Security
- Secure JWT handling using the `jose` library
- SHA-256 hashing for refresh token storage
- Automatic refresh token rotation
- Session-level revocation support
- Built-in brute-force mitigation utilities
