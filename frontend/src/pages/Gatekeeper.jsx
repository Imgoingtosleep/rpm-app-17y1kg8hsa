import React, { useState, useEffect } from 'react';

export default function Gatekeeper({ onOpenWorkOrder }) {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);
  const [inspectorName, setInspectorName] = useState(() => {
    return localStorage.getItem('inspectorName') || '';
  });
  const [rpmCycle, setRpmCycle] = useState('2026-R1');
  const [inspectionDateTime, setInspectionDateTime] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Format current local time: YYYY-MM-DDTHH:MM
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now - tzOffset)).toISOString().slice(0, 16);
    setInspectionDateTime(localISOTime);

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
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filteredSites = sites.filter(site =>
    site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedSite || !inspectorName.trim() || !rpmCycle || !inspectionDateTime) return;
    onOpenWorkOrder(selectedSite, inspectorName, rpmCycle, inspectionDateTime);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Select Site & Launch</h2>
          <p className="text-gray-400 mt-1">Select a telecom/power station to initialize a work order checklist.</p>
        </div>
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

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">วันเวลาที่ตรวจสอบ (Inspection Date & Time)</label>
                <input 
                  type="datetime-local" 
                  required
                  className="w-full bg-dark-accent/50 border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none transition-colors"
                  value={inspectionDateTime}
                  onChange={(e) => setInspectionDateTime(e.target.value)}
                />
              </div>

              <button 
                type="submit"
                disabled={!selectedSite || !inspectorName.trim() || !rpmCycle || !inspectionDateTime}
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
