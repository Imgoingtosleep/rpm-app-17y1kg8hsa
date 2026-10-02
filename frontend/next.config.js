/** @type {import('next').NextConfig} */
const BACKEND_PORT = process.env.BACKEND_PORT || '8050';
const BACKEND_HOST = process.env.BACKEND_HOST || 'backend';

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/auth/google',
        destination: `http://${BACKEND_HOST}:${BACKEND_PORT}/api/auth/google`,
      },
      {
        source: '/api/auth/mock',
        destination: `http://${BACKEND_HOST}:${BACKEND_PORT}/api/auth/mock`,
      },
      {
        source: '/api/auth/totp/:path*',
        destination: `http://${BACKEND_HOST}:${BACKEND_PORT}/api/auth/totp/:path*`,
      },
      {
        source: '/api/auth/sync-user',
        destination: `http://${BACKEND_HOST}:${BACKEND_PORT}/api/auth/sync-user`,
      },
      {
        source: '/api/auth/session',
        destination: '/api/auth/session',
      },
      {
        source: '/api/auth/csrf',
        destination: '/api/auth/csrf',
      },
      {
        source: '/api/auth/providers',
        destination: '/api/auth/providers',
      },
      {
        source: '/api/auth/signin/:path*',
        destination: '/api/auth/signin/:path*',
      },
      {
        source: '/api/auth/callback/:path*',
        destination: '/api/auth/callback/:path*',
      },
      {
        source: '/api/auth/signout/:path*',
        destination: '/api/auth/signout/:path*',
      },
      {
        source: '/api/:path*',
        destination: `http://${BACKEND_HOST}:${BACKEND_PORT}/api/:path*`,
      },
      {
        source: '/storage/:path*',
        destination: `http://${BACKEND_HOST}:${BACKEND_PORT}/storage/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
