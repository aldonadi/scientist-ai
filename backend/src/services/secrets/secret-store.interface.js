/**
 * @interface ISecretStore
 * Abstract interface for secret storage backends.
 *
 * Implementations must provide secure storage and retrieval of sensitive
 * credentials like API keys. The interface allows for pluggable backends
 * (plaintext for dev, encrypted storage for production, or external
 * secret managers like Vault).
 */
class ISecretStore {
    /**
     * Store a secret value.
     * @param {string} key - Unique identifier for the secret.
     * @param {string} value - The secret value to store.
     * @returns {Promise<string>} - The key used to retrieve the secret.
     * @throws {Error} - If storage fails.
     */
    async store(key, value) {
        throw new Error('ISecretStore.store() not implemented');
    }

    /**
     * Retrieve a secret value.
     * @param {string} key - The key for the secret.
     * @returns {Promise<string|null>} - The secret value, or null if not found.
     */
    async retrieve(key) {
        throw new Error('ISecretStore.retrieve() not implemented');
    }

    /**
     * Delete a secret.
     * @param {string} key - The key for the secret.
     * @returns {Promise<boolean>} - True if deleted, false if not found.
     */
    async delete(key) {
        throw new Error('ISecretStore.delete() not implemented');
    }

    /**
     * Check if a secret exists.
     * @param {string} key - The key for the secret.
     * @returns {Promise<boolean>} - True if the secret exists.
     */
    async exists(key) {
        throw new Error('ISecretStore.exists() not implemented');
    }
}

module.exports = ISecretStore;
