'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  const [errorMessage, setErrorMessage] = useState('');
  const [theme, setTheme] = useState('dark');
  const [authMethod, setAuthMethod] = useState('totp'); // 'totp', 'google', 'demo'

  // TOTP Authenticator State
  const [totpCode, setTotpCode] = useState('');
  const [totpLoading, setTotpLoading] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  
  // TOTP Setup Mode State
  const [setupMode, setSetupMode] = useState(false);
  const [setupEmail, setSetupEmail] = useState('');
  const [setupName, setSetupName] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupResult, setSetupResult] = useState(null); // { email, name, secret, otpauth_url, user }

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem('theme') || 'dark';
      setTheme(storedTheme);
      if (storedTheme === 'light') {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    } catch (e) {}
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('theme', nextTheme);
      if (nextTheme === 'light') {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    } catch (e) {}
  };

  // Check login status on page load
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      localStorage.setItem('user', JSON.stringify(session.user));
      if (session.backendToken) localStorage.setItem('token', session.backendToken);
      localStorage.setItem('inspectorName', session.user.name || 'Inspector');
      router.push('/select-site');
      return;
    }

    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (storedUser) {
      router.push('/select-site');
      return;
    }
  }, [status, session, router]);

  // Handle Generate Personalized QR Code
  const handleGenerateQR = async (e) => {
    if (e) e.preventDefault();
    if (!setupEmail || !setupEmail.includes('@')) {
      setErrorMessage('กรุณากรอก Email ให้ถูกต้อง (เช่น somchai@uih.co.th)');
      return;
    }

    setSetupLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/auth/totp/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: setupEmail.trim(),
          name: setupName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSetupResult(data);
      } else {
        setErrorMessage(data.error || 'ไม่สามารถสร้าง QR Code ได้');
      }
    } catch (err) {
      setErrorMessage('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ Backend ได้');
    } finally {
      setSetupLoading(false);
    }
  };



  // 1. Google OAuth Popup Callback (Method 2)
  const handleGoogleCredentialResponse = async (response) => {
    if (!response?.credential) return;
    setErrorMessage('');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        localStorage.setItem('inspectorName', data.user.name);
        window.location.href = '/select-site';
      } else {
        setErrorMessage(data.error || 'ยืนยันตัวตน Google ไม่สำเร็จ');
      }
    } catch (err) {
      setErrorMessage('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ Backend ได้');
    }
  };

  // 2. Initialize Google Sign-In Popup Button
  useEffect(() => {
    if (authMethod !== 'google') return;

    const setupGooglePopup = () => {
      if (window.google?.accounts?.id && clientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          const container = document.getElementById('google-popup-btn-container');
          if (container) {
            container.innerHTML = '';
            window.google.accounts.id.renderButton(container, {
              theme: 'outline',
              size: 'large',
              width: 300,
              text: 'signin_with',
              shape: 'rectangular',
              logo_alignment: 'left',
            });
          }
        } catch (err) {
          console.error('Google Popup init failed:', err);
        }
      }
    };

    if (window.google?.accounts?.id) {
      setupGooglePopup();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          setupGooglePopup();
          clearInterval(interval);
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [authMethod, clientId]);

  // 3. Handle TOTP Verify Login
  const handleTotpLogin = async (e) => {
    if (e) e.preventDefault();
    if (!totpCode.trim() || totpCode.trim().length !== 6) {
      setErrorMessage('กรุณากรอกรหัส OTP ให้ครบ 6 หลัก');
      return;
    }

    setTotpLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/auth/totp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: totpCode.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        localStorage.setItem('inspectorName', data.user.name);
        window.location.href = '/select-site';
      } else {
        setErrorMessage(data.error || 'รหัส OTP 6 หลักไม่ถูกต้อง หรือหมดอายุแล้ว');
      }
    } catch (err) {
      setErrorMessage('ไม่สามารถเชื่อมต่อระบบยืนยันตัวตนได้');
    } finally {
      setTotpLoading(false);
    }
  };

  // 4. Mock Direct Login (Demo Mode)
  const handleMockLogin = async (role) => {
    const mockUsers = {
      Admin: { name: 'Alex Vance', email: 'admin.dev@rpm.com', avatar: 'AV', role: 'Admin', area: 'All', subarea: 'All' },
      'Team Lead': { name: 'William Turner', email: 'wichai.tl@rpm.com', avatar: 'WT', role: 'Team Lead', area: '["กรุงเทพมหานคร","นนทบุรี","ปทุมธานี"]', subarea: null },
      Inspector: { name: 'Samuel Ingham', email: 'somchai.ins@rpm.com', avatar: 'SI', role: 'Inspector', area: '["กรุงเทพมหานคร","เชียงใหม่"]', subarea: '["นนทบุรี"]' },
      Viewer: { name: 'Grace Vance', email: 'guest.view@rpm.com', avatar: 'GV', role: 'Viewer', area: '["ยโสธร","อุบลราชธานี"]', subarea: null }
    };

    const mockUser = mockUsers[role] || mockUsers.Viewer;
    try {
      const res = await fetch('/api/auth/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUser),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        localStorage.setItem('inspectorName', data.user.name);
        window.location.href = '/select-site';
        return;
      }
    } catch (e) {
      console.error(e);
    }

    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('inspectorName', mockUser.name);
    window.location.href = '/select-site';
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 flex flex-col justify-center items-center px-4 py-8 font-sans relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-dark-border bg-dark-card text-gray-400 hover:text-white transition-all shadow-md active:scale-95"
          aria-label="Toggle Theme"
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

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5 relative overflow-hidden z-10">
        {/* Branding Header */}
        <div className="flex flex-col items-center text-center">
          <span className="font-black text-5xl bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent tracking-tighter mb-1.5">
            UIH
          </span>
          <h1 className="text-3xl font-black bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent tracking-tight">
            RPM Portal
          </h1>
          <span className="text-[10px] text-indigo-400 font-extrabold tracking-[0.2em] uppercase mt-1 block">
            Power Monitor System
          </span>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-3 bg-red-900/20 border border-red-500/40 rounded-xl text-red-400 text-xs text-center leading-relaxed animate-in fade-in">
            {errorMessage}
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex bg-dark-bg p-1 rounded-xl border border-dark-border gap-1">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('totp');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
              authMethod === 'totp'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Authenticator
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod('google');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
              authMethod === 'google'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod('demo');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
              authMethod === 'demo'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            ⚡ Demo Mode
          </button>
        </div>

        {/* Tab 1: Authenticator (TOTP) Login */}
        {authMethod === 'totp' && (
          <div>
            {!setupMode ? (
              /* --- A. Normal OTP Login View --- */
              <form onSubmit={handleTotpLogin} className="space-y-4">
                <div className="bg-dark-bg border border-dark-border rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2 shadow-inner">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Google / Microsoft Authenticator</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      เปิดแอป Authenticator บนมือถือ แล้วกรอกรหัส 6 หลักเพื่อเข้าสู่ระบบ
                    </p>
                  </div>
                </div>

                {/* 6-Digit Code Input */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-gray-300">
                      รหัส 6 หลักจากแอป:
                    </label>
                    <span className="text-[10px] text-gray-400">รหัสจะเปลี่ยนทุก 30 วินาที</span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoFocus
                    required
                    value={totpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setTotpCode(val);
                    }}
                    placeholder="000000"
                    className="w-full px-3.5 py-3 bg-dark-bg border border-dark-border rounded-xl text-center text-2xl tracking-[0.4em] font-mono font-bold text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={totpLoading || totpCode.length !== 6}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-indigo-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {totpLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>กำลังตรวจสอบรหัส...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      เข้าสู่ระบบด้วยรหัส 6 หลัก (Verify & Login)
                    </>
                  )}
                </button>

                {/* Setup Link */}
                <div className="pt-2 border-t border-dark-border/40 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setSetupMode(true);
                      setSetupResult(null);
                      setErrorMessage('');
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center justify-center gap-1.5 mx-auto py-1 transition-colors hover:underline"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    ลงทะเบียน / สร้าง QR Code ด้วย Email ประจำตัว
                  </button>
                </div>
              </form>
            ) : (
              /* --- B. Personalized QR Code Setup View --- */
              <div className="space-y-4 animate-in fade-in">
                {!setupResult ? (
                  <form onSubmit={handleGenerateQR} className="space-y-3.5">
                    <div className="text-center space-y-1">
                      <h3 className="text-sm font-bold text-white">สร้าง QR Code ประจำตัวผู้ใช้งาน</h3>
                      <p className="text-xs text-gray-400">
                        กรอก Email ของคุณเพื่อสร้าง QR Code ส่วนตัวสำหรับแอป Authenticator
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">
                        Email ผู้ใช้งาน: <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={setupEmail}
                        onChange={(e) => setSetupEmail(e.target.value)}
                        placeholder="เช่น somchai@uih.co.th"
                        className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">
                        ชื่อ - นามสกุล (ถ้ามี):
                      </label>
                      <input
                        type="text"
                        value={setupName}
                        onChange={(e) => setSetupName(e.target.value)}
                        placeholder="เช่น สมชาย ใจดี"
                        className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSetupMode(false);
                          setErrorMessage('');
                        }}
                        className="flex-1 py-2.5 bg-dark-bg hover:bg-dark-border border border-dark-border rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-all"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        disabled={setupLoading || !setupEmail}
                        className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {setupLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                            <span>กำลังสร้าง QR...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            สร้าง QR Code
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Display Generated Personalized QR Code */
                  <div className="space-y-3.5 text-center">
                    <div className="bg-dark-bg border border-dark-border rounded-2xl p-4 flex flex-col items-center justify-center space-y-2.5 shadow-inner">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 text-[11px] font-semibold">
                        <span>บัญชี:</span>
                        <span className="text-white font-bold">{setupResult.email}</span>
                      </div>

                      {/* QR Image */}
                      <div className="w-[160px] h-[160px] bg-white rounded-xl flex items-center justify-center p-2 shadow">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                            setupResult.otpauth_url
                          )}`}
                          alt="Personal Authenticator QR Code"
                          className="w-[145px] h-[145px] rounded"
                        />
                      </div>

                      {/* Key Code */}
                      {setupResult.secret && (
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-gray-400">Key:</span>
                          <code className="bg-dark-card border border-dark-border px-2 py-0.5 rounded text-indigo-300 font-mono font-bold select-all text-[11px]">
                            {setupResult.secret}
                          </code>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(setupResult.secret)}
                            className="px-1.5 py-0.5 bg-dark-card hover:bg-indigo-600 border border-dark-border rounded text-[10px] text-gray-300 hover:text-white transition-all"
                          >
                            {copiedSecret ? '✓' : 'คัดลอก'}
                          </button>
                        </div>
                      )}

                      <div className="text-[11px] text-gray-400 leading-relaxed text-left bg-dark-card p-2.5 rounded-xl border border-dark-border/60 w-full space-y-1">
                        <p className="font-bold text-gray-300">วิธีใช้งาน:</p>
                        <p>1. เปิดแอป Google / Microsoft Authenticator บนมือถือ</p>
                        <p>2. สแกน QR Code นี้ (จะขึ้นเป็นอีเมลของคุณในแอป)</p>
                        <p>3. กดปุ่มด้านล่างเพื่อกลับไปกรอกรหัส 6 หลักเข้าสู่ระบบ</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSetupMode(false);
                        setErrorMessage('');
                      }}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      เสร็จสิ้น / ไปหน้าล็อกอินเพื่อเข้าสู่ระบบ
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Google Login via Google Popup (Method 2) */}
        {authMethod === 'google' && (
          <div className="flex flex-col items-center justify-center space-y-3.5 py-4 min-h-[140px] text-center">
            <div>
              <h3 className="text-xs font-bold text-white mb-0.5">Google Workspace Login</h3>
              <p className="text-[11px] text-gray-400">
                เข้าสู่ระบบด้วยบัญชี Google ขององค์กรผ่านหน้าต่าง Popup
              </p>
            </div>

            {/* Google Official Popup Button Container */}
            <div className="flex justify-center min-h-[44px] items-center my-1">
              <div id="google-popup-btn-container" className="shadow-md rounded-lg overflow-hidden flex justify-center"></div>
            </div>

            <p className="text-[10px] text-gray-500 max-w-xs leading-tight">
              ยืนยันตัวตนผ่าน Google และเชื่อมต่อสิทธิ์ความปลอดภัยด้วย JWT อัตโนมัติ
            </p>
          </div>
        )}

        {/* Tab 3: Demo Mode (1-Click Role Login) */}
        {authMethod === 'demo' && (
          <div className="space-y-3 py-2">
            <p className="text-xs text-gray-400 text-center mb-1">
              เลือกสิทธิ์การใช้งานเพื่อจำลองการเข้าสู่ระบบแบบ 1-Click
            </p>
            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={() => handleMockLogin('Admin')}
                className="w-full p-3 bg-dark-bg hover:bg-purple-950/40 border border-dark-border hover:border-purple-500/50 rounded-xl text-left flex items-center justify-between transition-all group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white group-hover:text-purple-300">Alex Vance</span>
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 font-bold rounded-md text-[10px]">Admin</span>
                  </div>
                  <p className="text-[11px] text-gray-400">admin.dev@rpm.com • สิทธิ์สูงสุด จัดการระบบ</p>
                </div>
                <span className="text-purple-400 text-xs font-bold font-mono">1-Click ➔</span>
              </button>

              <button
                type="button"
                onClick={() => handleMockLogin('Team Lead')}
                className="w-full p-3 bg-dark-bg hover:bg-indigo-950/40 border border-dark-border hover:border-indigo-500/50 rounded-xl text-left flex items-center justify-between transition-all group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white group-hover:text-indigo-300">William Turner</span>
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 font-bold rounded-md text-[10px]">Team Lead</span>
                  </div>
                  <p className="text-[11px] text-gray-400">wichai.tl@rpm.com • หัวหน้าทีม ตรวจสอบงาน</p>
                </div>
                <span className="text-indigo-400 text-xs font-bold font-mono">1-Click ➔</span>
              </button>

              <button
                type="button"
                onClick={() => handleMockLogin('Inspector')}
                className="w-full p-3 bg-dark-bg hover:bg-teal-950/40 border border-dark-border hover:border-teal-500/50 rounded-xl text-left flex items-center justify-between transition-all group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white group-hover:text-teal-300">Samuel Ingham</span>
                    <span className="px-2 py-0.5 bg-teal-500/20 text-teal-400 font-bold rounded-md text-[10px]">Inspector</span>
                  </div>
                  <p className="text-[11px] text-gray-400">somchai.ins@rpm.com • ผู้ตรวจสอบ บันทึกข้อมูล</p>
                </div>
                <span className="text-teal-400 text-xs font-bold font-mono">1-Click ➔</span>
              </button>

              <button
                type="button"
                onClick={() => handleMockLogin('Viewer')}
                className="w-full p-3 bg-dark-bg hover:bg-slate-800 border border-dark-border hover:border-slate-600 rounded-xl text-left flex items-center justify-between transition-all group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white group-hover:text-gray-300">Grace Vance</span>
                    <span className="px-2 py-0.5 bg-slate-500/20 text-gray-400 font-bold rounded-md text-[10px]">Viewer</span>
                  </div>
                  <p className="text-[11px] text-gray-400">guest.view@rpm.com • ผู้ดูข้อมูลทั่วไป</p>
                </div>
                <span className="text-gray-400 text-xs font-bold font-mono">1-Click ➔</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-[11px] text-gray-500 pt-2 border-t border-dark-border/40">
          ต้องการความช่วยเหลือ? ติดต่อผู้ดูแลระบบไอที
        </div>
      </div>
    </div>
  );
}
