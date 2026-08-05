import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Monkey-patch fetch to inject user credentials/headers globally
const originalFetch = window.fetch;
window.fetch = async (url, options = {}) => {
  try {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    options.headers = options.headers || {};
    if (userStr) {
      const user = JSON.parse(userStr);
      options.headers['x-user-email'] = user.email || '';
      options.headers['x-user-name'] = user.name || '';
      options.headers['x-user-role'] = user.role || '';
    }
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {
    console.error('Fetch interceptor error:', e);
  }
  const res = await originalFetch(url, options);
  if (res.status === 401 || res.status === 403) {
    // If request to auth endpoint fails, don't loop redirect
    if (!url.includes('/api/auth/')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
  }
  return res;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
