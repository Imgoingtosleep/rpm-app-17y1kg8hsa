/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/auth/totp/:path*',
        destination: 'http://backend:1050/api/auth/totp/:path*',
      },
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',
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
