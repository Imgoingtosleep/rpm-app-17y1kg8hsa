'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupQrPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [theme, setTheme] = useState('dark');

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

  const handleGenerateQR = async (e) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage('กรุณากรอก Email ให้ถูกต้อง (เช่น somchai@uih.co.th)');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/auth/totp/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data);
      } else {
        setErrorMessage(data.error || 'ไม่สามารถสร้าง QR Code ได้');
      }
    } catch (err) {
      setErrorMessage('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ Backend ได้');
    } finally {
      setLoading(false);
    }
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

      {/* Main Card */}
      <div className="w-full max-w-md bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5 relative overflow-hidden z-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <span className="font-black text-4xl bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent tracking-tighter mb-1">
            UIH RPM Portal
          </span>
          <h1 className="text-lg font-bold text-white">
            ลงทะเบียนสร้าง QR Code Authenticator
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            กรอก Email ประจำตัวเพื่อสร้าง QR Code สำหรับสแกนเข้าแอป
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-3 bg-red-900/20 border border-red-500/40 rounded-xl text-red-400 text-xs text-center leading-relaxed">
            {errorMessage}
          </div>
        )}

        {!result ? (
          <form onSubmit={handleGenerateQR} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Email ผู้ใช้งาน: <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="เช่น somchai@uih.co.th"
                className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <p className="text-[10px] text-amber-400/90 mt-1 flex items-center gap-1">
                <span>💡</span>
                <span>หมายเหตุ: ต้องเป็น Email ที่เคยล็อกอินผ่าน Google หรือมีข้อมูลในระบบแล้วเท่านั้น</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                ชื่อ - นามสกุล (ถ้ามี):
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น สมชาย ใจดี"
                className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>กำลังสร้าง QR Code...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  สร้าง QR Code ประจำตัว
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full py-2.5 text-xs text-gray-400 hover:text-white font-semibold transition-colors"
            >
              ← กลับไปหน้าเข้าสู่ระบบ
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-center animate-in fade-in">
            <div className="bg-dark-bg border border-dark-border rounded-2xl p-4 flex flex-col items-center justify-center space-y-2.5 shadow-inner">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 text-xs font-semibold">
                <span>บัญชี:</span>
                <span className="text-white font-bold">{result.email}</span>
              </div>

              {/* QR Image */}
              <div className="w-[160px] h-[160px] bg-white rounded-xl flex items-center justify-center p-2 shadow">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                    result.otpauth_url
                  )}`}
                  alt="Personal Authenticator QR Code"
                  className="w-[145px] h-[145px] rounded"
                />
              </div>

              {/* Key Code */}
              {result.secret && (
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-gray-400">Key:</span>
                  <code className="bg-dark-card border border-dark-border px-2 py-0.5 rounded text-indigo-300 font-mono font-bold select-all text-[11px]">
                    {result.secret}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(result.secret)}
                    className="px-1.5 py-0.5 bg-dark-card hover:bg-indigo-600 border border-dark-border rounded text-[10px] text-gray-300 hover:text-white transition-all"
                  >
                    {copiedSecret ? '✓' : 'คัดลอก'}
                  </button>
                </div>
              )}

              <div className="text-[11px] text-gray-400 leading-relaxed text-left bg-dark-card p-3 rounded-xl border border-dark-border/60 w-full space-y-1">
                <p className="font-bold text-gray-300">วิธีใช้งาน:</p>
                <p>1. เปิดแอป Google Authenticator หรือ Microsoft Authenticator</p>
                <p>2. สแกน QR Code นี้ (จะขึ้นเป็นอีเมลของคุณในแอป)</p>
                <p>3. กดปุ่มด้านล่างเพื่อกลับไปกรอกรหัส OTP 6 หลักเข้าสู่ระบบ</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push('/')}
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
    </div>
  );
}
