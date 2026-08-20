import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import jwt from 'jsonwebtoken';

const SHARED_JWT_SECRET = process.env.SHARED_JWT_SECRET || process.env.JWT_SECRET;

const demoUsersMap = {
  admin: { name: 'Alex Vance', email: 'admin.dev@rpm.com', role: 'Admin', avatar: 'AV' },
  'team-lead': { name: 'William Turner', email: 'wichai.tl@rpm.com', role: 'Team Lead', avatar: 'WT' },
  inspector: { name: 'Samuel Ingham', email: 'somchai.ins@rpm.com', role: 'Inspector', avatar: 'SI' },
  viewer: { name: 'Grace Vance', email: 'guest.view@rpm.com', role: 'Viewer', avatar: 'GV' }
};

export const authOptions = {
  providers: [
    ...(process.env.VITE_GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID
      ? [
          GoogleProvider({
            clientId: process.env.VITE_GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || 'dummy-secret-if-client-side-only',
          }),
        ]
      : []),
    CredentialsProvider({
      id: 'demo-login',
      name: 'Demo Login',
      credentials: {
        role: { label: 'Role', type: 'text' },
      },
      async authorize(credentials) {
        const roleKey = (credentials?.role || 'viewer').toLowerCase().replace(/\s+/g, '-');
        const user = demoUsersMap[roleKey] || demoUsersMap.viewer;
        return {
          id: roleKey,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role || 'Viewer';
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;

        token.backendToken = jwt.sign(
          {
            email: token.email,
            name: token.name,
            role: token.role,
          },
          SHARED_JWT_SECRET,
          { expiresIn: '7d' }
        );
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role || 'Viewer';
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.image = token.picture;
        session.backendToken = token.backendToken;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'rpm-secure-auth-secret-key-9988',
  pages: {
    signIn: '/',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
