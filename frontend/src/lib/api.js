'use client';
import { getSession, signOut } from 'next-auth/react';

export async function fetchWithAuth(url, options = {}) {
  let token = null;
  let user = null;

  if (typeof window !== 'undefined') {
    try {
      const session = await getSession();
      if (session?.user) {
        user = session.user;
        token = session.backendToken;
      }
    } catch (e) {
      console.error('Session retrieval error:', e);
    }

    if (!token) {
      token = localStorage.getItem('token');
    }
    if (!user) {
      const uStr = localStorage.getItem('user');
      if (uStr) user = JSON.parse(uStr);
    }
  }

  const headers = options.headers instanceof Headers 
    ? options.headers 
    : new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (user) {
    if (user.email) headers.set('x-user-email', user.email);
    if (user.name) headers.set('x-user-name', user.name);
    if (user.role) headers.set('x-user-role', user.role);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 401 || res.status === 403) {
    if (!url.includes('/api/auth/')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        signOut({ callbackUrl: '/' });
      }
    }
  }

  return res;
}
