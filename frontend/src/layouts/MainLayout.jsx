import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MainLayout({ children, currentStep, currentSite, onNavigateBack }) {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDropdownOpen]);

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

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);
  const [scopeData, setScopeData] = useState(null);
  const [accessibleSitesCount, setAccessibleSitesCount] = useState(0);
  const [loadingScope, setLoadingScope] = useState(false);

  const parseScopeList = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string' && raw.startsWith('[')) {
      try { return JSON.parse(raw); } catch (e) {}
    }
    return typeof raw === 'string' ? raw.split(',').map(s => s.trim()).filter(Boolean) : [];
  };

  const handleOpenScopeModal = async () => {
    setIsDropdownOpen(false);
    setIsScopeModalOpen(true);
    setLoadingScope(true);

    try {
      const userRes = await fetch('/api/users/me');
      let currentUserData = user;
      if (userRes.ok) {
        currentUserData = await userRes.json();
      }

      setScopeData(currentUserData);

      const sitesRes = await fetch('/api/sites');
      if (sitesRes.ok) {
        const sites = await sitesRes.json();
        const userAreas = parseScopeList(currentUserData?.area);
        const userSubareas = parseScopeList(currentUserData?.subarea);
        const isAdmin = currentUserData?.role === 'Admin';

        const allowed = sites.filter(s => {
          if (isAdmin) return true;
          if (userAreas.length > 0 && !userAreas.includes('All') && !userAreas.includes(s.area)) {
            return false;
          }
          if (userSubareas.length > 0 && !userSubareas.includes('All') && !userSubareas.includes(s.subarea)) {
            return false;
          }
          return true;
        });

        setAccessibleSitesCount(allowed.length);
      }
    } catch (err) {
      console.error('Error loading user scope:', err);
    } finally {
      setLoadingScope(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('inspectorName');
    navigate('/');
  };

  return (
    <div className="min-h-[100dvh] bg-dark-bg text-gray-100 flex flex-col md:flex-row font-sans relative">
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 w-64 bg-dark-card border-r border-dark-border flex flex-col justify-between shrink-0 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div>
          <div className="p-6 border-b border-dark-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-black text-xl text-white tracking-tight">UIH</span>
              <div>
                <h1 className="text-base font-extrabold bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent leading-none">RPM Portal</h1>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Power Monitor System</p>
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-gray-400 hover:text-white p-1"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => { navigate('/select-site'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                currentStep === 'gatekeeper'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-lg'
                  : 'text-gray-400 hover:bg-dark-accent hover:text-gray-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m3 0v-4a1 1 0 011-1h2a1 1 0 011 1v4m-4 0h4" />
              </svg>
              <span>เลือกสถานีตรวจเช็ค</span>
            </button>

            {/* {user?.role === 'Admin' && (
              <button
                onClick={() => { navigate('/create-site'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  currentStep === 'create-site'
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-lg'
                    : 'text-gray-400 hover:bg-dark-accent hover:text-gray-200'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>เพิ่มสถานีใหม่</span>
              </button>
            )} */}

            {user?.role === 'Admin' && (
              <button
                onClick={() => { navigate('/admin/dashboard'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  currentStep === 'admin-dashboard'
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-lg'
                    : 'text-gray-400 hover:bg-dark-accent hover:text-gray-200'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Dashboard รายงาน</span>
              </button>
            )}

            {user?.role === 'Admin' && (
              <button
                onClick={() => { navigate('/admin/storage'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  currentStep === 'storage-browser'
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-lg'
                    : 'text-gray-400 hover:bg-dark-accent hover:text-gray-200'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>คลังรูปภาพและไฟล์</span>
              </button>
            )}

            {user?.role === 'Admin' && (
              <button
                onClick={() => { navigate('/admin/query'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  currentStep === 'db-query'
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-lg'
                    : 'text-gray-400 hover:bg-dark-accent hover:text-gray-200'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                <span>ฐานข้อมูล SQL</span>
              </button>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-dark-border">
          <div className="p-3 bg-dark-bg/60 rounded-xl border border-dark-border/40 text-center">
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">UIH RPM System</p>
            <p className="text-xs text-gray-400 font-bold mt-0.5">v1.0.2 (Production)</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <header className="h-16 bg-dark-card border-b border-dark-border px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-gray-400 hover:text-white p-2 rounded-lg bg-dark-bg border border-dark-border"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {currentSite ? (
              <div className="flex items-center gap-3">
                {onNavigateBack && (
                  <button
                    onClick={onNavigateBack}
                    className="p-2 rounded-xl text-gray-400 hover:text-white bg-dark-bg border border-dark-border hover:bg-dark-accent transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm md:text-base font-extrabold text-white truncate max-w-[200px] sm:max-w-md">{currentSite.name}</h2>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                      {currentSite.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-medium truncate max-w-[220px] sm:max-w-md">{currentSite.location}</p>
                </div>
              </div>
            ) : (
              <h2 className="text-sm md:text-base font-extrabold text-white">
                {currentStep === 'gatekeeper' && 'ระบบเลือกสถานีและบันทึกผล RPM'}
                {currentStep === 'create-site' && 'เพิ่มสถานีใหม่เข้าสู่ระบบ'}
                {currentStep === 'admin-dashboard' && 'Dashboard รายงานและการจัดการ'}
                {currentStep === 'storage-browser' && 'คลังเก็บรูปภาพและไฟล์ระบบ'}
                {currentStep === 'db-query' && 'ระบบสอบถามและจัดการฐานข้อมูล'}
              </h2>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 md:px-3 md:py-1.5 rounded-xl bg-dark-bg border border-dark-border hover:border-gray-600 transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-bold text-white text-xs shadow-md">
                  {user?.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
                </div>
                <span className="text-xs font-bold text-gray-200 group-hover:text-white transition-colors truncate max-w-[120px]">
                  {user?.name || 'User'} ({user?.role || 'Viewer'})
                </span>
                <svg className="hidden md:inline w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-dark-card border border-dark-border rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-dark-border/60">
                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">บัญชีผู้ใช้</p>
                    <p className="text-sm font-bold text-white truncate mt-0.5">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email || 'no-email@google.com'}</p>
                    <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      user?.role === 'Admin' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                      user?.role === 'Team Lead' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      user?.role === 'Inspector' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    }`}>
                      Role: {user?.role || 'Viewer'}
                    </span>
                  </div>
                  {user?.role === 'Admin' && (
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        navigate('/admin/fields');
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/10 transition-colors flex items-center gap-2 border-b border-dark-border/40"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      ตั้งค่าฟิลด์กรอกข้อมูล
                    </button>
                  )}
                  {user?.role === 'Admin' && (
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        navigate('/admin/users');
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/10 transition-colors flex items-center gap-2 border-b border-dark-border/40"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      จัดการสิทธิ์ผู้ใช้งาน
                    </button>
                  )}
                  <button
                    onClick={toggleTheme}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-300 hover:bg-dark-accent/60 transition-colors flex items-center gap-2 border-b border-dark-border/40"
                  >
                    {theme === 'dark' ? (
                      <>
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                        </svg>
                        <span>โหมดสว่าง (Light Mode)</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                        <span>โหมดมืด (Dark Mode)</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleOpenScopeModal}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-colors flex items-center gap-2 border-b border-dark-border/40"
                  >
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>ตรวจสอบพื้นที่รับผิดชอบ</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    ออกจากระบบ (Logout)
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 bg-dark-bg p-4 pb-32 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {isScopeModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-dark-card border border-dark-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between border-b border-dark-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">พื้นที่และโซนย่อยรับผิดชอบ</h3>
                  <p className="text-xs text-gray-400">ขอบเขตการทำงานสำหรับบัญชีผู้ใช้งานของคุณ</p>
                </div>
              </div>
              <button
                onClick={() => setIsScopeModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-dark-accent transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loadingScope ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                กำลังโหลดข้อมูลพื้นที่รับผิดชอบ...
              </div>
            ) : (
              <div className="space-y-5">
                <div className="bg-dark-bg p-4 rounded-xl border border-dark-border/60 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-extrabold text-white">{scopeData?.name || user?.name || 'User'}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{scopeData?.email || user?.email}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                    (scopeData?.role || user?.role) === 'Admin' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                    (scopeData?.role || user?.role) === 'Team Lead' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    (scopeData?.role || user?.role) === 'Inspector' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  }`}>
                    {scopeData?.role || user?.role || 'Viewer'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-dark-bg p-4 rounded-xl border border-dark-border/60 space-y-2">
                    <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">พื้นที่รับผิดชอบ (Area)</span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {parseScopeList(scopeData?.area || user?.area).length === 0 || parseScopeList(scopeData?.area || user?.area).includes('All') ? (
                        <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-lg text-xs font-bold">
                          ทุกพื้นที่ (All Areas)
                        </span>
                      ) : (
                        parseScopeList(scopeData?.area || user?.area).map((areaItem, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold">
                            {areaItem}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-dark-bg p-4 rounded-xl border border-dark-border/60 space-y-2">
                    <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">โซนย่อยรับผิดชอบ (Subarea)</span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {parseScopeList(scopeData?.subarea || user?.subarea).length === 0 || parseScopeList(scopeData?.subarea || user?.subarea).includes('All') ? (
                        <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-lg text-xs font-bold">
                          ทุกโซนย่อย (All Subareas)
                        </span>
                      ) : (
                        parseScopeList(scopeData?.subarea || user?.subarea).map((subItem, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-bold">
                            {subItem}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-extrabold text-emerald-400">สถานีในขอบเขต</p>
                    <p className="text-[11px] text-gray-400">จำนวนสถานีทั้งหมดที่บัญชีนี้เข้าถึงและตรวจเช็คได้</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-2xl font-black text-white">{accessibleSitesCount}</span>
                    <span className="text-[10px] text-gray-400 font-semibold block">สถานี</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsScopeModalOpen(false)}
                className="px-5 py-2.5 bg-dark-bg hover:bg-dark-accent border border-dark-border text-gray-300 hover:text-white text-xs font-bold rounded-xl transition-all"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
