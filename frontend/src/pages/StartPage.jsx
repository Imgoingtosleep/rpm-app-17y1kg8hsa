import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function StartPage() {
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [errorMessage, setErrorMessage] = useState('');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const handleCredentialResponse = async (response) => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential: response.credential }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        localStorage.setItem('inspectorName', data.user.name);
        navigate('/select-site');
      } else {
        const errData = await res.json();
        setErrorMessage(errData.error || 'ยืนยันตัวตนล้มเหลว');
      }
    } catch (err) {
      setErrorMessage('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ Backend ได้');
    }
  };

  useEffect(() => {
    // Redirect if already logged in
    const user = localStorage.getItem('user');
    if (user) {
      navigate('/select-site');
      return;
    }

    const initializeGoogleSignIn = () => {
      if (window.google) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
          });

          window.google.accounts.id.renderButton(
            document.getElementById('google-signin-btn'),
            { theme: 'outline', size: 'large', width: 320 }
          );
        } catch (err) {ป
          console.error('Google Sign-In initialization failed:', err);
        }
      }
    };

    // Initialize or wait for script to load
    if (window.google) {
      initializeGoogleSignIn();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          initializeGoogleSignIn();
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  const handleMockLogin = (role) => {
    const mockUser = {
      name: role === 'Admin' ? 'Admin Developer (Demo)' : 'Somchai Inspector (Demo)',
      email: role === 'Admin' ? 'admin.dev@rpm.com' : 'somchai.ins@rpm.com',
      avatar: role === 'Admin' ? 'AD' : 'SI',
      role: role
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('inspectorName', mockUser.name);
    navigate('/select-site');
  };

  return (
    <div className="min-h-[90vh] flex flex-col justify-center items-center px-4 py-12 relative">
      {/* Floating Theme Toggle */}
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-dark-border bg-dark-card text-gray-400 hover:text-white transition-all shadow-lg active:scale-95 hover:bg-dark-accent/60"
          aria-label="Toggle Theme"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      <div className="max-w-md w-full space-y-8 bg-dark-card border border-dark-border p-8 sm:p-10 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Glow effect decorative */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center text-center">
          <span className="font-black text-6xl bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent tracking-tighter mb-4">UIH</span>
          
          <h2 className="text-4xl font-black bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent tracking-tight">RPM Portal</h2>
          <span className="text-[10px] text-indigo-400 font-extrabold tracking-[0.2em] uppercase mt-2.5 block">Power Monitor System</span>
          <p className="text-xs text-gray-400 mt-4 max-w-xs leading-relaxed">
            ระบบตรวจสอบบำรุงรักษาตู้อุปกรณ์ไฟฟ้าและระบบโครงสร้างสถานีโทรคมนาคม
          </p>
        </div>

        <div className="mt-6 space-y-5">
          {errorMessage && (
            <div className="bg-red-900/20 border border-red-500/40 rounded-xl p-3 text-xs text-red-400 text-center">
              ⚠️ {errorMessage}
            </div>
          )}

          <div className="border-t border-dark-border/60 my-6 relative">
            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-dark-card px-3 text-xs text-gray-500 font-medium">
              เข้าใช้งานระบบด้วย Google
            </span>
          </div>

          <div className="flex justify-center min-h-[44px]">
            <div id="google-signin-btn"></div>
          </div>

          <div className="border-t border-dark-border/40 my-4 pt-4 space-y-3">
            <span className="block text-[10px] text-gray-500 font-semibold text-center uppercase tracking-wider">หรือ ทดสอบระบบจำลอง (Demo Mode)</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleMockLogin('Admin')}
                className="py-2.5 px-4 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-400 hover:text-white font-bold rounded-xl text-xs transition-all active:scale-[0.98]"
              >
                📊 สิทธิ์ Admin
              </button>
              <button
                onClick={() => handleMockLogin('Inspector')}
                className="py-2.5 px-4 bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-400 hover:text-white font-bold rounded-xl text-xs transition-all active:scale-[0.98]"
              >
                📋 สิทธิ์ Inspector
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-gray-500">
            ต้องการความช่วยเหลือ? ติดต่อผู้ดูแลระบบไอที
          </div>
        </div>
      </div>
    </div>
  );
}
