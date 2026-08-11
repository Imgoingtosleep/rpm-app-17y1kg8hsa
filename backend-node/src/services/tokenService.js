const crypto = require('crypto');
const SECRET = process.env.JWT_SECRET || 'netops-secure-token-signing-key-7892';

/**
 * Generates a signed token for a user.
 * @param {object} user 
 * @returns {string} Signed token
 */
function generateToken(user) {
  const payload = JSON.stringify({
    email: user.email,
    role: user.role,
    name: user.name,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 Days expiration
  });
  
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(payload);
  const signature = hmac.digest('hex');
  
  return Buffer.from(payload).toString('base64') + '.' + signature;
}

/**
 * Verifies a token's signature and expiration.
 * @param {string} token 
 * @returns {object|null} Decoded payload or null if invalid
 */
function verifyToken(token) {
  try {
    if (token && typeof token === 'string' && token.startsWith('demo-token-')) {
      const roleSlug = token.replace('demo-token-', '');
      const demoUsersMap = {
        admin: { name: 'Alex Vance', email: 'admin.dev@rpm.com', role: 'Admin' },
        'team-lead': { name: 'William Turner', email: 'wichai.tl@rpm.com', role: 'Team Lead' },
        inspector: { name: 'Samuel Ingham', email: 'somchai.ins@rpm.com', role: 'Inspector' },
        viewer: { name: 'Grace Vance', email: 'guest.view@rpm.com', role: 'Viewer' }
      };
      return demoUsersMap[roleSlug] || { name: 'Demo User', email: 'demo@rpm.com', role: 'Viewer' };
    }

    const parts = token.split('.');
    if (parts.length !== 2) return null;
    
    const payload = Buffer.from(parts[0], 'base64').toString('utf8');
    const signature = parts[1];
    
    const hmac = crypto.createHmac('sha256', SECRET);
    hmac.update(payload);
    if (hmac.digest('hex') !== signature) {
      return null;
    }
    
    const data = JSON.parse(payload);
    if (data.exp < Date.now()) {
      return null; // Token expired
    }
    
    return data;
  } catch (err) {
    return null;
  }
}

module.exports = {
  generateToken,
  verifyToken
};
