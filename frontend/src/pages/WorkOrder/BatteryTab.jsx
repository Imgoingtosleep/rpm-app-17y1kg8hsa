import React, { useState } from 'react';

export default function BatteryTab({ site, onComplete }) {
  const [selectedRect, setSelectedRect] = useState('ตู้ที่ 1');
  const [bankNo, setBankNo] = useState('Bank 1');
  
  // State for cells 1 to 4
  const [cells, setCells] = useState({
    1: { voltage: 13.2, ir: 4.5, file: null },
    2: { voltage: 13.2, ir: 4.5, file: null },
    3: { voltage: 13.2, ir: 4.5, file: null },
    4: { voltage: 13.2, ir: 4.5, file: null }
  });

  const handleCellChange = (num, field, value) => {
    setCells(prev => ({
      ...prev,
      [num]: {
        ...prev[num],
        [field]: value
      }
    }));
  };

  const evaluateStatus = (voltage, ir) => {
    return (ir > 10.0 || voltage < 12.0) ? 'เสื่อม' : 'ปกติ';
  };

  const handleSaveCell = (num) => {
    const cell = cells[num];
    const status = evaluateStatus(cell.voltage, cell.ir);
    alert(`บันทึกข้อมูลแบตเตอรี่ลูกที่ ${num} (${status}) เรียบร้อยแล้ว!`);
    if (onComplete) onComplete();
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">🔋 4. ผลทดสอบแบตเตอรี่ (Battery Tests)</h3>
        <p className="text-gray-400 text-sm mt-1">บันทึกข้อมูลแรงดันไฟฟ้า ความต้านทานภายใน และรูปภาพแยกรายลูก</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-dark-bg/50 p-4 rounded-lg border border-dark-border">
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">ระบุตู้ Rectifier</label>
          <select 
            className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm text-gray-200 focus:border-indigo-500 outline-none"
            value={selectedRect}
            onChange={(e) => setSelectedRect(e.target.value)}
          >
            <option>ตู้ที่ 1</option>
            <option>ตู้ที่ 2</option>
            <option>ตู้ที่ 3</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">เลือก Bank</label>
          <select 
            className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm text-gray-200 focus:border-indigo-500 outline-none"
            value={bankNo}
            onChange={(e) => setBankNo(e.target.value)}
          >
            <option>Bank 1</option>
            <option>Bank 2</option>
          </select>
        </div>
      </div>

      <div className="space-y-6 pt-4">
        <h4 className="font-bold text-white text-md border-b border-dark-border pb-2">📝 บันทึกข้อมูลและภาพถ่ายรายลูก (ลูกที่ 1-4)</h4>
        
        {[1, 2, 3, 4].map((num) => {
          const cell = cells[num];
          const status = evaluateStatus(cell.voltage, cell.ir);

          return (
            <div key={num} className="p-5 rounded-xl border border-dark-border bg-dark-bg/25 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-indigo-600/10 text-indigo-400 flex items-center justify-center font-bold text-sm">
                  #{num}
                </div>
                <div>
                  <h5 className="font-bold text-white text-sm">ลูกที่ {num}</h5>
                  <p className="text-xs text-gray-500">แบตเตอรี่ประจำ {bankNo}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
                <div>
                  <label className="block text-[10px] uppercase text-gray-500 mb-1">Volt (V)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="w-full bg-dark-bg border border-dark-border rounded p-2 text-xs text-gray-200 outline-none" 
                    value={cell.voltage}
                    onChange={(e) => handleCellChange(num, 'voltage', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-gray-500 mb-1">IR (mΩ)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="w-full bg-dark-bg border border-dark-border rounded p-2 text-xs text-gray-200 outline-none" 
                    value={cell.ir}
                    onChange={(e) => handleCellChange(num, 'ir', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-gray-500 mb-1">ผลประเมิน</label>
                  <span className={`inline-block w-full text-center py-2 rounded text-xs font-bold ${
                    status === 'ปกติ' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {status}
                  </span>
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-gray-500 mb-1">รูปถ่าย (battery_img)</label>
                  <input 
                    type="file" 
                    className="w-full text-[10px] text-gray-400 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:bg-dark-accent file:text-gray-300"
                    onChange={(e) => handleCellChange(num, 'file', e.target.files[0])}
                  />
                </div>
              </div>

              <div>
                <button 
                  onClick={() => handleSaveCell(num)}
                  className="w-full lg:w-auto px-4 py-2 bg-dark-accent border border-dark-border hover:border-indigo-500 text-gray-200 font-semibold rounded text-xs transition-colors"
                >
                  บันทึกข้อมูลลูกที่ {num}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
