import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Gatekeeper from './pages/Gatekeeper';
import StartPage from './pages/StartPage';

// Tabs
import MasterTab from './pages/WorkOrder/MasterTab';
import AcMainTab from './pages/WorkOrder/AcMainTab';
import RectifierTab from './pages/WorkOrder/RectifierTab';
import BatteryTab from './pages/WorkOrder/BatteryTab';
import FacilitiesTab from './pages/WorkOrder/FacilitiesTab';
import SummaryTab from './pages/WorkOrder/SummaryTab';
import FieldSettings from './pages/FieldSettings';
import AdminDashboard from './pages/AdminDashboard';

import CreateSite from './pages/CreateSite';
import StorageBrowser from './pages/StorageBrowser';
import ManageUsers from './pages/ManageUsers';
import DatabaseQuery from './pages/DatabaseQuery';

function WorkOrderPanel() {
  const { site_code, tab } = useParams();
  const navigate = useNavigate();
  const activeTab = tab || 'master';

  const [selectedSite, setSelectedSite] = useState(null);
  const [inspector, setInspector] = useState('');
  const [rpmCycle, setRpmCycle] = useState('');
  const [inspectionDate, setInspectionDate] = useState('');
  const [inspectionTime, setInspectionTime] = useState('');
  const [rpmId, setRpmId] = useState(null);
  const [userRole, setUserRole] = useState('Viewer');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Track completed sections per site and per RPM cycle
  const [completedSections, setCompletedSections] = useState({ master: false, acmain: false, rectifier: false, battery: false, facilities: false, summary: false });

  // Load completion state when site_code or rpmCycle changes
  useEffect(() => {
    const cycleKey = rpmCycle || localStorage.getItem('rpmCycle') || '';
    if (site_code && cycleKey) {
      try {
        const stored = localStorage.getItem(`completed_${site_code}_${cycleKey}`);
        setCompletedSections(stored ? JSON.parse(stored) : { master: false, acmain: false, rectifier: false, battery: false, facilities: false, summary: false });
      } catch {
        setCompletedSections({ master: false, acmain: false, rectifier: false, battery: false, facilities: false, summary: false });
      }
    }
  }, [site_code, rpmCycle]);

  // Save completion state to local storage when it updates
  useEffect(() => {
    const cycleKey = rpmCycle || localStorage.getItem('rpmCycle') || '';
    if (site_code && cycleKey) {
      localStorage.setItem(`completed_${site_code}_${cycleKey}`, JSON.stringify(completedSections));
    }
  }, [completedSections, site_code, rpmCycle]);

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/');
      return;
    }

    // Fetch site detail
    fetch(`/api/sites`)
      .then(res => res.json())
      .then(data => {
        const dbSite = data.find(s => s.site_code === site_code);
        if (dbSite) {
          let loc = `${dbSite.site_type || 'N/A'} - Grade ${dbSite.site_grade || '-'}`;
          if (dbSite.area || dbSite.subarea) {
            loc += ` | ${[dbSite.area, dbSite.subarea].filter(Boolean).join(' / ')}`;
          }

          setSelectedSite({
            id: dbSite.site_id,
            name: `${dbSite.site_name} (${dbSite.site_code})`,
            code: dbSite.site_code,
            location: loc,
            area: dbSite.area || '',
            subarea: dbSite.subarea || '',
            status: 'Active'
          });
        } else {
          setSelectedSite({ code: site_code, name: `Station ${site_code}` });
        }
      })
      .catch(() => {
        setSelectedSite({ code: site_code, name: `Station ${site_code}` });
      });

    // Retrieve inspector name, cycle, date and time
    const storedInspector = localStorage.getItem('inspectorName') || 'Inspector';
    const storedCycle = localStorage.getItem('rpmCycle') || '';
    const storedDate = localStorage.getItem('inspectionDate') || '';
    const storedTime = localStorage.getItem('inspectionTime') || '';
    const storedRpmId = localStorage.getItem('currentRpmId');
    if (storedRpmId) setRpmId(Number(storedRpmId));

    setInspector(storedInspector);
    setRpmCycle(storedCycle);
    setInspectionDate(storedDate);
    setInspectionTime(storedTime);

    const storedJob = localStorage.getItem('jobNo') || '';
    const storedSap = localStorage.getItem('sapNo') || '';

    // Start or load work order from backend
    fetch('/api/workorder/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        site_code: site_code,
        rpm_cycle: storedCycle || '',
        inspection_date: storedDate || null,
        inspection_time: storedTime || null,
        job_number_sl6: storedJob || null,
        sap_number: storedSap || null
      })
    })
      .then(res => res.json())
      .then(resData => {
        // Clear temp localStorage values once sent
        localStorage.removeItem('jobNo');
        localStorage.removeItem('sapNo');
        if (resData.data && resData.data.rpm_id) {
          setRpmId(resData.data.rpm_id);
          setIsSubmitted(resData.data.status === 'Submitted' || resData.data.status === 'TL Approved' || resData.data.status === 'Approved');
          if (resData.data.rpm_cycle) {
            setRpmCycle(resData.data.rpm_cycle);
            localStorage.setItem('rpmCycle', resData.data.rpm_cycle);
          }
          if (resData.data.inspection_date) {
            const dateStr = resData.data.inspection_date.split('T')[0];
            setInspectionDate(dateStr);
            localStorage.setItem('inspectionDate', dateStr);
          }
          if (resData.data.inspection_time) {
            setInspectionTime(resData.data.inspection_time);
            localStorage.setItem('inspectionTime', resData.data.inspection_time);
          }
        }
      })
      .catch(err => console.error("Error starting workorder:", err));

    // Retrieve and set user role
    try {
      const userObj = JSON.parse(user);
      if (userObj && userObj.role) {
        setUserRole(userObj.role);
      }
    } catch (e) {
      setUserRole('Viewer');
    }
  }, [site_code]);

  const handleReset = () => {
    navigate('/select-site');
  };

  const handleSectionComplete = (sectionId) => {
    setCompletedSections(prev => ({
      ...prev,
      [sectionId]: true
    }));
  };

  const [isLithiumOnly, setIsLithiumOnly] = useState(false);

  // Check rectifier battery types
  useEffect(() => {
    if (!rpmId) return;
    const checkBatteryType = () => {
      fetch(`/api/workorder/${rpmId}/rectifiers`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            const hasVrla = data.some(r => r.battery_type === 'VRLA AGM' || r.battery_type === 'VRLA AGM + Lithium');
            const allLithium = data.every(r => r.battery_type === 'Lithium');
            setHasVrlaBattery(hasVrla);
            setIsLithiumOnly(allLithium);
          } else {
            setHasVrlaBattery(false);
            setIsLithiumOnly(false);
          }
        })
        .catch(err => console.error("Error checking rectifier battery types:", err));
    };

    checkBatteryType();
    window.addEventListener('rectifierSaved', checkBatteryType);
    return () => window.removeEventListener('rectifierSaved', checkBatteryType);
  }, [rpmId, activeTab, site_code]);

  const [rectifierQtyUih, setRectifierQtyUih] = useState(0);

  const allTabs = [
    { id: 'master', label: 'Master Site' },
    { id: 'acmain', label: 'AC Main' },
    { id: 'rectifier', label: 'Rectifier' },
    { id: 'battery', label: 'Battery Bank' },
    { id: 'facilities', label: 'Facilities' },
    { id: 'summary', label: 'สรุปปัญหาหน้างาน' },
  ];

  // Hide Rectifier and Battery Bank tabs if rectifierQtyUih === 0
  const tabList = allTabs.filter(t => {
    if (t.id === 'rectifier' && rectifierQtyUih === 0) return false;
    if (t.id === 'battery' && rectifierQtyUih === 0) return false;
    return true;
  });

  const totalRequiredSections = tabList.length;
  const activeCompletedCount = tabList.filter(t => completedSections[t.id]).length;
  const progressPercent = Math.round((activeCompletedCount / totalRequiredSections) * 100);

  const renderTabContent = () => {
    const isReadOnly = userRole === 'Viewer' || (isSubmitted && userRole !== 'Admin' && userRole !== 'Team Lead');
    const commonProps = {
      site: selectedSite,
      rpmId,
      rpmCycle,
      inspectionDate,
      inspectionTime,
      isReadOnly,
      userRole,
      isSubmitted,
      onRectifierQtyChange: setRectifierQtyUih,
      rectifierQtyUihProp: rectifierQtyUih
    };

    switch (activeTab) {
      case 'master':
        return <MasterTab {...commonProps} setRpmId={setRpmId} inspector={inspector} onComplete={() => handleSectionComplete('master')} />;
      case 'acmain':
        return <AcMainTab {...commonProps} onComplete={() => handleSectionComplete('acmain')} />;
      case 'rectifier':
        return <RectifierTab {...commonProps} onComplete={() => handleSectionComplete('rectifier')} />;
      case 'battery':
        return <BatteryTab {...commonProps} onComplete={() => handleSectionComplete('battery')} />;
      case 'facilities':
        return <FacilitiesTab {...commonProps} onComplete={() => handleSectionComplete('facilities')} />;
      case 'summary':
        return <SummaryTab {...commonProps} onComplete={() => handleSectionComplete('summary')} />;
      default:
        return <MasterTab {...commonProps} setRpmId={setRpmId} inspector={inspector} onComplete={() => handleSectionComplete('master')} />;
    }
  };

  if (!selectedSite) {
    return (
      <MainLayout currentStep="workorder" currentSite={null} onNavigateBack={handleReset}>
        <div className="flex justify-center items-center py-32 bg-dark-card border border-dark-border rounded-xl my-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          <span className="ml-3 text-gray-400 text-sm">กำลังเชื่อมต่อข้อมูลใบงานสถานี {site_code}...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      currentStep="workorder" 
      currentSite={selectedSite} 
      onNavigateBack={handleReset}
    >
      <div className="space-y-6">
        {/* Header area in workorder */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Work Order Panel</h2>
            <p className="text-gray-400 mt-1">Complete all section checklists to submit the maintenance report.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button 
              onClick={handleReset}
              className="px-4 py-2 border border-dark-border bg-dark-card hover:bg-dark-accent rounded-lg text-sm text-gray-300 font-medium transition-colors"
            >
              Change Site
            </button>
            {/* RESET BUTTON FOR TESTING (FUTURE DELETE) */}
            <button 
              disabled={userRole === 'Viewer'}
              onClick={() => {
                if (window.confirm('คุณต้องการรีเซ็ตข้อมูลความคืบหน้าทั้งหมดของไซต์นี้ เพื่อเริ่มทดสอบใหม่ใช่หรือไม่?')) {
                  localStorage.removeItem(`completed_${site_code}`);
                  setCompletedSections({ master: false, acmain: false, rectifier: false, battery: false, facilities: false, summary: false });
                  alert('รีเซ็ตสถานะความคืบหน้าของไซต์นี้เรียบร้อยแล้ว!');
                }
              }}
              className={`px-4 py-2 border rounded-lg text-sm font-semibold transition-colors ${
                userRole === 'Viewer'
                  ? 'border-gray-800 bg-gray-900/20 text-gray-600 cursor-not-allowed opacity-50'
                  : 'border-red-900/40 bg-red-900/10 hover:bg-red-900/30 text-red-400'
              }`}
            >
              Reset Draft (Test Mode)
            </button>
            <button 
              disabled={userRole === 'Viewer' || (isSubmitted && userRole !== 'Admin' && userRole !== 'Team Lead')}
              onClick={async () => {
                if (activeCompletedCount < totalRequiredSections) {
                  alert(`กรุณากรอกข้อมูลและกดบันทึกให้ครบถ้วนทั้ง ${totalRequiredSections} ส่วนก่อนส่งงานครับ!`);
                  return;
                }
                if (!rpmId) {
                  alert('ไม่สามารถส่งงานได้ เนื่องจากไม่พบรหัสใบงานหลัก (RPM ID)');
                  return;
                }
                if (!window.confirm('คุณต้องการส่งใบงานนี้ใช่หรือไม่? หลังจากส่งงานแล้วจะไม่สามารถแก้ไขข้อมูลได้อีก')) {
                  return;
                }
                try {
                  const res = await fetch(`/api/workorder/${rpmId}/submit`, { method: 'POST' });
                  if (res.ok) {
                    alert('ส่งใบงานสำเร็จเรียบร้อย! ข้อมูลทั้งหมดถูกนำส่งเข้าระบบแล้ว');
                    localStorage.removeItem(`completed_${site_code}`);
                    setCompletedSections({ master: false, acmain: false, rectifier: false, battery: false, facilities: false, summary: false });
                    navigate('/select-site');
                  } else {
                    const errData = await res.json();
                    alert('เกิดข้อผิดพลาดในการส่งงาน: ' + errData.error);
                  }
                } catch (e) {
                  alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg ${
                userRole === 'Viewer' || (isSubmitted && userRole !== 'Admin' && userRole !== 'Team Lead')
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                  : activeCompletedCount === totalRequiredSections
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-600/20'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-indigo-600/20'
              }`}
            >
              {isSubmitted ? 'Submitted (ส่งแล้ว) ✓' : `Submit Work Order ${activeCompletedCount === totalRequiredSections ? '✓' : ''}`}
            </button>
          </div>
        </div>

        {/* Progress Bar Card */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-gray-300">ความคืบหน้าการกรอกข้อมูล (Work Order Progress)</span>
            <span className="text-sm font-extrabold text-indigo-400">
              {progressPercent}% ({activeCompletedCount} จาก {totalRequiredSections} ส่วน)
            </span>
          </div>
          <div className="w-full bg-dark-bg h-3 rounded-full overflow-hidden border border-dark-border/40">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            {tabList.map((tabItem) => (
              <div 
                key={tabItem.id}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                  completedSections[tabItem.id]
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                    : 'bg-dark-bg/60 border-dark-border/60 text-gray-500'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${completedSections[tabItem.id] ? 'bg-emerald-400' : 'bg-gray-600'}`}></span>
                {tabItem.label}
              </div>
            ))}
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="border-b border-dark-border">
          <nav className="flex flex-wrap gap-2 -mb-px">
            {tabList.map((tabItem) => (
              <button
                key={tabItem.id}
                onClick={() => navigate(`/workorder/${site_code}/${tabItem.id}`)}
                className={`px-5 py-3 border-b-2 text-sm font-semibold transition-all flex items-center gap-2.5 ${
                  activeTab === tabItem.id
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-600/5'
                    : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'
                }`}
              >
                <span className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  completedSections[tabItem.id]
                    ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]'
                    : 'bg-gray-700'
                }`}></span>
                {tabItem.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Active Tab Page Content */}
        <div className="bg-dark-card border border-dark-border rounded-xl shadow-xl min-h-[400px]">
          {renderTabContent()}
        </div>
      </div>
    </MainLayout>
  );
}

function GatekeeperWrapper() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/');
    }
  }, [navigate]);

  const handleOpenWorkOrder = (site, inspectorName, rpmCycle, inspectionDate, inspectionTime, jobNo, sapNo) => {
    localStorage.setItem('inspectorName', inspectorName);
    localStorage.setItem('rpmCycle', rpmCycle);
    localStorage.setItem('inspectionDate', inspectionDate);
    localStorage.setItem('inspectionTime', inspectionTime);
    if (jobNo) localStorage.setItem('jobNo', jobNo);
    if (sapNo) localStorage.setItem('sapNo', sapNo);
    navigate(`/workorder/${site.code}/master`);
  };

  return (
    <MainLayout 
      currentStep="gatekeeper" 
      currentSite={null} 
      onNavigateBack={() => {}}
    >
      <Gatekeeper onOpenWorkOrder={handleOpenWorkOrder} />
    </MainLayout>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <MainLayout currentStep="workorder" currentSite={null} onNavigateBack={() => window.location.href = '/admin/dashboard'}>
          <div className="p-8 text-center bg-dark-card border border-red-500/30 rounded-xl my-6 space-y-4">
            <h3 className="text-xl font-bold text-red-400">เกิดข้อผิดพลาดในการโหลดหน้าใบงาน</h3>
            <p className="text-xs text-gray-400 font-mono">{this.state.error?.toString()}</p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-colors"
            >
              โหลดหน้านี้ใหม่อีกครั้ง
            </button>
          </div>
        </MainLayout>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const CLIENT_VERSION = '1.0.2';

  useEffect(() => {
    fetch('/api/auth/version')
      .then(res => res.json())
      .then(data => {
        if (data && data.version && data.version !== CLIENT_VERSION) {
          console.log(`New version ${data.version} detected. Force reloading...`);
          window.location.reload();
        }
      })
      .catch(err => console.error("Error checking app version:", err));
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/select-site" element={<GatekeeperWrapper />} />
        <Route path="/create-site" element={<CreateSite />} />
        <Route 
          path="/admin/dashboard" 
          element={
            <MainLayout currentStep="admin-dashboard" currentSite={null} onNavigateBack={() => {}}>
              <AdminDashboard />
            </MainLayout>
          } 
        />
        <Route path="/workorder/:site_code" element={<Navigate to="master" replace />} />
        <Route path="/workorder/:site_code/:tab" element={<ErrorBoundary><WorkOrderPanel /></ErrorBoundary>} />
        <Route path="/admin/fields" element={<FieldSettings />} />
        <Route path="/admin/users" element={<ManageUsers />} />
        <Route path="/admin/storage" element={<StorageBrowser />} />
        <Route 
          path="/admin/query" 
          element={
            <MainLayout currentStep="db-query" currentSite={null} onNavigateBack={() => {}}>
              <DatabaseQuery />
            </MainLayout>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
