import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MainLayout({ children, currentStep, currentSite, onNavigateBack }) {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('inspectorName');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 flex flex-col md:flex-row font-sans relative overflow-x-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-dark-card border-r border-dark-border flex flex-col justify-between shrink-0 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div>
          {/* Logo / Header */}
          <div className="p-6 border-b border-dark-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-md">
                R
              </div>
              <div>
                <h1 className="font-bold text-lg leading-none text-white tracking-wide">RPM Portal</h1>
                <span className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase">Power Monitor</span>
              </div>
            </div>
            {/* Close Button on Mobile */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-gray-400 hover:text-white p-1 rounded-lg hover:bg-dark-accent"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <button 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                currentStep === 'gatekeeper' 
                  ? 'bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500 font-semibold' 
                  : 'text-gray-400 hover:bg-dark-accent hover:text-gray-200'
              }`}
              onClick={() => {
                onNavigateBack();
                setIsSidebarOpen(false);
              }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Site Selector
            </button>

            {currentSite && (
              <div className="pt-4 px-2">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Active Work Order</span>
                <div className="mt-2 p-3 bg-dark-accent/40 rounded-lg border border-dark-border/60">
                  <p className="text-xs font-semibold text-gray-300 truncate">{currentSite.name}</p>
                  <p className="text-[10px] text-indigo-400 font-mono mt-1">{currentSite.code}</p>
                </div>
              </div>
            )}
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-dark-border text-center text-xs text-gray-500">
          v1.0.0 &bull; Node & React
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Topbar */}
        <header className="h-16 bg-dark-card border-b border-dark-border px-4 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {/* Hamburger Button on Mobile */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white transition-colors mr-1"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {currentStep === 'workorder' && (
              <button 
                onClick={onNavigateBack}
                className="mr-2 text-gray-400 hover:text-white transition-colors"
              >
                &larr; <span className="hidden sm:inline">Back</span>
              </button>
            )}
            <span className="text-xs sm:text-sm font-semibold text-gray-300 truncate max-w-[150px] sm:max-w-none">
              {currentStep === 'gatekeeper' ? 'Gatekeeper Stage' : 'Work Order Form Submission'}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 relative">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-emerald-500/10 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Online
            </span>
            
            {/* User Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 focus:outline-none group"
              >
                {user?.avatar && user.avatar.startsWith('http') ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="h-8 w-8 rounded-full object-cover border border-indigo-500/30 group-hover:border-indigo-500 transition-all duration-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-sm border border-indigo-500/30 group-hover:border-indigo-500 transition-all duration-200">
                    {user?.avatar || 'U'}
                  </div>
                )}
                <span className="hidden md:inline text-sm text-gray-300 group-hover:text-white transition-colors max-w-[150px] truncate">
                  {user?.name || 'User'} ({user?.role || 'Viewer'})
                </span>
                <svg className="hidden md:inline w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-dark-card border border-dark-border rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-dark-border/60">
                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">บัญชีผู้ใช้</p>
                    <p className="text-sm font-bold text-white truncate mt-0.5">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email || 'no-email@google.com'}</p>
                    <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      user?.role === 'Admin' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                      user?.role === 'Inspector' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      Role: {user?.role || 'Viewer'}
                    </span>
                  </div>
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

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto bg-dark-bg p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
