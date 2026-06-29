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
      </div>
    </MainLayout>
  );
}
