import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';

export default function FieldSettings() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('master');

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
    model: 'Rectifier Model',
    ac_cable_size: 'AC Cable Input Size',
    breaker_size: 'Breaker Input Size',
    modules_all: 'All Rectifier Modules Qty',
    modules_fail: 'Failed Modules Qty',
    input_current_ac: 'Total Input Current AC',
    output_current_dc: 'Total Output Current DC',
    surge_status: 'Rectifier Surge Status',
    breaker_phase1: 'Rate Breaker AC Phase 1',
    breaker_phase2: 'Rate Breaker AC Phase 2',
    breaker_phase3: 'Rate Breaker AC Phase 3',
    battery_type: 'ชนิดแบตเตอรี่ (Battery Type)',
    lithium_capacity: 'Lithium Capacity',
    battery_run: 'Battery RUN',
    battery_soh: 'Battery % SOH (State of Health)',
    battery_soc: 'Battery % SOC (State of Charge)',
    battery_capacity_percent: 'Battery เปอร์เซ็น Capacity',
    battery_alarm: 'Battery Alarm Status',
    battery_qty_bank: 'จำนวน Bank Batt',

    // Battery Tab
    voltage: 'Cell Voltage (Volt)',
    internal_resistance: 'Internal Resistance (mΩ)',
    status: 'Battery Status',
    brand: 'ยี่ห้อ Bank (Battery Bank Brand)',
    capacity: 'Battery Bank Capacity',
    installed_date: 'วันที่ติดตั้ง (Battery Bank Installation Date)',
    warrantee_date: 'วันหมดประกัน สติ๊กเกอร์ขาว (Battery Bank Warrantee Date)',

    // Facilities Tab
    alarm_door: 'Door Open Alarm',
    alarm_ac_fail: 'AC Failure Alarm',
    alarm_low_bat: 'Low Battery Alarm',
    alarm_high_temp: 'High Temperature Alarm',
    alarm_smoke: 'Smoke & Fire Detector Alarm',
    alarm_air_fail: 'Air Conditioner Failure Alarm',
    vent_ac_fan: 'Ventilation AC Fan Status',
    vent_ac_fan_hood: 'Ventilation AC Fan Hood',
    vent_dc_fan: 'Ventilation DC Fan Status',
    vent_dc_fan_hood: 'Ventilation DC Fan Hood',
    vent_air_cond: 'Air Conditioner System Test',
    vent_filters: 'Air Filters Condition',
    vent_filter_door: 'ความสะอาด Filter Door',
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

  const tabsList = [
    { id: 'master', label: 'Master Site Tab' },
    { id: 'acmain', label: 'AC Main Tab' },
    { id: 'rectifier', label: 'Rectifier Tab' },
    { id: 'battery', label: 'Battery Tab' },
    { id: 'facilities', label: 'Facilities Tab' }
  ];

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-red-950/20 border border-red-900/40 rounded-xl max-w-xl mx-auto my-12">
        <h2 className="text-xl font-bold text-red-400">⛔ ปฏิเสธการเข้าถึง (Access Denied)</h2>
        <p className="text-gray-400 mt-2">หน้านี้อนุญาตให้เฉพาะผู้ใช้งานระดับสิทธิ์ Admin เข้าแก้ไขหรือตั้งค่าฟิลด์งานเท่านั้น</p>
      </div>
    );
  }

  // Filter configurations by selected tab
  const filteredConfigs = configs.filter(c => c.tab_name === activeTab);

  return (
    <MainLayout currentStep="admin-settings" currentSite={null} onNavigateBack={() => window.history.back()}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">⚙️ ตั้งค่าฟิลด์ข้อมูล (Admin Field Configurations)</h2>
          <p className="text-gray-400 text-sm mt-1">ผู้ดูแลระบบสามารถเลือกเปิด/ปิด ฟิลด์กรอกข้อมูล หรือเปิด/ปิด บังคับป้อนข้อมูล/อัปโหลดรูปภาพได้</p>
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
                filteredConfigs.map((config) => (
                  <div key={config.field_id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="font-bold text-sm text-gray-200">{labelMap[config.field_name] || config.field_name}</span>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">{config.field_name} ({config.tab_name})</p>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Toggle: Require Input / Image Upload */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">การบังคับกรอก/แนบรูป:</span>
                        <button
                          onClick={() => handleToggle(config.tab_name, config.field_name, 'required', config.is_required)}
                          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
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
                        <span className="text-xs text-gray-400">สถานะฟิลด์:</span>
                        <button
                          onClick={() => handleToggle(config.tab_name, config.field_name, 'enabled', config.is_enabled)}
                          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
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
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
