import React, { useState } from 'react';

export default function AcMainTab({ site, onComplete }) {
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

  // File uploads
  const [images, setImages] = useState({
    meter: null,
    cable: null,
    changeOver: null,
    surge: null,
    mdb: null,
    ground: null,
  });

  const handleFileChange = (field, file) => {
    setImages(prev => ({ ...prev, [field]: file }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    alert('บันทึกระบบไฟฟ้า AC และข้อมูลรูปภาพเรียบร้อยแล้ว!');
    if (onComplete) onComplete();
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h3 className="text-xl font-bold text-white">⚡ 2. ระบบไฟเมน AC (Power Main AC)</h3>
        <p className="text-gray-400 text-sm mt-1">กรอกข้อมูลระบบไฟฟ้าและอัปโหลดภาพประกอบรายงาน</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Param Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Col 1 */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Meter AC Size</label>
              <input type="text" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={meterSize} onChange={(e) => setMeterSize(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Cable Status</label>
              <input type="text" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={cableStatus} onChange={(e) => setCableStatus(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Change Over Switch</label>
              <input type="text" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={changeOverSwitch} onChange={(e) => setChangeOverSwitch(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">AC Phase Qty</label>
              <input type="text" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={phaseQty} onChange={(e) => setPhaseQty(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Surge Protection</label>
              <input type="text" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={surgeProtection} onChange={(e) => setSurgeProtection(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">MDB Temp (°C)</label>
              <input type="number" step="0.1" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={mdbTemp} onChange={(e) => setMdbTemp(parseFloat(e.target.value))} />
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Voltage P1</label>
                <input type="number" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={v1} onChange={(e) => setV1(parseInt(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Voltage P2</label>
                <input type="number" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={v2} onChange={(e) => setV2(parseInt(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Voltage P3</label>
                <input type="number" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={v3} onChange={(e) => setV3(parseInt(e.target.value))} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Current P1</label>
                <input type="number" step="0.1" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={cur1} onChange={(e) => setCur1(parseFloat(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Current P2</label>
                <input type="number" step="0.1" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={cur2} onChange={(e) => setCur2(parseFloat(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Current P3</label>
                <input type="number" step="0.1" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={cur3} onChange={(e) => setCur3(parseFloat(e.target.value))} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Ground Resistance (Ω)</label>
              <input type="number" step="0.1" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 outline-none" value={groundResistance} onChange={(e) => setGroundResistance(parseFloat(e.target.value))} />
            </div>
          </div>
        </div>

        <hr className="border-dark-border" />

        {/* Uploads Section */}
        <div>
          <h4 className="font-bold text-white mb-4">📷 อัปโหลดรูปภาพระบบไฟ AC (จัดเก็บลงตารางตาม Diagram)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">1. ภาพหน้าปัดมิเตอร์ (meter_ac_img)</label>
                <input type="file" className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-dark-accent file:text-gray-300 hover:file:bg-indigo-600/20" onChange={(e) => handleFileChange('meter', e.target.files[0])} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">2. ภาพสายไฟเมน (cable_img)</label>
                <input type="file" className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-dark-accent file:text-gray-300 hover:file:bg-indigo-600/20" onChange={(e) => handleFileChange('cable', e.target.files[0])} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">3. ภาพสวิตช์ Change Over (change_over_img)</label>
                <input type="file" className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-dark-accent file:text-gray-300 hover:file:bg-indigo-600/20" onChange={(e) => handleFileChange('changeOver', e.target.files[0])} />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">4. ภาพอุปกรณ์กันไฟกระชาก (surge_img)</label>
                <input type="file" className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-dark-accent file:text-gray-300 hover:file:bg-indigo-600/20" onChange={(e) => handleFileChange('surge', e.target.files[0])} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">5. ภาพเทอร์โมสแกน/อุณหภูมิตู้ MDB (mdb_temp_img)</label>
                <input type="file" className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-dark-accent file:text-gray-300 hover:file:bg-indigo-600/20" onChange={(e) => handleFileChange('mdb', e.target.files[0])} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">6. ภาพการวัดค่ากราวด์ (ground_img)</label>
                <input type="file" className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-dark-accent file:text-gray-300 hover:file:bg-indigo-600/20" onChange={(e) => handleFileChange('ground', e.target.files[0])} />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button type="submit" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-sm shadow-md transition-colors">
            💾 บันทึกระบบไฟฟ้า AC
          </button>
        </div>
      </form>
    </div>
  );
}
