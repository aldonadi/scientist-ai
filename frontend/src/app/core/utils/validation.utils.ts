/**
 * Validation utilities for input sanitization.
 * Provides reusable validation functions for Tool, Plan, and Script fields.
 */

// Python identifier pattern: starts with letter or underscore, followed by letters/numbers/underscores
const PYTHON_IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * Validates that a string is a valid Python identifier (function or variable name).
 * 
 * @param name - The name to validate
 * @returns true if valid Python identifier
 */
export function isValidPythonIdentifier(name: string): boolean {
    if (!name || typeof name !== 'string') return false;
    return PYTHON_IDENTIFIER_REGEX.test(name);
}

/**
 * Gets a human-readable error message for invalid Python identifiers.
 * 
 * @param name - The name that failed validation
 * @returns Error message or null if valid
 */
export function getPythonIdentifierError(name: string): string | null {
    if (!name) return 'Required';
    if (!/^[a-zA-Z_]/.test(name)) return 'Must start with a letter or underscore';
    if (!PYTHON_IDENTIFIER_REGEX.test(name)) return 'Only letters, numbers, and underscores allowed';
    return null;
}

/**
 * Validates that a string is valid JSON.
 * 
 * @param json - The JSON string to validate
 * @returns Object with valid boolean and optional error message
 */
export function validateJson(json: string): { valid: boolean; error?: string } {
    if (!json || !json.trim()) {
        return { valid: true }; // Empty is allowed (defaults to {})
    }
    try {
        JSON.parse(json);
        return { valid: true };
    } catch (e: any) {
        return { valid: false, error: e.message || 'Invalid JSON' };
    }
}

/**
 * Validates that a value is a positive integer greater than 0.
 * 
 * @param value - The value to validate
 * @returns true if valid positive integer
 */
export function isPositiveInteger(value: any): boolean {
    const num = typeof value === 'string' ? parseInt(value, 10) : value;
    return Number.isInteger(num) && num > 0;
}

/**
 * Gets an error message for invalid positive integer.
 * 
 * @param value - The value that failed validation
 * @returns Error message or null if valid
 */
export function getPositiveIntegerError(value: any): string | null {
    if (value === null || value === undefined || value === '') return 'Required';
    const num = typeof value === 'string' ? parseInt(value, 10) : value;
    if (isNaN(num)) return 'Must be a number';
    if (!Number.isInteger(num)) return 'Must be a whole number';
    if (num <= 0) return 'Must be greater than 0';
    return null;
}

/**
 * Validates an environment variable value against its declared type.
 * 
 * @param value - The string value to validate
 * @param type - The declared type
 * @returns Object with valid boolean and optional error message
 */
export function validateEnvValue(value: string, type: string): { valid: boolean; error?: string } {
    if (!value && value !== '0' && value !== 'false') {
        return { valid: true }; // Empty is allowed
    }

    switch (type) {
        case 'number':
            const num = parseFloat(value);
            if (isNaN(num)) return { valid: false, error: 'Must be a valid number' };
            return { valid: true };

        case 'boolean':
            const lower = value.toLowerCase();
            if (lower !== 'true' && lower !== 'false') {
                return { valid: false, error: 'Must be "true" or "false"' };
            }
            return { valid: true };

        case 'array':
            try {
                const parsed = JSON.parse(value);
                if (!Array.isArray(parsed)) return { valid: false, error: 'Must be a JSON array' };
                return { valid: true };
            } catch {
                return { valid: false, error: 'Invalid JSON array' };
            }

        case 'object':
            try {
                const parsed = JSON.parse(value);
                if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
                    return { valid: false, error: 'Must be a JSON object' };
                }
                return { valid: true };
            } catch {
                return { valid: false, error: 'Invalid JSON object' };
            }

        case 'string':
        default:
            return { valid: true };
    }
}

/**
 * Basic Python syntax check (client-side, non-exhaustive).
 * Checks for obvious issues like unmatched brackets.
 * 
 * @param code - The Python code to check
 * @returns Object with valid boolean and optional error message
 */
export function checkPythonSyntax(code: string): { valid: boolean; error?: string } {
    if (!code || !code.trim()) {
        return { valid: false, error: 'Code is required' };
    }

    // Check for unmatched brackets
    const brackets: { [key: string]: string } = { '(': ')', '[': ']', '{': '}' };
    const stack: string[] = [];

    for (const char of code) {
        if (brackets[char]) {
            stack.push(brackets[char]);
        } else if (Object.values(brackets).includes(char)) {
            if (stack.pop() !== char) {
                return { valid: false, error: 'Unmatched brackets' };
            }
        }
    }

    if (stack.length > 0) {
        return { valid: false, error: 'Unclosed brackets' };
    }

    return { valid: true };
}
