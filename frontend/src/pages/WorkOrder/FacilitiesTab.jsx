import React, { useState, useEffect } from 'react';

export default function FacilitiesTab({ site, rpmId, rpmCycle, onComplete, isReadOnly }) {
  // Facility parameters config
  const [params, setParams] = useState({
    alarm_door: { status: 'ปกติ', file: null },
    alarm_ac_fail: { status: 'ปกติ', file: null },
    alarm_low_bat: { status: 'ปกติ', file: null },
    alarm_high_temp: { status: 'ปกติ', file: null },
    alarm_smoke: { status: 'ปกติ', file: null },
    alarm_air_fail: { status: 'ปกติ', file: null },

    vent_ac_fan: { status: 'ปกติ', file: null },
    vent_ac_fan_hood: { status: 'ปกติ', file: null },
    vent_dc_fan: { status: 'ปกติ', file: null },
    vent_dc_fan_hood: { status: 'ปกติ', file: null },
    vent_air_cond: { status: 'ปกติ', file: null },
    vent_filters: { status: 'ปกติ', file: null },

    fac_site_sign: { status: 'ปกติ', file: null },
    fac_outdoor_clean: { status: 'ปกติ', file: null },
    fac_indoor_clean: { status: 'ปกติ', file: null },
    fac_lighting: { status: 'ปกติ', file: null },
    fac_grass_cut: { status: 'ปกติ', file: null },
  });

  const [existingPaths, setExistingPaths] = useState({});
  const [fieldConfigs, setFieldConfigs] = useState([]);

  useEffect(() => {
    // Fetch field configs
    fetch('/api/field-configs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFieldConfigs(data.filter(c => c.tab_name === 'facilities'));
        }
      })
      .catch(err => console.error("Error fetching field configs:", err));

    if (!rpmId) return;
    fetch(`/api/workorder/${rpmId}/facilities`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setParams(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(key => {
              if (data[key]) {
                updated[key].status = data[key];
              }
            });
            return updated;
          });

          const newExisting = {};
          Object.keys(params).forEach(key => {
            if (data[`${key}_img`]) {
              newExisting[key] = data[`${key}_img`];
            }
          });
          setExistingPaths(newExisting);
        }
      })
      .catch(err => console.error("Error fetching facilities:", err));
  }, [rpmId]);

  const handleStatusChange = (key, status) => {
    if (isReadOnly) return;
    setParams(prev => ({
      ...prev,
      [key]: { ...prev[key], status }
    }));
  };

  const handleFileChange = (key, file) => {
    if (isReadOnly) return;
    setParams(prev => ({
      ...prev,
      [key]: { ...prev[key], file }
    }));
  };

  const labelMap = {
    alarm_door: 'Door Open Alarm',
    alarm_ac_fail: 'AC Failure Alarm',
    alarm_low_bat: 'Low Battery Alarm',
    alarm_high_temp: 'High Temperature Alarm',
    alarm_smoke: 'Smoke & Fire Detector Alarm',
    alarm_air_fail: 'Air Conditioner Failure Alarm',
    vent_ac_fan: 'Ventilation AC Fan Status',
    vent_ac_fan_hood: 'Ventilation AC Fan Hood',
    vent_dc_fan: 'Ventilation DC Fan Status',
    vent_dc_fan_hood: 'Ventilation DC Fan Hood',
    vent_air_cond: 'Air Conditioner System Test',
    vent_filters: 'Air Filters Condition',
    fac_site_sign: 'ป้ายชื่อสถานี (Site Sign)',
    fac_outdoor_clean: 'ความสะอาดภายนอกห้องเครื่อง',
    fac_indoor_clean: 'ความสะอาดภายในห้องเครื่อง',
    fac_lighting: 'ระบบไฟส่องสว่างสถานี (Lighting)',
    fac_grass_cut: 'การตัดหญ้า/ถางวัชพืช'
  };

  const handleSaveAll = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    
    for (const [key, item] of Object.entries(params)) {
      const cfg = fieldConfigs.find(c => c.field_name === key);
      const isEnabled = cfg ? cfg.is_enabled : true;
      const isRequired = cfg ? cfg.is_required : true;

      // Skip validation if the field is disabled by Admin
      if (!isEnabled) continue;

      const hasImg = item.file || existingPaths[key];
      // Only require image if Admin has "isRequired" set to true and state is not 'ไม่มีระบบนี้'
      if (isRequired && item.status !== 'ไม่มีระบบนี้' && !hasImg) {
        const friendlyName = labelMap[key] || key;
        alert(`กรุณาอัปโหลดรูปภาพสำหรับหัวข้อ "${friendlyName}" หรือเลือกสถานะเป็น "ไม่มีระบบนี้" ก่อนทำการบันทึก!`);
        return;
      }
    }

    const formData = new FormData();
    Object.entries(params).forEach(([key, item]) => {
      // Check if disabled by admin
      const cfg = fieldConfigs.find(c => c.field_name === key);
      const isEnabled = cfg ? cfg.is_enabled : true;
      if (!isEnabled) return; // skip sending disabled fields

      formData.append(key, item.status);
      if (item.file) {
        formData.append(`${key}_img`, item.file);
      } else if (existingPaths[key]) {
        const pathVal = Array.isArray(existingPaths[key]) ? existingPaths[key] : [existingPaths[key]];
        pathVal.forEach(p => formData.append(`${key}_img_path`, p));
      }
    });

    try {
      const res = await fetch(`/api/workorder/${rpmId}/facilities?site_code=${encodeURIComponent(site.code)}&rpm_id=${rpmId}&rpm_cycle=${encodeURIComponent(rpmCycle || '')}`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        alert('บันทึกข้อมูลและอัปโหลดรูปภาพ Systems & Facilities ครบถ้วนเสร็จสมบูรณ์!');
        if (onComplete) onComplete();
      } else {
        const errorData = await res.json();
        alert('เกิดข้อผิดพลาด: ' + errorData.error);
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  const renderRow = (key, label) => {
    const cfg = fieldConfigs.find(c => c.field_name === key);
    const isEnabled = cfg ? cfg.is_enabled : true;
    const isRequired = cfg ? cfg.is_required : true;

    // Do not show field if disabled by Admin
    if (!isEnabled) {
      return (
        <div key={key} className="py-3 border-b border-dark-border/20 opacity-40 bg-dark-bg/10 px-2 flex justify-between items-center">
          <span className="text-xs text-gray-500 font-medium line-through">{label} (ถูกปิดใช้งานโดย Admin)</span>
          <span className="text-[10px] text-red-500/80 font-semibold px-2 py-0.5 border border-red-500/20 bg-red-500/5 rounded">Disabled</span>
        </div>
      );
    }

    const item = params[key];
    return (
      <div key={key} className="py-4 border-b border-dark-border/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="md:w-1/3">
          <span className="text-sm font-bold text-gray-200">
            {label}
            {isRequired && <span className="text-red-400 ml-1">*</span>}
          </span>
          <p className="text-[10px] text-gray-500 font-mono mt-0.5">{key}</p>
        </div>

        <div className="flex flex-wrap items-center gap-6 md:w-2/3">
          {/* Status Radio Buttons */}
          <div className="flex items-center gap-2 bg-dark-bg/60 p-1 rounded-lg border border-dark-border">
            {['ปกติ', 'ผิดปกติ', 'ไม่มีระบบนี้'].map((statusOption) => (
              <button
                key={statusOption}
                type="button"
                disabled={isReadOnly}
                onClick={() => handleStatusChange(key, statusOption)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  isReadOnly ? 'opacity-60 cursor-not-allowed' : ''
                } ${
                  item.status === statusOption
                    ? statusOption === 'ปกติ'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : statusOption === 'ผิดปกติ'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {statusOption}
              </button>
            ))}
          </div>

          {/* Image Uploader */}
          <div className="flex-1 min-w-[200px]">
            {isReadOnly ? (
              existingPaths[key] ? (
                <div className="text-[10px] text-emerald-400 flex items-center gap-1.5 font-medium">
                  <span>มีรูปภาพอัปโหลดไว้แล้ว:</span>
                  <a href={`/storage/${existingPaths[key]}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-300">
                    ดูรูปภาพ
                  </a>
                </div>
              ) : (
                <span className="text-[10px] text-gray-500 italic">ไม่มีรูปภาพประกอบ</span>
              )
            ) : (
              <div className="flex flex-col gap-1">
                <input
                  type="file"
                  className="w-full text-[10px] text-gray-500 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:bg-dark-accent file:text-gray-300"
                  onChange={(e) => handleFileChange(key, e.target.files[0])}
                />
                {existingPaths[key] && (
                  <span className="text-[9px] text-gray-400">รูปภาพเดิม: <a href={`/storage/${existingPaths[key]}`} target="_blank" rel="noopener noreferrer" className="underline">{existingPaths[key]}</a></span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 space-y-6">
      {isReadOnly && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs font-semibold flex items-center gap-2">
          <span>⚠️</span>
          <span>คุณอยู่ในโหมดผู้เข้าชมทั่วไป (Viewer) ระบบจะปิดการใช้งานฟิลด์ป้อนข้อมูล ปุ่มบันทึกข้อมูล และการอัปโหลดไฟล์ในหน้านี้ทั้งหมด</span>
        </div>
      )}

      <div>
        <h3 className="text-xl font-bold text-white">5. Alarms & Facilities (Systems & Facilities)</h3>
        <p className="text-gray-400 text-sm mt-1">บันทึกสถานะ Alarms, ระบบระบายอากาศ และความสะอาดของสถานที่</p>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-8">
        <fieldset disabled={isReadOnly} className="space-y-8 border-0 p-0 m-0">
          {/* Group 1: Alarms */}
          <div className="bg-dark-bg/25 border border-dark-border rounded-xl p-6">
            <h4 className="font-bold text-indigo-400 border-b border-dark-border pb-2 mb-4">1. หมวดสัญญาณเตือนภัย (Alarms)</h4>
            <div className="divide-y divide-dark-border/20">
              {renderRow('alarm_door', 'Door Open Alarm')}
              {renderRow('alarm_ac_fail', 'AC Failure Alarm')}
              {renderRow('alarm_low_bat', 'Low Battery Alarm')}
              {renderRow('alarm_high_temp', 'High Temperature Alarm')}
              {renderRow('alarm_smoke', 'Smoke & Fire Detector Alarm')}
              {renderRow('alarm_air_fail', 'Air Conditioner Failure Alarm')}
            </div>
          </div>

          {/* Group 2: Ventilation */}
          <div className="bg-dark-bg/25 border border-dark-border rounded-xl p-6">
            <h4 className="font-bold text-indigo-400 border-b border-dark-border pb-2 mb-4">2. หมวดระบบระบายอากาศ (Ventilation Systems)</h4>
            <div className="divide-y divide-dark-border/20">
              {renderRow('vent_ac_fan', 'Ventilation AC Fan Status')}
              {renderRow('vent_ac_fan_hood', 'Ventilation AC Fan Hood')}
              {renderRow('vent_dc_fan', 'Ventilation DC Fan Status')}
              {renderRow('vent_dc_fan_hood', 'Ventilation DC Fan Hood')}
              {renderRow('vent_air_cond', 'Air Conditioner System Test')}
              {renderRow('vent_filters', 'Air Filters Condition')}
            </div>
          </div>

          {/* Group 3: Site Facility */}
          <div className="bg-dark-bg/25 border border-dark-border rounded-xl p-6">
            <h4 className="font-bold text-indigo-400 border-b border-dark-border pb-2 mb-4">3. หมวดความสะอาดและสิ่งอำนวยความสะดวกสถานี (Site Facility)</h4>
            <div className="divide-y divide-dark-border/20">
              {renderRow('fac_site_sign', 'ป้ายชื่อสถานี (Site Sign)')}
              {renderRow('fac_outdoor_clean', 'ความสะอาดภายนอกห้องเครื่อง')}
              {renderRow('fac_indoor_clean', 'ความสะอาดภายในห้องเครื่อง')}
              {renderRow('fac_lighting', 'ระบบไฟส่องสว่างสถานี (Lighting)')}
              {renderRow('fac_grass_cut', 'การตัดหญ้า/ถางวัชพืช')}
            </div>
          </div>
        </fieldset>

        <div className="pt-4 flex justify-end">
          {!isReadOnly ? (
            <button type="submit" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-sm shadow-lg transition-all hover:shadow-indigo-600/20">
              บันทึกข้อมูลสรุประบบและปิดเล่มใบงาน (Submit All Data)
            </button>
          ) : (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs font-semibold w-full text-center">
              ไม่สามารถบันทึกข้อมูลสรุประบบและปิดเล่มได้เนื่องจากคุณอยู่ในสิทธิ์ Viewer (ดูข้อมูลได้อย่างเดียว)
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
