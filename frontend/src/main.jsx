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
  return originalFetch(url, options);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
