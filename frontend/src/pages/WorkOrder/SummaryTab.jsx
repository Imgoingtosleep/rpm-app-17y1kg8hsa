import React, { useState, useEffect } from 'react';

export default function SummaryTab({ site, rpmId, onComplete, isReadOnly, userRole, isSubmitted }) {
  const [summaryIssue, setSummaryIssue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [fieldConfigs, setFieldConfigs] = useState([]);

  useEffect(() => {
    // Fetch configs for Summary tab
    fetch('/api/field-configs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFieldConfigs(data.filter(c => c.tab_name === 'summary'));
        }
      })
      .catch(err => console.error("Error loading configs:", err));

    if (!rpmId) return;
    fetch(`/api/workorder/${rpmId}/master`)
      .then(res => res.json())
      .then(resData => {
        if (resData) {
          setSummaryIssue(resData.summary_issue || '');
        }
      })
      .catch(err => console.error("Error loading summary info:", err));
  }, [rpmId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!rpmId) {
      alert('ไม่พบรหัสใบงานหลัก (rpmId) กรุณาลองใหม่อีกครั้ง');
      return;
    }

    const issueCfg = fieldConfigs.find(c => c.field_name === 'summary_issue');
    const isRequired = issueCfg ? issueCfg.is_required : true;
    const isEnabled = issueCfg ? issueCfg.is_enabled : true;

    if (isEnabled && isRequired && !summaryIssue.trim()) {
      alert('กรุณากรอก สรุปปัญหาหน้างาน');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/workorder/${rpmId}/summary`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary_issue: isEnabled ? summaryIssue : ''
        })
      });
      if (res.ok) {
        alert('บันทึกข้อมูลสรุปปัญหาสำเร็จ!');
        if (onComplete) onComplete();
      } else {
        const errorData = await res.json();
        alert('เกิดข้อผิดพลาด: ' + errorData.error);
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsSaving(false);
    }
  };

  const issueCfg = fieldConfigs.find(c => c.field_name === 'summary_issue') || { is_enabled: true, is_required: true };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">สรุปปัญหาหน้างาน</h3>
        <p className="text-gray-400 text-sm mt-1">กรอกรายละเอียดสรุปผลหรือปัญหาที่พบระหว่างทำการเข้าตรวจวัดที่สถานี</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5 max-w-2xl">
        {issueCfg.is_enabled ? (
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
              สรุปปัญหาหน้างาน {issueCfg.is_required && <span className="text-red-400">*</span>}
            </label>
            <textarea 
              rows={8}
              required={issueCfg.is_required}
              disabled={isReadOnly}
              placeholder="กรอกรายละเอียดปัญหา อุปสรรค หรือข้อเสนอแนะเพิ่มเติม..."
              className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none transition-colors disabled:opacity-50"
              value={summaryIssue}
              onChange={(e) => setSummaryIssue(e.target.value)}
            />
          </div>
        ) : (
          <div className="opacity-40 bg-dark-bg/20 p-6 border border-dark-border/40 rounded-lg flex items-center justify-center text-xs text-gray-500 line-through">
            สรุปปัญหาหน้างาน (ถูกปิดใช้งานโดย Admin)
          </div>
        )}

        <div className="pt-2">
          {!isReadOnly ? (
            <button 
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm transition-all shadow-md"
            >
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลสรุปปัญหา'}
            </button>
          ) : (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs font-medium">
              {isSubmitted 
                ? 'ใบงานนี้ถูกส่งเรียบร้อยแล้ว — แสดงผลในรูปแบบตรวจสอบ (Read-Only)'
                : userRole === 'Team Lead' 
                ? 'โหมดตรวจสอบงาน (Team Lead) — แสดงผลในรูปแบบตรวจสอบ (Read-Only)'
                : 'คุณอยู่ในโหมดผู้เข้าชมทั่วไป (Viewer) ทำได้เฉพาะการดูข้อมูลเท่านั้น ไม่สามารถแก้ไขหรือบันทึกได้'}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
