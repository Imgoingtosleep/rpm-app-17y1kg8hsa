import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Gatekeeper({ onOpenWorkOrder }) {
  const [sites, setSites] = useState([]);
  const [activeWorkOrders, setActiveWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);
  const [inspectorName, setInspectorName] = useState(() => {
    return localStorage.getItem('inspectorName') || '';
  });
  const [rpmCycle, setRpmCycle] = useState('2026-R1');
  const [searchTerm, setSearchTerm] = useState('');
  const [jobNo, setJobNo] = useState('');
  const [sapNo, setSapNo] = useState('');

  useEffect(() => {
    // Reset selected site when changing search or cycle
    setSelectedSite(null);
  }, [searchTerm, rpmCycle]);

  useEffect(() => {
    if (selectedSite && rpmCycle) {
      const match = activeWorkOrders.find(wo => wo.site_code === selectedSite.code && wo.rpm_cycle === rpmCycle);
      if (match) {
        setJobNo(match.job_number_sl6 || '');
        setSapNo(match.sap_number || '');
      } else {
        setJobNo('');
        setSapNo('');
      }
    } else {
      setJobNo('');
      setSapNo('');
    }
  }, [selectedSite, rpmCycle, activeWorkOrders]);

  useEffect(() => {
    setLoading(true);
    // Fetch sites
    fetch('/api/sites')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch sites from database');
        return res.json();
      })
      .then(data => {
        const mapped = data.map(site => ({
          id: site.site_id,
          name: `${site.site_name} (${site.site_code})`,
          code: site.site_code,
          location: `${site.site_type || 'N/A'} - Grade ${site.site_grade || '-'}`,
          status: 'Active'
        }));
        setSites(mapped);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
      });

    // Fetch active work orders (records with SL6 or SAP ID)
    fetch('/api/workorders/active')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setActiveWorkOrders(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Retrieve user role from localStorage
  const getUserRole = () => {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        const parsed = JSON.parse(user);
        return parsed.role || 'Viewer';
      }
    } catch (e) {
      console.error(e);
    }
    return 'Viewer';
  };

  const isAdmin = getUserRole() === 'Admin';

  const filteredSites = sites.filter(site => {
    const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          site.code.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    // Admin can see all sites
    if (isAdmin) return true;

    // Inspector can only see sites that have an active work order in the selected cycle
    return activeWorkOrders.some(wo => wo.site_code === site.code && wo.rpm_cycle === rpmCycle);
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedSite || !inspectorName.trim() || !rpmCycle) return;

    if (isAdmin && (!jobNo.trim() || !sapNo.trim())) {
      alert('กรุณากรอกข้อมูลเลข Job SL6 และ SAP ID สำหรับรอบการตรวจนี้');
      return;
    }
    
    // Auto-capture actual real date and time at this moment
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const actualDate = `${year}-${month}-${day}`;
    const actualTime = `${hours}:${minutes}`;

    onOpenWorkOrder(selectedSite, inspectorName, rpmCycle, actualDate, actualTime, jobNo, sapNo);
  };

  const navigate = useNavigate();



  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Select Site & Launch</h2>
          <p className="text-gray-400 mt-1">Select a telecom/power station to initialize a work order checklist.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => navigate('/create-site')}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-sm transition-all shadow-md flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Station
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          <span className="ml-3 text-gray-400">Loading sites from database...</span>
        </div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4 text-red-200 text-sm">
          ⚠️ {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Site Selection List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-4 flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Search by site code or name..."
                className="bg-transparent border-0 outline-none w-full text-sm text-gray-200 placeholder-gray-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {filteredSites.length === 0 ? (
              <div className="bg-dark-bg border border-dark-border rounded-xl p-8 text-center text-gray-500 text-sm">
                {isAdmin 
                  ? "ไม่พบรหัสสถานี/ชื่อสถานีที่ค้นหา" 
                  : `ไม่พบสถานีที่มี Job/SAP ID ในรอบการตรวจ ${rpmCycle} นี้`
                }
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSites.map((site) => (
                  <div 
                    key={site.id}
                    onClick={() => setSelectedSite(site)}
                    className={`p-5 rounded-xl border cursor-pointer transition-all duration-300 ${
                      selectedSite?.id === site.id 
                        ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                        : 'bg-dark-card border-dark-border hover:border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-dark-accent text-indigo-400 font-mono">
                        {site.code}
                      </span>
                      <span className={`h-2 w-2 rounded-full ${site.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                    </div>
                    <h4 className="font-bold text-white mt-3 text-sm truncate">{site.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{site.location}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Panel */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 h-fit space-y-6">
            <h3 className="font-bold text-white text-lg">Work Order Setup</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Selected Station</label>
                <div className="p-3 bg-dark-accent/40 rounded-lg border border-dark-border text-sm text-gray-200">
                  {selectedSite ? selectedSite.name : <span className="text-gray-500 italic">No station selected</span>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-3">รอบการตรวจ (RPM Cycle)</label>
                <div className="grid grid-cols-3 gap-2">
                  {['2026-R1', '2026-R2', '2026-R3'].map((cycle) => (
                    <button
                      key={cycle}
                      type="button"
                      onClick={() => setRpmCycle(cycle)}
                      className={`py-2.5 px-3 text-sm font-semibold rounded-lg border text-center transition-all ${
                        rpmCycle === cycle
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/25'
                          : 'bg-dark-accent/40 border-dark-border text-gray-400 hover:text-gray-200 hover:border-gray-600'
                      }`}
                    >
                      {cycle}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">ชื่อผู้ตรวจสอบ (Inspector Name)</label>
                <input 
                  type="text" 
                  required
                  placeholder="กรอกชื่อผู้ตรวจสอบ..."
                  className="w-full bg-dark-accent/50 border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none transition-colors"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                />
              </div>

              {isAdmin ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">เลข Job SL6 (SL6 No.) <span className="text-red-400">*</span></label>
                    <input 
                      type="text" 
                      required
                      placeholder="กรอกเลข Job SL6..."
                      className="w-full bg-dark-accent/50 border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none transition-colors"
                      value={jobNo}
                      onChange={(e) => setJobNo(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">เลข SAP ID (SAP No.) <span className="text-red-400">*</span></label>
                    <input 
                      type="text" 
                      required
                      placeholder="กรอกเลข SAP ID..."
                      className="w-full bg-dark-accent/50 border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none transition-colors"
                      value={sapNo}
                      onChange={(e) => setSapNo(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                selectedSite && (
                  <div className="bg-dark-accent/20 p-4 rounded-xl border border-dark-border space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">เลข Job SL6:</span>
                      <span className="text-white font-bold">{jobNo || '-'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">เลข SAP ID:</span>
                      <span className="text-white font-bold">{sapNo || '-'}</span>
                    </div>
                  </div>
                )
              )}

              <button 
                type="submit"
                disabled={!selectedSite || !inspectorName.trim() || !rpmCycle}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg text-sm transition-all shadow-lg hover:shadow-indigo-600/20"
              >
                Open Work Order &rarr;
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
