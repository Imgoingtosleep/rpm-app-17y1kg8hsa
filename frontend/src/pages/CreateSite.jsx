import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

export default function CreateSite() {
  const navigate = useNavigate();
  const [siteCode, setSiteCode] = useState('');
  const [siteName, setSiteName] = useState('');
  const [siteGrade, setSiteGrade] = useState('A');
  const [siteType, setSiteType] = useState('Indoor');
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
        }),
      });

      if (res.ok) {
        alert('สร้างสถานีใหม่เรียบร้อยแล้ว!');
        navigate('/select-site');
      } else {
        const errData = await res.json();
        alert('เกิดข้อผิดพลาด: ' + errData.error);
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

      if (siteCodeIdx === -1 || siteNameIdx === -1) {
        alert('รูปแบบหัวข้อไฟล์ CSV ไม่ถูกต้อง (ต้องระบุคอลัมน์ site_code และ site_name)');
        return;
      }

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        // Split handling comma and double quotes
        const columns = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
        
        const site_code = columns[siteCodeIdx];
        const site_name = columns[siteNameIdx];

        if (site_code && site_name) {
          parsedSites.push({
            site_code: site_code.toUpperCase(),
            site_name,
            site_grade: 'A',
            site_type: 'Indoor'
          });
        }
      }

      if (parsedSites.length === 0) {
        alert('ไม่พบข้อมูลสถานีที่ถูกต้องในไฟล์ CSV');
        return;
      }

      if (!window.confirm(`ตรวจพบข้อมูลสถานีจำนวน ${parsedSites.length} รายการ\nคุณต้องการนำเข้ารายชื่อทั้งหมดลงระบบฐานข้อมูลใช่หรือไม่?`)) {
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
          alert(result.message || 'นำเข้าข้อมูลสถานีเรียบร้อย!');
          navigate('/select-site');
        } else {
          const errData = await res.json();
          alert('เกิดข้อผิดพลาดในการนำเข้า: ' + errData.error);
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
            <h3 className="font-bold text-white text-lg">Import Stations via CSV</h3>
            <p className="text-gray-400 text-xs mt-1">อัปโหลดไฟล์ข้อมูล CSV เพื่อนำเข้ารายชื่อสถานีแบบกลุ่ม (Bulk Import)</p>
          </div>

          <div className="bg-dark-bg/40 border border-dashed border-dark-border p-6 rounded-lg text-center space-y-3">
            <div className="text-xs text-gray-400">
              <p>ไฟล์ CSV จะต้องมีหัวข้อคอลัมน์แถวแรกเป็น:</p>
              <code className="inline-block mt-2 bg-dark-accent/60 px-3 py-1.5 rounded font-mono text-indigo-400 font-semibold">
                site_code,site_name
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
