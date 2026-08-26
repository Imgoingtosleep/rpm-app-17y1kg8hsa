'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const LOOP_WINDOW_MS = 3500; // 3.5 seconds sliding window
const MAX_TRANSITIONS = 5;   // Maximum allowed route transitions in window
const MAX_PING_PONG = 4;     // Maximum allowed A <-> B ping-pong alternations

export default function RouteLoopDetector() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentUrl = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;

  const historyRef = useRef([]);
  const [loopInfo, setLoopInfo] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const now = Date.now();
    // Keep history within sliding window
    const recent = historyRef.current.filter(item => now - item.time < LOOP_WINDOW_MS);
    recent.push({ path: currentUrl, time: now });
    historyRef.current = recent;

    // 1. Check for rapid transition flood (>= MAX_TRANSITIONS)
    if (recent.length >= MAX_TRANSITIONS) {
      const paths = recent.map(r => r.path);
      const uniquePaths = Array.from(new Set(paths));

      // 2. Check for ping-pong alternating pattern (e.g. ['/A', '/B', '/A', '/B'])
      let pingPongCount = 0;
      for (let i = 2; i < paths.length; i++) {
        if (paths[i] === paths[i - 2] && paths[i] !== paths[i - 1]) {
          pingPongCount++;
        }
      }

      if (uniquePaths.length <= 3 || pingPongCount >= MAX_PING_PONG || recent.length >= 7) {
        console.warn('⚠️ [RPM Route Guard] Detected Navigation / Redirect Loop:', {
          transitions: recent.length,
          paths,
          uniquePaths
        });

        setLoopInfo({
          count: recent.length,
          paths: uniquePaths,
          recentSeq: paths.slice(-6),
          time: new Date().toLocaleTimeString('th-TH')
        });

        // Set global flag to throttle further auto-navigation
        window.__RPM_ROUTE_LOOP_DETECTED = true;
      }
    }
  }, [currentUrl]);

  const handleBreakLoop = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      window.__RPM_ROUTE_LOOP_DETECTED = false;
    } catch (e) {}
    window.location.href = '/';
  };

  const handleDismiss = () => {
    historyRef.current = [];
    window.__RPM_ROUTE_LOOP_DETECTED = false;
    setLoopInfo(null);
  };

  if (!loopInfo) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#18181b] border-2 border-red-500/80 rounded-2xl p-6 shadow-2xl text-white space-y-4 relative overflow-hidden">
        {/* Glowing Ambient */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-xl shrink-0">
            ⚠️
          </div>
          <div>
            <h2 className="text-base font-bold text-red-400">
              ตรวจพบการเปลี่ยนเส้นทางวนลูป (Route Loop Warning)
            </h2>
            <p className="text-xs text-gray-400">
              ระบบตรวจพบการสลับหน้าไปมาอย่างรวดเร็วผิดปกติ ({loopInfo.count} ครั้ง ในเวลาไม่กี่วินาที)
            </p>
          </div>
        </div>

        {/* Details Box */}
        <div className="bg-dark-bg/90 border border-dark-border rounded-xl p-3.5 space-y-2 text-xs">
          <div className="text-gray-300 font-semibold flex justify-between items-center">
            <span>เส้นทางที่เกิดการวนซ้ำ:</span>
            <span className="text-[10px] text-gray-400 font-mono">{loopInfo.time} น.</span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {loopInfo.paths.map((p, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-red-950/60 border border-red-500/30 text-red-300 rounded font-mono text-[11px]"
              >
                {p || '/'}
              </span>
            ))}
          </div>

          <div className="pt-2 border-t border-dark-border text-[11px] text-gray-400 leading-relaxed">
            <p className="font-semibold text-gray-300 mb-0.5">สาเหตุที่อาจเกิดขึ้น:</p>
            <ul className="list-disc list-inside space-y-0.5 text-gray-400">
              <li>เงื่อนไข Redirect ในหน้าเว็บขัดแย้งกัน (เช่น หน้า A ดีดไป B แล้ว B ดีดกลับมา A)</li>
              <li>Session หรือ Token ผู้ใช้ไม่ตรงกับสิทธิ์ที่จำเป็นของหน้านั้นๆ</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleBreakLoop}
            className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-red-900/30 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            🛑 หยุดการทำงานและกลับหน้าหลัก
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="py-2.5 px-4 bg-dark-card hover:bg-dark-border border border-dark-border text-gray-300 hover:text-white font-semibold rounded-xl text-xs transition-all cursor-pointer"
          >
            ปิดเตือน
          </button>
        </div>
      </div>
    </div>
  );
}
