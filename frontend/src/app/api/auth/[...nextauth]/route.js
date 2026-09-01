import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import jwt from 'jsonwebtoken';

const SHARED_JWT_SECRET = process.env.SHARED_JWT_SECRET || process.env.JWT_SECRET || 'netops-secure-token-signing-key-7892';

const demoUsersMap = {
  admin: { name: 'Alex Vance', email: 'admin.dev@rpm.com', role: 'Admin', avatar: 'AV' },
  'team-lead': { name: 'William Turner', email: 'wichai.tl@rpm.com', role: 'Team Lead', avatar: 'WT' },
  inspector: { name: 'Samuel Ingham', email: 'somchai.ins@rpm.com', role: 'Inspector', avatar: 'SI' },
  viewer: { name: 'Grace Vance', email: 'guest.view@rpm.com', role: 'Viewer', avatar: 'GV' }
};

export const authOptions = {
  providers: [
    ...(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID
      ? [
          GoogleProvider({
            clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET || 'dummy-secret-if-client-side-only',
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
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          const backendPort = process.env.BACKEND_PORT || '8050';
          const syncRes = await fetch(`http://backend:${backendPort}/api/auth/sync-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              avatar: user.image,
            }),
          });
          if (syncRes.ok) {
            const dbData = await syncRes.json();
            if (dbData?.user) {
              user.role = dbData.user.role;
              user.name = dbData.user.name;
              user.area = dbData.user.area;
              user.subarea = dbData.user.subarea;
            }
          }
        } catch (e) {
          console.error('Error syncing Google user with backend:', e);
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role || token.role || 'Viewer';
        token.name = user.name || token.name;
        token.email = user.email || token.email;
        token.picture = user.image || token.picture;
        token.area = user.area || token.area;
        token.subarea = user.subarea || token.subarea;

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
        session.user.area = token.area;
        session.user.subarea = token.subarea;
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
