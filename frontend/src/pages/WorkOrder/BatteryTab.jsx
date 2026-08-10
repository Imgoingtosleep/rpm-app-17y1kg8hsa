import React, { useState, useEffect } from 'react';
import ImagePreviewManager from '../../components/ImagePreviewManager';

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

export default function BatteryTab({ site, rpmId, rpmCycle, onComplete, isReadOnly, rectifierQtyUihProp, userRole, isSubmitted }) {
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
    1: { voltage: '', ir: '', file: [], existingPath: [] },
    2: { voltage: '', ir: '', file: [], existingPath: [] },
    3: { voltage: '', ir: '', file: [], existingPath: [] },
    4: { voltage: '', ir: '', file: [], existingPath: [] }
  });

  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [loadedBankRect, setLoadedBankRect] = useState({ bank: '', rect: null });
  const [rectifierQtyUih, setRectifierQtyUih] = useState(rectifierQtyUihProp !== undefined ? rectifierQtyUihProp : 6);

  useEffect(() => {
    if (rectifierQtyUihProp !== undefined) {
      setRectifierQtyUih(rectifierQtyUihProp);
    }
  }, [rectifierQtyUihProp]);

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

    // Fetch master record for rectifier_qty_uih
    fetch(`/api/workorder/${rpmId}/master`)
      .then(res => res.json())
      .then(data => {
        if (data && data.rectifier_qty_uih !== undefined && data.rectifier_qty_uih !== null) {
          setRectifierQtyUih(parseInt(data.rectifier_qty_uih, 10));
        }
      })
      .catch(err => console.error("Error fetching master record:", err));

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
    const normalizeRectName = (str) => str ? str.replace(/[^0-9]/g, '') : '';
    const selectedNum = normalizeRectName(selectedRect);
    const found = rectifiers.find(r => normalizeRectName(r.rect_no) === selectedNum) || rectifiers.find(r => r.rect_no === selectedRect);
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
    const toArray = (val) => Array.isArray(val) ? val : (val ? [val] : []);

    const nextCells = {
      1: { voltage: '', ir: '', file: [], existingPath: [] },
      2: { voltage: '', ir: '', file: [], existingPath: [] },
      3: { voltage: '', ir: '', file: [], existingPath: [] },
      4: { voltage: '', ir: '', file: [], existingPath: [] }
    };

    // Filter batteries for selected bank
    const bankBatteries = batteries.filter(b => b.bank_name === bankNo);
    bankBatteries.forEach(bat => {
      const cellNo = bat.cell_no;
      if (nextCells[cellNo]) {
        nextCells[cellNo].voltage = (bat.voltage !== null && bat.voltage !== undefined) ? parseFloat(bat.voltage) : '';
        nextCells[cellNo].ir = (bat.internal_resistance !== null && bat.internal_resistance !== undefined) ? parseFloat(bat.internal_resistance) : '';
        nextCells[cellNo].existingPath = toArray(bat.battery_img);
        nextCells[cellNo].status = bat.status || 'Good';
      }
    });

    setCells(nextCells);
    setLoadedBankRect({ bank: bankNo, rect: activeRectId });

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
  }, [bankNo, batteries, activeRectId]);

  const handleCellChange = (num, field, value) => {
    if (field === 'file') {
      const existingCount = cells[num]?.existingPath ? (Array.isArray(cells[num].existingPath) ? cells[num].existingPath.length : 1) : 0;
      const files = Array.from(value);
      if (existingCount + files.length > 10) {
        alert(`คุณไม่สามารถอัปโหลดรูปภาพเกิน 10 รูปได้ในฟิลด์นี้ (มีรูปภาพเดิมอยู่ ${existingCount} รูป และรูปภาพใหม่ ${files.length} รูป)`);
        return;
      }
    }

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
        const warningIr = match ? match.abnormalIr * 0.9 : 9.0; // 90% threshold for warning

        // Evaluation logic: Fail if voltage < 12.0V or IR > threshold, Warning if IR >= 90%
        if ((!isNaN(vVal) && vVal < 12.0) || (!isNaN(irVal) && irVal > limitIr)) {
          updatedCell.status = 'Fail';
        } else if (!isNaN(irVal) && irVal >= warningIr) {
          updatedCell.status = 'Warning';
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
      const warningIr = match ? match.abnormalIr * 0.9 : 9.0;

      [1, 2, 3, 4].forEach(num => {
        if (!nextCells[num]) return;
        const cell = nextCells[num];
        const vVal = cell.voltage === '' ? NaN : parseFloat(cell.voltage);
        const irVal = cell.ir === '' ? NaN : parseFloat(cell.ir);
        
        let newStatus = 'Good';
        if ((!isNaN(vVal) && vVal < 12.0) || (!isNaN(irVal) && irVal > limitIr)) {
          newStatus = 'Fail';
        } else if (!isNaN(irVal) && irVal >= warningIr) {
          newStatus = 'Warning';
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
      isRequired: cfg ? cfg.is_required : true,
      dropdownOptions: cfg && cfg.dropdown_options ? cfg.dropdown_options : []
    };
  };

  const configsMap = {
    voltage: getFieldConfig('voltage'),
    internal_resistance: getFieldConfig('internal_resistance'),
    status: getFieldConfig('status'),
    brand: getFieldConfig('brand'),
    capacity: getFieldConfig('capacity'),
    installed_date: getFieldConfig('installed_date'),
    warrantee_date: getFieldConfig('warrantee_date'),
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
      const hasNew = cell.file && cell.file.length > 0;
      const hasExisting = cell.existingPath && cell.existingPath.length > 0;
      if (!hasNew && !hasExisting) {
        alert(`กรุณาอัปโหลดรูปถ่ายสำหรับแบตเตอรี่ลูกที่ ${num} ก่อนทำการบันทึก!`);
        return;
      }
    }

    // Bank metadata validation
    if (configsMap.brand.isEnabled && configsMap.brand.isRequired && !brand) {
      alert('กรุณากรอก/เลือกยี่ห้อ Bank แบตเตอรี่!');
      return;
    }
    if (configsMap.capacity.isEnabled && configsMap.capacity.isRequired && !capacity) {
      alert('กรุณาเลือก Capacity แบตเตอรี่!');
      return;
    }
    if (configsMap.installed_date.isEnabled && configsMap.installed_date.isRequired && !installedDate) {
      alert('กรุณาเลือกวันที่ติดตั้งแบตเตอรี่!');
      return;
    }
    if (configsMap.warrantee_date.isEnabled && configsMap.warrantee_date.isRequired && !warranteeDate) {
      alert('กรุณาเลือกวันหมดประกันแบตเตอรี่!');
      return;
    }

    const status = cell.status || 'Good';
    const formData = new FormData();
    formData.append('bank_name', bankNo);
    formData.append('cell_no', num);
    formData.append('voltage', configsMap.voltage.isEnabled ? cell.voltage : 0.0);
    formData.append('internal_resistance', configsMap.internal_resistance.isEnabled ? cell.ir : 0.0);
    formData.append('status', configsMap.status.isEnabled ? status : 'Good');

    // Add VRLA bank metadata
    formData.append('brand', configsMap.brand.isEnabled ? brand : '');
    formData.append('capacity', configsMap.capacity.isEnabled ? capacity : '');
    formData.append('installed_date', configsMap.installed_date.isEnabled ? installedDate : '');
    formData.append('warrantee_date', configsMap.warrantee_date.isEnabled ? warranteeDate : '');

    if (configsMap.status.isEnabled) {
      if (cell.file && cell.file.length > 0) {
        cell.file.forEach(f => {
          formData.append('battery_img', f);
        });
      }
      if (cell.existingPath && cell.existingPath.length > 0) {
        cell.existingPath.forEach(p => formData.append('battery_img_path', p));
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

  const handleSaveBankMeta = async () => {
    if (!activeRectId) {
      alert('กรุณากรอกข้อมูลและบันทึกตู้ Rectifier ก่อนทำการบันทึกข้อมูลกลุ่มแบตเตอรี่ครับ!');
      return;
    }

    if (configsMap.brand.isEnabled && configsMap.brand.isRequired && !brand) {
      alert('กรุณากรอก/เลือกยี่ห้อ Bank แบตเตอรี่!');
      return;
    }
    if (configsMap.capacity.isEnabled && configsMap.capacity.isRequired && !capacity) {
      alert('กรุณาเลือก Capacity แบตเตอรี่!');
      return;
    }
    if (configsMap.installed_date.isEnabled && configsMap.installed_date.isRequired && !installedDate) {
      alert('กรุณาเลือกวันที่ติดตั้งแบตเตอรี่!');
      return;
    }
    if (configsMap.warrantee_date.isEnabled && configsMap.warrantee_date.isRequired && !warranteeDate) {
      alert('กรุณาเลือกวันหมดประกันแบตเตอรี่!');
      return;
    }

    try {
      const res = await fetch(`/api/rectifier/${activeRectId}/bank-meta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_name: bankNo,
          brand: configsMap.brand.isEnabled ? brand : '',
          capacity: configsMap.capacity.isEnabled ? capacity : '',
          installed_date: configsMap.installed_date.isEnabled ? installedDate : '',
          warrantee_date: configsMap.warrantee_date.isEnabled ? warranteeDate : ''
        })
      });
      if (res.ok) {
        alert(`บันทึกข้อมูลกลุ่มแบตเตอรี่ ${bankNo} เรียบร้อยแล้ว!`);
        fetchBatteries();
      } else {
        const err = await res.json();
        alert('เกิดข้อผิดพลาดในการบันทึก: ' + (err.error || 'Unknown error'));
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  // Resolve active rectifier object and its battery_type with normalized comparison
  const normalizeRectName = (str) => {
    if (!str) return '';
    return str.replace(/[^0-9]/g, '');
  };

  const selectedNum = normalizeRectName(selectedRect);
  const activeRectObj = rectifiers.find(r => normalizeRectName(r.rect_no) === selectedNum) || rectifiers.find(r => r.rect_no === selectedRect);
  const isLithiumMode = activeRectObj ? activeRectObj.battery_type === 'Lithium' : false;

  const [allWorkorderBatteries, setAllWorkorderBatteries] = useState([]);

  // Fetch all batteries across all rectifiers for top warning/failed summary banner
  const fetchAllWorkorderBatteries = () => {
    if (!rpmId) return;
    fetch(`/api/workorder/${rpmId}/all-batteries`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllWorkorderBatteries(data);
        }
      })
      .catch(err => console.error("Error fetching all workorder batteries:", err));
  };

  useEffect(() => {
    fetchAllWorkorderBatteries();
  }, [rpmId, activeRectId, batteries]);

  // Filter failed or warning batteries across current workorder & current active cells
  const abnormalBatterySummary = (() => {
    const normalize = (str) => String(str || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const summaryMap = new Map();

    // 1. First add saved records from DB across all rectifiers & banks
    allWorkorderBatteries.forEach(b => {
      const rKey = normalize(b.rect_no || selectedRect);
      const bKey = normalize(b.bank_name || bankNo);
      const cKey = parseInt(b.cell_no, 10);
      const key = `${rKey}_${bKey}_${cKey}`;

      summaryMap.set(key, {
        rectNo: b.rect_no || selectedRect,
        bankName: b.bank_name || bankNo,
        cellNo: cKey,
        status: b.status,
        ir: b.internal_resistance,
        voltage: b.voltage
      });
    });

    // 2. Override with current live unsaved form state (cells)
    const curRectKey = normalize(selectedRect);
    const curBankKey = normalize(bankNo);

    [1, 2, 3, 4].forEach(num => {
      const c = cells[num];
      if (!c) return;

      const key = `${curRectKey}_${curBankKey}_${num}`;
      const hasValue = (c.ir !== '' && c.ir !== null && c.ir !== undefined) || (c.voltage !== '' && c.voltage !== null && c.voltage !== undefined);

      if (hasValue) {
        summaryMap.set(key, {
          rectNo: selectedRect,
          bankName: bankNo,
          cellNo: num,
          status: c.status || 'Good',
          ir: c.ir,
          voltage: c.voltage
        });
      }
    });

    const failList = [];
    const warningList = [];
    summaryMap.forEach(item => {
      if (item.status === 'Fail') failList.push(item);
      else if (item.status === 'Warning') warningList.push(item);
    });

    return { failList, warningList };
  })();

  return (
    <div className="p-8 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">4. ผลทดสอบแบตเตอรี่ (Battery Tests)</h3>
        <p className="text-gray-400 text-sm mt-1">บันทึกข้อมูลแรงดันไฟฟ้า ความต้านทานภายใน และรูปภาพแยกรายลูก</p>
      </div>

      {/* Top Banner Alert for Failed Batteries */}
      {abnormalBatterySummary.failList.length > 0 && (
        <div className="bg-red-950/30 border border-red-500/50 rounded-xl p-4 space-y-2 shadow-lg">
          <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
            <span className="text-lg">❌</span>
            <span>รายการแบตเตอรี่เสีย / เสื่อมสภาพ (Battery Fail List) - {abnormalBatterySummary.failList.length} ลูก</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            {abnormalBatterySummary.failList.map((item, idx) => (
              <div 
                key={idx} 
                className="p-2.5 rounded-lg border text-xs flex items-center justify-between font-medium bg-red-950/40 border-red-500/50 text-red-300"
              >
                <div>
                  <span className="font-bold border-b border-current pb-0.5">{item.rectNo}</span> | <span className="font-semibold">{item.bankName}</span> | <span className="font-extrabold text-white">ลูกที่ {item.cellNo}</span>
                  <div className="text-[10px] opacity-80 mt-0.5">
                    Volt: {item.voltage || '-'} V | IR: {item.ir || '-'} mΩ
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white">
                  Fail (เสีย)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Banner Alert for Warning Batteries */}
      {abnormalBatterySummary.warningList.length > 0 && (
        <div className="bg-amber-950/30 border border-amber-500/50 rounded-xl p-4 space-y-2 shadow-lg">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <span className="text-lg">⚠️</span>
            <span>รายการแบตเตอรี่เฝ้าระวัง 90% (Battery Warning List) - {abnormalBatterySummary.warningList.length} ลูก</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            {abnormalBatterySummary.warningList.map((item, idx) => (
              <div 
                key={idx} 
                className="p-2.5 rounded-lg border text-xs flex items-center justify-between font-medium bg-amber-950/40 border-amber-500/50 text-amber-300"
              >
                <div>
                  <span className="font-bold border-b border-current pb-0.5">{item.rectNo}</span> | <span className="font-semibold">{item.bankName}</span> | <span className="font-extrabold text-white">ลูกที่ {item.cellNo}</span>
                  <div className="text-[10px] opacity-80 mt-0.5">
                    Volt: {item.voltage || '-'} V | IR: {item.ir || '-'} mΩ
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-black">
                  Warning (เตือน)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-dark-bg/50 p-4 rounded-lg border border-dark-border">
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">ระบุตู้ Rectifier</label>
          <select 
            disabled={isReadOnly || rectifierQtyUih === 0}
            className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm text-gray-200 focus:border-indigo-500 outline-none disabled:opacity-50 font-medium"
            value={selectedRect}
            onChange={(e) => setSelectedRect(e.target.value)}
          >
            {rectifierQtyUih === 0 ? (
              <option value="">ไม่มีตู้ Rectifier (0 ตู้)</option>
            ) : (
              Array.from({ length: rectifierQtyUih }, (_, i) => `ตู้ที่ ${i + 1}`).map((name, idx) => {
                const normName = name.replace(/[^0-9]/g, '');
                const matchedRect = rectifiers.find(r => (r.rect_no || '').replace(/[^0-9]/g, '') === normName) || rectifiers.find(r => r.rect_no === name);
                const bType = matchedRect ? (matchedRect.battery_type || 'VRLA AGM') : 'VRLA AGM';
                return (
                  <option key={idx} value={name}>
                    {name} ({bType})
                  </option>
                );
              })
            )}
          </select>
        </div>
        {!isLithiumMode && (
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">เลือก Bank</label>
            <select 
              disabled={isReadOnly}
              className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm text-gray-200 focus:border-indigo-500 outline-none disabled:opacity-50"
              value={bankNo}
              onChange={(e) => setBankNo(e.target.value)}
            >
              {(() => {
                let availableQty = 12;
                if (activeRectObj) {
                  if (activeRectObj.battery_type === 'VRLA AGM + Lithium' && activeRectObj.vrla_qty_bank) {
                    availableQty = parseInt(activeRectObj.vrla_qty_bank, 10);
                  } else if (activeRectObj.battery_qty_bank) {
                    availableQty = parseInt(activeRectObj.battery_qty_bank, 10);
                  }
                }
                const count = (!isNaN(availableQty) && availableQty > 0) ? Math.min(Math.max(availableQty, 1), 12) : 12;
                return Array.from({ length: count }, (_, i) => `Bank ${i + 1}`).map((bName) => (
                  <option key={bName} value={bName}>{bName}</option>
                ));
              })()}
            </select>
          </div>
        )}
      </div>

      {isLithiumMode ? (
        <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-6 text-center space-y-3">
          <div className="text-indigo-300 font-bold text-base">
            ตู้ Rectifier นี้ถูกตั้งค่าเป็นประเภทแบตเตอรี่ Lithium
          </div>
          <p className="text-gray-400 text-xs max-w-xl mx-auto">
            สำหรับแบตเตอรี่ประเภท Lithium ข้อมูลสถานะ สเปก การทำงาน และ % SOH / % SOC จะถูกบันทึกรวบยอดอยู่ที่ส่วน "ข้อมูลแบตเตอรี่ควบคุม (Battery Settings)" ในหน้าตู้ Rectifier เรียบร้อยแล้ว จึงไม่มีการแยกกรอก Bank หรือ Cell รายลูกในหน้านี้
          </p>
          <button
            type="button"
            onClick={() => {
              const rectTabBtn = document.querySelector('button[data-tab="rectifier"]');
              if (rectTabBtn) rectTabBtn.click();
            }}
            className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-all shadow-md inline-block"
          >
            ไปที่หน้าตู้ Rectifier เพื่อตรวจสอบข้อมูล Lithium &rarr;
          </button>
        </div>
      ) : (
        <>
          {/* Battery Bank metadata */}
      <div className="bg-dark-bg/40 p-6 rounded-xl border border-dark-border space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-white text-sm">ข้อมูลกลุ่มแบตเตอรี่ (Battery Bank Meta)</h4>
          {!isReadOnly && (
            <button
              type="button"
              onClick={handleSaveBankMeta}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold transition-all shadow"
            >
              บันทึกข้อมูลกลุ่มแบตเตอรี่ ({bankNo})
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {configsMap.brand.isEnabled ? (
            <div>
              <label className="block text-[10px] uppercase text-gray-400 mb-2">ยี่ห้อ Bank {configsMap.brand.isRequired && <span className="text-red-400">*</span>}</label>
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
                  {(() => {
                    const extraOpts = configsMap.brand.dropdownOptions || [];
                    const excluded = extraOpts.filter(o => o.startsWith('__EXCLUDE__:')).map(o => o.replace('__EXCLUDE__:', ''));
                    const added = extraOpts.filter(o => !o.startsWith('__EXCLUDE__:'));

                    const defaultFiltered = BATTERY_MODELS.filter(m => !excluded.includes(m.brand));

                    return (
                      <>
                        {defaultFiltered.map((model, idx) => (
                          <option key={idx} value={model.brand}>{model.brand}</option>
                        ))}
                        {added.map((customOpt, idx) => (
                          <option key={`custom-${idx}`} value={customOpt}>{customOpt}</option>
                        ))}
                      </>
                    );
                  })()}
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
                      <span><strong>Spec IR:</strong> {info.specIr} mΩ</span>
                      <span><strong>ผิดปกติ (Fail) เมื่อ:</strong> &gt; {info.abnormalIr} mΩ</span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          ) : (
            <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded text-[10px] text-gray-500 line-through flex items-center justify-center">ยี่ห้อ Bank (Disabled)</div>
          )}
          {configsMap.capacity.isEnabled ? (
            <div>
              <label className="block text-[10px] uppercase text-gray-400 mb-2">Capacity {configsMap.capacity.isRequired && <span className="text-red-400">*</span>}</label>
              <select className="w-full bg-dark-bg border border-dark-border rounded p-2 text-xs text-gray-200 outline-none" value={capacity} onChange={(e) => setCapacity(e.target.value)} disabled={isReadOnly}>
                <option value="12AH">12AH</option>
                <option value="40AH">40AH</option>
                <option value="100AH">100AH</option>
                <option value="150AH">150AH</option>
              </select>
            </div>
          ) : (
            <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded text-[10px] text-gray-500 line-through flex items-center justify-center">Capacity (Disabled)</div>
          )}
          {configsMap.installed_date.isEnabled ? (
            <div>
              <label className="block text-[10px] uppercase text-gray-400 mb-2">วันที่ติดตั้ง {configsMap.installed_date.isRequired && <span className="text-red-400">*</span>}</label>
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
          ) : (
            <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded text-[10px] text-gray-500 line-through flex items-center justify-center">วันที่ติดตั้ง (Disabled)</div>
          )}
          {configsMap.warrantee_date.isEnabled ? (
            <div>
              <label className="block text-[10px] uppercase text-gray-400 mb-2">วันหมดประกัน สติ๊กเกอร์ขาว {configsMap.warrantee_date.isRequired && <span className="text-red-400">*</span>}</label>
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
          ) : (
            <div className="opacity-40 bg-dark-bg/20 p-3 border border-dark-border/40 rounded text-[10px] text-gray-500 line-through flex items-center justify-center">วันหมดประกัน (Disabled)</div>
          )}
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
                            const irVal = parseFloat(cell.ir);
                            if (irVal > match.abnormalIr) return 'border-red-500/60 focus:border-red-500';
                            if (irVal >= match.abnormalIr * 0.9) return 'border-amber-500/60 focus:border-amber-500';
                            return 'border-emerald-500/40 focus:border-emerald-500';
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
                        const irVal = parseFloat(cell.ir);
                        const isAbnormal = irVal > match.abnormalIr;
                        const isWarning = !isAbnormal && irVal >= match.abnormalIr * 0.9;
                        
                        if (isAbnormal) {
                          return <p className="text-[9px] mt-1 font-semibold text-red-400">สูงเกินเกณฑ์ (&gt; {match.abnormalIr} mΩ)</p>;
                        }
                        if (isWarning) {
                          return <p className="text-[9px] mt-1 font-semibold text-amber-400">เฝ้าระวัง 90% (≥ {(match.abnormalIr * 0.9).toFixed(2)} mΩ)</p>;
                        }
                        return <p className="text-[9px] mt-1 font-semibold text-emerald-400">ปกติ (&lt; {(match.abnormalIr * 0.9).toFixed(2)} mΩ)</p>;
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
                          status === 'Good' 
                            ? 'text-emerald-400 focus:border-emerald-500' 
                            : status === 'Warning' 
                            ? 'text-amber-400 focus:border-amber-500' 
                            : 'text-red-400 focus:border-red-500'
                        }`}
                      >
                        <option value="Good" className="text-emerald-400 bg-dark-bg">Good (ปกติ)</option>
                        <option value="Warning" className="text-amber-400 bg-dark-bg">Warning (เตือน 90%)</option>
                        <option value="Fail" className="text-red-400 bg-dark-bg">Fail (เสื่อม/เสีย)</option>
                      </select>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] uppercase text-gray-500 mb-1">
                        รูปถ่าย (battery_img) {configsMap.status.isRequired && <span className="text-red-400">*</span>}
                      </label>
                      <ImagePreviewManager
                        files={cell.file || []}
                        existingPaths={cell.existingPath || []}
                        onFilesChange={(newFiles) => handleCellChange(num, 'file', newFiles)}
                        onExistingRemove={(path) => {
                          setCells(prev => ({
                            ...prev,
                            [num]: {
                              ...prev[num],
                              existingPath: (prev[num].existingPath || []).filter(p => p !== path)
                            }
                          }));
                        }}
                        isReadOnly={isReadOnly}
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
    </>
  )}
</div>
);
}
