import React, { useState, useEffect } from 'react';

const modelOptions = [
  'AC Plug',
  'Emerson 1U',
  'Emerson 5U',
  'Emerson-1U CAU-NCU-M830B',
  'Emerson-1U NCU-1A-M830D',
  'Emerson-ACU-1M800D',
  'Enatel 3U SM32',
  'Enatel 3U SM36',
  'Enatel 5U SM32',
  'Enatel 5U SM36',
  'Enatel1U SM32',
  'Enetek 1U SMU01',
  'Enetek 2U SMU01',
  'Enetek 3U SMU01',
  'Enetek 6U SMU01',
  'HUAWEI 4875 / EPS75-4815AF',
  'HUAWEI H831PAIB',
  'Huawei-ETP4890-SMU01B',
  'Huawei-MTS9512A-SMU02B',
  'PowerWare',
  'UPS 1500 Abex Dynamic MP RT 1.5(SH)',
  'UPS SMK1500',
  'UPS TR1500',
  'Vertiv-1U NCU-M830BG3',
  'Vertiv-4U NCU-M830BG3',
  'Vertiv-5U NCU-M830BG3',
  'อื่นๆ'
];

export default function RectifierTab({ site, rpmId, rpmCycle, onComplete, isReadOnly }) {
  const [rectNo, setRectNo] = useState('ตู้ที่ 1');
  const [selectedModel, setSelectedModel] = useState('AC Plug');
  const [customModel, setCustomModel] = useState('');
  const [acCableSize, setAcCableSize] = useState('2.5 Sqmm');
  const [breakerSize, setBreakerSize] = useState('16');
  const [modulesAll, setModulesAll] = useState(4);
  const [modulesFail, setModulesFail] = useState(0);
  const [inputCurrentAc, setInputCurrentAc] = useState(0.0);
  const [outputCurrentDc, setOutputCurrentDc] = useState(0.0);
  const [surgeStatus, setSurgeStatus] = useState('มี ปกติ');

  // New fields from Colunm_List.csv
  const [breakerPhase1, setBreakerPhase1] = useState('16');
  const [breakerPhase2, setBreakerPhase2] = useState('16');
  const [breakerPhase3, setBreakerPhase3] = useState('16');
  const [batteryType, setBatteryType] = useState('VRLA AGM');
  const [lithiumCapacity, setLithiumCapacity] = useState('100AH');
  const [batteryRun, setBatteryRun] = useState('ON (เขียว)');
  const [batterySoh, setBatterySoh] = useState('100');
  const [batterySoc, setBatterySoc] = useState('100');
  const [batteryCapacityPercent, setBatteryCapacityPercent] = useState('100');
  const [batteryAlarm, setBatteryAlarm] = useState('Alarm LED (สีแดง) ดับ');
  const [batteryQtyBank, setBatteryQtyBank] = useState('1');
  
  // Dynamic Rectifier Count based on master record
  const [rectifierQtyUih, setRectifierQtyUih] = useState(6);

  const [breakerImg, setBreakerImg] = useState([]);
  const [pdbTempImg, setPdbTempImg] = useState([]);
  const [surgeRectImg, setSurgeRectImg] = useState([]);
  const [fieldConfigs, setFieldConfigs] = useState([]);

  const [existingPaths, setExistingPaths] = useState({
    breaker: null,
    pdbTemp: null,
    surgeRect: null,
  });

  const [rectifiers, setRectifiers] = useState([]);

  // Fetch all rectifiers for the work order
  const fetchRectifiers = () => {
    if (!rpmId) return;
    fetch(`/api/workorder/${rpmId}/rectifiers`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRectifiers(data);
        }
      })
      .catch(err => console.error("Error fetching rectifiers:", err));
  };

  useEffect(() => {
    fetchRectifiers();

    // Fetch configs
    fetch('/api/field-configs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFieldConfigs(data.filter(c => c.tab_name === 'rectifier'));
        }
      })
      .catch(err => console.error("Error fetching field configs:", err));

    // Fetch master config to get rectifier_qty_uih
    if (rpmId) {
      fetch(`/api/workorder/${rpmId}/master`)
        .then(res => res.json())
        .then(data => {
          if (data && data.rectifier_qty_uih) {
            setRectifierQtyUih(parseInt(data.rectifier_qty_uih, 10));
          }
        })
        .catch(err => console.error("Error fetching master config:", err));
    }
  }, [rpmId]);

  // Load rectifier details when rectNo select option changes or rectifier list updates
  useEffect(() => {
    const found = rectifiers.find(r => r.rect_no === rectNo);
    if (found) {
      const modelVal = found.model || '';
      if (modelOptions.includes(modelVal)) {
        setSelectedModel(modelVal);
        setCustomModel('');
      } else {
        setSelectedModel('อื่นๆ');
        setCustomModel(modelVal);
      }

      setAcCableSize(found.ac_cable_size || '2.5 Sqmm');
      setBreakerSize(found.breaker_size || '16');
      setModulesAll(found.modules_all || 0);
      setModulesFail(found.modules_fail || 0);
      setInputCurrentAc(found.input_current_ac ? parseFloat(found.input_current_ac) : 0.0);
      setOutputCurrentDc(found.output_current_dc ? parseFloat(found.output_current_dc) : 0.0);
      setSurgeStatus(found.surge_status || 'มี ปกติ');

      setBreakerPhase1(found.breaker_phase1 || '16');
      setBreakerPhase2(found.breaker_phase2 || '16');
      setBreakerPhase3(found.breaker_phase3 || '16');
      setBatteryType(found.battery_type || 'VRLA AGM');
      setLithiumCapacity(found.lithium_capacity || '100AH');
      setBatteryRun(found.battery_run || 'ON (เขียว)');
      setBatterySoh(found.battery_soh || '100');
      setBatterySoc(found.battery_soc || '100');
      setBatteryCapacityPercent(found.battery_capacity_percent || '100');
      setBatteryAlarm(found.battery_alarm || 'Alarm LED (สีแดง) ดับ');
      setBatteryQtyBank(String(found.battery_qty_bank || '1'));
      
      setExistingPaths({
        breaker: found.breaker_img || null,
        pdbTemp: found.pdb_temp_img || null,
        surgeRect: found.surge_rect_img || null,
      });
    } else {
      setSelectedModel('AC Plug');
      setCustomModel('');
      setAcCableSize('2.5 Sqmm');
      setBreakerSize('16');
      setModulesAll(4);
      setModulesFail(0);
      setInputCurrentAc(0.0);
      setOutputCurrentDc(0.0);
      setSurgeStatus('มี ปกติ');

      setBreakerPhase1('16');
      setBreakerPhase2('16');
      setBreakerPhase3('16');
      setBatteryType('VRLA AGM');
      setLithiumCapacity('100AH');
      setBatteryRun('ON (เขียว)');
      setBatterySoh('100');
      setBatterySoc('100');
      setBatteryCapacityPercent('100');
      setBatteryAlarm('Alarm LED (สีแดง) ดับ');
      setBatteryQtyBank('1');
      
      setExistingPaths({
        breaker: null,
        pdbTemp: null,
        surgeRect: null,
      });
    }
    setBreakerImg([]);
    setPdbTempImg([]);
    setSurgeRectImg([]);
  }, [rectNo, rectifiers]);

  const getFieldConfig = (name) => {
    const cfg = fieldConfigs.find(c => c.field_name === name);
    return {
      isEnabled: cfg ? cfg.is_enabled : true,
      isRequired: cfg ? cfg.is_required : true
    };
  };

  const configsMap = {
    model: getFieldConfig('model'),
    ac_cable_size: getFieldConfig('ac_cable_size'),
    breaker_size: getFieldConfig('breaker_size'),
    modules_all: getFieldConfig('modules_all'),
    modules_fail: getFieldConfig('modules_fail'),
    input_current_ac: getFieldConfig('input_current_ac'),
    output_current_dc: getFieldConfig('output_current_dc'),
    surge_status: getFieldConfig('surge_status'),
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!rpmId) {
      alert('ไม่พบรหัสใบงานหลัก (rpmId)');
      return;
    }

    const finalModel = selectedModel === 'อื่นๆ' ? customModel : selectedModel;
    if (configsMap.model.isEnabled && configsMap.model.isRequired && !finalModel.trim()) {
      alert('กรุณากรอก Model/ยี่ห้อ');
      return;
    }

    const imagesMap = {
      breaker: breakerImg,
      pdbTemp: pdbTempImg,
      surgeRect: surgeRectImg
    };

    const checkFile = (configName, uploadKey, originalName) => {
      const cfg = configsMap[configName];
      if (cfg.isEnabled && cfg.isRequired) {
        const hasUpload = imagesMap[uploadKey] && imagesMap[uploadKey].length > 0;
        if (!hasUpload && !existingPaths[uploadKey]) {
          alert(`กรุณาอัปโหลดรูปภาพประกอบสำหรับ ${originalName}`);
          return false;
        }
      }
      return true;
    };

    if (!checkFile('breaker_size', 'breaker', 'ภาพเบรกเกอร์')) return;
    if (!checkFile('model', 'pdbTemp', 'ภาพเทอร์โมสแกน/ภายในตู้')) return;
    if (!checkFile('surge_status', 'surgeRect', 'ภาพอุปกรณ์กันฟ้าตู้ Rect')) return;

    const formData = new FormData();
    formData.append('rect_no', rectNo);
    formData.append('model', configsMap.model.isEnabled ? finalModel : '');
    formData.append('ac_cable_size', configsMap.ac_cable_size.isEnabled ? acCableSize : '');
    formData.append('breaker_size', configsMap.breaker_size.isEnabled ? breakerSize : '');
    formData.append('modules_all', configsMap.modules_all.isEnabled ? modulesAll : 0);
    formData.append('modules_fail', configsMap.modules_fail.isEnabled ? modulesFail : 0);
    formData.append('input_current_ac', configsMap.input_current_ac.isEnabled ? inputCurrentAc : 0.0);
    formData.append('output_current_dc', configsMap.output_current_dc.isEnabled ? outputCurrentDc : 0.0);
    formData.append('surge_status', configsMap.surge_status.isEnabled ? surgeStatus : '');

    formData.append('breaker_phase1', breakerPhase1);
    formData.append('breaker_phase2', breakerPhase2);
    formData.append('breaker_phase3', breakerPhase3);
    formData.append('battery_type', batteryType);
    formData.append('lithium_capacity', lithiumCapacity);
    formData.append('battery_run', batteryRun);
    formData.append('battery_soh', batterySoh);
    formData.append('battery_soc', batterySoc);
    formData.append('battery_capacity_percent', batteryCapacityPercent);
    formData.append('battery_alarm', batteryAlarm);
    formData.append('battery_qty_bank', parseInt(batteryQtyBank, 10));

    if (configsMap.breaker_size.isEnabled) {
      if (breakerImg && breakerImg.length > 0) {
        breakerImg.forEach(file => {
          formData.append('breaker_img', file);
        });
      } else if (existingPaths.breaker) {
        const pathVal = Array.isArray(existingPaths.breaker) ? existingPaths.breaker : [existingPaths.breaker];
        pathVal.forEach(p => formData.append('breaker_img_path', p));
      }
    }
    if (configsMap.model.isEnabled) {
      if (pdbTempImg && pdbTempImg.length > 0) {
        pdbTempImg.forEach(file => {
          formData.append('pdb_temp_img', file);
        });
      } else if (existingPaths.pdbTemp) {
        const pathVal = Array.isArray(existingPaths.pdbTemp) ? existingPaths.pdbTemp : [existingPaths.pdbTemp];
        pathVal.forEach(p => formData.append('pdb_temp_img_path', p));
      }
    }
    if (configsMap.surge_status.isEnabled) {
      if (surgeRectImg && surgeRectImg.length > 0) {
        surgeRectImg.forEach(file => {
          formData.append('surge_rect_img', file);
        });
      } else if (existingPaths.surgeRect) {
        const pathVal = Array.isArray(existingPaths.surgeRect) ? existingPaths.surgeRect : [existingPaths.surgeRect];
        pathVal.forEach(p => formData.append('surge_rect_img_path', p));
      }
    }

    try {
      const res = await fetch(`/api/workorder/${rpmId}/rectifier?site_code=${encodeURIComponent(site.code)}&rpm_id=${rpmId}&rpm_cycle=${encodeURIComponent(rpmCycle || '')}`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        alert(`บันทึกข้อมูล ${rectNo} สำเร็จ!`);
        fetchRectifiers();
        if (onComplete) onComplete();
      } else {
        const errorData = await res.json();
        alert('เกิดข้อผิดพลาด: ' + errorData.error);
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  const breakerOptions = ['10', '15', '16', '20', '25', '30', '32', '35', '40', '50', '63', '100'];
  const cableOptions = ['1 Sqmm', '1.5 Sqmm', '2.5 Sqmm', '4 Sqmm', '6 Sqmm', '10 Sqmm', '16 Sqmm'];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">3. ระบบตู้แปลงกระแสไฟฟ้า (Power Rectifier)</h3>
        <p className="text-gray-400 text-sm mt-1">เพิ่มหรืออัปเดตข้อมูลตู้ Rectifier และรูปภาพของแต่ละตู้</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <fieldset disabled={isReadOnly} className="space-y-6 border-0 p-0 m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">ระบุหมายเลขตู้ (rect_no)</label>
              <select 
                className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none"
                value={rectNo}
                onChange={(e) => setRectNo(e.target.value)}
              >
                {Array.from({ length: rectifierQtyUih || 1 }, (_, i) => (
                  <option key={i + 1} value={`ตู้ที่ ${i + 1}`}>ตู้ที่ {i + 1}</option>
                ))}
              </select>
            </div>
            {configsMap.model.isEnabled ? (
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase text-gray-400">
                  ยี่ห้อ/Model Rectifier {configsMap.model.isRequired && <span className="text-red-400">*</span>}
                </label>
                <select
                  className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  {modelOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                {selectedModel === 'อื่นๆ' && (
                  <input
                    type="text"
                    placeholder="กรุณาระบุยี่ห้อ/รุ่น Rectifier อื่นๆ..."
                    className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none mt-2"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    required={configsMap.model.isRequired}
                  />
                )}
              </div>
            ) : (
              <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-xs text-gray-500 line-through flex items-center justify-center">Model (Disabled)</div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {configsMap.ac_cable_size.isEnabled ? (
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                  ขนาดสายไฟ AC input
                </label>
                <select className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={acCableSize} onChange={(e) => setAcCableSize(e.target.value)}>
                  {cableOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            ) : (
              <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-xs text-gray-500 line-through">AC Cable Size (Disabled)</div>
            )}
            {configsMap.breaker_size.isEnabled ? (
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                  ขนาดเมนเบรกเกอร์ (Breaker Size)
                </label>
                <select className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={breakerSize} onChange={(e) => setBreakerSize(e.target.value)}>
                  {breakerOptions.map(opt => <option key={opt} value={opt}>{opt} A</option>)}
                </select>
              </div>
            ) : (
              <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-xs text-gray-500 line-through">Breaker Size (Disabled)</div>
            )}
            {configsMap.surge_status.isEnabled ? (
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                  Surge Protection ที่ Rectifier
                </label>
                <select className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={surgeStatus} onChange={(e) => setSurgeStatus(e.target.value)}>
                  <option value="มี ปกติ">มี ปกติ</option>
                  <option value="มี ไม่ปกติ">มี ไม่ปกติ</option>
                  <option value="ไม่มี">ไม่มี</option>
                </select>
              </div>
            ) : (
              <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-xs text-gray-500 line-through">Surge Status (Disabled)</div>
            )}
          </div>

          {/* Rate Breaker AC Phase 1, 2, 3 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-dark-bg/30 p-4 rounded-xl border border-dark-border/40">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Rate Breaker AC Phase 1 (Amp)</label>
              <select className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={breakerPhase1} onChange={(e) => setBreakerPhase1(e.target.value)}>
                {breakerOptions.map(opt => <option key={opt} value={opt}>{opt} A</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Rate Breaker AC Phase 2 (Amp)</label>
              <select className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={breakerPhase2} onChange={(e) => setBreakerPhase2(e.target.value)}>
                {breakerOptions.map(opt => <option key={opt} value={opt}>{opt} A</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Rate Breaker AC Phase 3 (Amp)</label>
              <select className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={breakerPhase3} onChange={(e) => setBreakerPhase3(e.target.value)}>
                {breakerOptions.map(opt => <option key={opt} value={opt}>{opt} A</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {configsMap.modules_all.isEnabled ? (
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Modules All</label>
                <input type="number" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={modulesAll} onChange={(e) => setModulesAll(parseInt(e.target.value))} required={configsMap.modules_all.isRequired} />
              </div>
            ) : (
              <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-[10px] text-gray-500 line-through flex items-center justify-center">Modules All (Disabled)</div>
            )}
            {configsMap.modules_fail.isEnabled ? (
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Modules Fail</label>
                <input type="number" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={modulesFail} onChange={(e) => setModulesFail(parseInt(e.target.value))} required={configsMap.modules_fail.isRequired} />
              </div>
            ) : (
              <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-[10px] text-gray-500 line-through flex items-center justify-center">Modules Fail (Disabled)</div>
            )}
            {configsMap.input_current_ac.isEnabled ? (
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">AC Input Current (A)</label>
                <input type="number" step="0.1" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={inputCurrentAc} onChange={(e) => setInputCurrentAc(parseFloat(e.target.value))} required={configsMap.input_current_ac.isRequired} />
              </div>
            ) : (
              <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-[10px] text-gray-500 line-through flex items-center justify-center">Input Current (Disabled)</div>
            )}
            {configsMap.output_current_dc.isEnabled ? (
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">DC Output Current (A)</label>
                <input type="number" step="0.1" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={outputCurrentDc} onChange={(e) => setOutputCurrentDc(parseFloat(e.target.value))} required={configsMap.output_current_dc.isRequired} />
              </div>
            ) : (
              <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-[10px] text-gray-500 line-through flex items-center justify-center">Output Current (Disabled)</div>
            )}
          </div>

          {/* Battery specifications configuration */}
          <div className="bg-dark-bg/40 p-6 rounded-xl border border-dark-border space-y-6">
            <h4 className="font-bold text-white text-md border-b border-dark-border/60 pb-2">🔋 ข้อมูลแบตเตอรี่ควบคุม (Battery Settings)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">ชนิดแบตเตอรี่</label>
                <select className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={batteryType} onChange={(e) => setBatteryType(e.target.value)}>
                  <option value="VRLA AGM">VRLA AGM</option>
                  <option value="Lithium">Lithium</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">จำนวน Bank Batt</label>
                <input type="number" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={batteryQtyBank} onChange={(e) => setBatteryQtyBank(e.target.value)} />
              </div>
            </div>

            {/* Lithium Conditional Fields */}
            {batteryType === 'Lithium' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 bg-dark-bg/60 p-4 rounded-xl border border-dark-border/40">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Lithium Capacity</label>
                  <select className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={lithiumCapacity} onChange={(e) => setLithiumCapacity(e.target.value)}>
                    <option value="12AH">12AH</option>
                    <option value="40AH">40AH</option>
                    <option value="100AH">100AH</option>
                    <option value="150AH">150AH</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Battery RUN</label>
                  <select className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={batteryRun} onChange={(e) => setBatteryRun(e.target.value)}>
                    <option value="ON (เขียว)">ON (เขียว)</option>
                    <option value="OFF (ดับ)">OFF (ดับ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Battery Alarm Status</label>
                  <select className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={batteryAlarm} onChange={(e) => setBatteryAlarm(e.target.value)}>
                    <option value="Alarm LED (สีแดง) ดับ">Alarm LED (สีแดง) ดับ</option>
                    <option value="Alarm LED (สีแดง) ติด">Alarm LED (สีแดง) ติด</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Battery % SOH (State of Health)</label>
                  <input type="text" className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={batterySoh} onChange={(e) => setBatterySoh(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Battery % SOC (State of Charge)</label>
                  <input type="text" className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={batterySoc} onChange={(e) => setBatterySoc(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Battery เปอร์เซ็น Capacity</label>
                  <input type="text" className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={batteryCapacityPercent} onChange={(e) => setBatteryCapacityPercent(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <hr className="border-dark-border" />

          <div>
            <h4 className="font-bold text-white mb-4">รูปถ่ายประจำตู้ Rectifier (ครบถ้วนตาม Diagram)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {configsMap.breaker_size.isEnabled && (
                <div>
                  <label className="block text-xs text-gray-400 mb-2">
                    ภาพเบรกเกอร์ (breaker_img) {configsMap.breaker_size.isRequired && <span className="text-red-400">*</span>}
                  </label>
                  <input type="file" multiple className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-dark-accent file:text-gray-300 hover:file:bg-indigo-600/20" onChange={(e) => setBreakerImg(Array.from(e.target.files))} />
                  {existingPaths.breaker && <p className="text-[10px] text-gray-500 mt-1">รูปเก่า: {Array.isArray(existingPaths.breaker) ? existingPaths.breaker.join(', ') : existingPaths.breaker}</p>}
                </div>
              )}
              {configsMap.model.isEnabled && (
                <div>
                  <label className="block text-xs text-gray-400 mb-2">
                    ภาพเทอร์โมสแกน/ภายในตู้ (pdb_temp_img) {configsMap.model.isRequired && <span className="text-red-400">*</span>}
                  </label>
                  <input type="file" multiple className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-dark-accent file:text-gray-300 hover:file:bg-indigo-600/20" onChange={(e) => setPdbTempImg(Array.from(e.target.files))} />
                  {existingPaths.pdbTemp && <p className="text-[10px] text-gray-500 mt-1">รูปเก่า: {Array.isArray(existingPaths.pdbTemp) ? existingPaths.pdbTemp.join(', ') : existingPaths.pdbTemp}</p>}
                </div>
              )}
              {configsMap.surge_status.isEnabled && (
                <div>
                  <label className="block text-xs text-gray-400 mb-2">
                    ภาพอุปกรณ์กันฟ้าตู้ Rect (surge_rect_img) {configsMap.surge_status.isRequired && <span className="text-red-400">*</span>}
                  </label>
                  <input type="file" multiple className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-dark-accent file:text-gray-300 hover:file:bg-indigo-600/20" onChange={(e) => setSurgeRectImg(Array.from(e.target.files))} />
                  {existingPaths.surgeRect && <p className="text-[10px] text-gray-500 mt-1">รูปเก่า: {Array.isArray(existingPaths.surgeRect) ? existingPaths.surgeRect.join(', ') : existingPaths.surgeRect}</p>}
                </div>
              )}
            </div>
          </div>
        </fieldset>

        <div className="pt-4">
          {!isReadOnly ? (
            <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-sm shadow-md transition-colors">
              บันทึก/เพิ่ม ตู้ Rectifier ตัวนี้
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
