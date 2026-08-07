import React, { useState, useEffect } from 'react';
import ImagePreviewManager from '../../components/ImagePreviewManager';

export default function AcMainTab({ site, rpmId, rpmCycle, onComplete, isReadOnly }) {
  // Input fields state
  const [meterSize, setMeterSize] = useState('');
  const [cableStatus, setCableStatus] = useState('');
  const [changeOverSwitch, setChangeOverSwitch] = useState('');
  const [phaseQty, setPhaseQty] = useState('');
  const [surgeProtection, setSurgeProtection] = useState('');
  const [mdbTemp, setMdbTemp] = useState('');
  const [siteTemp, setSiteTemp] = useState('');
  
  const [v1, setV1] = useState('');
  const [v2, setV2] = useState('');
  const [v3, setV3] = useState('');
  const [cur1, setCur1] = useState('');
  const [cur2, setCur2] = useState('');
  const [cur3, setCur3] = useState('');
  const [groundResistance, setGroundResistance] = useState('');
  const [fieldConfigs, setFieldConfigs] = useState([]);

  // Existing image paths from server
  const [existingPaths, setExistingPaths] = useState({
    meter: [],
    cable: [],
    changeOver: [],
    surge: [],
    mdb: [],
    ground: [],
  });

  // File uploads
  const [images, setImages] = useState({
    meter: [],
    cable: [],
    changeOver: [],
    surge: [],
    mdb: [],
    ground: [],
  });

  const [fileInputKey, setFileInputKey] = useState(Date.now());

  useEffect(() => {
    // Fetch configs
    fetch('/api/field-configs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFieldConfigs(data.filter(c => c.tab_name === 'acmain'));
        }
      })
      .catch(err => console.error("Error fetching AC config:", err));

    if (!rpmId) return;
    fetch(`/api/workorder/${rpmId}/ac`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setMeterSize(data.meter_ac_size || '');
          setCableStatus(data.cable_status || '');
          setChangeOverSwitch(data.change_over_switch || '');
          setPhaseQty(data.ac_phase_qty || '');
          setSurgeProtection(data.surge_protection || '');
          setMdbTemp(data.mdb_temp || '');
          setSiteTemp(data.site_temp || '');
          setV1(data.voltage_p1 !== null && data.voltage_p1 !== undefined ? data.voltage_p1 : '');
          setV2(data.voltage_p2 !== null && data.voltage_p2 !== undefined ? data.voltage_p2 : '');
          setV3(data.voltage_p3 !== null && data.voltage_p3 !== undefined ? data.voltage_p3 : '');
          setCur1(data.current_p1 !== null && data.current_p1 !== undefined ? parseFloat(data.current_p1) : '');
          setCur2(data.current_p2 !== null && data.current_p2 !== undefined ? parseFloat(data.current_p2) : '');
          setCur3(data.current_p3 !== null && data.current_p3 !== undefined ? parseFloat(data.current_p3) : '');
          setGroundResistance(data.ground_resistance || '');

          const toArray = (val) => Array.isArray(val) ? val : (val ? [val] : []);

          setExistingPaths({
            meter: toArray(data.meter_ac_img),
            cable: toArray(data.cable_img),
            changeOver: toArray(data.change_over_img),
            surge: toArray(data.surge_img),
            mdb: toArray(data.mdb_temp_img),
            ground: toArray(data.ground_img),
          });
        }
      })
      .catch(err => console.error("Error fetching AC details:", err));
  }, [rpmId]);

  const handleFilesChange = (field, fileList) => {
    setImages(prev => ({ ...prev, [field]: fileList }));
  };

  const handleExistingRemove = (field, pathToRemove) => {
    setExistingPaths(prev => {
      const current = prev[field] || [];
      return { ...prev, [field]: current.filter(p => p !== pathToRemove) };
    });
  };

  const getFieldConfig = (name) => {
    const cfg = fieldConfigs.find(c => c.field_name === name);
    return {
      isEnabled: cfg ? cfg.is_enabled : true,
      isRequired: cfg ? cfg.is_required : true,
      dropdownOptions: cfg && cfg.dropdown_options ? cfg.dropdown_options : []
    };
  };

  const renderOptions = (fieldName, defaultOpts) => {
    const extraOpts = configsMap[fieldName]?.dropdownOptions || [];
    const excluded = extraOpts.filter(o => o.startsWith('__EXCLUDE__:')).map(o => o.replace('__EXCLUDE__:', ''));
    const added = extraOpts.filter(o => !o.startsWith('__EXCLUDE__:'));

    const allFiltered = Array.from(new Set([...defaultOpts, ...added])).filter(o => !excluded.includes(o));
    return allFiltered.map(opt => <option key={opt} value={opt}>{opt}</option>);
  };

  const configsMap = {
    meter_ac_size: getFieldConfig('meter_ac_size'),
    cable_status: getFieldConfig('cable_status'),
    change_over_switch: getFieldConfig('change_over_switch'),
    ac_phase_qty: getFieldConfig('ac_phase_qty'),
    surge_protection: getFieldConfig('surge_protection'),
    mdb_temp: getFieldConfig('mdb_temp'),
    site_temp: getFieldConfig('site_temp'),
    voltage_p1: getFieldConfig('voltage_p1'),
    voltage_p2: getFieldConfig('voltage_p2'),
    voltage_p3: getFieldConfig('voltage_p3'),
    current_p1: getFieldConfig('current_p1'),
    current_p2: getFieldConfig('current_p2'),
    current_p3: getFieldConfig('current_p3'),
    ground_resistance: getFieldConfig('ground_resistance'),
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!rpmId) {
      alert('ไม่พบรหัสใบงานหลัก (rpmId)');
      return;
    }

    // Dynamic checks
    if (configsMap.meter_ac_size.isEnabled && configsMap.meter_ac_size.isRequired && !meterSize) {
      alert('กรุณาเลือก ขนาด AC KWHrs Meter');
      return;
    }
    if (configsMap.cable_status.isEnabled && configsMap.cable_status.isRequired && !cableStatus) {
      alert('กรุณาเลือก สภาพสายไฟ Main AC Line');
      return;
    }
    if (configsMap.change_over_switch.isEnabled && configsMap.change_over_switch.isRequired && !changeOverSwitch) {
      alert('กรุณาเลือก สภาพ Change Over Switch');
      return;
    }
    if (configsMap.ac_phase_qty.isEnabled && configsMap.ac_phase_qty.isRequired && !phaseQty) {
      alert('กรุณาเลือก AC Phase Qty');
      return;
    }
    if (configsMap.surge_protection.isEnabled && configsMap.surge_protection.isRequired && !surgeProtection) {
      alert('กรุณาเลือก Surge Protection ตู้ไฟ Main AC');
      return;
    }
    if (configsMap.mdb_temp.isEnabled && configsMap.mdb_temp.isRequired && !mdbTemp) {
      alert('กรุณาเลือก อุณหภูมิ จุดต่อสายภายในตู้ AC MDB และ DC PDB');
      return;
    }
    if (configsMap.site_temp.isEnabled && configsMap.site_temp.isRequired && !siteTemp) {
      alert('กรุณาเลือก อุณหภูมิ ภายใน Site');
      return;
    }
    if (configsMap.voltage_p1.isEnabled && configsMap.voltage_p1.isRequired && (v1 === '' || v1 === null || v1 === undefined)) {
      alert('กรุณากรอก Phase#1 แรงดันไฟฟ้า');
      return;
    }
    if (phaseQty !== '1 Phase') {
      if (configsMap.voltage_p2.isEnabled && configsMap.voltage_p2.isRequired && (v2 === '' || v2 === null || v2 === undefined)) {
        alert('กรุณากรอก Phase#2 แรงดันไฟฟ้า');
        return;
      }
      if (configsMap.voltage_p3.isEnabled && configsMap.voltage_p3.isRequired && (v3 === '' || v3 === null || v3 === undefined)) {
        alert('กรุณากรอก Phase#3 แรงดันไฟฟ้า');
        return;
      }
    }
    if (configsMap.current_p1.isEnabled && configsMap.current_p1.isRequired && (cur1 === '' || cur1 === null || cur1 === undefined)) {
      alert('กรุณากรอก Phase#1 กระแสโหลด');
      return;
    }
    if (phaseQty !== '1 Phase') {
      if (configsMap.current_p2.isEnabled && configsMap.current_p2.isRequired && (cur2 === '' || cur2 === null || cur2 === undefined)) {
        alert('กรุณากรอก Phase#2 กระแสโหลด');
        return;
      }
      if (configsMap.current_p3.isEnabled && configsMap.current_p3.isRequired && (cur3 === '' || cur3 === null || cur3 === undefined)) {
        alert('กรุณากรอก Phase#3 กระแสโหลด');
        return;
      }
    }
    if (configsMap.ground_resistance.isEnabled && configsMap.ground_resistance.isRequired && !groundResistance) {
      alert('กรุณาเลือก Ground Site วัดค่าความต้านทาน');
      return;
    }

    // Verify if active uploads are needed
    const checkFile = (configName, uploadKey, originalName) => {
      const cfg = configsMap[configName];
      if (cfg.isEnabled && cfg.isRequired) {
        const hasNew = images[uploadKey] && images[uploadKey].length > 0;
        const hasExisting = existingPaths[uploadKey] && existingPaths[uploadKey].length > 0;
        if (!hasNew && !hasExisting) {
          alert(`กรุณาอัปโหลดรูปภาพประกอบสำหรับ ${originalName}`);
          return false;
        }
      }
      return true;
    };

    if (!checkFile('meter_ac_size', 'meter', 'ภาพหน้าปัดมิเตอร์')) return;
    if (!checkFile('cable_status', 'cable', 'ภาพสายไฟเมน')) return;
    if (!checkFile('change_over_switch', 'changeOver', 'ภาพสวิตช์ Change Over')) return;
    if (!checkFile('surge_protection', 'surge', 'ภาพอุปกรณ์กันไฟกระชาก')) return;
    if (!checkFile('mdb_temp', 'mdb', 'ภาพเทอร์โมสแกน/อุณหภูมิตู้ MDB')) return;
    if (!checkFile('ground_resistance', 'ground', 'ภาพการวัดค่ากราวด์')) return;

    const formData = new FormData();
    formData.append('meter_ac_size', configsMap.meter_ac_size.isEnabled ? meterSize : '');
    formData.append('cable_status', configsMap.cable_status.isEnabled ? cableStatus : '');
    formData.append('change_over_switch', configsMap.change_over_switch.isEnabled ? changeOverSwitch : '');
    formData.append('ac_phase_qty', configsMap.ac_phase_qty.isEnabled ? phaseQty : '');
    formData.append('surge_protection', configsMap.surge_protection.isEnabled ? surgeProtection : '');
    formData.append('mdb_temp', configsMap.mdb_temp.isEnabled ? mdbTemp : '');
    formData.append('site_temp', configsMap.site_temp.isEnabled ? siteTemp : '');
    formData.append('voltage_p1', configsMap.voltage_p1.isEnabled ? v1 : 0);
    formData.append('voltage_p2', configsMap.voltage_p2.isEnabled ? (phaseQty === '1 Phase' ? '' : v2) : 0);
    formData.append('voltage_p3', configsMap.voltage_p3.isEnabled ? (phaseQty === '1 Phase' ? '' : v3) : 0);
    formData.append('current_p1', configsMap.current_p1.isEnabled ? cur1 : 0.0);
    formData.append('current_p2', configsMap.current_p2.isEnabled ? (phaseQty === '1 Phase' ? '' : cur2) : 0.0);
    formData.append('current_p3', configsMap.current_p3.isEnabled ? (phaseQty === '1 Phase' ? '' : cur3) : 0.0);
    formData.append('ground_resistance', configsMap.ground_resistance.isEnabled ? groundResistance : '');

    // Append files or original paths if enabled
    const appendFile = (configName, uploadKey, fieldName) => {
      if (configsMap[configName].isEnabled) {
        if (images[uploadKey] && images[uploadKey].length > 0) {
          images[uploadKey].forEach(file => {
            formData.append(fieldName, file);
          });
        }
        if (existingPaths[uploadKey] && existingPaths[uploadKey].length > 0) {
          existingPaths[uploadKey].forEach(p => formData.append(`${fieldName}_path`, p));
        }
      }
    };

    appendFile('meter_ac_size', 'meter', 'meter_ac_img');
    appendFile('cable_status', 'cable', 'cable_img');
    appendFile('change_over_switch', 'changeOver', 'change_over_img');
    appendFile('surge_protection', 'surge', 'surge_img');
    appendFile('mdb_temp', 'mdb', 'mdb_temp_img');
    appendFile('ground_resistance', 'ground', 'ground_img');

    try {
      const res = await fetch(`/api/workorder/${rpmId}/ac?site_code=${encodeURIComponent(site.code)}&rpm_id=${rpmId}&rpm_cycle=${encodeURIComponent(rpmCycle || '')}`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        alert('บันทึกระบบไฟฟ้า AC และข้อมูลรูปภาพเรียบร้อยแล้ว!');
        setImages({
          meter: [],
          cable: [],
          changeOver: [],
          surge: [],
          mdb: [],
          ground: [],
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

  return (
    <div className="p-8 space-y-6">
      {isReadOnly && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs font-semibold flex items-center gap-2">
          <span>คุณอยู่ในโหมดผู้เข้าชมทั่วไป (Viewer) ระบบจะปิดการใช้งานฟิลด์ป้อนข้อมูล ปุ่มบันทึกข้อมูล และการอัปโหลดไฟล์ในหน้านี้ทั้งหมด</span>
        </div>
      )}

      <div>
        <h3 className="text-xl font-bold text-white">2. ระบบไฟฟ้า AC (Main AC Power System)</h3>
        <p className="text-gray-400 text-sm mt-1">บันทึกขนาดมิเตอร์, แรงดันกระแสไฟฟ้า และวัดค่าความต้านทานกราวด์</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <fieldset disabled={isReadOnly} className="space-y-8 border-0 p-0 m-0">
          {/* Param Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Col 1 */}
            <div className="space-y-4">
              {configsMap.site_temp.isEnabled ? (
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                    2. อุณหภูมิ ภายใน Site (°C) {configsMap.site_temp.isRequired && <span className="text-red-400">*</span>}
                  </label>
                  <select className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={siteTemp} onChange={(e) => setSiteTemp(e.target.value)}>
                    <option value="">-- เลือก --</option>
                    {renderOptions('site_temp', ['<25', '25-30', '30-35', '35-40', '>40'])}
                  </select>
                </div>
              ) : (
                <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-xs text-gray-500 line-through">2. อุณหภูมิ ภายใน Site (Disabled)</div>
              )}

              {configsMap.mdb_temp.isEnabled ? (
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                    3. อุณหภูมิ จุดต่อสายภายในตู้ AC MDB และ DC PDB (°C) {configsMap.mdb_temp.isRequired && <span className="text-red-400">*</span>}
                  </label>
                  <select className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={mdbTemp} onChange={(e) => setMdbTemp(e.target.value)}>
                    <option value="">-- เลือก --</option>
                    {renderOptions('mdb_temp', ['<25', '25-30', '30-35', '35-40', '>40'])}
                  </select>
                </div>
              ) : (
                <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-xs text-gray-500 line-through">อุณหภูมิตู้ MDB (Disabled)</div>
              )}

              {configsMap.ground_resistance.isEnabled ? (
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                    4. Ground Site วัดค่าความต้านทาน (Ω) {configsMap.ground_resistance.isRequired && <span className="text-red-400">*</span>}
                  </label>
                  <select className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={groundResistance} onChange={(e) => setGroundResistance(e.target.value)}>
                    <option value="">-- เลือก --</option>
                    {renderOptions('ground_resistance', ['<5', '5-10', '>10-20', '>20-30', '>30-40', '>40-50', '>50-60', '>60', 'วัดค่าไม่ได้'])}
                  </select>
                </div>
              ) : (
                <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-xs text-gray-500 line-through">Ground Resistance (Disabled)</div>
              )}

              {configsMap.meter_ac_size.isEnabled ? (
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                    5. ขนาด AC KWHrs Meter {configsMap.meter_ac_size.isRequired && <span className="text-red-400">*</span>}
                  </label>
                  <select className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={meterSize} onChange={(e) => setMeterSize(e.target.value)}>
                    <option value="">-- เลือก --</option>
                    {renderOptions('meter_ac_size', ['1 phase 5/15', '1 phase 15/45', '1 phase 5/100', '3 phase 5/15', '3 phase 15/45', 'DTAC site', 'LL'])}
                  </select>
                </div>
              ) : (
                <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-xs text-gray-500 line-through">Meter AC Size (Disabled)</div>
              )}

              {configsMap.cable_status.isEnabled ? (
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                    6. สภาพสายไฟ Main AC Line {configsMap.cable_status.isRequired && <span className="text-red-400">*</span>}
                  </label>
                  <select className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={cableStatus} onChange={(e) => setCableStatus(e.target.value)}>
                    <option value="">-- เลือก --</option>
                    {renderOptions('cable_status', ['ปกติ สภาพปลอดภัย', 'Dtact site', 'หย่อน ชำรุด', 'รก ไม่สะอาด ต้องปรับปรุง'])}
                  </select>
                </div>
              ) : (
                <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-xs text-gray-500 line-through">Cable Status (Disabled)</div>
              )}

              {configsMap.change_over_switch.isEnabled ? (
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                    23. สภาพ Change Over Switch {configsMap.change_over_switch.isRequired && <span className="text-red-400">*</span>}
                  </label>
                  <select className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={changeOverSwitch} onChange={(e) => setChangeOverSwitch(e.target.value)}>
                    <option value="">-- เลือก --</option>
                    {renderOptions('change_over_switch', ['มี/พร้อมใช้งาน', 'มี/ไม่พร้อมใช้งาน', 'มี/ชำรุดบางจุดต้องแก้ไข', 'ไม่มี'])}
                  </select>
                </div>
              ) : (
                <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-xs text-gray-500 line-through">Change Over Switch (Disabled)</div>
              )}

              {configsMap.surge_protection.isEnabled ? (
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                    24. Surge Protection ตู้ไฟ Main AC {configsMap.surge_protection.isRequired && <span className="text-red-400">*</span>}
                  </label>
                  <select className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={surgeProtection} onChange={(e) => setSurgeProtection(e.target.value)}>
                    <option value="">-- เลือก --</option>
                    {renderOptions('surge_protection', ['มี ปกติ', 'มี ไม่ปกติ', 'ไม่มี'])}
                  </select>
                </div>
              ) : (
                <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-xs text-gray-500 line-through">Surge Protection (Disabled)</div>
              )}
            </div>

            {/* Col 2 */}
            <div className="space-y-4">
              {configsMap.ac_phase_qty.isEnabled ? (
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                    AC Phase Qty {configsMap.ac_phase_qty.isRequired && <span className="text-red-400">*</span>}
                  </label>
                  <select 
                    className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" 
                    value={phaseQty} 
                    onChange={(e) => setPhaseQty(e.target.value)}
                  >
                    <option value="">-- เลือก --</option>
                    {renderOptions('ac_phase_qty', ['1 Phase', '3 Phase'])}
                  </select>
                </div>
              ) : (
                <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-xs text-gray-500 line-through">AC Phase Qty (Disabled)</div>
              )}

              <div className="grid grid-cols-3 gap-4">
                {configsMap.voltage_p1.isEnabled ? (
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                      Phase#1 แรงดันไฟฟ้า {configsMap.voltage_p1.isRequired && <span className="text-red-400">*</span>}
                    </label>
                    <input type="number" min="0" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={v1} onChange={(e) => setV1(e.target.value === '' ? '' : parseInt(e.target.value))} required={configsMap.voltage_p1.isRequired} />
                  </div>
                ) : (
                  <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-[10px] text-gray-500 line-through flex items-center justify-center">V-P1 Disabled</div>
                )}
                {configsMap.voltage_p2.isEnabled ? (
                  <div className={phaseQty === '1 Phase' ? 'opacity-30' : ''}>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                      Phase#2 แรงดันไฟฟ้า {configsMap.voltage_p2.isRequired && <span className="text-red-400">*</span>}
                    </label>
                    <input type="number" min="0" disabled={phaseQty === '1 Phase'} className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none disabled:opacity-50" value={phaseQty === '1 Phase' ? '' : v2} onChange={(e) => setV2(e.target.value === '' ? '' : parseInt(e.target.value))} required={phaseQty !== '1 Phase' && configsMap.voltage_p2.isRequired} />
                  </div>
                ) : (
                  <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-[10px] text-gray-500 line-through flex items-center justify-center">V-P2 Disabled</div>
                )}
                {configsMap.voltage_p3.isEnabled ? (
                  <div className={phaseQty === '1 Phase' ? 'opacity-30' : ''}>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                      Phase#3 แรงดันไฟฟ้า {configsMap.voltage_p3.isRequired && <span className="text-red-400">*</span>}
                    </label>
                    <input type="number" min="0" disabled={phaseQty === '1 Phase'} className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none disabled:opacity-50" value={phaseQty === '1 Phase' ? '' : v3} onChange={(e) => setV3(e.target.value === '' ? '' : parseInt(e.target.value))} required={phaseQty !== '1 Phase' && configsMap.voltage_p3.isRequired} />
                  </div>
                ) : (
                  <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-[10px] text-gray-500 line-through flex items-center justify-center">V-P3 Disabled</div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                {configsMap.current_p1.isEnabled ? (
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                      Phase#1 กระแสโหลด {configsMap.current_p1.isRequired && <span className="text-red-400">*</span>}
                    </label>
                    <input type="number" min="0" step="0.1" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={cur1} onChange={(e) => setCur1(e.target.value === '' ? '' : parseFloat(e.target.value))} required={configsMap.current_p1.isRequired} />
                  </div>
                ) : (
                  <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-[10px] text-gray-500 line-through flex items-center justify-center">Cur-P1 Disabled</div>
                )}
                {configsMap.current_p2.isEnabled ? (
                  <div className={phaseQty === '1 Phase' ? 'opacity-30' : ''}>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                      Phase#2 กระแสโหลด {configsMap.current_p2.isRequired && <span className="text-red-400">*</span>}
                    </label>
                    <input type="number" min="0" step="0.1" disabled={phaseQty === '1 Phase'} className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none disabled:opacity-50" value={phaseQty === '1 Phase' ? '' : cur2} onChange={(e) => setCur2(e.target.value === '' ? '' : parseFloat(e.target.value))} required={phaseQty !== '1 Phase' && configsMap.current_p2.isRequired} />
                  </div>
                ) : (
                  <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-[10px] text-gray-500 line-through flex items-center justify-center">Cur-P2 Disabled</div>
                )}
                {configsMap.current_p3.isEnabled ? (
                  <div className={phaseQty === '1 Phase' ? 'opacity-30' : ''}>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                      Phase#3 กระแสโหลด {configsMap.current_p3.isRequired && <span className="text-red-400">*</span>}
                    </label>
                    <input type="number" min="0" step="0.1" disabled={phaseQty === '1 Phase'} className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none disabled:opacity-50" value={phaseQty === '1 Phase' ? '' : cur3} onChange={(e) => setCur3(e.target.value === '' ? '' : parseFloat(e.target.value))} required={phaseQty !== '1 Phase' && configsMap.current_p3.isRequired} />
                  </div>
                ) : (
                  <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-[10px] text-gray-500 line-through flex items-center justify-center">Cur-P3 Disabled</div>
                )}
              </div>
            </div>
          </div>

          <hr className="border-dark-border" />

          {/* Uploads Section with ImagePreviewManager */}
          <div>
            <h4 className="font-bold text-white mb-4">อัปโหลดรูปภาพระบบไฟ AC (จัดเก็บลงตารางตาม Diagram)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                {configsMap.meter_ac_size.isEnabled && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-2">
                      1. ภาพหน้าปัดมิเตอร์ (meter_ac_img) {configsMap.meter_ac_size.isRequired && <span className="text-red-400">*</span>}
                    </label>
                    <ImagePreviewManager
                      files={images.meter}
                      existingPaths={existingPaths.meter}
                      onFilesChange={(newFiles) => handleFilesChange('meter', newFiles)}
                      onExistingRemove={(path) => handleExistingRemove('meter', path)}
                      isReadOnly={isReadOnly}
                    />
                  </div>
                )}
                {configsMap.cable_status.isEnabled && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-2">
                      2. ภาพสายไฟเมน (cable_img) {configsMap.cable_status.isRequired && <span className="text-red-400">*</span>}
                    </label>
                    <ImagePreviewManager
                      files={images.cable}
                      existingPaths={existingPaths.cable}
                      onFilesChange={(newFiles) => handleFilesChange('cable', newFiles)}
                      onExistingRemove={(path) => handleExistingRemove('cable', path)}
                      isReadOnly={isReadOnly}
                    />
                  </div>
                )}
                {configsMap.change_over_switch.isEnabled && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-2">
                      3. ภาพสวิตช์ Change Over (change_over_img) {configsMap.change_over_switch.isRequired && <span className="text-red-400">*</span>}
                    </label>
                    <ImagePreviewManager
                      files={images.changeOver}
                      existingPaths={existingPaths.changeOver}
                      onFilesChange={(newFiles) => handleFilesChange('changeOver', newFiles)}
                      onExistingRemove={(path) => handleExistingRemove('changeOver', path)}
                      isReadOnly={isReadOnly}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-6">
                {configsMap.surge_protection.isEnabled && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-2">
                      4. ภาพอุปกรณ์กันไฟกระชาก (surge_img) {configsMap.surge_protection.isRequired && <span className="text-red-400">*</span>}
                    </label>
                    <ImagePreviewManager
                      files={images.surge}
                      existingPaths={existingPaths.surge}
                      onFilesChange={(newFiles) => handleFilesChange('surge', newFiles)}
                      onExistingRemove={(path) => handleExistingRemove('surge', path)}
                      isReadOnly={isReadOnly}
                    />
                  </div>
                )}
                {configsMap.mdb_temp.isEnabled && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-2">
                      5. ภาพเทอร์โมสแกน/อุณหภูมิตู้ MDB (mdb_temp_img) {configsMap.mdb_temp.isRequired && <span className="text-red-400">*</span>}
                    </label>
                    <ImagePreviewManager
                      files={images.mdb}
                      existingPaths={existingPaths.mdb}
                      onFilesChange={(newFiles) => handleFilesChange('mdb', newFiles)}
                      onExistingRemove={(path) => handleExistingRemove('mdb', path)}
                      isReadOnly={isReadOnly}
                    />
                  </div>
                )}
                {configsMap.ground_resistance.isEnabled && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      6. ภาพการวัดค่ากราวด์ (ground_img) {configsMap.ground_resistance.isRequired && <span className="text-red-400">*</span>}
                    </label>
                    <input key={`ground-${fileInputKey}`} type="file" multiple className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-dark-accent file:text-gray-300 hover:file:bg-indigo-600/20" onChange={(e) => handleFileChange('ground', e.target.files)} />
                    {existingPaths.ground && <p className="text-[10px] text-gray-500 mt-1">รูปเก่า: {Array.isArray(existingPaths.ground) ? existingPaths.ground.join(', ') : existingPaths.ground}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </fieldset>

        <div className="pt-4">
          {!isReadOnly ? (
            <button type="submit" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-sm shadow-md transition-colors">
              บันทึกระบบไฟฟ้า AC
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
