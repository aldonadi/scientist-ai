# Secret Storage Interface

- **Status:** REVIEW
- **Points:** 3
- **Story ID:** 044
- **Type:** Feature

## Description
Create an abstraction layer for secret storage that decouples sensitive credential storage (like API keys) from the domain objects that use them. This enables seamless swapping of storage backends (plaintext for dev, encrypted storage for production, or external secret managers like Vault).

This story implements the interface and a single development-only plaintext implementation. Encrypted storage implementations will be added in future stories.

## Technical Specification

### Interface Definition
Create `ISecretStore` interface in `backend/src/services/secrets/secret-store.interface.js`:

```javascript
/**
 * @interface ISecretStore
 * Abstract interface for secret storage backends.
 */
class ISecretStore {
  /**
   * Store a secret value.
   * @param {string} key - Unique identifier for the secret.
   * @param {string} value - The secret value to store.
   * @returns {Promise<string>} - A reference/handle to retrieve the secret later.
   */
  async store(key, value) { throw new Error('Not implemented'); }

  /**
   * Retrieve a secret value.
   * @param {string} key - The key or reference for the secret.
   * @returns {Promise<string|null>} - The secret value, or null if not found.
   */
  async retrieve(key) { throw new Error('Not implemented'); }

  /**
   * Delete a secret.
   * @param {string} key - The key or reference for the secret.
   * @returns {Promise<boolean>} - True if deleted, false if not found.
   */
  async delete(key) { throw new Error('Not implemented'); }

  /**
   * Check if a secret exists.
   * @param {string} key - The key or reference for the secret.
   * @returns {Promise<boolean>} - True if the secret exists.
   */
  async exists(key) { throw new Error('Not implemented'); }
}
```

### Plaintext Implementation (Dev Only)
Create `PlaintextInsecureNightmareSecretStore` in `backend/src/services/secrets/plaintext-insecure-nightmare-secret-store.js`:

- Stores secrets directly in MongoDB in a `Secrets` collection.
- **WARNING**: This is for development only. Secrets are stored in plaintext.
- Schema: `{ key: String (unique), value: String, createdAt: Date, updatedAt: Date }`

### Factory/Registry Pattern
Create `SecretStoreFactory` in `backend/src/services/secrets/secret-store.factory.js`:

- Returns the appropriate `ISecretStore` implementation based on configuration.
- Configuration via environment variable: `SECRET_STORE_TYPE` (default: `plaintext`).
- Future implementations: `encrypted`, `vault`, `aws-secrets-manager`.

### Directory Structure
```
backend/src/services/secrets/
├── index.js                                      # Re-exports
├── secret-store.interface.js                     # ISecretStore interface
├── secret-store.factory.js                       # Factory for creating store instances
└── plaintext-insecure-nightmare-secret-store.js  # Dev-only plaintext implementation
```

## User Story
**As a** Developer,
**I want** a pluggable secret storage interface,
**So that** I can store API keys securely with the flexibility to upgrade storage backends without changing consuming code.

## Acceptance Criteria
- [x] `ISecretStore` interface defined with `store()`, `retrieve()`, `delete()`, `exists()` methods.
- [x] `PlaintextInsecureNightmareSecretStore` class implements `ISecretStore`.
- [x] Plaintext implementation stores secrets in MongoDB `Secrets` collection.
- [x] `SecretStoreFactory.getStore()` returns the configured implementation.
- [x] Factory reads `SECRET_STORE_TYPE` environment variable.
- [x] Clear console warning logged when using plaintext store (dev safety).
- [x] Exported via index.js for easy importing.

## Testing
1. **Unit Test**: Create test file `backend/tests/services/secrets/secret-store.test.js`.
2. **Store and Retrieve**: Store a secret, retrieve it, verify value matches.
3. **Exists Check**: Store a secret, verify `exists()` returns true. Check non-existent key returns false.
4. **Delete**: Store a secret, delete it, verify `exists()` returns false.
5. **Factory**: Verify factory returns `PlaintextSecretStore` when `SECRET_STORE_TYPE` is unset or `plaintext`.

## Dependencies
- None (this is a foundational story).

## Notes
> [!WARNING]
> The `PlaintextSecretStore` is for **development only**. Production deployments MUST use an encrypted implementation (future story).

## Review Log

