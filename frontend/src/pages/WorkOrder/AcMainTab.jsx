import React, { useState, useEffect } from 'react';

export default function AcMainTab({ site, rpmId, onComplete, isReadOnly }) {
  // Input fields state
  const [meterSize, setMeterSize] = useState('');
  const [cableStatus, setCableStatus] = useState('');
  const [changeOverSwitch, setChangeOverSwitch] = useState('');
  const [phaseQty, setPhaseQty] = useState('');
  const [surgeProtection, setSurgeProtection] = useState('');
  const [mdbTemp, setMdbTemp] = useState(25.0);
  
  const [v1, setV1] = useState(220);
  const [v2, setV2] = useState(220);
  const [v3, setV3] = useState(220);
  const [cur1, setCur1] = useState(0.0);
  const [cur2, setCur2] = useState(0.0);
  const [cur3, setCur3] = useState(0.0);
  const [groundResistance, setGroundResistance] = useState(0.0);
  const [fieldConfigs, setFieldConfigs] = useState([]);

  // Existing image paths from server
  const [existingPaths, setExistingPaths] = useState({
    meter: null,
    cable: null,
    changeOver: null,
    surge: null,
    mdb: null,
    ground: null,
  });

  // File uploads
  const [images, setImages] = useState({
    meter: null,
    cable: null,
    changeOver: null,
    surge: null,
    mdb: null,
    ground: null,
  });

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
          setMdbTemp(data.mdb_temp ? parseFloat(data.mdb_temp) : 25.0);
          setV1(data.voltage_p1 || 220);
          setV2(data.voltage_p2 || 220);
          setV3(data.voltage_p3 || 220);
          setCur1(data.current_p1 ? parseFloat(data.current_p1) : 0.0);
          setCur2(data.current_p2 ? parseFloat(data.current_p2) : 0.0);
          setCur3(data.current_p3 ? parseFloat(data.current_p3) : 0.0);
          setGroundResistance(data.ground_resistance ? parseFloat(data.ground_resistance) : 0.0);

          setExistingPaths({
            meter: data.meter_ac_img || null,
            cable: data.cable_img || null,
            changeOver: data.change_over_img || null,
            surge: data.surge_img || null,
            mdb: data.mdb_temp_img || null,
            ground: data.ground_img || null,
          });
        }
      })
      .catch(err => console.error("Error fetching AC details:", err));
  }, [rpmId]);

  const handleFileChange = (field, file) => {
    setImages(prev => ({ ...prev, [field]: file }));
  };

  const getFieldConfig = (name) => {
    const cfg = fieldConfigs.find(c => c.field_name === name);
    return {
      isEnabled: cfg ? cfg.is_enabled : true,
      isRequired: cfg ? cfg.is_required : true
    };
  };

  const configsMap = {
    meter_ac_size: getFieldConfig('meter_ac_size'),
    cable_status: getFieldConfig('cable_status'),
    change_over_switch: getFieldConfig('change_over_switch'),
    ac_phase_qty: getFieldConfig('ac_phase_qty'),
    surge_protection: getFieldConfig('surge_protection'),
    mdb_temp: getFieldConfig('mdb_temp'),
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
    if (configsMap.meter_ac_size.isEnabled && configsMap.meter_ac_size.isRequired && !meterSize.trim()) {
      alert('กรุณากรอก Meter AC Size');
      return;
    }
    if (configsMap.cable_status.isEnabled && configsMap.cable_status.isRequired && !cableStatus.trim()) {
      alert('กรุณากรอก Cable Status');
      return;
    }
    if (configsMap.change_over_switch.isEnabled && configsMap.change_over_switch.isRequired && !changeOverSwitch.trim()) {
      alert('กรุณากรอก Change Over Switch');
      return;
    }
    if (configsMap.ac_phase_qty.isEnabled && configsMap.ac_phase_qty.isRequired && !phaseQty.trim()) {
      alert('กรุณากรอก AC Phase Qty');
      return;
    }
    if (configsMap.surge_protection.isEnabled && configsMap.surge_protection.isRequired && !surgeProtection.trim()) {
      alert('กรุณากรอก Surge Protection');
      return;
    }

    // Verify if active uploads are needed
    const checkFile = (configName, uploadKey, originalName) => {
      const cfg = configsMap[configName];
      if (cfg.isEnabled && cfg.isRequired) {
        if (!images[uploadKey] && !existingPaths[uploadKey]) {
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
    formData.append('mdb_temp', configsMap.mdb_temp.isEnabled ? mdbTemp : 0.0);
    formData.append('voltage_p1', configsMap.voltage_p1.isEnabled ? v1 : 0);
    formData.append('voltage_p2', configsMap.voltage_p2.isEnabled ? v2 : 0);
    formData.append('voltage_p3', configsMap.voltage_p3.isEnabled ? v3 : 0);
    formData.append('current_p1', configsMap.current_p1.isEnabled ? cur1 : 0.0);
    formData.append('current_p2', configsMap.current_p2.isEnabled ? cur2 : 0.0);
    formData.append('current_p3', configsMap.current_p3.isEnabled ? cur3 : 0.0);
    formData.append('ground_resistance', configsMap.ground_resistance.isEnabled ? groundResistance : 0.0);

    // Append files or original paths if enabled
    const appendFile = (configName, uploadKey, fieldName) => {
      if (configsMap[configName].isEnabled) {
        if (images[uploadKey]) formData.append(`${fieldName}_img`, images[uploadKey]);
        else if (existingPaths[uploadKey]) formData.append(`${fieldName}_img_path`, existingPaths[uploadKey]);
      }
    };

    appendFile('meter_ac_size', 'meter', 'meter_ac');
    appendFile('cable_status', 'cable', 'cable');
    appendFile('change_over_switch', 'changeOver', 'change_over');
    appendFile('surge_protection', 'surge', 'surge');
    appendFile('mdb_temp', 'mdb', 'mdb_temp');
    appendFile('ground_resistance', 'ground', 'ground');

    try {
      const res = await fetch(`/api/workorder/${rpmId}/ac`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        alert('บันทึกระบบไฟฟ้า AC และข้อมูลรูปภาพเรียบร้อยแล้ว!');
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
    <div className="p-8 space-y-8">
      <div>
        <h3 className="text-xl font-bold text-white">2. ระบบไฟเมน AC (Power Main AC)</h3>
        <p className="text-gray-400 text-sm mt-1">กรอกข้อมูลระบบไฟฟ้าและอัปโหลดภาพประกอบรายงาน</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <fieldset disabled={isReadOnly} className="space-y-8 border-0 p-0 m-0">
          {/* Param Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Col 1 */}
            <div className="space-y-4">
              {configsMap.meter_ac_size.isEnabled ? (
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                    Meter AC Size {configsMap.meter_ac_size.isRequired && <span className="text-red-400">*</span>}
                  </label>
                  <input type="text" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={meterSize} onChange={(e) => setMeterSize(e.target.value)} required={configsMap.meter_ac_size.isRequired} />
                </div>
              ) : (
                <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-xs text-gray-500 line-through">Meter AC Size (Disabled)</div>
              )}

              {configsMap.cable_status.isEnabled ? (
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                    Cable Status {configsMap.cable_status.isRequired && <span className="text-red-400">*</span>}
                  </label>
                  <input type="text" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={cableStatus} onChange={(e) => setCableStatus(e.target.value)} required={configsMap.cable_status.isRequired} />
                </div>
              ) : (
                <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-xs text-gray-500 line-through">Cable Status (Disabled)</div>
              )}

              {configsMap.change_over_switch.isEnabled ? (
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                    Change Over Switch {configsMap.change_over_switch.isRequired && <span className="text-red-400">*</span>}
                  </label>
                  <input type="text" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={changeOverSwitch} onChange={(e) => setChangeOverSwitch(e.target.value)} required={configsMap.change_over_switch.isRequired} />
                </div>
              ) : (
                <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-xs text-gray-500 line-through">Change Over Switch (Disabled)</div>
              )}

              {configsMap.ac_phase_qty.isEnabled ? (
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                    AC Phase Qty {configsMap.ac_phase_qty.isRequired && <span className="text-red-400">*</span>}
                  </label>
                  <input type="text" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={phaseQty} onChange={(e) => setPhaseQty(e.target.value)} required={configsMap.ac_phase_qty.isRequired} />
                </div>
              ) : (
                <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-xs text-gray-500 line-through">AC Phase Qty (Disabled)</div>
              )}

              {configsMap.surge_protection.isEnabled ? (
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                    Surge Protection {configsMap.surge_protection.isRequired && <span className="text-red-400">*</span>}
                  </label>
                  <input type="text" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={surgeProtection} onChange={(e) => setSurgeProtection(e.target.value)} required={configsMap.surge_protection.isRequired} />
                </div>
              ) : (
                <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-xs text-gray-500 line-through">Surge Protection (Disabled)</div>
              )}

              {configsMap.mdb_temp.isEnabled ? (
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                    MDB Temp (°C) {configsMap.mdb_temp.isRequired && <span className="text-red-400">*</span>}
                  </label>
                  <input type="number" step="0.1" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={mdbTemp} onChange={(e) => setMdbTemp(parseFloat(e.target.value))} required={configsMap.mdb_temp.isRequired} />
                </div>
              ) : (
                <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-xs text-gray-500 line-through">MDB Temp (Disabled)</div>
              )}
            </div>

            {/* Col 2 */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {configsMap.voltage_p1.isEnabled ? (
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                      Voltage P1 {configsMap.voltage_p1.isRequired && <span className="text-red-400">*</span>}
                    </label>
                    <input type="number" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={v1} onChange={(e) => setV1(parseInt(e.target.value))} required={configsMap.voltage_p1.isRequired} />
                  </div>
                ) : (
                  <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-[10px] text-gray-500 line-through flex items-center justify-center">V-P1 Disabled</div>
                )}
                {configsMap.voltage_p2.isEnabled ? (
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                      Voltage P2 {configsMap.voltage_p2.isRequired && <span className="text-red-400">*</span>}
                    </label>
                    <input type="number" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={v2} onChange={(e) => setV2(parseInt(e.target.value))} required={configsMap.voltage_p2.isRequired} />
                  </div>
                ) : (
                  <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-[10px] text-gray-500 line-through flex items-center justify-center">V-P2 Disabled</div>
                )}
                {configsMap.voltage_p3.isEnabled ? (
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                      Voltage P3 {configsMap.voltage_p3.isRequired && <span className="text-red-400">*</span>}
                    </label>
                    <input type="number" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={v3} onChange={(e) => setV3(parseInt(e.target.value))} required={configsMap.voltage_p3.isRequired} />
                  </div>
                ) : (
                  <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-[10px] text-gray-500 line-through flex items-center justify-center">V-P3 Disabled</div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                {configsMap.current_p1.isEnabled ? (
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                      Current P1 {configsMap.current_p1.isRequired && <span className="text-red-400">*</span>}
                    </label>
                    <input type="number" step="0.1" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={cur1} onChange={(e) => setCur1(parseFloat(e.target.value))} required={configsMap.current_p1.isRequired} />
                  </div>
                ) : (
                  <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-[10px] text-gray-500 line-through flex items-center justify-center">Cur-P1 Disabled</div>
                )}
                {configsMap.current_p2.isEnabled ? (
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                      Current P2 {configsMap.current_p2.isRequired && <span className="text-red-400">*</span>}
                    </label>
                    <input type="number" step="0.1" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={cur2} onChange={(e) => setCur2(parseFloat(e.target.value))} required={configsMap.current_p2.isRequired} />
                  </div>
                ) : (
                  <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-[10px] text-gray-500 line-through flex items-center justify-center">Cur-P2 Disabled</div>
                )}
                {configsMap.current_p3.isEnabled ? (
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                      Current P3 {configsMap.current_p3.isRequired && <span className="text-red-400">*</span>}
                    </label>
                    <input type="number" step="0.1" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={cur3} onChange={(e) => setCur3(parseFloat(e.target.value))} required={configsMap.current_p3.isRequired} />
                  </div>
                ) : (
                  <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-[10px] text-gray-500 line-through flex items-center justify-center">Cur-P3 Disabled</div>
                )}
              </div>

              {configsMap.ground_resistance.isEnabled ? (
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                    Ground Resistance (Ω) {configsMap.ground_resistance.isRequired && <span className="text-red-400">*</span>}
                  </label>
                  <input type="number" step="0.1" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={groundResistance} onChange={(e) => setGroundResistance(parseFloat(e.target.value))} required={configsMap.ground_resistance.isRequired} />
                </div>
              ) : (
                <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-xs text-gray-500 line-through">Ground Resistance (Disabled)</div>
              )}
            </div>
          </div>

          <hr className="border-dark-border" />

          {/* Uploads Section */}
          <div>
            <h4 className="font-bold text-white mb-4">อัปโหลดรูปภาพระบบไฟ AC (จัดเก็บลงตารางตาม Diagram)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {configsMap.meter_ac_size.isEnabled && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      1. ภาพหน้าปัดมิเตอร์ (meter_ac_img) {configsMap.meter_ac_size.isRequired && <span className="text-red-400">*</span>}
                    </label>
                    <input type="file" className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-dark-accent file:text-gray-300 hover:file:bg-indigo-600/20" onChange={(e) => handleFileChange('meter', e.target.files[0])} />
                  </div>
                )}
                {configsMap.cable_status.isEnabled && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      2. ภาพสายไฟเมน (cable_img) {configsMap.cable_status.isRequired && <span className="text-red-400">*</span>}
                    </label>
                    <input type="file" className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-dark-accent file:text-gray-300 hover:file:bg-indigo-600/20" onChange={(e) => handleFileChange('cable', e.target.files[0])} />
                  </div>
                )}
                {configsMap.change_over_switch.isEnabled && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      3. ภาพสวิตช์ Change Over (change_over_img) {configsMap.change_over_switch.isRequired && <span className="text-red-400">*</span>}
                    </label>
                    <input type="file" className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-dark-accent file:text-gray-300 hover:file:bg-indigo-600/20" onChange={(e) => handleFileChange('changeOver', e.target.files[0])} />
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {configsMap.surge_protection.isEnabled && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      4. ภาพอุปกรณ์กันไฟกระชาก (surge_img) {configsMap.surge_protection.isRequired && <span className="text-red-400">*</span>}
                    </label>
                    <input type="file" className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-dark-accent file:text-gray-300 hover:file:bg-indigo-600/20" onChange={(e) => handleFileChange('surge', e.target.files[0])} />
                  </div>
                )}
                {configsMap.mdb_temp.isEnabled && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      5. ภาพเทอร์โมสแกน/อุณหภูมิตู้ MDB (mdb_temp_img) {configsMap.mdb_temp.isRequired && <span className="text-red-400">*</span>}
                    </label>
                    <input type="file" className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-dark-accent file:text-gray-300 hover:file:bg-indigo-600/20" onChange={(e) => handleFileChange('mdb', e.target.files[0])} />
                  </div>
                )}
                {configsMap.ground_resistance.isEnabled && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      6. ภาพการวัดค่ากราวด์ (ground_img) {configsMap.ground_resistance.isRequired && <span className="text-red-400">*</span>}
                    </label>
                    <input type="file" className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-dark-accent file:text-gray-300 hover:file:bg-indigo-600/20" onChange={(e) => handleFileChange('ground', e.target.files[0])} />
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
