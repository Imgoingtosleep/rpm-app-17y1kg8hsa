'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from '../utils/navigation';

export default function DatabaseQuery() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [sql, setSql] = useState('SELECT * FROM sites LIMIT 10;');
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [expandedTable, setExpandedTable] = useState(null);


  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed);
        if (parsed.role !== 'Admin') {
          alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (เฉพาะ Admin เท่านั้น)');
          navigate('/select-site');
          return;
        }
        fetchTables();
        fetchCycles();
      } else {
        navigate('/');
      }
    } catch (e) {
      navigate('/');
    }
  }, []);

  const [cycles, setCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('A');

  const fetchCycles = async () => {
    try {
      const stored = localStorage.getItem('user');
      const parsed = stored ? JSON.parse(stored) : null;
      const res = await fetch('/api/query/cycles', {
        headers: {
          'x-user-email': parsed?.email || '',
          'x-user-name': parsed?.name || '',
          'x-user-role': parsed?.role || ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCycles(data);
        if (data.length > 0) {
          setSelectedCycle(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTables = async () => {
    setLoadingTables(true);
    try {
      const stored = localStorage.getItem('user');
      const parsed = stored ? JSON.parse(stored) : null;
      
      const res = await fetch('/api/query/tables', {
        headers: {
          'x-user-email': parsed?.email || '',
          'x-user-name': parsed?.name || '',
          'x-user-role': parsed?.role || ''
        }
      });
      if (!res.ok) throw new Error('ไม่สามารถดึงโครงสร้างตารางได้');
      const data = await res.json();
      setTables(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTables(false);
    }
  };

  const handleExecute = async () => {
    if (!sql.trim()) return;
    setExecuting(true);
    setError(null);
    setResult(null);
    const startTime = performance.now();
    try {
      const res = await fetch('/api/query/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || '',
          'x-user-name': currentUser?.name || '',
          'x-user-role': currentUser?.role || ''
        },
        body: JSON.stringify({ sql })
      });
      const data = await res.json();
      const endTime = performance.now();
      const durationMs = Math.round(endTime - startTime);

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'การประมวลผลคำสั่งผิดพลาด');
      }

      setResult({
        ...data,
        durationMs
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setExecuting(false);
    }
  };

  // Keyboard shortcut Ctrl+Enter to run query
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  const loadQueryTemplate = (templateSql) => {
    setSql(templateSql);
  };

  const exportToCSV = () => {
    if (!result || !result.rows || result.rows.length === 0) return;
    const fields = result.fields;
    const csvContent = [
      fields.join(','),
      ...result.rows.map(row => 
        fields.map(field => {
          const val = row[field];
          if (val === null || val === undefined) return '';
          const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `query_result_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRows = result?.rows ? result.rows.filter(row => {
    if (!searchFilter) return true;
    const filter = searchFilter.toLowerCase();
    return Object.values(row).some(val => 
      val !== null && val !== undefined && String(val).toLowerCase().includes(filter)
    );
  }) : [];

  return (
    <div className="space-y-6 text-gray-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
            Database Query Console
          </h2>
          <p className="text-gray-400 mt-1">สอบถาม ค้นหา หรือประมวลผลข้อมูลในระบบโดยตรงด้วยคำสั่ง SQL (สำหรับผู้ดูแลระบบ)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Tables & Schema */}
        <div className="lg:col-span-1 bg-dark-card border border-dark-border rounded-xl p-4 flex flex-col h-[600px] overflow-hidden">
          <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center justify-between">
            <span>ตารางข้อมูลในระบบ ({tables.length})</span>
            <button 
              onClick={fetchTables} 
              className="text-indigo-400 hover:text-indigo-300 p-1 rounded hover:bg-dark-accent" 
              title="Refresh Schema"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 12H19" />
              </svg>
            </button>
          </h3>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-indigo-500/20 scrollbar-track-transparent">
            {loadingTables ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
              </div>
            ) : tables.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">ไม่พบตารางในฐานข้อมูล</p>
            ) : (
              tables.map(table => (
                <div key={table.tableName} className="border border-dark-border/40 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedTable(expandedTable === table.tableName ? null : table.tableName)}
                    className="w-full text-left px-3 py-2 bg-dark-bg/60 hover:bg-dark-accent/40 text-xs font-semibold text-gray-300 flex items-center justify-between transition-colors"
                  >
                    <span className="font-mono text-indigo-300 truncate">{table.tableName}</span>
                    <svg 
                      className={`w-3.5 h-3.5 text-gray-500 transform transition-transform ${expandedTable === table.tableName ? 'rotate-90' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {expandedTable === table.tableName && (
                    <div className="p-2 bg-dark-card border-t border-dark-border/40 space-y-1 max-h-60 overflow-y-auto">
                      <button
                        onClick={() => loadQueryTemplate(`SELECT * FROM ${table.tableName} LIMIT 100;`)}
                        className="w-full text-[10px] font-bold text-center py-1 px-2 border border-dashed border-indigo-500/30 hover:border-indigo-500 text-indigo-400 hover:text-indigo-300 bg-indigo-500/5 hover:bg-indigo-500/10 rounded transition-all mb-2"
                      >
                        + Generate SELECT *
                      </button>
                      
                      {table.columns.map(col => (
                        <div key={col.name} className="flex justify-between items-center text-[10px] px-1 font-mono text-gray-400">
                          <span className="truncate mr-1 text-gray-300" title={col.name}>{col.name}</span>
                          <span className="text-gray-500 text-right shrink-0">{col.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Query Editor & Results */}
        <div className="lg:col-span-3 space-y-6">
          {/* Editor Card */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-300">ตัวแก้ไขคำสั่ง SQL</span>
                <span className="text-xs text-gray-500 font-mono">(Ctrl + Enter เพื่อสั่งรัน)</span>
              </div>
              
              {/* Quick Template Picker */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mr-1">คำสั่งทั่วไป:</span>
                <button
                  onClick={() => loadQueryTemplate('SELECT * FROM sites ORDER BY site_code;')}
                  className="px-2 py-1 bg-dark-bg hover:bg-dark-accent rounded text-[10px] font-mono text-indigo-400 border border-dark-border/60 transition-colors"
                >
                  Sites list
                </button>
                <button
                  onClick={() => loadQueryTemplate('SELECT * FROM users ORDER BY created_at DESC;')}
                  className="px-2 py-1 bg-dark-bg hover:bg-dark-accent rounded text-[10px] font-mono text-indigo-400 border border-dark-border/60 transition-colors"
                >
                  Users list
                </button>
                <button
                  onClick={() => loadQueryTemplate('SELECT * FROM rpm_records_master ORDER BY rpm_id DESC LIMIT 20;')}
                  className="px-2 py-1 bg-dark-bg hover:bg-dark-accent rounded text-[10px] font-mono text-indigo-400 border border-dark-border/60 transition-colors"
                >
                  Recent RPMs
                </button>
                <button
                  onClick={() => loadQueryTemplate('SELECT NOW();')}
                  className="px-2 py-1 bg-dark-bg hover:bg-dark-accent rounded text-[10px] font-mono text-gray-400 border border-dark-border/60 transition-colors"
                >
                  Test Conn
                </button>

                <div className="w-full h-px my-1 bg-dark-border/40"></div>

                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mr-1">การตั้งค่าสิทธิ์ (สิทธิ์ผู้ใช้งาน):</span>
                <button
                  onClick={() => loadQueryTemplate("UPDATE users SET role = 'Admin' WHERE email = 'อีเมลของสิทธิ์_admin@google.com';")}
                  className="px-2 py-1 bg-indigo-950/30 hover:bg-indigo-900/30 rounded text-[10px] font-mono text-indigo-300 border border-indigo-500/20 transition-colors font-semibold"
                >
                  + เพิ่มสิทธิ์ Admin
                </button>
                <button
                  onClick={() => loadQueryTemplate("UPDATE users SET role = 'Inspector' WHERE email = 'อีเมลของสิทธิ์_inspector@google.com';")}
                  className="px-2 py-1 bg-emerald-950/30 hover:bg-emerald-900/30 rounded text-[10px] font-mono text-emerald-300 border border-emerald-500/20 transition-colors font-semibold"
                >
                  + ตั้งสิทธิ์ Inspector
                </button>
                <button
                  onClick={() => loadQueryTemplate("UPDATE users SET role = 'Viewer' WHERE email = 'อีเมลของสิทธิ์_viewer@google.com';")}
                  className="px-2 py-1 bg-gray-900 hover:bg-gray-800 rounded text-[10px] font-mono text-gray-300 border border-dark-border/60 transition-colors font-semibold"
                >
                  ลดสิทธิ์เป็น Viewer
                </button>
                <button
                  onClick={() => loadQueryTemplate('SELECT role, COUNT(*) FROM users GROUP BY role;')}
                  className="px-2 py-1 bg-dark-bg hover:bg-dark-accent rounded text-[10px] font-mono text-amber-400 border border-dark-border/60 transition-colors"
                >
                  ดูสถิติสิทธิ์ทั้งหมด
                </button>

                <div className="w-full h-px my-1 bg-dark-border/40"></div>

                <div className="flex items-center gap-2 flex-wrap w-full">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mr-1">สอบถามข้อมูลรอบ RPM:</span>
                  <select
                    value={selectedCycle}
                    onChange={(e) => setSelectedCycle(e.target.value)}
                    className="bg-dark-bg border border-dark-border text-[10px] rounded px-2 py-1 text-gray-300 font-mono focus:outline-none focus:border-indigo-500"
                  >
                    {cycles.length === 0 ? (
                      <option value="">-- ไม่พบรอบ RPM --</option>
                    ) : (
                      cycles.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))
                    )}
                  </select>
                  
                  {selectedCycle && (
                    <>
                      <button
                        onClick={() => loadQueryTemplate(`SELECT * FROM rpm_records_master WHERE rpm_cycle = '${selectedCycle}' ORDER BY rpm_id DESC;`)}
                        className="px-2 py-1 bg-indigo-950/20 hover:bg-indigo-900/30 rounded text-[10px] font-mono text-indigo-400 border border-indigo-500/20 transition-colors"
                      >
                        ดูใบงานรอบ {selectedCycle}
                      </button>
                      <button
                        onClick={() => loadQueryTemplate(`SELECT site_code, job_number_sl6, sap_number, summary_issue, status FROM rpm_records_master WHERE rpm_cycle = '${selectedCycle}' ORDER BY site_code;`)}
                        className="px-2 py-1 bg-indigo-950/20 hover:bg-indigo-900/30 rounded text-[10px] font-mono text-indigo-400 border border-indigo-500/20 transition-colors"
                      >
                        สรุปปัญหาหน้างานรอบ {selectedCycle}
                      </button>
                      <button
                        onClick={() => loadQueryTemplate(`SELECT r.site_code, r.rpm_cycle, a.* FROM power_main_ac a JOIN rpm_records_master r ON a.rpm_id = r.rpm_id WHERE r.rpm_cycle = '${selectedCycle}' ORDER BY r.site_code;`)}
                        className="px-2 py-1 bg-indigo-950/20 hover:bg-indigo-900/30 rounded text-[10px] font-mono text-indigo-400 border border-indigo-500/20 transition-colors"
                      >
                        ดูระบบไฟฟ้า AC รอบ {selectedCycle}
                      </button>
                      <button
                        onClick={() => loadQueryTemplate(`SELECT r.site_code, r.rpm_cycle, p.* FROM power_rectifier p JOIN rpm_records_master r ON p.rpm_id = r.rpm_id WHERE r.rpm_cycle = '${selectedCycle}' ORDER BY r.site_code;`)}
                        className="px-2 py-1 bg-indigo-950/20 hover:bg-indigo-900/30 rounded text-[10px] font-mono text-indigo-400 border border-indigo-500/20 transition-colors"
                      >
                        ดูตู้ Rectifier รอบ {selectedCycle}
                      </button>
                    </>
                  )}
                </div>

                <div className="w-full h-px my-1 bg-dark-border/40"></div>

                <div className="flex items-center gap-2 flex-wrap w-full">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mr-1">สอบถามข้อมูลตาม Site Grade:</span>
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="bg-dark-bg border border-dark-border text-[10px] rounded px-2 py-1 text-gray-300 font-mono focus:outline-none focus:border-indigo-500"
                  >
                    <option value="A">Grade A</option>
                    <option value="B">Grade B</option>
                    <option value="C">Grade C</option>
                  </select>

                  <button
                    onClick={() => loadQueryTemplate(`SELECT * FROM sites WHERE site_grade = '${selectedGrade}' ORDER BY site_code;`)}
                    className="px-2 py-1 bg-indigo-950/20 hover:bg-indigo-900/30 rounded text-[10px] font-mono text-amber-400 border border-amber-500/20 transition-colors"
                  >
                    ดูข้อมูลสถานีเกรด {selectedGrade}
                  </button>
                  <button
                    onClick={() => loadQueryTemplate(`SELECT r.*, s.site_name, s.site_grade FROM rpm_records_master r JOIN sites s ON r.site_code = s.site_code WHERE s.site_grade = '${selectedGrade}' ORDER BY r.site_code;`)}
                    className="px-2 py-1 bg-indigo-950/20 hover:bg-indigo-900/30 rounded text-[10px] font-mono text-indigo-400 border border-indigo-500/20 transition-colors"
                  >
                    ดูใบงานทั้งหมดเกรด {selectedGrade}
                  </button>
                  <button
                    onClick={() => loadQueryTemplate(`SELECT r.site_code, s.site_name, s.site_grade, r.job_number_sl6, r.sap_number, r.summary_issue, r.status FROM rpm_records_master r JOIN sites s ON r.site_code = s.site_code WHERE s.site_grade = '${selectedGrade}' ORDER BY r.site_code;`)}
                    className="px-2 py-1 bg-indigo-950/20 hover:bg-indigo-900/30 rounded text-[10px] font-mono text-indigo-400 border border-indigo-500/20 transition-colors"
                  >
                    สรุปปัญหาเกรด {selectedGrade}
                  </button>
                  <button
                    onClick={() => loadQueryTemplate(`SELECT r.site_code, s.site_grade, r.rpm_cycle, a.* FROM power_main_ac a JOIN rpm_records_master r ON a.rpm_id = r.rpm_id JOIN sites s ON r.site_code = s.site_code WHERE s.site_grade = '${selectedGrade}' ORDER BY r.site_code;`)}
                    className="px-2 py-1 bg-indigo-950/20 hover:bg-indigo-900/30 rounded text-[10px] font-mono text-indigo-400 border border-indigo-500/20 transition-colors"
                  >
                    ระบบไฟฟ้า AC เกรด {selectedGrade}
                  </button>
                  <button
                    onClick={() => loadQueryTemplate(`SELECT r.site_code, s.site_grade, r.rpm_cycle, p.* FROM power_rectifier p JOIN rpm_records_master r ON p.rpm_id = r.rpm_id JOIN sites s ON r.site_code = s.site_code WHERE s.site_grade = '${selectedGrade}' ORDER BY r.site_code;`)}
                    className="px-2 py-1 bg-indigo-950/20 hover:bg-indigo-900/30 rounded text-[10px] font-mono text-indigo-400 border border-indigo-500/20 transition-colors"
                  >
                    ตู้ Rectifier เกรด {selectedGrade}
                  </button>
                </div>
              </div>
            </div>

            <div className="relative border border-dark-border/85 rounded-xl overflow-hidden focus-within:border-indigo-500 transition-all shadow-inner">
              <textarea
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-44 bg-dark-bg/85 text-gray-100 p-4 font-mono text-xs focus:outline-none resize-y placeholder-gray-600 leading-relaxed leading-5 tab-size-4"
                placeholder="เขียนคำสั่ง SQL ที่นี่..."
              />
            </div>

            <div className="flex justify-end items-center">

              <button
                onClick={handleExecute}
                disabled={executing || !sql.trim()}
                className={`px-5 py-2 rounded-lg text-sm font-bold text-white transition-all shadow-lg flex items-center gap-2 ${
                  executing || !sql.trim()
                    ? 'bg-indigo-900/30 text-gray-500 cursor-not-allowed border border-indigo-900/40'
                    : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-600/20 active:scale-95'
                }`}
              >
                {executing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    กำลังรัน...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    </svg>
                    รันคำสั่ง (Execute)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Area */}
          {error && (
            <div className="bg-red-950/20 border border-red-500/40 p-4 rounded-xl flex items-start gap-3">
              <svg className="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h4 className="text-sm font-bold text-red-300">เกิดข้อผิดพลาดในการประมวลผลคำสั่ง</h4>
                <p className="text-xs text-red-400 mt-1 font-mono">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-dark-border/40">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded">
                    Command: {result.command || 'SELECT'}
                  </span>
                  <span className="text-xs text-gray-400">
                    ประมวลผลเสร็จสิ้นใน <span className="font-mono font-bold text-white">{result.durationMs}ms</span>
                  </span>
                  <span className="text-xs text-gray-400">
                    พบทั้งหมด <span className="font-mono font-bold text-white">{result.rowCount}</span> แถว
                  </span>
                </div>
                
                {result.rows && result.rows.length > 0 && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="กรองข้อมูลผลลัพธ์..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="bg-dark-bg border border-dark-border text-xs rounded-lg px-3 py-1.5 w-44 focus:outline-none focus:border-indigo-500 text-gray-300"
                    />
                    <button
                      onClick={exportToCSV}
                      className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 hover:border-indigo-500 rounded-lg text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      CSV Export
                    </button>
                  </div>
                )}
              </div>

              {result.rows && result.rows.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">
                  คำสั่งทำงานเสร็จสิ้น แต่ไม่มีข้อมูลส่งกลับมา (0 rows)
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[450px] border border-dark-border/40 rounded-xl scrollbar-thin scrollbar-thumb-indigo-500/20 scrollbar-track-transparent">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead className="bg-dark-bg/80 sticky top-0 backdrop-blur border-b border-dark-border/80 z-10">
                      <tr>
                        {result.fields.map(field => (
                          <th key={field} className="px-4 py-3 text-indigo-400 font-bold uppercase tracking-wider border-r border-dark-border/40">
                            {field}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border/40">
                      {filteredRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-dark-accent/20 transition-colors">
                          {result.fields.map(field => {
                            const val = row[field];
                            let cellText = '';
                            if (val === null || val === undefined) {
                              cellText = <span className="text-gray-600 font-semibold">NULL</span>;
                            } else if (typeof val === 'object') {
                              cellText = <span className="text-yellow-500/80 truncate max-w-[200px] block" title={JSON.stringify(val)}>{JSON.stringify(val)}</span>;
                            } else if (typeof val === 'boolean') {
                              cellText = val ? <span className="text-emerald-400">true</span> : <span className="text-rose-400">false</span>;
                            } else {
                              cellText = String(val);
                            }
                            
                            return (
                              <td key={field} className="px-4 py-2.5 max-w-xs truncate border-r border-dark-border/20 text-gray-300">
                                {cellText}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
