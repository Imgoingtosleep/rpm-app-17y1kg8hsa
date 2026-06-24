import React, { useState, useEffect } from 'react';

export default function MasterTab({ site, inspector, rpmCycle, inspectionDateTime, onComplete }) {
  const [sl6Number, setSl6Number] = useState(`SL6-TEMP-${site?.code || 'SITE'}`);
  const [sapNumber, setSapNumber] = useState(`SAP-TEMP-${site?.code || 'SITE'}`);
  const [summaryIssue, setSummaryIssue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    // Mock save endpoint or direct call
    setTimeout(() => {
      setIsSaving(false);
      alert('บันทึกข้อมูลใบงานหลักสำเร็จ!');
      if (onComplete) onComplete();
    }, 800);
  };

  // Helper to format date-time
  const formatDateTime = (dtStr) => {
    if (!dtStr) return 'ไม่ได้ระบุ';
    try {
      const date = new Date(dtStr);
      return date.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }) + ' น.';
    } catch (e) {
      return dtStr;
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">📝 ข้อมูลใบงานหลัก (Master Records)</h3>
        <p className="text-gray-400 text-sm mt-1">กรอกข้อมูลอ้างอิงใบงานหลักและสรุปปัญหาสถานี</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">รอบการตรวจ (RPM Cycle)</label>
            <div className="w-full bg-dark-bg/60 border border-dark-border rounded-lg p-3 text-sm text-indigo-400 font-semibold">
              {rpmCycle || 'ไม่ได้ระบุ'}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">ผู้ตรวจสอบ (Inspector)</label>
            <div className="w-full bg-dark-bg/60 border border-dark-border rounded-lg p-3 text-sm text-gray-200 font-semibold truncate">
              {inspector || 'ไม่ได้ระบุ'}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">วันเวลาที่ตรวจสอบ</label>
            <div className="w-full bg-dark-bg/60 border border-dark-border rounded-lg p-3 text-sm text-gray-200 font-semibold">
              {formatDateTime(inspectionDateTime)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">SL6 Number *</label>
            <input 
              type="text" 
              required
              className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none transition-colors"
              value={sl6Number}
              onChange={(e) => setSl6Number(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">SAP Number *</label>
            <input 
              type="text" 
              required
              className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none transition-colors"
              value={sapNumber}
              onChange={(e) => setSapNumber(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">สรุปปัญหาหน้างาน</label>
          <textarea 
            rows={4}
            placeholder="รายละเอียดหรือปัญหาที่พบระหว่างตรวจสอบ..."
            className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none transition-colors"
            value={summaryIssue}
            onChange={(e) => setSummaryIssue(e.target.value)}
          />
        </div>

        <div className="pt-2">
          <button 
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm transition-all shadow-md"
          >
            {isSaving ? 'กำลังบันทึก...' : '💾 บันทึกข้อมูลใบงานหลัก'}
          </button>
        </div>
      </form>
    </div>
  );
}
