import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [workorders, setWorkorders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [cycleFilter, setCycleFilter] = useState('All');

  useEffect(() => {
    fetchWorkorders();
  }, []);

  const fetchWorkorders = () => {
    setLoading(true);
    fetch('/api/workorders/all')
      .then(res => {
        if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลประวัติใบงานได้');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setWorkorders(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  };

  const handleUnlock = async (rpmId) => {
    if (!window.confirm('คุณต้องการปลดล็อกใบงานนี้เพื่อให้ Inspector สามารถแก้ไขข้อมูลได้อีกครั้งใช่หรือไม่?')) {
      return;
    }
    try {
      const res = await fetch(`/api/workorder/${rpmId}/unlock`, { method: 'POST' });
      if (res.ok) {
        alert('ปลดล็อกใบงานเรียบร้อยแล้ว');
        fetchWorkorders();
      } else {
        const data = await res.json();
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  const uniqueCycles = ['All', ...new Set(workorders.map(wo => wo.rpm_cycle).filter(Boolean))];

  const filteredWorkorders = workorders.filter(wo => {
    const matchesSearch = 
      wo.site_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.site_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (wo.area && wo.area.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (wo.subarea && wo.subarea.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (wo.job_number_sl6 && wo.job_number_sl6.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (wo.sap_number && wo.sap_number.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = 
      statusFilter === 'All' || 
      (statusFilter === 'Submitted' && wo.status === 'Submitted') ||
      (statusFilter === 'Pending' && (wo.status === 'Pending' || !wo.status));

    const matchesCycle =
      cycleFilter === 'All' ||
      wo.rpm_cycle === cycleFilter;

    return matchesSearch && matchesStatus && matchesCycle;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Admin Dashboard</h2>
          <p className="text-gray-400 mt-1">ติดตามสถานะการส่งงาน ตรวจสอบข้อมูลดิบ และจัดการปลดล็อกใบงาน</p>
        </div>
        <button
          onClick={() => navigate('/select-site')}
          className="px-5 py-2.5 bg-dark-accent hover:bg-dark-accent/80 border border-dark-border text-gray-200 font-bold rounded-lg text-sm transition-all shadow-md flex items-center gap-2"
        >
          &larr; กลับหน้าเลือกสถานี
        </button>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-xl p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 bg-dark-bg/60 border border-dark-border rounded-lg px-3 py-2 w-full md:max-w-md">
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="ค้นหาด้วยรหัส, ชื่อสถานี, Area/Subarea, Job หรือ SAP No..."
            className="bg-transparent border-0 outline-none w-full text-sm text-gray-200 placeholder-gray-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-gray-400 font-semibold uppercase whitespace-nowrap">รอบตรวจ RPM:</span>
            <select
              value={cycleFilter}
              onChange={(e) => setCycleFilter(e.target.value)}
              className="bg-dark-bg border border-dark-border text-gray-200 text-xs font-semibold rounded-lg px-3 py-2 outline-none focus:border-indigo-500 transition-all cursor-pointer min-w-[120px]"
            >
              {uniqueCycles.map(cycle => (
                <option key={cycle} value={cycle} className="bg-dark-card text-gray-200">
                  {cycle === 'All' ? 'ทุกรอบ' : cycle}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs text-gray-400 font-semibold uppercase whitespace-nowrap">สถานะใบงาน:</span>
            <div className="flex bg-dark-bg border border-dark-border rounded-lg p-1">
              {['All', 'Submitted', 'Pending'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    statusFilter === status
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {status === 'All' ? 'ทั้งหมด' : status === 'Submitted' ? 'ส่งงานแล้ว' : 'กำลังดำเนินการ'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 bg-dark-card border border-dark-border rounded-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          <span className="ml-3 text-gray-400">กำลังโหลดประวัติใบงานทั้งหมด...</span>
        </div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6 text-red-200 text-sm text-center">
          ⚠️ {error}
        </div>
      ) : filteredWorkorders.length === 0 ? (
        <div className="bg-dark-card border border-dark-border rounded-xl p-12 text-center text-gray-500 text-sm">
          ไม่พบรายการใบงานตามเงื่อนไขที่เลือก
        </div>
      ) : (
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dark-accent/40 border-b border-dark-border text-xs text-gray-400 font-semibold uppercase">
                  <th className="p-4">รหัส / ชื่อสถานี</th>
                  <th className="p-4">พื้นที่ (Area / Sub-Area)</th>
                  <th className="p-4">รอบตรวจ</th>
                  <th className="p-4">SL6 / SAP Number</th>
                  <th className="p-4">วันที่ตรวจสอบ</th>
                  <th className="p-4 text-center">สถานะ</th>
                  <th className="p-4 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40 text-sm text-gray-300">
                {filteredWorkorders.map((wo) => {
                  const isSubmitted = wo.status === 'Submitted';
                  return (
                    <tr key={wo.rpm_id} className="hover:bg-dark-accent/10 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-dark-accent text-indigo-400 font-mono">
                            {wo.site_code}
                          </span>
                          <div>
                            <p className="font-bold text-white text-xs">{wo.site_name}</p>
                            <p className="text-[10px] text-gray-500">{wo.site_type} - เกรด {wo.site_grade}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-xs">
                        <p className="text-gray-300 font-semibold">{wo.area || '-'}</p>
                        <p className="text-gray-500 text-[10px]">{wo.subarea || '-'}</p>
                      </td>
                      <td className="p-4 font-semibold text-gray-200">{wo.rpm_cycle || '-'}</td>
                      <td className="p-4 font-mono text-xs">
                        <p className="text-gray-400"><span className="text-[10px] text-gray-500">SL6:</span> {wo.job_number_sl6 || '-'}</p>
                        <p className="text-gray-400"><span className="text-[10px] text-gray-500">SAP:</span> {wo.sap_number || '-'}</p>
                      </td>
                      <td className="p-4 text-xs">
                        <p className="text-gray-300 font-medium">{formatDate(wo.inspection_date)}</p>
                        <p className="text-gray-500 mt-0.5">{wo.inspection_time ? `${wo.inspection_time.slice(0, 5)} น.` : '-'}</p>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isSubmitted
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${isSubmitted ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                          {isSubmitted ? 'ส่งงานแล้ว' : 'กำลังดำเนินการ'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => {
                              // Set cycle info to localStorage so workorder page knows which cycle to view
                              localStorage.setItem('rpmCycle', wo.rpm_cycle);
                              localStorage.setItem('inspectionDate', wo.inspection_date ? wo.inspection_date.split('T')[0] : '');
                              localStorage.setItem('inspectionTime', wo.inspection_time || '');
                              navigate(`/workorder/${wo.site_code}/master`);
                            }}
                            className="px-3.5 py-1.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 font-bold rounded-lg text-xs transition-all"
                          >
                            ดูรายละเอียด
                          </button>
                          {isSubmitted && (
                            <button
                              onClick={() => handleUnlock(wo.rpm_id)}
                              className="px-3.5 py-1.5 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 font-bold rounded-lg text-xs transition-all"
                            >
                              ปลดล็อก
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
