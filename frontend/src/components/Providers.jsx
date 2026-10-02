'use client';
import { SessionProvider } from 'next-auth/react';
import React, { useEffect } from 'react';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

function FetchInterceptor() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!window.__fetchIntercepted) {
      window.__fetchIntercepted = true;
      const originalFetch = window.fetch;

      window.fetch = async (url, options = {}) => {
        let finalUrl = url;
        if (typeof url === 'string') {
          if (BASE_PATH && (url.startsWith('/api/') || url.startsWith('/storage/')) && !url.startsWith(BASE_PATH)) {
            finalUrl = `${BASE_PATH}${url}`;
          }
        }

        try {
          const userStr = localStorage.getItem('user');
          const token = localStorage.getItem('token');
          const user = userStr ? JSON.parse(userStr) : null;

          if (options.headers instanceof Headers) {
            if (user) {
              if (user.email && !options.headers.has('x-user-email')) options.headers.set('x-user-email', user.email);
              if (user.name && !options.headers.has('x-user-name')) options.headers.set('x-user-name', user.name);
              if (user.role && !options.headers.has('x-user-role')) options.headers.set('x-user-role', user.role);
            }
            if (token && !options.headers.has('Authorization')) {
              options.headers.set('Authorization', `Bearer ${token}`);
            }
          } else {
            options.headers = options.headers || {};
            if (user) {
              if (user.email && !options.headers['x-user-email']) options.headers['x-user-email'] = user.email;
              if (user.name && !options.headers['x-user-name']) options.headers['x-user-name'] = user.name;
              if (user.role && !options.headers['x-user-role']) options.headers['x-user-role'] = user.role;
            }
            if (token && !options.headers['Authorization']) {
              options.headers['Authorization'] = `Bearer ${token}`;
            }
          }
        } catch (e) {
          console.error('Fetch interceptor error:', e);
        }

        const res = await originalFetch(finalUrl, options);

        if (res.status === 401 || res.status === 403) {
          const urlStr = typeof finalUrl === 'string' ? finalUrl : finalUrl?.url || '';
          if (!urlStr.includes('/api/auth/')) {
            try {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
            } catch (e) {}
            const rootPath = BASE_PATH ? `${BASE_PATH}/` : '/';
            if (window.location.pathname !== rootPath && window.location.pathname !== BASE_PATH) {
              window.location.href = rootPath;
            }
          }
        }
        return res;
      };
    }
  }, []);

  return null;
}

export default function Providers({ children, session }) {
  return (
    <SessionProvider session={session}>
      <FetchInterceptor />
      {children}
    </SessionProvider>
  );
}
