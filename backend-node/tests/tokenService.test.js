const { generateToken, verifyToken } = require('../src/services/tokenService');

describe('Token Service', () => {
  it('should generate and verify JWT token correctly', () => {
    const payload = { email: 'admin@test.com', role: 'Admin' };
    const token = generateToken(payload);
    expect(typeof token).toBe('string');

    const decoded = verifyToken(token);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it('should return null for invalid token verification', () => {
    const decoded = verifyToken('invalid.token.string');
    expect(decoded).toBeNull();
  });
});
