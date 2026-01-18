const { validateType } = require('./environment.schema');

describe('Environment Schema Validators', () => {
    describe('Type Validation', () => {
        it('should validate strings', () => {
            expect(validateType('hello', 'string').valid).toBe(true);
            expect(validateType(123, 'string').valid).toBe(false);
        });

        it('should validate integers', () => {
            expect(validateType(123, 'int').valid).toBe(true);
            expect(validateType(123.45, 'int').valid).toBe(false);
            expect(validateType('123', 'int').valid).toBe(false);
        });

        it('should validate floats', () => {
            expect(validateType(123.45, 'float').valid).toBe(true);
            expect(validateType(123, 'float').valid).toBe(true); // Ints are numbers too
            expect(validateType('123', 'float').valid).toBe(false);
        });

        it('should validate booleans', () => {
            expect(validateType(true, 'bool').valid).toBe(true);
            expect(validateType(false, 'bool').valid).toBe(true);
            expect(validateType('true', 'bool').valid).toBe(false);
        });

        it('should validate arrays', () => {
            expect(validateType([], 'array').valid).toBe(true);
            expect(validateType([1, 2, 3], 'array').valid).toBe(true);
            expect(validateType({}, 'array').valid).toBe(false);
            expect(validateType('[]', 'array').valid).toBe(false);
        });

        it('should validate objects', () => {
            expect(validateType({}, 'object').valid).toBe(true);
            expect(validateType({ key: 'value' }, 'object').valid).toBe(true);
            expect(validateType([], 'object').valid).toBe(false); // Arrays are not "objects" in our strict sense
            expect(validateType(null, 'object').valid).toBe(false);
            expect(validateType(123, 'object').valid).toBe(false);
        });

        it('should allow unknown types', () => {
            // Current behavior is to allow unknown types (or we could change to strict)
            expect(validateType('whatever', 'custom').valid).toBe(true);
        });
    });
});
