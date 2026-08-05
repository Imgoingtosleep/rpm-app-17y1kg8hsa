const request = require('supertest');
const app = require('../src/server');
const { generateToken } = require('../src/services/tokenService');

describe('Authentication & Authorization Middleware', () => {
  it('GET /api/sites should deny access when no token is provided', async () => {
    const res = await request(app).get('/api/sites');
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('error', 'Access Denied: No Token Provided');
  });

  it('GET /api/sites should deny access when token is invalid', async () => {
    const res = await request(app)
      .get('/api/sites')
      .set('Authorization', 'Bearer invalidtoken123');
    expect(res.statusCode).toEqual(403);
    expect(res.body).toHaveProperty('error', 'Access Denied: Invalid or Expired Token');
  });

  it('GET /api/sites should allow access with valid token', async () => {
    const user = { email: 'test@netops.local', name: 'Tester', role: 'Inspector' };
    const token = generateToken(user);
    const res = await request(app)
      .get('/api/sites')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
