import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

export default function CreateSite() {
  const navigate = useNavigate();
  const [siteCode, setSiteCode] = useState('');
  const [siteName, setSiteName] = useState('');
  const [siteGrade, setSiteGrade] = useState('A');
  const [siteType, setSiteType] = useState('Indoor');
  const [area, setArea] = useState('');
  const [subarea, setSubarea] = useState('');
  
  // Job SL6 & SAP fields
  const [jobNumberSl6, setJobNumberSl6] = useState('');
  const [sapNumber, setSapNumber] = useState('');
  const [rpmCycle, setRpmCycle] = useState('2026-R1');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        const parsed = JSON.parse(user);
        if (parsed.role !== 'Admin') {
          alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (เฉพาะผู้ดูแลระบบ Admin เท่านั้น)');
          navigate('/select-site');
        }
      } else {
        navigate('/');
      }
    } catch (e) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!siteCode.trim() || !siteName.trim()) {
      alert('กรุณากรอกรหัสสถานีและชื่อสถานีให้ครบถ้วน');
      return;
    }

    if ((jobNumberSl6.trim() && !sapNumber.trim()) || (!jobNumberSl6.trim() && sapNumber.trim())) {
      alert('หากต้องการผูกใบงาน (Job) กรุณากรอกทั้ง เลขที่ SL6 และ เลขที่ SAP ให้ครบถ้วน');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          site_code: siteCode.trim(),
          site_name: siteName.trim(),
          site_grade: siteGrade,
          site_type: siteType,
          area: area.trim() || null,
          subarea: subarea.trim() || null,
          job_number_sl6: jobNumberSl6.trim() || null,
          sap_number: sapNumber.trim() || null,
          rpm_cycle: rpmCycle.trim() || '2026-R1'
        }),
      });

      if (res.ok) {
        alert(`สร้างสถานี ${siteCode.toUpperCase()} ${jobNumberSl6 ? 'และผูกใบงาน SL6' : ''} เรียบร้อยแล้ว!`);
        navigate('/select-site');
      } else {
        const errData = await res.json();
        alert('เกิดข้อผิดพลาด: ' + (errData.error || 'ไม่สามารถเพิ่มสถานีได้'));
      }
    } catch (err) {
      alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target.result;
      const lines = text.split(/\r?\n/);
      const parsedSites = [];

      if (lines.length <= 1) {
        alert('ไฟล์ CSV ไม่มีข้อมูล');
        return;
      }

      // Check header values
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const siteCodeIdx = headers.indexOf('site_code');
      const siteNameIdx = headers.indexOf('site_name');
      const siteGradeIdx = headers.indexOf('site_grade');
      const siteTypeIdx = headers.indexOf('site_type');
      const areaIdx = headers.indexOf('area');
      const subareaIdx = headers.indexOf('subarea');
      
      const sl6Idx = headers.indexOf('job_number_sl6');
      const sapIdx = headers.indexOf('sap_number');
      const cycleIdx = headers.indexOf('rpm_cycle');

      if (siteCodeIdx === -1 || siteNameIdx === -1) {
        alert('รูปแบบหัวข้อไฟล์ CSV ไม่ถูกต้อง (ต้องระบุคอลัมน์ site_code และ site_name เป็นอย่างน้อย)');
        return;
      }

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        // Split handling comma and double quotes
        const columns = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
        
        const site_code = columns[siteCodeIdx];
        const site_name = columns[siteNameIdx];
        
        const rawGrade = siteGradeIdx !== -1 && siteGradeIdx < columns.length && columns[siteGradeIdx] ? columns[siteGradeIdx].trim().toUpperCase() : 'A';
        const site_grade = ['A', 'B', 'C'].includes(rawGrade) ? rawGrade : 'A';
        
        const rawType = siteTypeIdx !== -1 && siteTypeIdx < columns.length && columns[siteTypeIdx] ? columns[siteTypeIdx].trim() : 'Indoor';
        const site_type = rawType.toLowerCase() === 'outdoor' ? 'Outdoor' : 'Indoor';

        const areaVal = areaIdx !== -1 && areaIdx < columns.length && columns[areaIdx] ? columns[areaIdx].trim() : null;
        const subareaVal = subareaIdx !== -1 && subareaIdx < columns.length && columns[subareaIdx] ? columns[subareaIdx].trim() : null;

        const job_number_sl6 = sl6Idx !== -1 && sl6Idx < columns.length && columns[sl6Idx] ? columns[sl6Idx].trim() : null;
        const sap_number = sapIdx !== -1 && sapIdx < columns.length && columns[sapIdx] ? columns[sapIdx].trim() : null;
        const rpm_cycle = cycleIdx !== -1 && cycleIdx < columns.length && columns[cycleIdx] ? columns[cycleIdx].trim() : '2026-R1';

        if (site_code && site_name) {
          parsedSites.push({
            site_code: site_code.toUpperCase(),
            site_name,
            site_grade,
            site_type,
            area: areaVal,
            subarea: subareaVal,
            job_number_sl6,
            sap_number,
            rpm_cycle
          });
        }
      }

      if (parsedSites.length === 0) {
        alert('ไม่พบข้อมูลสถานีที่ถูกต้องในไฟล์ CSV');
        return;
      }

      if (!window.confirm(`ตรวจพบข้อมูลจำนวน ${parsedSites.length} รายการ\nคุณต้องการนำเข้ารายชื่อทั้งหมดลงระบบฐานข้อมูลใช่หรือไม่?`)) {
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await fetch('/api/sites/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sites: parsedSites }),
        });

        if (res.ok) {
          const result = await res.json();
          alert(`✅ นำเข้าข้อมูลเรียบร้อยแล้ว!\nจำนวนทั้งหมด ${result.total} รายการ`);
          navigate('/select-site');
        } else {
          const errData = await res.json();
          alert(`🚫 ไม่สามารถนำเข้าข้อมูลได้ (ยกเลิกการนำเข้าทั้งหมด!)\n\n${errData.error || 'เกิดข้อผิดพลาดในการนำเข้า'}`);
        }
      } catch (err) {
        alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
      } finally {
        setIsSubmitting(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <MainLayout currentStep="create-site" currentSite={null} onNavigateBack={() => navigate('/select-site')}>
      <div className="max-w-2xl mx-auto space-y-6 py-6">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Create Station (Add Site Code)</h2>
          <p className="text-gray-400 mt-1">เพิ่มรหัสสถานีและกำหนดรายละเอียดประเภทของไซต์ลงในระบบ Checklists</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-dark-card border border-dark-border rounded-xl p-8 space-y-6 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">รหัสสถานี (Site Code) <span className="text-red-400">*</span></label>
              <input
                type="text"
                required
                placeholder="เช่น CNX-101"
                className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none transition-colors"
                value={siteCode}
                onChange={(e) => setSiteCode(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">ชื่อสถานี (Site Name) <span className="text-red-400">*</span></label>
              <input
                type="text"
                required
                placeholder="เช่น สถานีเชียงใหม่ ท่าแพ"
                className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none transition-colors"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">เขต/พื้นที่หลัก (Area)</label>
              <input
                type="text"
                placeholder="เช่น ภาคเหนือ, BKK-N, Area 1"
                className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none transition-colors"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">พื้นที่ย่อย (Sub-Area)</label>
              <input
                type="text"
                placeholder="เช่น เชียงใหม่, Zone A-1, Sub 2"
                className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none transition-colors"
                value={subarea}
                onChange={(e) => setSubarea(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">ระดับความสำคัญ (Site Grade)</label>
              <select
                className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none transition-colors"
                value={siteGrade}
                onChange={(e) => setSiteGrade(e.target.value)}
              >
                <option value="A">Grade A (ความสำคัญสูงสุด)</option>
                <option value="B">Grade B (ความสำคัญปานกลาง)</option>
                <option value="C">Grade C (ความสำคัญปกติ)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">ประเภทของสถานี (Site Type)</label>
              <select
                className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none transition-colors"
                value={siteType}
                onChange={(e) => setSiteType(e.target.value)}
              >
                <option value="Indoor">Indoor (ภายในอาคาร)</option>
                <option value="Outdoor">Outdoor (ภายนอกอาคาร)</option>
              </select>
            </div>
          </div>

          {/* Job Section (Optional) */}
          <div className="pt-4 border-t border-dark-border/60">
            <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-4">ข้อมูลใบงาน (Work Order Job - Optional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">เลขที่ SL6 (Job SL6)</label>
                <input
                  type="text"
                  placeholder="เช่น SL6-2026-001"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none transition-colors"
                  value={jobNumberSl6}
                  onChange={(e) => setJobNumberSl6(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">เลขที่ SAP (SAP No.)</label>
                <input
                  type="text"
                  placeholder="เช่น SAP-9000123"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none transition-colors"
                  value={sapNumber}
                  onChange={(e) => setSapNumber(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">รอบการตรวจ (Cycle)</label>
                <input
                  type="text"
                  placeholder="เช่น 2026-R1"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none transition-colors"
                  value={rpmCycle}
                  onChange={(e) => setRpmCycle(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm transition-all shadow-md"
            >
              {isSubmitting ? 'กำลังเพิ่มไซต์...' : 'เพิ่มสถานีลง Database'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/select-site')}
              className="px-6 py-3 bg-dark-accent/40 border border-dark-border text-gray-300 hover:text-gray-100 hover:border-gray-600 rounded-lg text-sm transition-all"
            >
              ยกเลิก
            </button>
          </div>
        </form>

        <div className="bg-dark-card border border-dark-border rounded-xl p-8 space-y-4 shadow-xl">
          <div>
            <h3 className="font-bold text-white text-lg">Import Stations & Jobs via CSV</h3>
            <p className="text-gray-400 text-xs mt-1">อัปโหลดไฟล์ข้อมูล CSV เพื่อนำเข้ารายชื่อสถานีและใบงานพร้อมกันแบบกลุ่ม (Bulk Import)</p>
          </div>

          <div className="bg-dark-bg/40 border border-dashed border-dark-border p-6 rounded-lg text-center space-y-3">
            <div className="text-xs text-gray-400">
              <p>รองรับการนำเข้าสถานีพร้อมสร้าง Job SL6/SAP โดยระบุหัวข้อคอลัมน์แถวแรกใน CSV ดังนี้:</p>
              <code className="inline-block mt-2 bg-dark-accent/60 px-3 py-1.5 rounded font-mono text-indigo-400 font-semibold break-all">
                site_code,site_name,site_grade,site_type,job_number_sl6,sap_number,rpm_cycle
              </code>
            </div>
            
            <div className="pt-2">
              <input 
                type="file" 
                accept=".csv"
                disabled={isSubmitting}
                onChange={handleCSVUpload}
                className="mx-auto block text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-600/10 file:text-indigo-400 hover:file:bg-indigo-600/20 cursor-pointer disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
