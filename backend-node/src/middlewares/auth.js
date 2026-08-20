const { verifyToken } = require('../services/tokenService');

/**
 * Middleware to verify token and populate x-user headers securely.
 */
function authenticateToken(req, res, next) {
  // Allow public endpoints to pass without auth check
  const publicPaths = ['/api/auth/', '/api/health', '/auth/', '/health'];
  const targetUrl = req.originalUrl || req.url || req.path || '';
  if (publicPaths.some(p => targetUrl.includes(p))) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <token>

  if (!token) {
    // For local development fallback if x-user-email is provided and env is dev, 
    // but in production, require token.
    if (process.env.NODE_ENV !== 'production' && req.headers['x-user-email']) {
      return next();
    }
    return res.status(401).json({ error: 'Access Denied: No Token Provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Access Denied: Invalid or Expired Token' });
  }

  // Override / set headers based on verified token details to prevent header spoofing
  req.headers['x-user-email'] = decoded.email;
  req.headers['x-user-role'] = decoded.role;
  req.headers['x-user-name'] = decoded.name;
  
  next();
}

module.exports = {
  authenticateToken
};
