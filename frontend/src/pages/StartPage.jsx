import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function StartPage() {
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    // Mock login with Google
    const mockUser = {
      name: 'Anan Developer',
      email: 'anan.dev@rpm.com',
      avatar: 'AD'
    };
    
    // Store user session in localStorage
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('inspectorName', mockUser.name); // Prefill inspector name
    
    // Navigate to Site Selector
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

        <div className="mt-8 space-y-6">
          <div className="border-t border-dark-border/60 my-6 relative">
            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-dark-card px-3 text-xs text-gray-500 font-medium">
              เข้าใช้งานระบบด้วยบัญชีองค์กร
            </span>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-xl text-sm transition-all shadow-lg hover:shadow-white/5 active:scale-[0.98]"
          >
            {/* Google Vector Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          <div className="text-center text-xs text-gray-500 pt-4">
            ต้องการความช่วยเหลือ? ติดต่อผู้ดูแลระบบไอที
          </div>
        </div>
      </div>
    </div>
  );
}
