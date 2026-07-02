import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function StartPage() {
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [errorMessage, setErrorMessage] = useState('');

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
        } catch (err) {
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
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-dark-card border border-dark-border p-8 sm:p-10 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Glow effect decorative */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center text-center">
          {/* Logo Icon */}
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-extrabold text-white text-3xl shadow-xl shadow-indigo-500/20 mb-6">
            R
          </div>
          
          <h2 className="text-3xl font-extrabold text-white tracking-tight">RPM Portal</h2>
          <p className="text-sm text-gray-400 mt-2 max-w-xs">
            ระบบตรวจสอบบำรุงรักษาตู้อุปกรณ์ไฟฟ้าและระบบโครงสร้างสถานีโทรคมนาคม (Power Monitor System)
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
