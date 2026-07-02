import React, { useState, useEffect } from 'react';

const BATTERY_MODELS = [
  { brand: "Narada รุ่น AG12V100F(100AH)", capacity: "100AH", specIr: 6.36, abnormalIr: 13 },
  { brand: "Genesys รุ่น 12TD100F4(100AH)", capacity: "100AH", specIr: 5.70, abnormalIr: 12 },
  { brand: "ABT รุ่น EFTB12-100(100AH)", capacity: "100AH", specIr: 3.99, abnormalIr: 8 },
  { brand: "Sacred SUN รุ่น FTB12-100 II(100AH)", capacity: "100AH", specIr: 4.50, abnormalIr: 9 },
  { brand: "Transpower รุ่น FTB12-100 B(100AH)", capacity: "100AH", specIr: 5.50, abnormalIr: 11 },
  { brand: "Invent รุ่น IFT12-100 V0(100AH)", capacity: "100AH", specIr: 5.50, abnormalIr: 11 },
  { brand: "Outdo OT105-12FT(100AH)", capacity: "100AH", specIr: 5.50, abnormalIr: 11 },
  { brand: "HIPOW รุ่น HP 12-40(40AH)", capacity: "40AH", specIr: 10.00, abnormalIr: 20 },
  { brand: "CSB รุ่น DB 12-40(40AH)", capacity: "40AH", specIr: 9.50, abnormalIr: 19 },
  { brand: "Trasnpower รุ่น TDB 12-40(40AH)", capacity: "40AH", specIr: 9.50, abnormalIr: 19 },
  { brand: "Invent รุ่น IHB12-40 V0(40AH)", capacity: "40AH", specIr: 9.00, abnormalIr: 18 },
  { brand: "Outdo OT40-12(40AH)", capacity: "40AH", specIr: 9.50, abnormalIr: 19 },
  { brand: "TPP TPP40-12 (AGM)(40AH)", capacity: "40AH", specIr: 9.50, abnormalIr: 19 },
  { brand: "HIPOW รุ่น HP 12-12(12AH)", capacity: "12AH", specIr: 13.00, abnormalIr: 26 },
  { brand: "Transpowerรุ่น TGB 12-12(12AH)", capacity: "12AH", specIr: 19.00, abnormalIr: 38 },
  { brand: "Invent รุ่น IHB12-12 V0(12AH)", capacity: "12AH", specIr: 17.00, abnormalIr: 34 },
  { brand: "Outdo OT12-12(12AH)", capacity: "12AH", specIr: 11.00, abnormalIr: 22 }
];

export default function BatteryTab({ site, rpmId, rpmCycle, onComplete, isReadOnly }) {
  const [selectedRect, setSelectedRect] = useState('ตู้ที่ 1');
  const [bankNo, setBankNo] = useState('Bank 1');
  const [rectifiers, setRectifiers] = useState([]);
  const [activeRectId, setActiveRectId] = useState(null);
  const [batteries, setBatteries] = useState([]);
  const [fieldConfigs, setFieldConfigs] = useState([]);

  // VRLA Bank Metadata fields
  const [brand, setBrand] = useState('');
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [capacity, setCapacity] = useState('100AH');
  const [installedDate, setInstalledDate] = useState('');
  const [warranteeDate, setWarranteeDate] = useState('');

  // State for cells 1 to 4
  const [cells, setCells] = useState({
    1: { voltage: '', ir: '', file: null, existingPath: null },
    2: { voltage: '', ir: '', file: null, existingPath: null },
    3: { voltage: '', ir: '', file: null, existingPath: null },
    4: { voltage: '', ir: '', file: null, existingPath: null }
  });

  const [fileInputKey, setFileInputKey] = useState(Date.now());

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
      1: { voltage: '', ir: '', file: null, existingPath: null },
      2: { voltage: '', ir: '', file: null, existingPath: null },
      3: { voltage: '', ir: '', file: null, existingPath: null },
      4: { voltage: '', ir: '', file: null, existingPath: null }
    };

    // Filter batteries for selected bank
    const bankBatteries = batteries.filter(b => b.bank_name === bankNo);
    bankBatteries.forEach(bat => {
      const cellNo = bat.cell_no;
      if (updatedCells[cellNo]) {
        updatedCells[cellNo].voltage = (bat.voltage !== null && bat.voltage !== undefined) ? parseFloat(bat.voltage) : '';
        updatedCells[cellNo].ir = (bat.internal_resistance !== null && bat.internal_resistance !== undefined) ? parseFloat(bat.internal_resistance) : '';
        updatedCells[cellNo].existingPath = bat.battery_img || null;
        updatedCells[cellNo].status = bat.status || 'Good';
      }
    });

    setCells(updatedCells);

    const formatDateForInput = (dateStr) => {
      if (!dateStr) return '';
      if (dateStr.length >= 10) {
        return dateStr.substring(0, 10);
      }
      return dateStr;
    };

    // Get metadata from any cell of this bank
    const matchedBank = batteries.find(b => b.bank_name === bankNo);
    if (matchedBank) {
      setBrand(matchedBank.brand || '');
      setCapacity(matchedBank.capacity || '100AH');
      setInstalledDate(formatDateForInput(matchedBank.installed_date));
      setWarranteeDate(formatDateForInput(matchedBank.warrantee_date));
    } else {
      setBrand('');
      setCapacity('100AH');
      setInstalledDate('');
      setWarranteeDate('');
    }
  }, [bankNo, batteries]);

  const handleCellChange = (num, field, value) => {
    setCells(prev => {
      let finalValue = value;
      if (field === 'file') {
        finalValue = Array.from(value);
      }

      const updatedCell = {
        ...prev[num],
        [field]: finalValue
      };

      // Automatically evaluate status if voltage or ir changes
      if (field === 'ir' || field === 'voltage') {
        const vVal = field === 'voltage' ? (value === '' ? NaN : parseFloat(value)) : (updatedCell.voltage === '' ? NaN : parseFloat(updatedCell.voltage));
        const irVal = field === 'ir' ? (value === '' ? NaN : parseFloat(value)) : (updatedCell.ir === '' ? NaN : parseFloat(updatedCell.ir));
        
        // Find abnormal threshold for selected brand
        const match = BATTERY_MODELS.find(m => m.brand === brand);
        const limitIr = match ? match.abnormalIr : 10.0; // Fallback to 10.0 mΩ

        // Evaluation logic: Fail if voltage < 12.0V or IR > threshold
        if ((!isNaN(vVal) && vVal < 12.0) || (!isNaN(irVal) && irVal > limitIr)) {
          updatedCell.status = 'Fail';
        } else {
          updatedCell.status = 'Good';
        }
      }

      return {
        ...prev,
        [num]: updatedCell
      };
    });
  };

  // Re-evaluate statuses when brand changes
  useEffect(() => {
    setCells(prev => {
      let updated = false;
      const nextCells = { ...prev };
      const match = BATTERY_MODELS.find(m => m.brand === brand);
      const limitIr = match ? match.abnormalIr : 10.0;

      [1, 2, 3, 4].forEach(num => {
        if (!nextCells[num]) return;
        const cell = nextCells[num];
        const vVal = cell.voltage === '' ? NaN : parseFloat(cell.voltage);
        const irVal = cell.ir === '' ? NaN : parseFloat(cell.ir);
        
        let newStatus = 'Good';
        if ((!isNaN(vVal) && vVal < 12.0) || (!isNaN(irVal) && irVal > limitIr)) {
          newStatus = 'Fail';
        }
        
        if (cell.status !== newStatus) {
          nextCells[num] = { ...cell, status: newStatus };
          updated = true;
        }
      });

      return updated ? nextCells : prev;
    });
  }, [brand]);

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

    // Validation: check if required fields are filled (not default/empty)
    if (configsMap.voltage.isEnabled && configsMap.voltage.isRequired) {
      if (cell.voltage === '' || cell.voltage === null || cell.voltage === undefined) {
        alert(`กรุณากรอกค่า Volt สำหรับแบตเตอรี่ลูกที่ ${num} ก่อนทำการบันทึก!`);
        return;
      }
    }
    if (configsMap.internal_resistance.isEnabled && configsMap.internal_resistance.isRequired) {
      if (cell.ir === '' || cell.ir === null || cell.ir === undefined) {
        alert(`กรุณากรอกค่า IR สำหรับแบตเตอรี่ลูกที่ ${num} ก่อนทำการบันทึก!`);
        return;
      }
    }

    // Check if image required
    if (configsMap.status.isEnabled && configsMap.status.isRequired) {
      const hasImg = (cell.file && cell.file.length > 0) || cell.existingPath;
      if (!hasImg) {
        alert(`กรุณาอัปโหลดรูปถ่ายสำหรับแบตเตอรี่ลูกที่ ${num} ก่อนทำการบันทึก!`);
        return;
      }
    }

    const status = cell.status || 'Good';
    const formData = new FormData();
    formData.append('bank_name', bankNo);
    formData.append('cell_no', num);
    formData.append('voltage', configsMap.voltage.isEnabled ? cell.voltage : 0.0);
    formData.append('internal_resistance', configsMap.internal_resistance.isEnabled ? cell.ir : 0.0);
    formData.append('status', configsMap.status.isEnabled ? status : 'Good');

    // Add VRLA bank metadata
    formData.append('brand', brand);
    formData.append('capacity', capacity);
    formData.append('installed_date', installedDate);
    formData.append('warrantee_date', warranteeDate);

    if (configsMap.status.isEnabled) {
      if (cell.file && cell.file.length > 0) {
        cell.file.forEach(f => {
          formData.append('battery_img', f);
        });
      } else if (cell.existingPath) {
        const pathVal = Array.isArray(cell.existingPath) ? cell.existingPath : [cell.existingPath];
        pathVal.forEach(p => formData.append('battery_img_path', p));
      }
    }

    try {
      const res = await fetch(`/api/rectifier/${activeRectId}/battery?site_code=${encodeURIComponent(site.code)}&rpm_id=${rpmId}&rect_no=${encodeURIComponent(selectedRect)}&rpm_cycle=${encodeURIComponent(rpmCycle || '')}`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        alert(`บันทึกข้อมูลแบตเตอรี่ลูกที่ ${num} (${status}) และข้อมูล Bank เรียบร้อยแล้ว!`);
        setFileInputKey(Date.now());
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
            <option>ตู้ที่ 5</option>
            <option>ตู้ที่ 6</option>
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

      {/* Battery Bank metadata */}
      <div className="bg-dark-bg/40 p-6 rounded-xl border border-dark-border space-y-4">
        <h4 className="font-bold text-white text-sm">ข้อมูลกลุ่มแบตเตอรี่ (Battery Bank Meta)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-[10px] uppercase text-gray-400 mb-2">ยี่ห้อ Bank</label>
            {!isCustomBrand ? (
              <select 
                className="w-full bg-dark-bg border border-dark-border rounded p-2 text-xs text-gray-200 outline-none disabled:opacity-50" 
                value={brand} 
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'custom') {
                    setIsCustomBrand(true);
                    setBrand('');
                  } else {
                    setBrand(val);
                    const matched = BATTERY_MODELS.find(m => m.brand === val);
                    if (matched) {
                      setCapacity(matched.capacity);
                    }
                  }
                }} 
                disabled={isReadOnly}
              >
                <option value="">-- เลือกยี่ห้อ Bank --</option>
                {BATTERY_MODELS.map((model, idx) => (
                  <option key={idx} value={model.brand}>{model.brand}</option>
                ))}
                <option value="custom">อื่น ๆ (ระบุเอง)</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="w-full bg-dark-bg border border-dark-border rounded p-2 text-xs text-gray-200 outline-none disabled:opacity-50" 
                  value={brand} 
                  onChange={(e) => setBrand(e.target.value)} 
                  placeholder="ระบุยี่ห้อ/รุ่นด้วยตัวเอง"
                  disabled={isReadOnly} 
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomBrand(false);
                    setBrand('');
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 whitespace-nowrap"
                  disabled={isReadOnly}
                >
                  เลือกจากรายการ
                </button>
              </div>
            )}
            {(() => {
              const info = BATTERY_MODELS.find(m => m.brand === brand);
              if (info) {
                return (
                  <div className="mt-2 text-[10px] bg-indigo-500/10 border border-indigo-500/20 p-2 rounded-lg flex justify-between text-indigo-300">
                    <span>🔋 <strong>Spec IR:</strong> {info.specIr} mΩ</span>
                    <span>⚠️ <strong>ผิดปกติ (Fail) เมื่อ:</strong> &gt; {info.abnormalIr} mΩ</span>
                  </div>
                );
              }
              return null;
            })()}
          </div>
          <div>
            <label className="block text-[10px] uppercase text-gray-400 mb-2">Capacity</label>
            <select className="w-full bg-dark-bg border border-dark-border rounded p-2 text-xs text-gray-200 outline-none" value={capacity} onChange={(e) => setCapacity(e.target.value)} disabled={isReadOnly}>
              <option value="12AH">12AH</option>
              <option value="40AH">40AH</option>
              <option value="100AH">100AH</option>
              <option value="150AH">150AH</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase text-gray-400 mb-2">วันที่ติดตั้ง</label>
            <input 
              type="date" 
              style={{ colorScheme: 'dark' }}
              onClick={(e) => {
                try {
                  e.target.showPicker();
                } catch (err) {}
              }}
              className="w-full bg-dark-bg border border-dark-border rounded p-2 text-xs text-gray-200 outline-none cursor-pointer" 
              value={installedDate} 
              onChange={(e) => setInstalledDate(e.target.value)} 
              disabled={isReadOnly} 
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-gray-400 mb-2">วันหมดประกัน สติ๊กเกอร์ขาว</label>
            <input 
              type="date" 
              style={{ colorScheme: 'dark' }}
              onClick={(e) => {
                try {
                  e.target.showPicker();
                } catch (err) {}
              }}
              className="w-full bg-dark-bg border border-dark-border rounded p-2 text-xs text-gray-200 outline-none cursor-pointer" 
              value={warranteeDate} 
              onChange={(e) => setWarranteeDate(e.target.value)} 
              disabled={isReadOnly} 
            />
          </div>
        </div>
      </div>

      <div className="space-y-6 pt-4">
        <div className="flex justify-between items-center border-b border-dark-border pb-2">
          <h4 className="font-bold text-white text-md">บันทึกข้อมูลและภาพถ่ายรายลูก (ลูกที่ 1-4)</h4>
        </div>
        
        {[1, 2, 3, 4].map((num) => {
          const cell = cells[num];
          const status = cell.status || 'Good';

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
                      Volt (Volt) {configsMap.voltage.isRequired && <span className="text-red-400">*</span>}
                    </label>
                    <input 
                      type="number" 
                      min="0"
                      step="0.01" 
                      disabled={isReadOnly}
                      className="w-full bg-dark-bg border border-dark-border rounded p-2 text-xs text-gray-200 outline-none disabled:opacity-50" 
                      value={cell.voltage}
                      onChange={(e) => handleCellChange(num, 'voltage', e.target.value)}
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
                      min="0"
                      step="0.01" 
                      disabled={isReadOnly}
                      className={`w-full bg-dark-bg border rounded p-2 text-xs text-gray-200 outline-none disabled:opacity-50 ${
                        (() => {
                          const match = BATTERY_MODELS.find(m => m.brand === brand);
                          if (match && cell.ir !== '') {
                            return parseFloat(cell.ir) > match.abnormalIr ? 'border-red-500/60 focus:border-red-500' : 'border-emerald-500/40 focus:border-emerald-500';
                          }
                          return 'border-dark-border focus:border-indigo-500';
                        })()
                      }`} 
                      value={cell.ir}
                      onChange={(e) => handleCellChange(num, 'ir', e.target.value)}
                      required={configsMap.internal_resistance.isRequired}
                    />
                    {(() => {
                      const match = BATTERY_MODELS.find(m => m.brand === brand);
                      if (match && cell.ir !== '') {
                        const isAbnormal = parseFloat(cell.ir) > match.abnormalIr;
                        return (
                          <p className={`text-[9px] mt-1 font-semibold ${isAbnormal ? 'text-red-400' : 'text-emerald-400'}`}>
                            {isAbnormal 
                              ? `⚠️ สูงเกินเกณฑ์ (> ${match.abnormalIr} mΩ)` 
                              : `✓ ปกติ (≤ ${match.abnormalIr} mΩ)`
                            }
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>
                ) : (
                  <div className="opacity-40 bg-dark-bg/20 p-2 border border-dark-border/40 rounded text-[10px] text-gray-500 line-through flex items-center justify-center">IR (Disabled)</div>
                )}

                {configsMap.status.isEnabled ? (
                  <>
                    <div>
                      <label className="block text-[10px] uppercase text-gray-500 mb-1">ผลประเมิน (Status)</label>
                      <select
                        disabled={isReadOnly}
                        value={status}
                        onChange={(e) => handleCellChange(num, 'status', e.target.value)}
                        className={`w-full bg-dark-bg border border-dark-border rounded p-2 text-xs font-bold outline-none ${
                          status === 'Good' ? 'text-emerald-400 focus:border-emerald-500' : 'text-red-400 focus:border-red-500'
                        }`}
                      >
                        <option value="Good" className="text-emerald-400 bg-dark-bg">Good</option>
                        <option value="Fail" className="text-red-400 bg-dark-bg">Fail</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-gray-500 mb-1">
                        รูปถ่าย (battery_img) {configsMap.status.isRequired && <span className="text-red-400">*</span>}
                      </label>
                      <input 
                        key={`${num}-${fileInputKey}`}
                        type="file" 
                        multiple
                        disabled={isReadOnly}
                        className="w-full text-[10px] text-gray-400 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:bg-dark-accent file:text-gray-300 disabled:opacity-50"
                        onChange={(e) => handleCellChange(num, 'file', Array.from(e.target.files))}
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
