/**
 * Secret Storage Module
 *
 * Provides an abstraction layer for secret storage, decoupling sensitive
 * credential storage from domain objects.
 *
 * Usage:
 *   const { SecretStoreFactory } = require('./services/secrets');
 *   const store = SecretStoreFactory.getStore();
 *   await store.store('my-api-key', 'secret-value');
 *   const value = await store.retrieve('my-api-key');
 */

const ISecretStore = require('./secret-store.interface');
const SecretStoreFactory = require('./secret-store.factory');
const PlaintextInsecureNightmareSecretStore = require('./plaintext-insecure-nightmare-secret-store');

module.exports = {
    ISecretStore,
    SecretStoreFactory,
    PlaintextInsecureNightmareSecretStore
};
