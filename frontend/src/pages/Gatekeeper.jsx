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

  const [selectedArea, setSelectedArea] = useState('All');
  const [selectedSubarea, setSelectedSubarea] = useState('All');

  // Editing states for site_grade, site_type, area, subarea
  const [isEditingSite, setIsEditingSite] = useState(false);
  const [editSiteName, setEditSiteName] = useState('');
  const [editSiteGrade, setEditSiteGrade] = useState('A');
  const [editSiteType, setEditSiteType] = useState('Indoor');
  const [editArea, setEditArea] = useState('');
  const [editSubarea, setEditSubarea] = useState('');

  // Retrieve user object from localStorage
  const getUserObj = () => {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        return JSON.parse(user);
      }
    } catch (e) {
      console.error(e);
    }
    return { role: 'Viewer' };
  };

  const parseUserList = (rawVal) => {
    if (!rawVal) return [];
    if (Array.isArray(rawVal)) return rawVal;
    if (typeof rawVal === 'string' && rawVal.startsWith('[')) {
      try { return JSON.parse(rawVal); } catch (e) {}
    }
    return typeof rawVal === 'string' ? rawVal.split(',').map(s => s.trim()).filter(Boolean) : [];
  };

  const userObj = getUserObj();
  const userRole = userObj.role || 'Viewer';
  const isAdmin = userRole === 'Admin';
  const isTeamLead = userRole === 'Team Lead';
  const userAreas = parseUserList(userObj.area);
  const userSubareas = parseUserList(userObj.subarea);

  // Filter allowed sites based on logged in user's role and assigned Multi-Areas & Subareas
  const allowedUserSites = sites.filter(site => {
    if (isAdmin) return true;
    if (userAreas.length > 0 && !userAreas.includes('All') && !userAreas.includes(site.rawArea)) {
      return false;
    }
    if (userSubareas.length > 0 && !userSubareas.includes('All') && !userSubareas.includes(site.rawSubarea)) {
      return false;
    }
    return true;
  });

  // Extract unique areas and subareas restricted to user's assigned scope
  const uniqueAreas = ['All', ...Array.from(new Set(allowedUserSites.map(s => s.rawArea).filter(Boolean)))];
  
  const availableSubareas = selectedArea === 'All' ? [] : ['All', ...Array.from(new Set(
    allowedUserSites
      .filter(s => s.rawArea === selectedArea)
      .map(s => s.rawSubarea)
      .filter(Boolean)
  ))];

  // Auto-reset subarea filter if selectedArea is All or selectedSubarea is no longer valid
  useEffect(() => {
    if (selectedArea === 'All' || (selectedSubarea !== 'All' && !availableSubareas.includes(selectedSubarea))) {
      setSelectedSubarea('All');
    }
  }, [selectedArea, availableSubareas, selectedSubarea]);

  const handleStartEdit = () => {
    if (!selectedSite) return;
    setEditSiteName(selectedSite.rawName || '');
    setEditSiteGrade(selectedSite.rawGrade || 'A');
    setEditSiteType(selectedSite.rawType || 'Indoor');
    setEditArea(selectedSite.rawArea || '');
    setEditSubarea(selectedSite.rawSubarea || '');
    setIsEditingSite(true);
  };

  const handleSaveSiteEdit = async (e) => {
    e.preventDefault();
    if (!editSiteName.trim()) {
      alert('กรุณากรอกชื่อสถานี');
      return;
    }
    
    try {
      const res = await fetch(`/api/sites/${selectedSite.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          site_name: editSiteName.trim(),
          site_grade: editSiteGrade,
          site_type: editSiteType,
          area: editArea.trim() || null,
          subarea: editSubarea.trim() || null
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'บันทึกการแก้ไขล้มเหลว');
      }
      
      const updatedSite = await res.json();
      alert('แก้ไขข้อมูลสถานีสำเร็จแล้ว!');
      
      const formatLoc = (type, grade, area, subarea) => {
        let loc = `${type || 'N/A'} - Grade ${grade || '-'}`;
        if (area || subarea) {
          loc += ` | ${[area, subarea].filter(Boolean).join(' / ')}`;
        }
        return loc;
      };

      // Update local state list
      setSites(prev => prev.map(s => {
        if (s.id === updatedSite.site_id) {
          return {
            ...s,
            name: `${updatedSite.site_name} (${updatedSite.site_code})`,
            location: formatLoc(updatedSite.site_type, updatedSite.site_grade, updatedSite.area, updatedSite.subarea),
            rawName: updatedSite.site_name,
            rawGrade: updatedSite.site_grade || 'A',
            rawType: updatedSite.site_type || 'Indoor',
            rawArea: updatedSite.area || '',
            rawSubarea: updatedSite.subarea || ''
          };
        }
        return s;
      }));
      
      // Update selectedSite preview info
      setSelectedSite(prev => ({
        ...prev,
        name: `${updatedSite.site_name} (${updatedSite.site_code})`,
        location: formatLoc(updatedSite.site_type, updatedSite.site_grade, updatedSite.area, updatedSite.subarea),
        rawName: updatedSite.site_name,
        rawGrade: updatedSite.site_grade || 'A',
        rawType: updatedSite.site_type || 'Indoor',
        rawArea: updatedSite.area || '',
        rawSubarea: updatedSite.subarea || ''
      }));
      
      setIsEditingSite(false);
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  useEffect(() => {
    // Reset selected site when changing search term, area, or subarea
    setSelectedSite(null);
  }, [searchTerm, selectedArea, selectedSubarea]);

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
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
          }
          throw new Error('ไม่สามารถดึงข้อมูลสถานีจากฐานข้อมูลได้ (HTTP ' + res.status + ')');
        }
        return res.json();
      })
      .then(data => {
        const mapped = data.map(site => {
          let loc = `${site.site_type || 'N/A'} - Grade ${site.site_grade || '-'}`;
          if (site.area || site.subarea) {
            loc += ` | ${[site.area, site.subarea].filter(Boolean).join(' / ')}`;
          }

          return {
            id: site.site_id,
            name: `${site.site_name} (${site.site_code})`,
            code: site.site_code,
            location: loc,
            status: 'Active',
            rawName: site.site_name,
            rawGrade: site.site_grade || 'A',
            rawType: site.site_type || 'Indoor',
            rawArea: site.area || '',
            rawSubarea: site.subarea || ''
          };
        });
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

  const [rpmCyclesList, setRpmCyclesList] = useState(['2026-R1', '2026-R2', '2026-R3']);
  const [newCycleInput, setNewCycleInput] = useState('');
  const [showCycleModal, setShowCycleModal] = useState(false);

  const fetchRpmCycles = () => {
    fetch('/api/rpm-cycles')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setRpmCyclesList(data);
          if (!data.includes(rpmCycle)) {
            setRpmCycle(data[0]);
          }
        }
      })
      .catch(err => console.error("Error fetching rpm cycles:", err));
  };

  const handleAddCycle = async (e) => {
    e.preventDefault();
    if (!newCycleInput.trim()) return;
    try {
      const res = await fetch('/api/rpm-cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycle_name: newCycleInput.trim() })
      });
      if (res.ok) {
        alert(`เพิ่มรอบการตรวจ ${newCycleInput.trim()} เรียบร้อยแล้ว`);
        setNewCycleInput('');
        fetchRpmCycles();
      } else {
        const data = await res.json();
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err) {
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  };

  const handleDeleteCycle = async (cycleName) => {
    if (!window.confirm(`คุณต้องการลบตัวเลือกรอบการตรวจ "${cycleName}" ใช่หรือไม่?\n\n*หมายเหตุ: ข้อมูลประวัติใบงานเดิมในรอบนี้จะไม่ถูกลบหรือได้รับผลกระทบใดๆ ทั้งสิ้น*`)) {
      return;
    }
    try {
      const res = await fetch(`/api/rpm-cycles/${encodeURIComponent(cycleName)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert(`ลบตัวเลือกรอบการตรวจ ${cycleName} เรียบร้อยแล้ว`);
        fetchRpmCycles();
      } else {
        const data = await res.json();
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err) {
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  };

  useEffect(() => {
    fetchRpmCycles();
  }, []);

  const filteredSites = allowedUserSites.filter(site => {
    const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          site.code.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    // Filter by UI dropdown selection
    if (selectedArea !== 'All' && site.rawArea !== selectedArea) {
      return false;
    }
    if (selectedSubarea !== 'All' && site.rawSubarea !== selectedSubarea) {
      return false;
    }

    // Role-based Area & Subarea restriction
    if (isAdmin) {
      return true; // Admin sees all
    }

    if (userAreas.length > 0 && !userAreas.includes('All')) {
      if (!userAreas.includes(site.rawArea)) return false;
    }

    if (userSubareas.length > 0 && !userSubareas.includes('All')) {
      if (!userSubareas.includes(site.rawSubarea)) return false;
    }

    // Team Lead sees all sites in assigned areas/subareas
    if (isTeamLead) return true;

    // Inspector and Viewer can see sites with active workorders or within assigned areas
    return true;
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
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="px-5 py-2.5 bg-dark-accent hover:bg-dark-accent/80 border border-dark-border text-gray-200 font-bold rounded-lg text-sm transition-all shadow-md flex items-center gap-2"
            >
              Admin Dashboard
            </button>
            <button
              onClick={() => navigate('/create-site')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-sm transition-all shadow-md flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Station
            </button>
          </div>
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
            <div className="bg-dark-card border border-dark-border rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="flex items-center gap-3 bg-dark-bg/60 border border-dark-border rounded-lg px-3 py-2 flex-1">
                <svg className="w-5 h-5 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

              {/* Area & Subarea Cascading Filters */}
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="bg-dark-bg border border-dark-border text-gray-200 text-xs font-semibold rounded-lg px-3 py-2 outline-none focus:border-indigo-500 transition-all cursor-pointer w-[170px] shrink-0 truncate"
                >
                  <option value="All">ทุกเขต (All Area)</option>
                  {uniqueAreas.filter(a => a !== 'All').map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>

                <select
                  value={selectedSubarea}
                  onChange={(e) => setSelectedSubarea(e.target.value)}
                  disabled={selectedArea === 'All'}
                  title={selectedArea === 'All' ? 'กรุณาเลือก Area ก่อน' : 'เลือก Subarea'}
                  className={`border text-xs font-semibold rounded-lg px-3 py-2 outline-none transition-all w-[170px] shrink-0 truncate ${
                    selectedArea === 'All'
                      ? 'bg-dark-bg/40 border-dark-border/40 text-gray-500 cursor-not-allowed opacity-60'
                      : 'bg-dark-bg border-dark-border text-gray-200 focus:border-indigo-500 cursor-pointer'
                  }`}
                >
                  {selectedArea === 'All' ? (
                    <option value="All">-- เลือก Area ก่อน --</option>
                  ) : (
                    <>
                      <option value="All">ทุกพื้นที่ย่อย (All Subarea)</option>
                      {availableSubareas.filter(s => s !== 'All').map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </>
                  )}
                </select>
              </div>
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
                <div className="p-3 bg-dark-accent/40 rounded-lg border border-dark-border text-sm text-gray-200 flex justify-between items-center">
                  <span>{selectedSite ? selectedSite.name : <span className="text-gray-500 italic">No station selected</span>}</span>
                  {selectedSite && isAdmin && (
                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold transition-all shrink-0 ml-2"
                    >
                      แก้ไขสถานี
                    </button>
                  )}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold uppercase text-gray-400">
                    2. เลือกรอบการตรวจ (RPM Cycle) {!selectedSite && <span className="text-amber-400 font-normal border-b border-amber-400/50 text-[10px] ml-1">(กรุณาเลือกสถานีก่อน)</span>}
                  </label>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setShowCycleModal(true)}
                      className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/30 flex items-center gap-1"
                    >
                      <span>⚙️</span> จัดการรอบการตรวจ
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {rpmCyclesList.map((cycle) => (
                    <button
                      key={cycle}
                      type="button"
                      disabled={!selectedSite}
                      onClick={() => setRpmCycle(cycle)}
                      className={`w-full py-2.5 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                        !selectedSite
                          ? 'bg-dark-accent/20 border-dark-border/40 text-gray-600 cursor-not-allowed'
                          : rpmCycle === cycle
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/25 font-bold'
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
                  readOnly
                  className="w-full bg-dark-accent/20 border border-dark-border rounded-lg p-3 text-sm text-gray-400 cursor-not-allowed outline-none select-none"
                  value={inspectorName}
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

      {/* RPM Cycle Management Modal */}
      {showCycleModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-dark-card border border-dark-border p-6 rounded-2xl shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-dark-border pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">จัดการรอบการตรวจ (RPM Cycles)</h3>
                <p className="text-xs text-gray-400 mt-0.5">เพิ่มตัวเลือกใหม่ หรือ ลบตัวเลือกที่ไม่ใช้ออก</p>
              </div>
              <button
                onClick={() => setShowCycleModal(false)}
                className="text-gray-400 hover:text-white text-xl font-bold p-1 rounded-lg hover:bg-dark-accent"
              >
                &times;
              </button>
            </div>

            {/* Add New Cycle Form */}
            <form onSubmit={handleAddCycle} className="space-y-2">
              <label className="block text-xs font-bold uppercase text-indigo-400">+ เพิ่มรอบการตรวจใหม่</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="เช่น 2027-R1..."
                  value={newCycleInput}
                  onChange={(e) => setNewCycleInput(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-xs text-gray-200 focus:border-indigo-500 outline-none transition-colors"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shrink-0 transition-all shadow-md"
                >
                  เพิ่มรอบ
                </button>
              </div>
            </form>

            {/* Active Cycles List */}
            <div className="space-y-2 pt-2 border-t border-dark-border/60">
              <label className="block text-xs font-bold uppercase text-gray-400">รายการรอบการตรวจปัจจุบัน</label>
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {rpmCyclesList.map((cycle) => (
                  <div
                    key={cycle}
                    className="flex justify-between items-center p-3 bg-dark-bg/60 border border-dark-border/80 rounded-xl hover:border-gray-700 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                      <span className="text-xs font-bold text-gray-200 font-mono">{cycle}</span>
                    </div>
                    {rpmCyclesList.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteCycle(cycle)}
                        className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1"
                      >
                        <span>🗑️</span> ลบตัวเลือก
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-500 italic">จำเป็นต้องมีอย่างน้อย 1 ตัวเลือก</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-[11px] text-amber-300 leading-relaxed">
              *การลบตัวเลือกรอบการตรวจจะไม่ส่งผลกระทบต่อประวัติข้อมูลใบงานเดิมที่เคยบันทึกไว้ในรอบนั้นๆ*
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCycleModal(false)}
                className="px-5 py-2 bg-dark-accent hover:bg-dark-accent/80 border border-dark-border text-gray-200 font-bold rounded-lg text-xs transition-all"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Site Modal */}
      {isEditingSite && selectedSite && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveSiteEdit} className="w-full max-w-md bg-dark-card border border-dark-border p-6 rounded-2xl shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-white">แก้ไขข้อมูลสถานี ({selectedSite.code})</h3>
            
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">ชื่อสถานี (Site Name)</label>
              <input
                type="text"
                required
                className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none transition-colors"
                value={editSiteName}
                onChange={(e) => setEditSiteName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">เขต/พื้นที่หลัก (Area)</label>
                <input
                  type="text"
                  placeholder="เช่น ภาคเหนือ"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none transition-colors"
                  value={editArea}
                  onChange={(e) => setEditArea(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">พื้นที่ย่อย (Sub-Area)</label>
                <input
                  type="text"
                  placeholder="เช่น เชียงใหม่"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none transition-colors"
                  value={editSubarea}
                  onChange={(e) => setEditSubarea(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">ความสำคัญ (Site Grade)</label>
                <select
                  className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none transition-colors"
                  value={editSiteGrade}
                  onChange={(e) => setEditSiteGrade(e.target.value)}
                >
                  <option value="A">Grade A</option>
                  <option value="B">Grade B</option>
                  <option value="C">Grade C</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">ประเภท (Site Type)</label>
                <select
                  className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none transition-colors"
                  value={editSiteType}
                  onChange={(e) => setEditSiteType(e.target.value)}
                >
                  <option value="Indoor">Indoor</option>
                  <option value="Outdoor">Outdoor</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4 justify-end">
              <button
                type="button"
                onClick={() => setIsEditingSite(false)}
                className="px-4 py-2 border border-dark-border bg-dark-bg text-gray-300 hover:text-white rounded-lg text-xs font-semibold transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-md"
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
