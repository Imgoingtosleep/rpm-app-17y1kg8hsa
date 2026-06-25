import React, { useState } from 'react';

export default function RectifierTab({ site, onComplete }) {
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

  const handleSave = (e) => {
    e.preventDefault();
    alert(`บันทึกข้อมูล ${rectNo} สำเร็จ!`);
    if (onComplete) onComplete();
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">⚙️ 3. ระบบตู้แปลงกระแสไฟฟ้า (Power Rectifier)</h3>
        <p className="text-gray-400 text-sm mt-1">เพิ่มหรืออัปเดตข้อมูลตู้ Rectifier และรูปภาพของแต่ละตู้</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
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

        <div className="pt-4">
          <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-sm shadow-md transition-colors">
            💾 บันทึก/เพิ่ม ตู้ Rectifier ตัวนี้
          </button>
        </div>
      </form>
    </div>
  );
}
