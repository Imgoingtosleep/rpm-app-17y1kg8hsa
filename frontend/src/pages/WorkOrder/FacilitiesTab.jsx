import React, { useState, useEffect } from 'react';

export default function FacilitiesTab({ site, rpmId, rpmCycle, onComplete, isReadOnly }) {
  // Facility parameters config
  const [params, setParams] = useState({
    alarm_door: { status: '', file: null },
    alarm_ac_fail: { status: '', file: null },
    alarm_low_bat: { status: '', file: null },
    alarm_high_temp: { status: '', file: null },
    alarm_smoke: { status: '', file: null },
    alarm_air_fail: { status: '', file: null },

    vent_ac_fan: { status: '', file: null },
    vent_ac_fan_hood: { status: '', file: null },
    vent_dc_fan: { status: '', file: null },
    vent_dc_fan_hood: { status: '', file: null },
    vent_air_cond: { status: '', file: null },

    vent_filter_door: { status: '', file: null },
    vent_filter_window: { status: '', file: null },
    vent_equip_fan: { status: '', file: null },
    vent_filter_equip: { status: '', file: null },
    air_owner: { status: '', file: null },
    control_air_type: { status: '', file: null },
    control_air_status: { status: '', file: null },

    fac_site_sign: { status: '', file: null },
    fac_outdoor_clean: { status: '', file: null },
    fac_indoor_clean: { status: '', file: null },
    fac_lighting: { status: '', file: null },
    fac_grass_cut: { status: '', file: null },
  });

  const [existingPaths, setExistingPaths] = useState({});
  const [fieldConfigs, setFieldConfigs] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

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

  const handleFileChange = (key, fileList) => {
    if (isReadOnly) return;
    let files = Array.from(fileList);
    const existingCount = existingPaths[key] ? (Array.isArray(existingPaths[key]) ? existingPaths[key].length : 1) : 0;
    if (existingCount + files.length > 10) {
      alert(`คุณไม่สามารถอัปโหลดรูปภาพเกิน 10 รูปได้ในฟิลด์นี้ (มีรูปภาพเดิมอยู่ ${existingCount} รูป และรูปภาพใหม่ ${files.length} รูป)`);
      return;
    }
    setParams(prev => ({
      ...prev,
      [key]: { ...prev[key], file: files }
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
    // vent_filters: 'Air Filters Condition',

    vent_filter_door: 'ความสะอาด Filter Door',
    vent_filter_window: 'ความสะอาด Filter Window',
    vent_equip_fan: 'ทำความสะอาด Equipment Fan',
    vent_filter_equip: 'ความสะอาด Filter Equipment',
    air_owner: 'เจ้าของแอร์',
    control_air_type: 'Control Air (Intronic or Timer)',
    control_air_status: 'Control Air Status',

    fac_site_sign: 'ประตู ป้าย Site',
    fac_outdoor_clean: 'ความสะอาดภายนอกห้อง และรอบบริเวณอาคาร',
    fac_indoor_clean: 'ความสะอาดภายใน Site',
    fac_lighting: 'ระบบไฟฟ้าแสงสว่าง',
    fac_grass_cut: 'ความสะอาดภายนอก site วัชพืชรอบๆ Site'
  };

  const dropdownOptions = {
    alarm_door: [
      'มี Sensor ทดสอบ Alarm ได้',
      'มี Sensor ทดสอบ Alarm ไม่ได้อุปกรณ์ไม่รองรับ',
      'มี Sensor ไม่ได้ Wiring เอาใว้',
      'ไม่มี sensor'
    ],
    alarm_ac_fail: [
      'ทดสอบการส่ง Alarm ได้',
      'ทดสอบไม่ได้ Battery Fail',
      'ทดสอบไม่ได้ Monitor ระบบไม่ได้',
      'ไม่ได้ติดตั้งไว้/ไม่ได้ Wiring ไว้',
      'ทดสอบผ่านระบบ RMS ได้',
      'ใช้ไฟ DTAC'
    ],
    alarm_low_bat: [
      'ทดสอบการส่ง Alarm ได้',
      'ทดสอบไม่ได้ Battery Fail',
      'ทดสอบไม่ได้ Monitor ระบบไม่ได้',
      'ไม่ได้ติดตั้งไว้/ไม่ได้ Wiring ไว้',
      'ทดสอบผ่านระบบ RMS ได้',
      'ใช้ไฟ DTAC'
    ],
    alarm_smoke: [
      'มี Sensor ทดสอบ Alarm ได้',
      'มี Sensor ทดสอบ Alarm ไม่ได้อุปกรณ์ไม่รองรับ',
      'มี Sensor ไม่ได้ Wiring เอาไว้',
      'ไม่มี sensor',
      'ไม่สามารถทดสอบได้'
    ],
    alarm_high_temp: [
      'มี Sensor ทดสอบ Alarm ได้',
      'มี Sensor ทดสอบ Alarm ไม่ได้อุปกรณ์ไม่รองรับ',
      'มี Sensor ไม่ได้ Wiring เอาไว้',
      'ไม่มี sensor',
      'ไม่สามารถทดสอบได้'
    ],
    alarm_air_fail: [
      'ทดสอบ Alarm ได้',
      'ทดสอบ Alarm ไม่ได้(ไม่มีการติดตั้งไว้)',
      'DTAC Site',
      'LL Site',
      'ทดสอบ Alarm ไม่ได้(Magnetic Fail)',
      'ทดสอบ Alarm ไม่ได้(Intronic Fail)'
    ],

    vent_ac_fan: ['มี ปกติ', 'มี ทำงานไม่ปกติ เสีย', 'ไม่มี'],
    vent_ac_fan_hood: ['มี สภาพดี', 'มี ชำรุด ตะแกรงผุขาด', 'ไม่มี'],
    vent_dc_fan: ['มี ปกติ', 'มี ทำงานไม่ปกติ เสีย', 'ไม่มี'],
    vent_dc_fan_hood: ['มี สภาพดี', 'มี ชำรุด ตะแกรงผุขาด', 'ไม่มี'],
    vent_air_cond: ['ไม่มี', 'มี ทำงานปกติ', 'มี ทำงานไม่ปกติ/เสีย'],

    vent_filter_door: ['เปลี่ยนใหม่ 2 แผ่น', 'DTAC site', 'ทำความสะอาดเรียบร้อย', 'เปลี่ยนใหม่ 1 แผ่น', 'ไม่มีฟิลเตอร์'],
    vent_filter_window: ['เปลี่ยนใหม่ 2 แผ่น', 'DTAC site', 'ทำความสะอาดเรียบร้อย', 'เปลี่ยนใหม่ 1 แผ่น', 'ไม่มีฟิลเตอร์'],
    vent_equip_fan: ['ทำความสะอาดเรียบร้อย', 'ไม่สามารถทำความสะอาดได้', 'อุปกรณ์ไม่มีพัดลม'],
    vent_filter_equip: ['ทำความสะอาดเรียบร้อย', 'ไม่สามารถทำความสะอาดได้', 'อุปกรณ์ไม่มีพัดลม'],
    air_owner: ['ไม่มีแอร์', 'UIH', 'DTAC', 'LL'],
    control_air_type: ['ไม่มี', 'มี ปกติ', 'มี ทำงานไม่ปกติ เสีย'],
    control_air_status: ['ไม่มี', 'มี ปกติ', 'มี ไม่ปกติ', 'DTAC Site', 'LL'],

    fac_site_sign: ['แข็งแรง มีป้าย', 'แข็งแรง ไม่มีป้าย', 'ไม่แข็งแรง มีป้าย', 'ไม่แข็งแรง ไม่มีป้าย'],
    fac_outdoor_clean: ['สะอาดเรียบร้อย ไม่มีขยะ หรือ ชำรุดเสียหาย', 'สกปรก รก ต้องปรับปรุง'],
    fac_indoor_clean: ['ห้องสะอาดเรียบร้อย', 'สกปรก รก ต้องปรับปรุง'],
    fac_lighting: ['Good หลอดไฟติดสว่างทุกดวง', 'หลอดขาด ไม่ติดบางหลอด', 'UIH Outdoor ไม่มีติดตั้ง', 'UIH Outdoor มีติดตั้ง', 'DTAC site', 'หลอดไฟของ LL'],
    fac_grass_cut: ['อาคารเช่า ตัดวัชพืชรอบอาคารแล้ว', 'ห้องเช่า ไม่มีวัชพืช', 'container/cabinet/pole ไม่มีวัชพืช', 'container/cabinet/pole ตัดวัชพืชรอบๆแล้ว']
  };

  const handleSaveAll = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    
    for (const [key, item] of Object.entries(params)) {
      const cfg = fieldConfigs.find(c => c.field_name === key);
      const isEnabled = cfg ? cfg.is_enabled : true;
      const isRequired = cfg ? cfg.is_required : true;

      if (!isEnabled) continue;

      const friendlyName = labelMap[key] || key;

      if (isRequired && (!item.status || item.status.trim() === '')) {
        alert(`กรุณาเลือกสถานะสำหรับหัวข้อ "${friendlyName}" ก่อนทำการบันทึก!`);
        return;
      }

      const hasImg = (item.file && item.file.length > 0) || existingPaths[key];
      if (isRequired && !hasImg) {
        alert(`กรุณาอัปโหลดรูปภาพสำหรับหัวข้อ "${friendlyName}" ก่อนทำการบันทึก!`);
        return;
      }
    }

    const formData = new FormData();
    Object.entries(params).forEach(([key, item]) => {
      const cfg = fieldConfigs.find(c => c.field_name === key);
      const isEnabled = cfg ? cfg.is_enabled : true;
      if (!isEnabled) return;

      formData.append(key, item.status);
      if (item.file && item.file.length > 0) {
        item.file.forEach(f => {
          formData.append(`${key}_img`, f);
        });
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
        setParams(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(k => {
            updated[k].file = null;
          });
          return updated;
        });
        setFileInputKey(Date.now());
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

    if (!isEnabled) {
      return (
        <div key={key} className="py-3 border-b border-dark-border/20 opacity-40 bg-dark-bg/10 px-2 flex justify-between items-center">
          <span className="text-xs text-gray-500 font-medium line-through">{label} (ถูกปิดใช้งานโดย Admin)</span>
          <span className="text-[10px] text-red-500/80 font-semibold px-2 py-0.5 border border-red-500/20 bg-red-500/5 rounded">Disabled</span>
        </div>
      );
    }

    const item = params[key];
    const options = dropdownOptions[key] || ['ปกติ', 'ผิดปกติ', 'ไม่มีระบบนี้'];

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
          {/* Status Dropdown */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <select
              disabled={isReadOnly}
              value={item.status}
              onChange={(e) => handleStatusChange(key, e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-xs text-gray-200 focus:border-indigo-500 outline-none disabled:opacity-50"
            >
              <option value="">-- เลือก --</option>
              {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
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
                  key={`${key}-${fileInputKey}`}
                  type="file"
                  multiple
                  className="w-full text-[10px] text-gray-500 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:bg-dark-accent file:text-gray-300"
                  onChange={(e) => handleFileChange(key, e.target.files)}
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
              {renderRow('vent_filter_door', 'ความสะอาด Filter Door')}
              {renderRow('vent_filter_window', 'ความสะอาด Filter Window')}
              {renderRow('vent_equip_fan', 'ทำความสะอาด Equipment Fan')}
              {renderRow('vent_filter_equip', 'ความสะอาด Filter Equipment')}
              {renderRow('air_owner', 'เจ้าของแอร์')}
              {renderRow('control_air_type', 'Control Air (Intronic or Timer)')}
              {renderRow('control_air_status', 'Control Air Status')}
            </div>
          </div>

          {/* Group 3: Site Facility */}
          <div className="bg-dark-bg/25 border border-dark-border rounded-xl p-6">
            <h4 className="font-bold text-indigo-400 border-b border-dark-border pb-2 mb-4">3. หมวดความสะอาดและสิ่งอำนวยความสะดวกสถานี (Site Facility)</h4>
            <div className="divide-y divide-dark-border/20">
              {renderRow('fac_site_sign', 'ประตู ป้าย Site')}
              {renderRow('fac_outdoor_clean', 'ความสะอาดภายนอกห้อง')}
              {renderRow('fac_indoor_clean', 'ความสะอาดภายใน Site')}
              {renderRow('fac_lighting', 'ระบบไฟฟ้าแสงสว่าง')}
              {renderRow('fac_grass_cut', 'ความสะอาดภายนอก site (วัชพืช)')}
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
