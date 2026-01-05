const PlaintextInsecureNightmareSecretStore = require('./plaintext-insecure-nightmare-secret-store');

/**
 * Factory for creating SecretStore instances.
 *
 * Returns the appropriate ISecretStore implementation based on configuration.
 * Uses singleton pattern to cache the store instance.
 *
 * Configuration via environment variable: SECRET_STORE_TYPE
 * - 'plaintext' (default): PlaintextInsecureNightmareSecretStore (dev only!)
 * - Future: 'encrypted', 'vault', 'aws-secrets-manager'
 */
class SecretStoreFactory {
    static _instance = null;
    static _storeType = null;

    /**
     * Get the configured SecretStore instance.
     *
     * Returns a singleton instance. The store type is determined by the
     * SECRET_STORE_TYPE environment variable (defaults to 'plaintext').
     *
     * @returns {ISecretStore} The configured secret store instance.
     * @throws {Error} If an unknown store type is configured.
     */
    static getStore() {
        const requestedType = process.env.SECRET_STORE_TYPE || 'plaintext';

        // If we have a cached instance for the same type, return it
        if (SecretStoreFactory._instance && SecretStoreFactory._storeType === requestedType) {
            return SecretStoreFactory._instance;
        }

        // Create new instance based on type
        switch (requestedType) {
            case 'plaintext':
                SecretStoreFactory._instance = new PlaintextInsecureNightmareSecretStore();
                SecretStoreFactory._storeType = requestedType;
                break;

            // Future implementations:
            // case 'encrypted':
            //     SecretStoreFactory._instance = new EncryptedSecretStore();
            //     break;
            // case 'vault':
            //     SecretStoreFactory._instance = new VaultSecretStore();
            //     break;
            // case 'aws-secrets-manager':
            //     SecretStoreFactory._instance = new AwsSecretsManagerStore();
            //     break;

            default:
                throw new Error(
                    `Unknown SECRET_STORE_TYPE: '${requestedType}'. ` +
                    `Valid options are: 'plaintext'. ` +
                    `(Future: 'encrypted', 'vault', 'aws-secrets-manager')`
                );
        }

        return SecretStoreFactory._instance;
    }

    /**
     * Reset the singleton instance.
     * Primarily for testing purposes.
     */
    static reset() {
        SecretStoreFactory._instance = null;
        SecretStoreFactory._storeType = null;
    }
}

module.exports = SecretStoreFactory;
