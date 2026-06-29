import React, { useState, useEffect } from 'react';

export default function BatteryTab({ site, rpmId, onComplete, isReadOnly }) {
  const [selectedRect, setSelectedRect] = useState('ตู้ที่ 1');
  const [bankNo, setBankNo] = useState('Bank 1');
  const [rectifiers, setRectifiers] = useState([]);
  const [activeRectId, setActiveRectId] = useState(null);
  const [batteries, setBatteries] = useState([]);
  const [fieldConfigs, setFieldConfigs] = useState([]);

  // State for cells 1 to 4
  const [cells, setCells] = useState({
    1: { voltage: 13.2, ir: 4.5, file: null, existingPath: null },
    2: { voltage: 13.2, ir: 4.5, file: null, existingPath: null },
    3: { voltage: 13.2, ir: 4.5, file: null, existingPath: null },
    4: { voltage: 13.2, ir: 4.5, file: null, existingPath: null }
  });

  // 1. Fetch rectifiers for current workorder
  useEffect(() => {
    if (!rpmId) return;
    fetch(`/api/workorder/${rpmId}/rectifiers`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRectifiers(data);
        }
      })
      .catch(err => console.error("Error fetching rectifiers:", err));

    // Fetch configs
    fetch('/api/field-configs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFieldConfigs(data.filter(c => c.tab_name === 'battery'));
        }
      })
      .catch(err => console.error("Error fetching field configs:", err));
  }, [rpmId]);

  // 2. Resolve active rect_id when selectedRect name changes
  useEffect(() => {
    const found = rectifiers.find(r => r.rect_no === selectedRect);
    if (found) {
      setActiveRectId(found.rect_id);
    } else {
      setActiveRectId(null);
      setBatteries([]);
    }
  }, [selectedRect, rectifiers]);

  // 3. Fetch batteries for active rectifier
  const fetchBatteries = () => {
    if (!activeRectId) return;
    fetch(`/api/rectifier/${activeRectId}/batteries`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBatteries(data);
        }
      })
      .catch(err => console.error("Error fetching batteries:", err));
  };

  useEffect(() => {
    fetchBatteries();
  }, [activeRectId]);

  // 4. Update UI cells state when active batteries list or bank selection changes
  useEffect(() => {
    const updatedCells = {
      1: { voltage: 13.2, ir: 4.5, file: null, existingPath: null },
      2: { voltage: 13.2, ir: 4.5, file: null, existingPath: null },
      3: { voltage: 13.2, ir: 4.5, file: null, existingPath: null },
      4: { voltage: 13.2, ir: 4.5, file: null, existingPath: null }
    };

    // Filter batteries for selected bank
    const bankBatteries = batteries.filter(b => b.bank_name === bankNo);
    bankBatteries.forEach(bat => {
      const cellNo = bat.cell_no;
      if (updatedCells[cellNo]) {
        updatedCells[cellNo].voltage = bat.voltage ? parseFloat(bat.voltage) : 13.2;
        updatedCells[cellNo].ir = bat.internal_resistance ? parseFloat(bat.internal_resistance) : 4.5;
        updatedCells[cellNo].existingPath = bat.battery_img || null;
      }
    });

    setCells(updatedCells);
  }, [bankNo, batteries]);

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

  const getFieldConfig = (name) => {
    const cfg = fieldConfigs.find(c => c.field_name === name);
    return {
      isEnabled: cfg ? cfg.is_enabled : true,
      isRequired: cfg ? cfg.is_required : true
    };
  };

  const configsMap = {
    voltage: getFieldConfig('voltage'),
    internal_resistance: getFieldConfig('internal_resistance'),
    status: getFieldConfig('status'),
  };

  const handleSaveCell = async (num) => {
    if (!activeRectId) {
      alert('กรุณากรอกข้อมูลและบันทึกตู้ Rectifier ก่อนทำการบันทึกแบตเตอรี่ครับ!');
      return;
    }

    const cell = cells[num];

    // Check if image required
    if (configsMap.status.isEnabled && configsMap.status.isRequired) {
      const hasImg = cell.file || cell.existingPath;
      if (!hasImg) {
        alert(`กรุณาอัปโหลดรูปถ่ายสำหรับแบตเตอรี่ลูกที่ ${num} ก่อนทำการบันทึก!`);
        return;
      }
    }

    const status = evaluateStatus(cell.voltage, cell.ir);
    const formData = new FormData();
    formData.append('bank_name', bankNo);
    formData.append('cell_no', num);
    formData.append('voltage', configsMap.voltage.isEnabled ? cell.voltage : 0.0);
    formData.append('internal_resistance', configsMap.internal_resistance.isEnabled ? cell.ir : 0.0);
    formData.append('status', configsMap.status.isEnabled ? status : 'ปกติ');

    if (configsMap.status.isEnabled) {
      if (cell.file) {
        formData.append('battery_img', cell.file);
      } else if (cell.existingPath) {
        formData.append('battery_img_path', cell.existingPath);
      }
    }

    try {
      const res = await fetch(`/api/rectifier/${activeRectId}/battery`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        alert(`บันทึกข้อมูลแบตเตอรี่ลูกที่ ${num} (${status}) เรียบร้อยแล้ว!`);
        fetchBatteries(); // Reload batteries list
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
        <h3 className="text-xl font-bold text-white">4. ผลทดสอบแบตเตอรี่ (Battery Tests)</h3>
        <p className="text-gray-400 text-sm mt-1">บันทึกข้อมูลแรงดันไฟฟ้า ความต้านทานภายใน และรูปภาพแยกรายลูก</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-dark-bg/50 p-4 rounded-lg border border-dark-border">
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">ระบุตู้ Rectifier</label>
          <select 
            disabled={isReadOnly}
            className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm text-gray-200 focus:border-indigo-500 outline-none disabled:opacity-50"
            value={selectedRect}
            onChange={(e) => setSelectedRect(e.target.value)}
          >
            <option>ตู้ที่ 1</option>
            <option>ตู้ที่ 2</option>
            <option>ตู้ที่ 3</option>
            <option>ตู้ที่ 4</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">เลือก Bank</label>
          <select 
            disabled={isReadOnly}
            className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm text-gray-200 focus:border-indigo-500 outline-none disabled:opacity-50"
            value={bankNo}
            onChange={(e) => setBankNo(e.target.value)}
          >
            <option>Bank 1</option>
            <option>Bank 2</option>
            <option>Bank 3</option>
            <option>Bank 4</option>
            <option>Bank 5</option>
            <option>Bank 6</option>
            <option>Bank 7</option>
            <option>Bank 8</option>
            <option>Bank 9</option>
            <option>Bank 10</option>
            <option>Bank 11</option>
            <option>Bank 12</option>
          </select>
        </div>
      </div>

      <div className="space-y-6 pt-4">
        <div className="flex justify-between items-center border-b border-dark-border pb-2">
          <h4 className="font-bold text-white text-md">บันทึกข้อมูลและภาพถ่ายรายลูก (ลูกที่ 1-4)</h4>
        </div>
        
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
                {configsMap.voltage.isEnabled ? (
                  <div>
                    <label className="block text-[10px] uppercase text-gray-500 mb-1">
                      Volt (V) {configsMap.voltage.isRequired && <span className="text-red-400">*</span>}
                    </label>
                    <input 
                      type="number" 
                      step="0.01" 
                      disabled={isReadOnly}
                      className="w-full bg-dark-bg border border-dark-border rounded p-2 text-xs text-gray-200 outline-none disabled:opacity-50" 
                      value={cell.voltage}
                      onChange={(e) => handleCellChange(num, 'voltage', parseFloat(e.target.value))}
                      required={configsMap.voltage.isRequired}
                    />
                  </div>
                ) : (
                  <div className="opacity-40 bg-dark-bg/20 p-2 border border-dark-border/40 rounded text-[10px] text-gray-500 line-through flex items-center justify-center">Volt (Disabled)</div>
                )}

                {configsMap.internal_resistance.isEnabled ? (
                  <div>
                    <label className="block text-[10px] uppercase text-gray-500 mb-1">
                      IR (mΩ) {configsMap.internal_resistance.isRequired && <span className="text-red-400">*</span>}
                    </label>
                    <input 
                      type="number" 
                      step="0.01" 
                      disabled={isReadOnly}
                      className="w-full bg-dark-bg border border-dark-border rounded p-2 text-xs text-gray-200 outline-none disabled:opacity-50" 
                      value={cell.ir}
                      onChange={(e) => handleCellChange(num, 'ir', parseFloat(e.target.value))}
                      required={configsMap.internal_resistance.isRequired}
                    />
                  </div>
                ) : (
                  <div className="opacity-40 bg-dark-bg/20 p-2 border border-dark-border/40 rounded text-[10px] text-gray-500 line-through flex items-center justify-center">IR (Disabled)</div>
                )}

                {configsMap.status.isEnabled ? (
                  <>
                    <div>
                      <label className="block text-[10px] uppercase text-gray-500 mb-1">ผลประเมิน</label>
                      <span className={`inline-block w-full text-center py-2 rounded text-xs font-bold ${
                        status === 'ปกติ' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {status}
                      </span>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-gray-500 mb-1">
                        รูปถ่าย (battery_img) {configsMap.status.isRequired && <span className="text-red-400">*</span>}
                      </label>
                      <input 
                        type="file" 
                        disabled={isReadOnly}
                        className="w-full text-[10px] text-gray-400 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:bg-dark-accent file:text-gray-300 disabled:opacity-50"
                        onChange={(e) => handleCellChange(num, 'file', e.target.files[0])}
                      />
                    </div>
                  </>
                ) : (
                  <div className="col-span-2 opacity-40 bg-dark-bg/20 p-2 border border-dark-border/40 rounded text-xs text-gray-500 line-through flex items-center justify-center">Status & Photo Upload (Disabled)</div>
                )}
              </div>

              <div>
                {!isReadOnly ? (
                  <button 
                    onClick={() => handleSaveCell(num)}
                    className="w-full lg:w-auto px-4 py-2 bg-dark-accent border border-dark-border hover:border-indigo-500 text-gray-200 font-semibold rounded text-xs transition-colors"
                  >
                    บันทึกข้อมูลลูกที่ {num}
                  </button>
                ) : (
                  <span className="text-[10px] text-gray-500 font-medium italic">
                    โหมดอ่านอย่างเดียว
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
