/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/auth/google',
        destination: 'http://backend:1050/api/auth/google',
      },
      {
        source: '/api/auth/mock',
        destination: 'http://backend:1050/api/auth/mock',
      },
      {
        source: '/api/auth/totp/:path*',
        destination: 'http://backend:1050/api/auth/totp/:path*',
      },
      {
        source: '/api/auth/sync-user',
        destination: 'http://backend:1050/api/auth/sync-user',
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
        destination: 'http://backend:1050/api/:path*',
      },
      {
        source: '/storage/:path*',
        destination: 'http://backend:1050/storage/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
