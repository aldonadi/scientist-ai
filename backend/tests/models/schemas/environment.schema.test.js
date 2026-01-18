const {
    environmentSchema,
    deepCopy,
    get,
    set,
    toJSON,
    validateType,
    parseEnumType
} = require('../../../src/models/schemas/environment.schema');

describe('Environment Schema', () => {

    describe('Schema Structure', () => {
        it('should export environmentSchema', () => {
            expect(environmentSchema).toBeDefined();
            expect(environmentSchema.paths.variables).toBeDefined();
            expect(environmentSchema.paths.variableTypes).toBeDefined();
        });

        it('should have Mixed type for variables field', () => {
            const variablesPath = environmentSchema.paths.variables;
            expect(variablesPath.instance).toBe('Mixed');
        });

        it('should have Mixed type for variableTypes field', () => {
            const variableTypesPath = environmentSchema.paths.variableTypes;
            expect(variableTypesPath.instance).toBe('Mixed');
        });

        it('should have default empty objects for both fields', () => {
            // Mongoose uses functions for object defaults to ensure fresh references
            const variablesDefault = environmentSchema.paths.variables.defaultValue;
            const variableTypesDefault = environmentSchema.paths.variableTypes.defaultValue;

            // If it's a function, call it to get the default value
            const varsDefault = typeof variablesDefault === 'function' ? variablesDefault() : variablesDefault;
            const typesDefault = typeof variableTypesDefault === 'function' ? variableTypesDefault() : variableTypesDefault;

            expect(varsDefault).toEqual({});
            expect(typesDefault).toEqual({});
        });
    });

    describe('parseEnumType', () => {
        it('should parse valid enum type with multiple values', () => {
            expect(parseEnumType('enum:[A,B,C]')).toEqual(['A', 'B', 'C']);
        });

        it('should parse enum with single value', () => {
            expect(parseEnumType('enum:[SINGLE]')).toEqual(['SINGLE']);
        });

        it('should parse enum with spaces and trim values', () => {
            expect(parseEnumType('enum:[A, B, C]')).toEqual(['A', 'B', 'C']);
        });

        it('should return null for non-enum types', () => {
            expect(parseEnumType('string')).toBeNull();
            expect(parseEnumType('int')).toBeNull();
            expect(parseEnumType('float')).toBeNull();
            expect(parseEnumType('bool')).toBeNull();
        });

        it('should return null for malformed enum', () => {
            expect(parseEnumType('enum:A,B,C')).toBeNull();
            expect(parseEnumType('enum[')).toBeNull();
            expect(parseEnumType('enum:')).toBeNull();
        });

        it('should return null for null or undefined', () => {
            expect(parseEnumType(null)).toBeNull();
            expect(parseEnumType(undefined)).toBeNull();
        });

        it('should handle empty enum list', () => {
            expect(parseEnumType('enum:[]')).toEqual(['']);
        });
    });

    describe('validateType', () => {
        describe('string type', () => {
            it('should accept string values', () => {
                expect(validateType('hello', 'string')).toEqual({ valid: true });
                expect(validateType('', 'string')).toEqual({ valid: true });
            });

            it('should reject non-string values', () => {
                const result = validateType(123, 'string');
                expect(result.valid).toBe(false);
                expect(result.error).toContain('string');
            });
        });

        describe('int type', () => {
            it('should accept integer values', () => {
                expect(validateType(42, 'int')).toEqual({ valid: true });
                expect(validateType(0, 'int')).toEqual({ valid: true });
                expect(validateType(-10, 'int')).toEqual({ valid: true });
            });

            it('should reject float values', () => {
                const result = validateType(3.14, 'int');
                expect(result.valid).toBe(false);
                expect(result.error).toContain('int');
            });

            it('should reject non-number values', () => {
                expect(validateType('42', 'int').valid).toBe(false);
            });
        });

        describe('float type', () => {
            it('should accept float values', () => {
                expect(validateType(3.14, 'float')).toEqual({ valid: true });
            });

            it('should accept integers as valid floats', () => {
                expect(validateType(42, 'float')).toEqual({ valid: true });
            });

            it('should reject non-number values', () => {
                const result = validateType('3.14', 'float');
                expect(result.valid).toBe(false);
            });
        });

        describe('bool type', () => {
            it('should accept boolean values', () => {
                expect(validateType(true, 'bool')).toEqual({ valid: true });
                expect(validateType(false, 'bool')).toEqual({ valid: true });
            });

            it('should reject non-boolean values', () => {
                expect(validateType(1, 'bool').valid).toBe(false);
                expect(validateType('true', 'bool').valid).toBe(false);
                expect(validateType(0, 'bool').valid).toBe(false);
            });
        });

        describe('enum type', () => {
            it('should accept value in enum list', () => {
                expect(validateType('A', 'enum:[A,B,C]')).toEqual({ valid: true });
                expect(validateType('B', 'enum:[A,B,C]')).toEqual({ valid: true });
            });

            it('should reject value not in enum list', () => {
                const result = validateType('D', 'enum:[A,B,C]');
                expect(result.valid).toBe(false);
                expect(result.error).toContain('enum');
                expect(result.error).toContain('D');
            });
        });

        describe('edge cases', () => {
            it('should allow any value when type is undefined', () => {
                expect(validateType('anything', undefined)).toEqual({ valid: true });
                expect(validateType(123, undefined)).toEqual({ valid: true });
            });

            it('should allow any value when type is null', () => {
                expect(validateType('anything', null)).toEqual({ valid: true });
            });

            it('should allow any value for unknown types', () => {
                expect(validateType('value', 'unknown_type')).toEqual({ valid: true });
            });
        });
    });

    describe('deepCopy', () => {
        it('should create a new object', () => {
            const original = { variables: { x: 1 }, variableTypes: { x: 'int' } };
            const copy = deepCopy(original);
            expect(copy).not.toBe(original);
        });

        it('should create detached variables object', () => {
            const original = { variables: { x: 1 }, variableTypes: { x: 'int' } };
            const copy = deepCopy(original);
            expect(copy.variables).not.toBe(original.variables);
        });

        it('should create detached variableTypes object', () => {
            const original = { variables: { x: 1 }, variableTypes: { x: 'int' } };
            const copy = deepCopy(original);
            expect(copy.variableTypes).not.toBe(original.variableTypes);
        });

        it('should preserve values in copy', () => {
            const original = {
                variables: { x: 1, name: 'test' },
                variableTypes: { x: 'int', name: 'string' }
            };
            const copy = deepCopy(original);
            expect(copy.variables).toEqual({ x: 1, name: 'test' });
            expect(copy.variableTypes).toEqual({ x: 'int', name: 'string' });
        });

        it('should not affect original when copy is mutated', () => {
            const original = { variables: { x: 1 }, variableTypes: { x: 'int' } };
            const copy = deepCopy(original);
            copy.variables.x = 999;
            copy.variables.newKey = 'new';
            expect(original.variables.x).toBe(1);
            expect(original.variables.newKey).toBeUndefined();
        });

        it('should handle nested objects', () => {
            const original = {
                variables: { nested: { a: 1, b: 2 } },
                variableTypes: { nested: 'object' }
            };
            const copy = deepCopy(original);
            copy.variables.nested.a = 999;
            expect(original.variables.nested.a).toBe(1);
        });

        it('should handle null input', () => {
            const copy = deepCopy(null);
            expect(copy).toEqual({ variables: {}, variableTypes: {} });
        });

        it('should handle undefined input', () => {
            const copy = deepCopy(undefined);
            expect(copy).toEqual({ variables: {}, variableTypes: {} });
        });

        it('should handle empty environment', () => {
            const copy = deepCopy({ variables: {}, variableTypes: {} });
            expect(copy).toEqual({ variables: {}, variableTypes: {} });
        });

        it('should handle environment with missing fields', () => {
            const copy = deepCopy({ variables: { x: 1 } });
            expect(copy.variables).toEqual({ x: 1 });
            expect(copy.variableTypes).toEqual({});
        });

        it('should handle arrays in variables', () => {
            const original = { variables: { items: [1, 2, 3] }, variableTypes: {} };
            const copy = deepCopy(original);
            copy.variables.items.push(4);
            expect(original.variables.items).toEqual([1, 2, 3]);
        });
    });

    describe('get', () => {
        it('should retrieve existing variable', () => {
            const env = { variables: { x: 42, name: 'test' }, variableTypes: {} };
            expect(get(env, 'x')).toBe(42);
            expect(get(env, 'name')).toBe('test');
        });

        it('should return undefined for non-existent variable', () => {
            const env = { variables: { x: 42 }, variableTypes: {} };
            expect(get(env, 'missing')).toBeUndefined();
        });

        it('should return undefined for null environment', () => {
            expect(get(null, 'x')).toBeUndefined();
        });

        it('should return undefined for undefined environment', () => {
            expect(get(undefined, 'x')).toBeUndefined();
        });

        it('should return undefined when variables is missing', () => {
            expect(get({}, 'x')).toBeUndefined();
        });

        it('should handle various value types', () => {
            const env = {
                variables: {
                    str: 'hello',
                    num: 123,
                    bool: true,
                    arr: [1, 2],
                    obj: { a: 1 },
                    nil: null
                },
                variableTypes: {}
            };
            expect(get(env, 'str')).toBe('hello');
            expect(get(env, 'num')).toBe(123);
            expect(get(env, 'bool')).toBe(true);
            expect(get(env, 'arr')).toEqual([1, 2]);
            expect(get(env, 'obj')).toEqual({ a: 1 });
            expect(get(env, 'nil')).toBeNull();
        });
    });

    describe('set', () => {
        describe('without type constraints', () => {
            it('should set a new variable', () => {
                const env = { variables: {}, variableTypes: {} };
                set(env, 'x', 42);
                expect(env.variables.x).toBe(42);
            });

            it('should update an existing variable', () => {
                const env = { variables: { x: 1 }, variableTypes: {} };
                set(env, 'x', 42);
                expect(env.variables.x).toBe(42);
            });

            it('should initialize variables if missing', () => {
                const env = { variableTypes: {} };
                set(env, 'x', 42);
                expect(env.variables.x).toBe(42);
            });

            it('should initialize variableTypes if missing', () => {
                const env = { variables: {} };
                set(env, 'x', 42);
                expect(env.variableTypes).toEqual({});
            });
        });

        describe('with type constraints', () => {
            it('should accept valid string', () => {
                const env = { variables: {}, variableTypes: { name: 'string' } };
                set(env, 'name', 'hello');
                expect(env.variables.name).toBe('hello');
            });

            it('should reject invalid string', () => {
                const env = { variables: {}, variableTypes: { name: 'string' } };
                expect(() => set(env, 'name', 123)).toThrow('Type validation failed');
            });

            it('should accept valid int', () => {
                const env = { variables: {}, variableTypes: { count: 'int' } };
                set(env, 'count', 42);
                expect(env.variables.count).toBe(42);
            });

            it('should reject float for int type', () => {
                const env = { variables: {}, variableTypes: { count: 'int' } };
                expect(() => set(env, 'count', 3.14)).toThrow('Type validation failed');
            });

            it('should accept valid float', () => {
                const env = { variables: {}, variableTypes: { price: 'float' } };
                set(env, 'price', 19.99);
                expect(env.variables.price).toBe(19.99);
            });

            it('should accept int for float type', () => {
                const env = { variables: {}, variableTypes: { value: 'float' } };
                set(env, 'value', 42);
                expect(env.variables.value).toBe(42);
            });

            it('should accept valid bool', () => {
                const env = { variables: {}, variableTypes: { active: 'bool' } };
                set(env, 'active', true);
                expect(env.variables.active).toBe(true);
            });

            it('should reject number for bool type', () => {
                const env = { variables: {}, variableTypes: { active: 'bool' } };
                expect(() => set(env, 'active', 1)).toThrow('Type validation failed');
            });

            it('should accept valid enum value', () => {
                const env = { variables: {}, variableTypes: { status: 'enum:[OPEN,CLOSED,PENDING]' } };
                set(env, 'status', 'OPEN');
                expect(env.variables.status).toBe('OPEN');
            });

            it('should reject invalid enum value', () => {
                const env = { variables: {}, variableTypes: { status: 'enum:[OPEN,CLOSED,PENDING]' } };
                expect(() => set(env, 'status', 'INVALID')).toThrow('Type validation failed');
            });
        });

        describe('error handling', () => {
            it('should throw for null environment', () => {
                expect(() => set(null, 'x', 1)).toThrow('Environment is required');
            });

            it('should throw for undefined environment', () => {
                expect(() => set(undefined, 'x', 1)).toThrow('Environment is required');
            });

            it('should include key name in error message', () => {
                const env = { variables: {}, variableTypes: { count: 'int' } };
                try {
                    set(env, 'count', 'not a number');
                    fail('Should have thrown');
                } catch (e) {
                    expect(e.message).toContain('count');
                }
            });
        });

        describe('edge cases', () => {
            it('should allow any value for undefined type', () => {
                const env = { variables: {}, variableTypes: {} };
                set(env, 'untyped', { anything: 'goes' });
                expect(env.variables.untyped).toEqual({ anything: 'goes' });
            });

            it('should preserve other variables when setting', () => {
                const env = { variables: { a: 1, b: 2 }, variableTypes: {} };
                set(env, 'c', 3);
                expect(env.variables).toEqual({ a: 1, b: 2, c: 3 });
            });
        });
    });

    describe('toJSON', () => {
        it('should return a plain object', () => {
            const env = { variables: { x: 1 }, variableTypes: { x: 'int' } };
            const json = toJSON(env);
            expect(json).toEqual({ variables: { x: 1 }, variableTypes: { x: 'int' } });
        });

        it('should handle null input', () => {
            expect(toJSON(null)).toEqual({ variables: {}, variableTypes: {} });
        });

        it('should handle undefined input', () => {
            expect(toJSON(undefined)).toEqual({ variables: {}, variableTypes: {} });
        });

        it('should handle missing variables', () => {
            const json = toJSON({ variableTypes: { x: 'int' } });
            expect(json.variables).toEqual({});
        });

        it('should handle missing variableTypes', () => {
            const json = toJSON({ variables: { x: 1 } });
            expect(json.variableTypes).toEqual({});
        });

        it('should serialize complex nested values', () => {
            const env = {
                variables: {
                    nested: { a: [1, 2, 3], b: { c: true } }
                },
                variableTypes: {}
            };
            const json = toJSON(env);
            expect(json.variables.nested).toEqual({ a: [1, 2, 3], b: { c: true } });
        });
    });
});
