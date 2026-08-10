import React, { useState, useEffect } from 'react';

export default function MasterTab({ site, rpmId, setRpmId, inspector, rpmCycle, inspectionDate, inspectionTime, onComplete, isReadOnly, onRectifierQtyChange, userRole, isSubmitted }) {
  const [sl6Number, setSl6Number] = useState('');
  const [sapNumber, setSapNumber] = useState('');
  const [rectifierQtyUih, setRectifierQtyUih] = useState('');
  const [jobOpenedAt, setJobOpenedAt] = useState('');
  const [localDate, setLocalDate] = useState(inspectionDate || '');
  const [localTime, setLocalTime] = useState(inspectionTime || '');
  const [isSaving, setIsSaving] = useState(false);
  const [fieldConfigs, setFieldConfigs] = useState([]);

  const getUserRole = () => {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        const parsed = JSON.parse(user);
        return parsed.role || 'Viewer';
      }
    } catch (e) {
      console.error(e);
    }
    return 'Viewer';
  };

  const isAdmin = getUserRole() === 'Admin';

  // Synchronize local states when parent props load asynchronously
  useEffect(() => {
    if (inspectionDate) {
      setLocalDate(inspectionDate);
    }
  }, [inspectionDate]);

  useEffect(() => {
    if (inspectionTime) {
      setLocalTime(inspectionTime);
    }
  }, [inspectionTime]);

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
          setSl6Number(resData.data.job_number_sl6 || '');
          setSapNumber(resData.data.sap_number || '');
          if (resData.data.created_at) {
            try {
              const createdDate = new Date(resData.data.created_at);
              setJobOpenedAt(createdDate.toLocaleString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) + ' น.');
            } catch (e) {
              setJobOpenedAt(resData.data.created_at);
            }
          }
          const qty = resData.data.rectifier_qty_uih !== undefined && resData.data.rectifier_qty_uih !== null ? resData.data.rectifier_qty_uih : 0;
          setRectifierQtyUih(String(qty));
          if (onRectifierQtyChange) onRectifierQtyChange(parseInt(qty, 10));
          const now = new Date();
          const defaultDate = now.toISOString().split('T')[0];
          const defaultTime = now.toTimeString().split(' ')[0].substring(0, 5);

          setLocalDate(resData.data.inspection_date ? resData.data.inspection_date.split('T')[0] : defaultDate);
          setLocalTime(resData.data.inspection_time ? resData.data.inspection_time.substring(0, 5) : defaultTime);
          
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

    if (!rectifierQtyUih) {
      alert('กรุณาเลือก จำนวน Rectifier UIH');
      return;
    }

    // Dynamic validations
    const sl6Cfg = fieldConfigs.find(c => c.field_name === 'job_number_sl6');
    const sapCfg = fieldConfigs.find(c => c.field_name === 'sap_number');

    if (sl6Cfg?.is_enabled && sl6Cfg?.is_required && !sl6Number.trim()) {
      alert('กรุณากรอก SL6 Number');
      return;
    }
    if (sapCfg?.is_enabled && sapCfg?.is_required && !sapNumber.trim()) {
      alert('กรุณากรอก SAP Number');
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
          rectifier_qty_uih: parseInt(rectifierQtyUih, 10),
          rpm_cycle: rpmCycle || '',
          inspection_date: localDate || null,
          inspection_time: localTime || null
        })
      });
      if (res.ok) {
        alert('บันทึกข้อมูลใบงานหลักสำเร็จ!');
        if (onRectifierQtyChange) onRectifierQtyChange(parseInt(rectifierQtyUih, 10));
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

  // Helper to format date
  const formatDateTh = (dStr) => {
    if (!dStr) return 'ไม่ได้ระบุ';
    try {
      const date = new Date(dStr);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dStr;
    }
  };

  // Helper to format time
  const formatTimeTh = (tStr) => {
    if (!tStr) return 'ไม่ได้ระบุ';
    // Remove seconds if present (e.g. 14:30:00 -> 14:30)
    const parts = tStr.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]} น.`;
    }
    return tStr;
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

  return (
    <div className="p-8 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">ข้อมูลใบงานหลัก (Master Records)</h3>
        <p className="text-gray-400 text-sm mt-1">กรอกข้อมูลอ้างอิงใบงานหลักและสรุปปัญหาสถานี</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5 max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">เขต/พื้นที่หลัก (Area)</label>
            <div className="w-full bg-dark-bg/60 border border-dark-border rounded-lg p-3 text-sm text-amber-400 font-semibold truncate">
              {site?.area || 'ไม่ได้ระบุ'}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">พื้นที่ย่อย (Sub-Area)</label>
            <div className="w-full bg-dark-bg/60 border border-dark-border rounded-lg p-3 text-sm text-amber-400 font-semibold truncate">
              {site?.subarea || 'ไม่ได้ระบุ'}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">รอบการตรวจ (Cycle)</label>
            <div className="w-full bg-dark-bg/60 border border-dark-border rounded-lg p-3 text-sm text-indigo-400 font-semibold">
              {rpmCycle || 'ไม่ได้ระบุ'}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">ผู้ตรวจสอบ</label>
            <div className="w-full bg-dark-bg/60 border border-dark-border rounded-lg p-3 text-sm text-gray-200 font-semibold truncate">
              {inspector || 'ไม่ได้ระบุ'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
              วันที่เข้าตรวจสอบ (Inspection Date)
            </label>
            <input 
              type="date"
              disabled={isReadOnly}
              className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm text-gray-200 focus:border-indigo-500 outline-none transition-colors disabled:opacity-50"
              value={localDate}
              onChange={(e) => setLocalDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
              เวลาที่เข้าตรวจสอบ (Inspection Time)
            </label>
            <div className="flex gap-2">
              <input 
                type="time"
                disabled={isReadOnly}
                className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm text-gray-200 focus:border-indigo-500 outline-none transition-colors disabled:opacity-50"
                value={localTime}
                onChange={(e) => setLocalTime(e.target.value)}
              />
              {!isReadOnly && (
                <button
                  type="button"
                  title="ใช้วันที่และเวลาปัจจุบัน"
                  onClick={() => {
                    const now = new Date();
                    const dStr = now.toISOString().split('T')[0];
                    const tStr = now.toTimeString().split(' ')[0].substring(0, 5);
                    setLocalDate(dStr);
                    setLocalTime(tStr);
                  }}
                  className="px-2.5 py-1 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/30 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
                >
                  ตอนนี้
                </button>
              )}
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
                disabled={isReadOnly || !isAdmin}
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
                disabled={isReadOnly || !isAdmin}
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
              จำนวน Rectifier UIH <span className="text-red-400">*</span>
            </label>
            <select
              disabled={isReadOnly}
              className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none transition-colors disabled:opacity-50"
              value={rectifierQtyUih}
              onChange={(e) => {
                const val = e.target.value;
                setRectifierQtyUih(val);
                if (onRectifierQtyChange) onRectifierQtyChange(parseInt(val, 10));
              }}
            >
              <option value="0">0 (ไม่มีตู้ Rectifier)</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
            </select>
          </div>
        </div>



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
              {isSubmitted 
                ? 'ใบงานนี้ถูกส่งเรียบร้อยแล้ว — แสดงผลในรูปแบบตรวจสอบ (Read-Only)'
                : userRole === 'Team Lead' 
                ? 'โหมดตรวจสอบงาน (Team Lead) — แสดงผลในรูปแบบตรวจสอบ (Read-Only)'
                : userRole === 'Inspector'
                ? 'โหมดดูข้อมูลใบงาน (Inspector) — แสดงผลในรูปแบบตรวจสอบ (Read-Only)'
                : 'คุณอยู่ในโหมดผู้เข้าชมทั่วไป (Viewer) ทำได้เฉพาะการดูข้อมูลเท่านั้น ไม่สามารถแก้ไขหรือบันทึกได้'}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
