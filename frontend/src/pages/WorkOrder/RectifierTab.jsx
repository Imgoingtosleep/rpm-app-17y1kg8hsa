import React, { useState, useEffect } from 'react';

export default function RectifierTab({ site, rpmId, rpmCycle, onComplete, isReadOnly }) {
  const [rectNo, setRectNo] = useState('ตู้ที่ 1');
  const [model, setModel] = useState('');
  const [acCableSize, setAcCableSize] = useState('');
  const [breakerSize, setBreakerSize] = useState('');
  const [modulesAll, setModulesAll] = useState(4);
  const [modulesFail, setModulesFail] = useState(0);
  const [inputCurrentAc, setInputCurrentAc] = useState(0.0);
  const [outputCurrentDc, setOutputCurrentDc] = useState(0.0);
  const [surgeStatus, setSurgeStatus] = useState('ปกติ');

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
  }, [rpmId]);

  // Load rectifier details when rectNo select option changes or rectifier list updates
  useEffect(() => {
    const found = rectifiers.find(r => r.rect_no === rectNo);
    if (found) {
      setModel(found.model || '');
      setAcCableSize(found.ac_cable_size || '');
      setBreakerSize(found.breaker_size || '');
      setModulesAll(found.modules_all || 0);
      setModulesFail(found.modules_fail || 0);
      setInputCurrentAc(found.input_current_ac ? parseFloat(found.input_current_ac) : 0.0);
      setOutputCurrentDc(found.output_current_dc ? parseFloat(found.output_current_dc) : 0.0);
      setSurgeStatus(found.surge_status || 'ปกติ');
      
      setExistingPaths({
        breaker: found.breaker_img || null,
        pdbTemp: found.pdb_temp_img || null,
        surgeRect: found.surge_rect_img || null,
      });
    } else {
      // Clear fields for new rectifier entries
      setModel('');
      setAcCableSize('');
      setBreakerSize('');
      setModulesAll(4);
      setModulesFail(0);
      setInputCurrentAc(0.0);
      setOutputCurrentDc(0.0);
      setSurgeStatus('ปกติ');
      
      setExistingPaths({
        breaker: null,
        pdbTemp: null,
        surgeRect: null,
      });
    }
    // Clear newly selected files
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

    // Dynamic validations
    if (configsMap.model.isEnabled && configsMap.model.isRequired && !model.trim()) {
      alert('กรุณากรอก Model');
      return;
    }
    if (configsMap.ac_cable_size.isEnabled && configsMap.ac_cable_size.isRequired && !acCableSize.trim()) {
      alert('กรุณากรอก AC Cable Size');
      return;
    }
    if (configsMap.breaker_size.isEnabled && configsMap.breaker_size.isRequired && !breakerSize.trim()) {
      alert('กรุณากรอก Breaker Size');
      return;
    }
    if (configsMap.surge_status.isEnabled && configsMap.surge_status.isRequired && !surgeStatus.trim()) {
      alert('กรุณากรอก Surge Status');
      return;
    }

    // Verify if active uploads are needed
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

    const imagesMap = {
      breaker: breakerImg,
      pdbTemp: pdbTempImg,
      surgeRect: surgeRectImg
    };

    if (!checkFile('breaker_size', 'breaker', 'ภาพเบรกเกอร์')) return;
    if (!checkFile('model', 'pdbTemp', 'ภาพเทอร์โมสแกน/ภายในตู้')) return;
    if (!checkFile('surge_status', 'surgeRect', 'ภาพอุปกรณ์กันฟ้าตู้ Rect')) return;

    const formData = new FormData();
    formData.append('rect_no', rectNo);
    formData.append('model', configsMap.model.isEnabled ? model : '');
    formData.append('ac_cable_size', configsMap.ac_cable_size.isEnabled ? acCableSize : '');
    formData.append('breaker_size', configsMap.breaker_size.isEnabled ? breakerSize : '');
    formData.append('modules_all', configsMap.modules_all.isEnabled ? modulesAll : 0);
    formData.append('modules_fail', configsMap.modules_fail.isEnabled ? modulesFail : 0);
    formData.append('input_current_ac', configsMap.input_current_ac.isEnabled ? inputCurrentAc : 0.0);
    formData.append('output_current_dc', configsMap.output_current_dc.isEnabled ? outputCurrentDc : 0.0);
    formData.append('surge_status', configsMap.surge_status.isEnabled ? surgeStatus : '');

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
        fetchRectifiers(); // Reload the data
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
                <option>ตู้ที่ 1</option>
                <option>ตู้ที่ 2</option>
                <option>ตู้ที่ 3</option>
                <option>ตู้ที่ 4</option>
                <option>ตู้ที่ 5</option>
                <option>ตู้ที่ 6</option>
              </select>
            </div>
            {configsMap.model.isEnabled ? (
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                  Model {configsMap.model.isRequired && <span className="text-red-400">*</span>}
                </label>
                <input type="text" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={model} onChange={(e) => setModel(e.target.value)} required={configsMap.model.isRequired} />
              </div>
            ) : (
              <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-xs text-gray-500 line-through flex items-center justify-center">Model (Disabled)</div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {configsMap.ac_cable_size.isEnabled ? (
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                  AC Cable Size {configsMap.ac_cable_size.isRequired && <span className="text-red-400">*</span>}
                </label>
                <input type="text" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={acCableSize} onChange={(e) => setAcCableSize(e.target.value)} required={configsMap.ac_cable_size.isRequired} />
              </div>
            ) : (
              <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-xs text-gray-500 line-through">AC Cable Size (Disabled)</div>
            )}
            {configsMap.breaker_size.isEnabled ? (
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                  Breaker Size {configsMap.breaker_size.isRequired && <span className="text-red-400">*</span>}
                </label>
                <input type="text" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={breakerSize} onChange={(e) => setBreakerSize(e.target.value)} required={configsMap.breaker_size.isRequired} />
              </div>
            ) : (
              <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-xs text-gray-500 line-through">Breaker Size (Disabled)</div>
            )}
            {configsMap.surge_status.isEnabled ? (
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                  Surge Status {configsMap.surge_status.isRequired && <span className="text-red-400">*</span>}
                </label>
                <input type="text" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={surgeStatus} onChange={(e) => setSurgeStatus(e.target.value)} required={configsMap.surge_status.isRequired} />
              </div>
            ) : (
              <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-xs text-gray-500 line-through">Surge Status (Disabled)</div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {configsMap.modules_all.isEnabled ? (
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                  Modules All {configsMap.modules_all.isRequired && <span className="text-red-400">*</span>}
                </label>
                <input type="number" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={modulesAll} onChange={(e) => setModulesAll(parseInt(e.target.value))} required={configsMap.modules_all.isRequired} />
              </div>
            ) : (
              <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-[10px] text-gray-500 line-through flex items-center justify-center">Modules All (Disabled)</div>
            )}
            {configsMap.modules_fail.isEnabled ? (
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                  Modules Fail {configsMap.modules_fail.isRequired && <span className="text-red-400">*</span>}
                </label>
                <input type="number" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={modulesFail} onChange={(e) => setModulesFail(parseInt(e.target.value))} required={configsMap.modules_fail.isRequired} />
              </div>
            ) : (
              <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-[10px] text-gray-500 line-through flex items-center justify-center">Modules Fail (Disabled)</div>
            )}
            {configsMap.input_current_ac.isEnabled ? (
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                  Input Current AC (A) {configsMap.input_current_ac.isRequired && <span className="text-red-400">*</span>}
                </label>
                <input type="number" step="0.1" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={inputCurrentAc} onChange={(e) => setInputCurrentAc(parseFloat(e.target.value))} required={configsMap.input_current_ac.isRequired} />
              </div>
            ) : (
              <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-[10px] text-gray-500 line-through flex items-center justify-center">Input Current AC (Disabled)</div>
            )}
            {configsMap.output_current_dc.isEnabled ? (
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">
                  Output Current DC (A) {configsMap.output_current_dc.isRequired && <span className="text-red-400">*</span>}
                </label>
                <input type="number" step="0.1" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={outputCurrentDc} onChange={(e) => setOutputCurrentDc(parseFloat(e.target.value))} required={configsMap.output_current_dc.isRequired} />
              </div>
            ) : (
              <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded-lg text-[10px] text-gray-500 line-through flex items-center justify-center">Output Current DC (Disabled)</div>
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
                </div>
              )}
              {configsMap.model.isEnabled && (
                <div>
                  <label className="block text-xs text-gray-400 mb-2">
                    ภาพเทอร์โมสแกน/ภายในตู้ (pdb_temp_img) {configsMap.model.isRequired && <span className="text-red-400">*</span>}
                  </label>
                  <input type="file" multiple className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-dark-accent file:text-gray-300 hover:file:bg-indigo-600/20" onChange={(e) => setPdbTempImg(Array.from(e.target.files))} />
                </div>
              )}
              {configsMap.surge_status.isEnabled && (
                <div>
                  <label className="block text-xs text-gray-400 mb-2">
                    ภาพอุปกรณ์กันฟ้าตู้ Rect (surge_rect_img) {configsMap.surge_status.isRequired && <span className="text-red-400">*</span>}
                  </label>
                  <input type="file" multiple className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-dark-accent file:text-gray-300 hover:file:bg-indigo-600/20" onChange={(e) => setSurgeRectImg(Array.from(e.target.files))} />
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
