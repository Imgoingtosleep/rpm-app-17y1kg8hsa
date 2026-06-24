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

function WorkOrderPanel() {
  const { site_code, tab } = useParams();
  const navigate = useNavigate();
  const activeTab = tab || 'master';

  const [selectedSite, setSelectedSite] = useState(null);
  const [inspector, setInspector] = useState('');
  const [rpmCycle, setRpmCycle] = useState('');
  const [inspectionDateTime, setInspectionDateTime] = useState('');

  // Track completed sections
  const [completedSections, setCompletedSections] = useState(() => {
    try {
      const stored = localStorage.getItem(`completed_${site_code}`);
      return stored ? JSON.parse(stored) : { master: false, acmain: false, rectifier: false, battery: false, facilities: false };
    } catch {
      return { master: false, acmain: false, rectifier: false, battery: false, facilities: false };
    }
  });

  // Save completion state to local storage when it updates
  useEffect(() => {
    if (site_code) {
      localStorage.setItem(`completed_${site_code}`, JSON.stringify(completedSections));
    }
  }, [completedSections, site_code]);

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/');
      return;
    }

    // Resolve site dynamically from database via API
    fetch('/api/sites')
      .then(res => res.json())
      .then(data => {
        const dbSite = data.find(s => s.site_code.toLowerCase() === site_code?.toLowerCase());
        if (dbSite) {
          setSelectedSite({
            id: dbSite.site_id,
            name: `${dbSite.site_name} (${dbSite.site_code})`,
            code: dbSite.site_code,
            location: `${dbSite.site_type || 'N/A'} - Grade ${dbSite.site_grade || '-'}`,
            status: 'Active'
          });
        } else {
          setSelectedSite({ code: site_code, name: `Station ${site_code}` });
        }
      })
      .catch(() => {
        setSelectedSite({ code: site_code, name: `Station ${site_code}` });
      });

    // Retrieve inspector name, cycle, and datetime
    const storedInspector = localStorage.getItem('inspectorName') || 'Inspector';
    const storedCycle = localStorage.getItem('rpmCycle') || '';
    const storedDateTime = localStorage.getItem('inspectionDateTime') || '';
    setInspector(storedInspector);
    setRpmCycle(storedCycle);
    setInspectionDateTime(storedDateTime);
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

  const totalCompleted = Object.values(completedSections).filter(Boolean).length;
  const progressPercent = Math.round((totalCompleted / 5) * 100);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'master':
        return <MasterTab site={selectedSite} inspector={inspector} rpmCycle={rpmCycle} inspectionDateTime={inspectionDateTime} onComplete={() => handleSectionComplete('master')} />;
      case 'acmain':
        return <AcMainTab site={selectedSite} onComplete={() => handleSectionComplete('acmain')} />;
      case 'rectifier':
        return <RectifierTab site={selectedSite} onComplete={() => handleSectionComplete('rectifier')} />;
      case 'battery':
        return <BatteryTab site={selectedSite} onComplete={() => handleSectionComplete('battery')} />;
      case 'facilities':
        return <FacilitiesTab site={selectedSite} onComplete={() => handleSectionComplete('facilities')} />;
      default:
        return <MasterTab site={selectedSite} inspector={inspector} rpmCycle={rpmCycle} inspectionDateTime={inspectionDateTime} onComplete={() => handleSectionComplete('master')} />;
    }
  };

  const tabList = [
    { id: 'master', label: 'Master Site' },
    { id: 'acmain', label: 'AC Main' },
    { id: 'rectifier', label: 'Rectifier' },
    { id: 'battery', label: 'Battery Bank' },
    { id: 'facilities', label: 'Facilities' },
  ];

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
              onClick={() => {
                if (window.confirm('คุณต้องการรีเซ็ตข้อมูลความคืบหน้าทั้งหมดของไซต์นี้ เพื่อเริ่มทดสอบใหม่ใช่หรือไม่?')) {
                  localStorage.removeItem(`completed_${site_code}`);
                  setCompletedSections({ master: false, acmain: false, rectifier: false, battery: false, facilities: false });
                  alert('รีเซ็ตสถานะความคืบหน้าของไซต์นี้เรียบร้อยแล้ว!');
                }
              }}
              className="px-4 py-2 border border-red-900/40 bg-red-900/10 hover:bg-red-900/30 rounded-lg text-sm text-red-400 font-semibold transition-colors"
            >
              Reset Draft (Test Mode)
            </button>
            <button 
              onClick={() => {
                if (totalCompleted < 5) {
                  alert('กรุณากรอกข้อมูลและกดบันทึกให้ครบถ้วนทั้ง 5 ส่วนก่อนส่งงานครับ!');
                } else {
                  alert('ส่งใบงานสำเร็จเรียบร้อย! ข้อมูลทั้งหมดถูกนำส่งเข้าระบบแล้ว');
                  localStorage.removeItem(`completed_${site_code}`);
                  setCompletedSections({ master: false, acmain: false, rectifier: false, battery: false, facilities: false });
                  navigate('/select-site');
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg ${
                totalCompleted === 5
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-600/20'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-indigo-600/20'
              }`}
            >
              Submit Work Order {totalCompleted === 5 && '✓'}
            </button>
          </div>
        </div>

        {/* Progress Bar Card */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-gray-300">ความคืบหน้าการกรอกข้อมูล (Work Order Progress)</span>
            <span className="text-sm font-extrabold text-indigo-400">
              {progressPercent}% ({totalCompleted} จาก 5 ส่วน)
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

  const handleOpenWorkOrder = (site, inspectorName, rpmCycle, inspectionDateTime) => {
    localStorage.setItem('inspectorName', inspectorName);
    localStorage.setItem('rpmCycle', rpmCycle);
    localStorage.setItem('inspectionDateTime', inspectionDateTime);
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

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/select-site" element={<GatekeeperWrapper />} />
        <Route path="/workorder/:site_code" element={<Navigate to="master" replace />} />
        <Route path="/workorder/:site_code/:tab" element={<WorkOrderPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
