import React, { useState, useEffect } from 'react';

export default function RectifierTab({ site, rpmId, onComplete, isReadOnly }) {
  const [rectNo, setRectNo] = useState('ตู้ที่ 1');
  const [model, setModel] = useState('');
  const [acCableSize, setAcCableSize] = useState('');
  const [breakerSize, setBreakerSize] = useState('');
  const [modulesAll, setModulesAll] = useState(4);
  const [modulesFail, setModulesFail] = useState(0);
  const [inputCurrentAc, setInputCurrentAc] = useState(0.0);
  const [outputCurrentDc, setOutputCurrentDc] = useState(0.0);
  const [surgeStatus, setSurgeStatus] = useState('ปกติ');

  const [breakerImg, setBreakerImg] = useState(null);
  const [pdbTempImg, setPdbTempImg] = useState(null);
  const [surgeRectImg, setSurgeRectImg] = useState(null);

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
    setBreakerImg(null);
    setPdbTempImg(null);
    setSurgeRectImg(null);
  }, [rectNo, rectifiers]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!rpmId) {
      alert('ไม่พบรหัสใบงานหลัก (rpmId)');
      return;
    }

    const hasBreaker = breakerImg || existingPaths.breaker;
    const hasPdbTemp = pdbTempImg || existingPaths.pdbTemp;
    const hasSurgeRect = surgeRectImg || existingPaths.surgeRect;

    if (!hasBreaker || !hasPdbTemp || !hasSurgeRect) {
      alert('กรุณาอัปโหลดรูปถ่ายประจำตู้ Rectifier ให้ครบถ้วนทั้ง 3 รูปก่อนทำการบันทึก!');
      return;
    }

    const formData = new FormData();
    formData.append('rect_no', rectNo);
    formData.append('model', model);
    formData.append('ac_cable_size', acCableSize);
    formData.append('breaker_size', breakerSize);
    formData.append('modules_all', modulesAll);
    formData.append('modules_fail', modulesFail);
    formData.append('input_current_ac', inputCurrentAc);
    formData.append('output_current_dc', outputCurrentDc);
    formData.append('surge_status', surgeStatus);

    if (breakerImg) formData.append('breaker_img', breakerImg);
    else if (existingPaths.breaker) formData.append('breaker_img_path', existingPaths.breaker);

    if (pdbTempImg) formData.append('pdb_temp_img', pdbTempImg);
    else if (existingPaths.pdbTemp) formData.append('pdb_temp_img_path', existingPaths.pdbTemp);

    if (surgeRectImg) formData.append('surge_rect_img', surgeRectImg);
    else if (existingPaths.surgeRect) formData.append('surge_rect_img_path', existingPaths.surgeRect);

    try {
      const res = await fetch(`/api/workorder/${rpmId}/rectifier`, {
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
        <h3 className="text-xl font-bold text-white">⚙️ 3. ระบบตู้แปลงกระแสไฟฟ้า (Power Rectifier)</h3>
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
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Model</label>
              <input type="text" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">AC Cable Size</label>
              <input type="text" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={acCableSize} onChange={(e) => setAcCableSize(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Breaker Size</label>
              <input type="text" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={breakerSize} onChange={(e) => setBreakerSize(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Surge Status</label>
              <input type="text" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={surgeStatus} onChange={(e) => setSurgeStatus(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Modules All</label>
              <input type="number" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={modulesAll} onChange={(e) => setModulesAll(parseInt(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Modules Fail</label>
              <input type="number" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={modulesFail} onChange={(e) => setModulesFail(parseInt(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Input Current AC (A)</label>
              <input type="number" step="0.1" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={inputCurrentAc} onChange={(e) => setInputCurrentAc(parseFloat(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Output Current DC (A)</label>
              <input type="number" step="0.1" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={outputCurrentDc} onChange={(e) => setOutputCurrentDc(parseFloat(e.target.value))} />
            </div>
          </div>

          <hr className="border-dark-border" />

          <div>
            <h4 className="font-bold text-white mb-4">📷 รูปถ่ายประจำตู้ Rectifier (ครบถ้วนตาม Diagram)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs text-gray-400 mb-2">ภาพเบรกเกอร์ (breaker_img)</label>
                <input type="file" className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-dark-accent file:text-gray-300 hover:file:bg-indigo-600/20" onChange={(e) => setBreakerImg(e.target.files[0])} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">ภาพเทอร์โมสแกน/ภายในตู้ (pdb_temp_img)</label>
                <input type="file" className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-dark-accent file:text-gray-300 hover:file:bg-indigo-600/20" onChange={(e) => setPdbTempImg(e.target.files[0])} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">ภาพอุปกรณ์กันฟ้าตู้ Rect (surge_rect_img)</label>
                <input type="file" className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-dark-accent file:text-gray-300 hover:file:bg-indigo-600/20" onChange={(e) => setSurgeRectImg(e.target.files[0])} />
              </div>
            </div>
          </div>
        </fieldset>

        <div className="pt-4">
          {!isReadOnly ? (
            <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-sm shadow-md transition-colors">
              💾 บันทึก/เพิ่ม ตู้ Rectifier ตัวนี้
            </button>
          ) : (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs font-medium">
              ⚠️ คุณอยู่ในโหมดผู้เข้าชมทั่วไป (Viewer) ทำได้เฉพาะการดูข้อมูลเท่านั้น ไม่สามารถแก้ไขหรือบันทึกได้
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
