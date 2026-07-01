import React, { useState, useEffect } from 'react';

export default function MasterTab({ site, rpmId, setRpmId, inspector, rpmCycle, inspectionDateTime, onComplete, isReadOnly }) {
  const [sl6Number, setSl6Number] = useState('');
  const [sapNumber, setSapNumber] = useState('');
  const [summaryIssue, setSummaryIssue] = useState('');
  const [rectifierQtyUih, setRectifierQtyUih] = useState('1');
  const [isSaving, setIsSaving] = useState(false);
  const [fieldConfigs, setFieldConfigs] = useState([]);

  // Load existing data and configs
  useEffect(() => {
    // Fetch configs for Master site
    fetch('/api/field-configs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFieldConfigs(data.filter(c => c.tab_name === 'master'));
        }
      })
      .catch(err => console.error("Error loading configs:", err));

    if (!site?.code) return;
    fetch('/api/workorder/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        site_code: site.code,
        rpm_cycle: localStorage.getItem('rpmCycle') || ''
      })
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.data) {
          setSl6Number(resData.data.job_number_sl6 || `SL6-TEMP-${site.code}`);
          setSapNumber(resData.data.sap_number || `SAP-TEMP-${site.code}`);
          setSummaryIssue(resData.data.summary_issue || '');
          setRectifierQtyUih(String(resData.data.rectifier_qty_uih || '1'));
          if (resData.data.rpm_id && setRpmId) {
            setRpmId(resData.data.rpm_id);
          }
        }
      })
      .catch(err => console.error("Error loading master info:", err));
  }, [site?.code]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!rpmId) {
      alert('ไม่พบรหัสใบงานหลัก (rpmId) กรุณาลองใหม่อีกครั้ง');
      return;
    }

    // Dynamic validations
    const sl6Cfg = fieldConfigs.find(c => c.field_name === 'job_number_sl6');
    const sapCfg = fieldConfigs.find(c => c.field_name === 'sap_number');
    const issueCfg = fieldConfigs.find(c => c.field_name === 'summary_issue');

    if (sl6Cfg?.is_enabled && sl6Cfg?.is_required && !sl6Number.trim()) {
      alert('กรุณากรอก SL6 Number');
      return;
    }
    if (sapCfg?.is_enabled && sapCfg?.is_required && !sapNumber.trim()) {
      alert('กรุณากรอก SAP Number');
      return;
    }
    if (issueCfg?.is_enabled && issueCfg?.is_required && !summaryIssue.trim()) {
      alert('กรุณากรอก สรุปปัญหาหน้างาน');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/workorder/${rpmId}/master`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_number_sl6: (sl6Cfg?.is_enabled ?? true) ? sl6Number : '',
          sap_number: (sapCfg?.is_enabled ?? true) ? sapNumber : '',
          summary_issue: (issueCfg?.is_enabled ?? true) ? summaryIssue : '',
          rectifier_qty_uih: parseInt(rectifierQtyUih, 10),
          rpm_cycle: rpmCycle || '',
          inspection_date_time: inspectionDateTime || null
        })
      });
      if (res.ok) {
        alert('บันทึกข้อมูลใบงานหลักสำเร็จ!');
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

  const getFieldConfig = (name) => {
    const cfg = fieldConfigs.find(c => c.field_name === name);
    return {
      isEnabled: cfg ? cfg.is_enabled : true,
      isRequired: cfg ? cfg.is_required : true
    };
  };

  const sl6Config = getFieldConfig('job_number_sl6');
  const sapConfig = getFieldConfig('sap_number');
  const issueConfig = getFieldConfig('summary_issue');

  return (
    <div className="p-8 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">ข้อมูลใบงานหลัก (Master Records)</h3>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sl6Config.isEnabled ? (
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                SL6 Number {sl6Config.isRequired && <span className="text-red-400">*</span>}
              </label>
              <input 
                type="text" 
                required={sl6Config.isRequired}
                disabled={isReadOnly}
                className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none transition-colors disabled:opacity-50"
                value={sl6Number}
                onChange={(e) => setSl6Number(e.target.value)}
              />
            </div>
          ) : (
            <div className="opacity-40 bg-dark-bg/20 p-4 border border-dark-border/40 rounded-lg flex items-center justify-center text-xs text-gray-500 line-through">
              SL6 Number (ถูกปิดใช้งานโดย Admin)
            </div>
          )}

          {sapConfig.isEnabled ? (
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                SAP Number {sapConfig.isRequired && <span className="text-red-400">*</span>}
              </label>
              <input 
                type="text" 
                required={sapConfig.isRequired}
                disabled={isReadOnly}
                className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none transition-colors disabled:opacity-50"
                value={sapNumber}
                onChange={(e) => setSapNumber(e.target.value)}
              />
            </div>
          ) : (
            <div className="opacity-40 bg-dark-bg/20 p-4 border border-dark-border/40 rounded-lg flex items-center justify-center text-xs text-gray-500 line-through">
              SAP Number (ถูกปิดใช้งานโดย Admin)
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
              จำนวน Rectifier UIH
            </label>
            <select
              disabled={isReadOnly}
              className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none transition-colors disabled:opacity-50"
              value={rectifierQtyUih}
              onChange={(e) => setRectifierQtyUih(e.target.value)}
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
            </select>
          </div>
        </div>

        {issueConfig.isEnabled ? (
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
              สรุปปัญหาหน้างาน {issueConfig.isRequired && <span className="text-red-400">*</span>}
            </label>
            <textarea 
              rows={4}
              required={issueConfig.isRequired}
              disabled={isReadOnly}
              placeholder="รายละเอียดหรือปัญหาที่พบระหว่างตรวจสอบ..."
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
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลใบงานหลัก'}
            </button>
          ) : (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs font-medium">
              คุณอยู่ในโหมดผู้เข้าชมทั่วไป (Viewer) ทำได้เฉพาะการดูข้อมูลเท่านั้น ไม่สามารถแก้ไขหรือบันทึกได้
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
