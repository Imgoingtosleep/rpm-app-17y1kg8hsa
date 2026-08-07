import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';

export default function FieldSettings() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('master');

  // Modal State for unified Option Management
  const [activeModalConfig, setActiveModalConfig] = useState(null);
  const [newOptionInput, setNewOptionInput] = useState('');

  useEffect(() => {
    // Check if user is Admin
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.role === 'Admin') {
        setIsAdmin(true);
      }
    } catch (e) {
      setIsAdmin(false);
    }
  }, []);

  const fetchConfigs = () => {
    setLoading(true);
    fetch('/api/field-configs')
      .then(res => {
        if (!res.ok) throw new Error('ไม่สามารถโหลดข้อมูลการตั้งค่าฟิลด์ได้');
        return res.json();
      })
      .then(data => {
        setConfigs(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isAdmin) {
      fetchConfigs();
    }
  }, [isAdmin]);

  const handleToggle = async (tabName, fieldName, type, currentValue) => {
    const updatedValue = !currentValue;
    const item = configs.find(c => c.tab_name === tabName && c.field_name === fieldName);
    if (!item) return;

    const payload = {
      tab_name: tabName,
      field_name: fieldName,
      is_required: type === 'required' ? updatedValue : item.is_required,
      is_enabled: type === 'enabled' ? updatedValue : item.is_enabled
    };

    try {
      const res = await fetch('/api/field-configs/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Update local state
        setConfigs(prev =>
          prev.map(c =>
            c.tab_name === tabName && c.field_name === fieldName
              ? { ...c, [type === 'required' ? 'is_required' : 'is_enabled']: updatedValue }
              : c
          )
        );
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
      }
    } catch (err) {
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่ออัปเดตได้');
    }
  };

  const handleSaveOptions = async (tabName, fieldName, updatedOptions) => {
    const item = configs.find(c => c.tab_name === tabName && c.field_name === fieldName);
    if (!item) return;

    const payload = {
      tab_name: tabName,
      field_name: fieldName,
      is_required: item.is_required,
      is_enabled: item.is_enabled,
      dropdown_options: updatedOptions
    };

    try {
      const res = await fetch('/api/field-configs/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setConfigs(prev =>
          prev.map(c =>
            c.tab_name === tabName && c.field_name === fieldName
              ? { ...c, dropdown_options: updatedOptions }
              : c
          )
        );
        // Also update modal target if open
        if (activeModalConfig && activeModalConfig.field_name === fieldName && activeModalConfig.tab_name === tabName) {
          setActiveModalConfig(prev => ({ ...prev, dropdown_options: updatedOptions }));
        }
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึกตัวเลือก Dropdown');
      }
    } catch (err) {
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่ออัปเดตตัวเลือกได้');
    }
  };

  const labelMap = {
    // Master Site Tab
    job_number_sl6: 'SL6 Job Number',
    sap_number: 'SAP Reference Number',
    summary_issue: 'สรุปปัญหาหน้างาน (Summary Issue)',

    // AC Main Tab
    meter_ac_size: 'AC Meter Size',
    cable_status: 'Main Cable Status & Photo',
    change_over_switch: 'Change Over Switch Type',
    ac_phase_qty: 'AC Phase Qty',
    surge_protection: 'Surge Protection Status',
    mdb_temp: 'MDB Cabinet Temperature (°C)',
    site_temp: 'Site Temperature (°C)',
    voltage_p1: 'Voltage Phase 1 (Volt)',
    voltage_p2: 'Voltage Phase 2 (Volt)',
    voltage_p3: 'Voltage Phase 3 (Volt)',
    current_p1: 'Current Phase 1 (Amp)',
    current_p2: 'Current Phase 2 (Amp)',
    current_p3: 'Current Phase 3 (Amp)',
    ground_resistance: 'Ground Resistance (Ω)',

    // Rectifier Tab
    model: 'ยี่ห้อ/Model Rectifier',
    ac_cable_size: 'AC Cable Size',
    breaker_size: 'Breaker Size (Amp)',
    modules_all: 'All Rectifier Modules Qty',
    modules_fail: 'Failed Rectifier Modules Qty',
    input_current_ac: 'Total Input Current AC (Amp)',
    output_current_dc: 'Total Output Current DC (Amp)',
    surge_status: 'Surge Protection Status',
    breaker_phase1: 'Breaker AC Phase 1',
    breaker_phase2: 'Breaker AC Phase 2',
    breaker_phase3: 'Breaker AC Phase 3',
    battery_type: 'Battery Type',
    lithium_capacity: 'Lithium Capacity',
    battery_run: 'Battery Backup Run Time',
    battery_soh: 'Battery SOH (%)',
    battery_soc: 'Battery SOC (%)',
    battery_capacity_percent: 'Battery Capacity (%)',
    battery_alarm: 'Battery Alarm Status',
    battery_qty_bank: 'Battery Qty Bank',

    // Battery Tab
    voltage: 'Battery Voltage (Volt)',
    internal_resistance: 'Internal Resistance (mΩ)',
    status: 'Cell Status (Good/Fail)',
    brand: 'ยี่ห้อ/รุ่น แบตเตอรี่ (Battery Bank Brand)',
    capacity: 'ความจุแบตเตอรี่ (Battery Capacity)',
    installed_date: 'วันที่ติดตั้ง (Installed Date)',
    warrantee_date: 'วันที่หมดประกัน (Warrantee Date)',

    // Facilities Tab
    alarm_door: 'Door Alarm',
    alarm_ac_fail: 'AC Fail Alarm',
    alarm_low_bat: 'Low Battery Alarm',
    alarm_high_temp: 'High Temperature Alarm',
    alarm_smoke: 'Smoke Alarm',
    alarm_air_fail: 'Air Fail Alarm',
    vent_ac_fan: 'พัดลมระบายอากาศ AC Fan',
    vent_ac_fan_hood: 'ฝาครอบ Hood AC Fan',
    vent_dc_fan: 'พัดลมระบายอากาศ DC Fan',
    vent_dc_fan_hood: 'ฝาครอบ Hood DC Fan',
    vent_air_cond: 'เครื่องปรับอากาศ (Air Conditioner)',
    vent_filters: 'แผ่นกรองฝุ่น Filter',
    vent_filter_door: 'ความสะอาด Filter ประตู',
    vent_filter_window: 'ความสะอาด Filter Window',
    vent_equip_fan: 'ทำความสะอาด Equipment Fan',
    vent_filter_equip: 'ความสะอาด Filter Equipment',
    air_owner: 'เจ้าของแอร์',
    control_air_type: 'Control Air (Intronic or Timer)',
    control_air_status: 'Control Air Status',
    fac_site_sign: 'ป้ายชื่อสถานี (Site Sign)',
    fac_outdoor_clean: 'ความสะอาดภายนอกห้องเครื่อง',
    fac_indoor_clean: 'ความสะอาดภายในห้องเครื่อง',
    fac_lighting: 'ระบบไฟส่องสว่างสถานี (Lighting)',
    fac_grass_cut: 'การตัดหญ้า/ถางวัชพืช'
  };

  const defaultOptsMap = {
    // Rectifier Tab
    model: ['AC Plug', 'Emerson 1U', 'Emerson 5U', 'Emerson-1U CAU-NCU-M830B', 'Emerson-1U NCU-1A-M830D', 'Emerson-ACU-1M800D', 'Enatel 3U SM32', 'Enatel 3U SM36', 'Enatel 5U SM32', 'Enatel 5U SM36', 'Enatel1U SM32', 'Enetek 1U SMU01', 'Enetek 2U SMU01', 'Enetek 3U SMU01', 'Enetek 6U SMU01', 'HUAWEI 4875 / EPS75-4815AF', 'HUAWEI H831PAIB', 'Huawei-ETP4890-SMU01B', 'Huawei-MTS9512A-SMU02B', 'PowerWare', 'UPS 1500 Abex Dynamic MP RT 1.5(SH)', 'UPS SMK1500', 'UPS TR1500', 'Vertiv-1U NCU-M830BG3', 'Vertiv-4U NCU-M830BG3', 'Vertiv-5U NCU-M830BG3', 'อื่นๆ'],
    // Battery Tab
    brand: ["Narada รุ่น AG12V100F(100AH)", "Genesys รุ่น 12TD100F4(100AH)", "ABT รุ่น EFTB12-100(100AH)", "Sacred SUN รุ่น FTB12-100 II(100AH)", "Transpower รุ่น FTB12-100 B(100AH)", "Invent รุ่น IFT12-100 V0(100AH)", "Outdo OT105-12FT(100AH)", "HIPOW รุ่น HP 12-40(40AH)", "CSB รุ่น DB 12-40(40AH)", "Trasnpower รุ่น TDB 12-40(40AH)", "Invent รุ่น IHB12-40 V0(40AH)", "Outdo OT40-12(40AH)", "TPP TPP40-12 (AGM)(40AH)", "HIPOW รุ่น HP 12-12(12AH)", "Transpowerรุ่น TGB 12-12(12AH)", "Invent รุ่น IHB12-12 V0(12AH)", "Outdo OT12-12(12AH)"],
    ac_cable_size: ['1 Sqmm', '1.5 Sqmm', '2.5 Sqmm', '4 Sqmm', '6 Sqmm', '10 Sqmm', '16 Sqmm'],
    breaker_size: ['10', '15', '16', '20', '25', '30', '32', '35', '40', '50', '63', '100'],
    surge_status: ['มี', 'ไม่มี', 'ชำรุด'],
    status: ['Good', 'Fail'],

    // AC Main Tab
    meter_ac_size: ['1 phase 5/15', '1 phase 15/45', '1 phase 5/100', '3 phase 5/15', '3 phase 15/45', 'DTAC site', 'LL'],
    cable_status: ['ปกติ สภาพปลอดภัย', 'Dtact site', 'หย่อน ชำรุด', 'รก ไม่สะอาด ต้องปรับปรุง'],
    change_over_switch: ['มี/พร้อมใช้งาน', 'มี/ไม่พร้อมใช้งาน', 'มี/ชำรุดบางจุดต้องแก้ไข', 'ไม่มี'],
    surge_protection: ['มี ปกติ', 'มี ไม่ปกติ', 'ไม่มี'],
    mdb_temp: ['<25', '25-30', '30-35', '35-40', '>40'],
    site_temp: ['<25', '25-30', '30-35', '35-40', '>40'],
    ground_resistance: ['<5', '5-10', '>10-20', '>20-30', '>30-40', '>40-50', '>50-60', '>60', 'วัดค่าไม่ได้'],
    ac_phase_qty: ['1 Phase', '3 Phase'],

    // Facilities Tab
    alarm_door: ['มี Sensor ทดสอบ Alarm ได้', 'มี Sensor ทดสอบ Alarm ไม่ได้อุปกรณ์ไม่รองรับ', 'มี Sensor ไม่ได้ Wiring เอาใว้', 'ไม่มี sensor'],
    alarm_ac_fail: ['ทดสอบการส่ง Alarm ได้', 'ทดสอบไม่ได้ Battery Fail', 'ทดสอบไม่ได้ Monitor ระบบไม่ได้', 'ไม่ได้ติดตั้งไว้/ไม่ได้ Wiring ไว้', 'ทดสอบผ่านระบบ RMS ได้', 'ใช้ไฟ DTAC'],
    alarm_low_bat: ['ทดสอบการส่ง Alarm ได้', 'ทดสอบไม่ได้ Battery Fail', 'ทดสอบไม่ได้ Monitor ระบบไม่ได้', 'ไม่ได้ติดตั้งไว้/ไม่ได้ Wiring ไว้', 'ทดสอบผ่านระบบ RMS ได้', 'ใช้ไฟ DTAC'],
    alarm_smoke: ['มี Sensor ทดสอบ Alarm ได้', 'มี Sensor ทดสอบ Alarm ไม่ได้อุปกรณ์ไม่รองรับ', 'มี Sensor ไม่ได้ Wiring เอาไว้', 'ไม่มี sensor', 'ไม่สามารถทดสอบได้'],
    alarm_high_temp: ['มี Sensor ทดสอบ Alarm ได้', 'มี Sensor ทดสอบ Alarm ไม่ได้อุปกรณ์ไม่รองรับ', 'มี Sensor ไม่ได้ Wiring เอาไว้', 'ไม่มี sensor', 'ไม่สามารถทดสอบได้'],
    alarm_air_fail: ['ทดสอบ Alarm ได้', 'ทดสอบ Alarm ไม่ได้(ไม่มีการติดตั้งไว้)', 'DTAC Site', 'LL Site', 'ทดสอบ Alarm ไม่ได้(Magnetic Fail)', 'ทดสอบ Alarm ไม่ได้(Intronic Fail)'],
    vent_ac_fan: ['มี ปกติ', 'มี ทำงานไม่ปกติ เสีย', 'ไม่มี'],
    vent_ac_fan_hood: ['มี สภาพดี', 'มี ชำรุด ตะแกรงผุขาด', 'ไม่มี'],
    vent_dc_fan: ['มี ปกติ', 'มี ทำงานไม่ปกติ เสีย', 'ไม่มี'],
    vent_dc_fan_hood: ['มี สภาพดี', 'มี ชำรุด ตะแกรงผุขาด', 'ไม่มี'],
    vent_air_cond: ['ไม่มี', 'มี ทำงานปกติ', 'มี ทำงานไม่ปกติ/เสีย'],
    vent_filter_door: ['เปลี่ยนใหม่ 2 แผ่น', 'DTAC site', 'ทำความสะอาดเรียบร้อย', 'เปลี่ยนใหม่ 1 แผ่น', 'ไม่มีฟิลเตอร์'],
    vent_filter_window: ['เปลี่ยนใหม่ 2 แผ่น', 'DTAC site', 'ทำความสะอาดเรียบร้อย', 'เปลี่ยนใหม่ 1 แผ่น', 'ไม่มีฟิลเตอร์'],
    vent_equip_fan: ['ทำความสะอาดเรียบร้อย', 'ไม่สามารถทำความสะอาดได้', 'อุปกรณ์ไม่มีพัดลม'],
    vent_filter_equip: ['ทำความสะอาดเรียบร้อย', 'ไม่สามารถทำความสะอาดได้', 'อุปกรณ์ไม่มีพัดลม'],
    air_owner: ['ไม่มีแอร์', 'UIH', 'DTAC', 'LL'],
    control_air_type: ['ไม่มี', 'มี ปกติ', 'มี ทำงานไม่ปกติ เสีย'],
    control_air_status: ['ไม่มี', 'มี ปกติ', 'มี ไม่ปกติ', 'DTAC Site', 'LL'],
    fac_site_sign: ['แข็งแรง มีป้าย', 'แข็งแรง ไม่มีป้าย', 'ไม่แข็งแรง มีป้าย', 'ไม่แข็งแรง ไม่มีป้าย'],
    fac_outdoor_clean: ['สะอาดเรียบร้อย ไม่มีขยะ หรือ ชำรุดเสียหาย', 'สกปรก รก ต้องปรับปรุง'],
    fac_indoor_clean: ['ห้องสะอาดเรียบร้อย', 'สกปรก รก ต้องปรับปรุง'],
    fac_lighting: ['Good หลอดไฟติดสว่างทุกดวง', 'หลอดขาด ไม่ติดบางหลอด', 'UIH Outdoor ไม่มีติดตั้ง', 'UIH Outdoor มีติดตั้ง', 'DTAC site', 'หลอดไฟของ LL'],
    fac_grass_cut: ['อาคารเช่า ตัดวัชพืชรอบอาคารแล้ว', 'ห้องเช่า ไม่มีวัชพืช', 'container/cabinet/pole ไม่มีวัชพืช', 'container/cabinet/pole ตัดวัชพืชรอบๆแล้ว']
  };

  const tabsList = [
    { id: 'master', label: 'Master Site Tab' },
    { id: 'acmain', label: 'AC Main Tab' },
    { id: 'rectifier', label: 'Rectifier Tab' },
    { id: 'battery', label: 'Battery Tab' },
    { id: 'facilities', label: 'Facilities Tab' },
    { id: 'summary', label: 'Summary Tab' }
  ];

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-red-950/20 border border-red-900/40 rounded-xl max-w-xl mx-auto my-12">
        <h2 className="text-xl font-bold text-red-400">⛔ ปฏิเสธการเข้าถึง (Access Denied)</h2>
        <p className="text-gray-400 mt-2">หน้านี้อนุญาตให้เฉพาะผู้ใช้งานระดับสิทธิ์ Admin เข้าแก้ไขหรือตั้งค่าฟิลด์งานเท่านั้น</p>
      </div>
    );
  }

  const filteredConfigs = configs.filter(c => c.tab_name === activeTab);

  const handleAddOptionFromModal = () => {
    if (!newOptionInput || !newOptionInput.trim() || !activeModalConfig) return;
    const val = newOptionInput.trim();
    const currentOpts = activeModalConfig.dropdown_options || [];
    
    if (currentOpts.includes(val)) {
      alert(`ตัวเลือก "${val}" มีอยู่แล้วในระบบ`);
      return;
    }

    const updated = [...currentOpts, val];
    handleSaveOptions(activeModalConfig.tab_name, activeModalConfig.field_name, updated);
    setNewOptionInput('');
  };

  const handleDeleteOptionFromModal = (optToDelete) => {
    if (!activeModalConfig) return;
    if (window.confirm(`คุณต้องการลบตัวเลือก "${optToDelete}" ใช่หรือไม่?`)) {
      const currentOpts = activeModalConfig.dropdown_options || [];
      const updated = currentOpts.filter(o => o !== optToDelete);
      handleSaveOptions(activeModalConfig.tab_name, activeModalConfig.field_name, updated);
    }
  };

  return (
    <MainLayout currentStep="admin-settings" currentSite={null} onNavigateBack={() => window.history.back()}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">ตั้งค่าฟิลด์ข้อมูลและจัดการ Dropdown Options</h2>
          <p className="text-gray-400 text-sm mt-1">ผู้ดูแลระบบสามารถเลือกเปิด/ปิด ฟิลด์กรอกข้อมูล บังคับป้อนข้อมูล หรือจัดการตัวเลือก Dropdown ของแต่ละฟิลด์ได้</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-dark-border">
          <nav className="flex flex-wrap gap-2 -mb-px">
            {tabsList.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-5 py-3 border-b-2 text-sm font-semibold transition-all ${
                  activeTab === t.id
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-600/5'
                    : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">กำลังโหลดการตั้งค่าฟิลด์...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-400">⚠️ {error}</div>
        ) : (
          <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-dark-border flex justify-between items-center bg-dark-bg/40">
              <span className="font-bold text-gray-200">หมวดหมู่: {tabsList.find(t => t.id === activeTab)?.label}</span>
              <span className="text-xs text-gray-500 font-mono">{filteredConfigs.length} ฟิลด์ในระบบ</span>
            </div>

            <div className="divide-y divide-dark-border/40">
              {filteredConfigs.length === 0 ? (
                <div className="p-8 text-center text-gray-500">ไม่มีฟิลด์ที่ต้องการกำหนดค่าในหมวดหมู่นี้</div>
              ) : (
                filteredConfigs.map((config) => {
                  const customCount = (config.dropdown_options || []).length;
                  const defaultCount = (defaultOptsMap[config.field_name] || []).length;
                  const totalCount = customCount + defaultCount;

                  return (
                    <div key={config.field_id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="font-bold text-sm text-gray-200">{labelMap[config.field_name] || config.field_name}</span>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">{config.field_name} ({config.tab_name})</p>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Unified Manage Options Button (Shown strictly ONLY for fields with Dropdown options) */}
                        {Boolean(defaultOptsMap[config.field_name]) && (
                          <button
                            onClick={() => {
                              setActiveModalConfig(config);
                              setNewOptionInput('');
                            }}
                            className="px-3.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5"
                          >
                            <span>จัดการตัวเลือก Dropdown</span>
                            {totalCount > 0 && (
                              <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-200 rounded-full text-[10px] font-bold">
                                {totalCount} ตัวเลือก
                              </span>
                            )}
                          </button>
                        )}

                        {/* Toggle: Require Input / Image Upload */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">การบังคับ:</span>
                          <button
                            onClick={() => handleToggle(config.tab_name, config.field_name, 'required', config.is_required)}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                              config.is_required
                                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                                : 'bg-dark-accent text-gray-500 border border-dark-border'
                            }`}
                          >
                            {config.is_required ? 'บังคับ (Required)' : 'ไม่บังคับ (Optional)'}
                          </button>
                        </div>

                        {/* Toggle: Enable / Disable Field */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">สถานะ:</span>
                          <button
                            onClick={() => handleToggle(config.tab_name, config.field_name, 'enabled', config.is_enabled)}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                              config.is_enabled
                                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-red-600/20 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {config.is_enabled ? 'เปิดใช้งาน (Active)' : 'ปิดใช้งาน (Disabled)'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* UNIFIED OPTIONS MANAGEMENT MODAL WITHOUT EMOJIS */}
      {activeModalConfig && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex justify-between items-start border-b border-dark-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>จัดการตัวเลือก Dropdown</span>
                </h3>
                <p className="text-xs text-indigo-400 font-semibold mt-0.5">
                  {labelMap[activeModalConfig.field_name] || activeModalConfig.field_name} <span className="text-gray-500 font-mono">({activeModalConfig.field_name})</span>
                </p>
              </div>
              <button 
                onClick={() => setActiveModalConfig(null)}
                className="text-gray-400 hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-dark-accent"
              >
                ✕
              </button>
            </div>

            {/* Add New Option Input Form */}
            <div className="bg-dark-bg/60 p-4 rounded-xl border border-dark-border/60 space-y-3">
              <label className="block text-xs font-semibold uppercase text-gray-300">เพิ่มตัวเลือกใหม่ลงรายการ Dropdown</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="พิมพ์ชื่อตัวเลือกใหม่ที่นี่..." 
                  className="flex-1 bg-dark-bg border border-dark-border rounded-lg p-2.5 text-xs text-gray-200 outline-none focus:border-indigo-500"
                  value={newOptionInput}
                  onChange={(e) => setNewOptionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOptionFromModal();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddOptionFromModal}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-all shadow-md"
                >
                  บันทึกตัวเลือก
                </button>
              </div>
            </div>

            {/* Unified Options List View */}
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              <div>
                {(() => {
                  const defaultOpts = defaultOptsMap[activeModalConfig.field_name] || [];
                  const dbOpts = activeModalConfig.dropdown_options || [];
                  
                  const excluded = dbOpts.filter(o => o.startsWith('__EXCLUDE__:')).map(o => o.replace('__EXCLUDE__:', ''));
                  const added = dbOpts.filter(o => !o.startsWith('__EXCLUDE__:'));

                  // Combine both default and added, removing duplicates & excluded items
                  const allActiveOpts = Array.from(new Set([...defaultOpts, ...added])).filter(o => !excluded.includes(o));

                  return (
                    <>
                      <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>รายการตัวเลือกทั้งหมดในระบบ ({allActiveOpts.length} รายการ)</span>
                        <span className="text-[10px] text-gray-500 font-normal">(สามารถกดปุ่มลบได้ทุกตัวเลือก)</span>
                      </h4>

                      {allActiveOpts.length === 0 ? (
                        <div className="p-4 text-center text-xs text-gray-500 bg-dark-bg/30 rounded-lg border border-dashed border-dark-border">
                          ไม่มีตัวเลือกในระบบ สามารถพิมพ์และกดบันทึกเพิ่มด้านบนได้เลย
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {allActiveOpts.map((opt, idx) => {
                            const isDefaultOpt = defaultOpts.includes(opt);
                            return (
                              <div key={idx} className="flex justify-between items-center p-2.5 bg-dark-bg/60 border border-dark-border rounded-lg text-xs hover:border-gray-600 transition-all">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-200 font-medium">{opt}</span>
                                  {isDefaultOpt ? (
                                    <span className="text-[10px] bg-gray-700/50 text-gray-400 border border-gray-600/30 px-1.5 py-0.5 rounded">
                                      ค่าเริ่มต้น
                                    </span>
                                  ) : (
                                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                                      Admin เพิ่ม
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`คุณต้องการลบตัวเลือก "${opt}" ใช่หรือไม่?`)) {
                                      if (isDefaultOpt) {
                                        // Flag default item as excluded
                                        const updated = [...dbOpts, `__EXCLUDE__:${opt}`];
                                        handleSaveOptions(activeModalConfig.tab_name, activeModalConfig.field_name, updated);
                                      } else {
                                        // Remove custom added item
                                        const updated = dbOpts.filter(o => o !== opt);
                                        handleSaveOptions(activeModalConfig.tab_name, activeModalConfig.field_name, updated);
                                      }
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-200 border border-red-500/30 rounded text-[11px] font-semibold transition-all flex items-center gap-1"
                                >
                                  <span>ลบ</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-dark-border flex justify-end">
              <button
                onClick={() => setActiveModalConfig(null)}
                className="px-5 py-2 bg-dark-accent hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-semibold transition-all"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
