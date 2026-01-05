# Secret Storage Interface Implementation

Create an abstraction layer for secret storage that decouples sensitive credential storage from domain objects, enabling seamless swapping of storage backends.

## Proposed Changes

### New: Services Directory Structure

```
backend/src/services/secrets/
├── index.js                                      # Re-exports
├── secret-store.interface.js                     # ISecretStore interface
├── secret-store.factory.js                       # Singleton factory
└── plaintext-insecure-nightmare-secret-store.js  # Dev-only implementation (DO NOT USE IN PROD)
```

---

### [NEW] [secret-store.interface.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/secrets/secret-store.interface.js)

Base class defining the contract for all secret store implementations:
- `store(key, value)` → `Promise<string>` - Store a secret
- `retrieve(key)` → `Promise<string|null>` - Retrieve a secret
- `delete(key)` → `Promise<boolean>` - Delete a secret
- `exists(key)` → `Promise<boolean>` - Check if secret exists

---

### [NEW] [plaintext-insecure-nightmare-secret-store.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/secrets/plaintext-insecure-nightmare-secret-store.js)

Dev-only `PlaintextInsecureNightmareSecretStore` implementation with:
- Internal Mongoose schema `{ key: String (unique), value: String, createdAt, updatedAt }`
- **Loud** console warning on instantiation (dev safety)
- Full implementation of `ISecretStore` interface

---

### [NEW] [secret-store.factory.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/secrets/secret-store.factory.js)

Singleton factory pattern:
- Reads `SECRET_STORE_TYPE` environment variable (default: `plaintext`)
- Caches and returns the same instance on subsequent calls
- Extensible for future backends (encrypted, vault, aws-secrets-manager)

---

### [NEW] [index.js](file:///home/andrew/Projects/Code/web/scientist-ai/backend/src/services/secrets/index.js)

Clean re-exports for easy importing.

---

## Verification Plan

### Automated Tests
Test file: `backend/tests/services/secrets/secret-store.test.js`

| Test Case | Description |
|-----------|-------------|
| Store & Retrieve | Store a secret, retrieve it, verify value matches |
| Exists (positive) | Store a secret, verify `exists()` returns true |
| Exists (negative) | Check non-existent key returns false |
| Delete | Store, delete, verify `exists()` returns false |
| Factory default | Verify factory returns `PlaintextInsecureNightmareSecretStore` when env unset |
| Factory explicit | Verify factory returns `PlaintextInsecureNightmareSecretStore` when env is `plaintext` |
| Factory singleton | Verify factory returns same instance on multiple calls |

**Command**: `npm test -- --testPathPattern=secret-store`
